'use client'

import { useEffect, useRef } from 'react'

/* ─────────────────────────────────────────
   TIPOS
───────────────────────────────────────── */
interface Profile {
  display_name: string   // ej: "Jack Stalin Parra"
  job_title: string      // ej: "Full Stack Developer"
  avatar_url: string     // URL pública del bucket profile-images
}

interface Card {
  primary_color: string  // ej: "#3AA3FF"
  secondary_color: string // ej: "#0A1F33"
  github_url: string | null
  linkedin_url: string | null
  whatsapp: string | null  // número completo ej: "51950886127"
  logo_url?: string | null // URL pública del logo/brand (opcional)
}

interface ARCardProps {
  mindFileUrl: string   // signed URL del .mind desde Supabase Storage
  profile: Profile
  card: Card
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

// Divide "Jack Stalin Parra" en ["Jack Stalin", "Parra"]
// para replicar el mismo efecto de dos líneas del MVP
function splitName(fullName: string): [string, string] {
  const parts = fullName.trim().split(' ')
  if (parts.length <= 2) return [fullName, '']
  const last = parts.pop()!
  return [parts.join(' '), last]
}

/* ─────────────────────────────────────────
   COMPONENTE
───────────────────────────────────────── */
export default function ARCard({ mindFileUrl, profile, card }: ARCardProps) {

  const sceneRef      = useRef<Element | null>(null)
  const overlayRef    = useRef<HTMLDivElement>(null)
  const lostRef       = useRef<HTMLDivElement>(null)
  const toastRef      = useRef<HTMLDivElement>(null)

  const [nameLine1, nameLine2] = splitName(profile.display_name)

  /* ══════════════════════════════════════
     LÓGICA AR — equivalente a ar-logic.js
  ══════════════════════════════════════ */
  useEffect(() => {
    // A-Frame y MindAR manipulan el DOM directamente,
    // así que toda la lógica se ejecuta después de que el componente monta.

    let deployed           = false
    let animating          = false
    let stabilizationTimer: ReturnType<typeof setTimeout> | null = null
    let lostTimer:          ReturnType<typeof setTimeout> | null = null

    const LINKS: Record<string, string> = {}
    const LABELS: Record<string, string> = {}

    if (card.github_url)   { LINKS.github   = card.github_url;                     LABELS.github   = 'GitHub'    }
    if (card.linkedin_url) { LINKS.linkedin = card.linkedin_url;                   LABELS.linkedin = 'LinkedIn'  }
    if (card.whatsapp)     { LINKS.phone    = `https://wa.me/${card.whatsapp}`;    LABELS.phone    = 'WhatsApp'  }

    /* ── TOAST ── */
    function showToast(msg: string) {
      const toast = toastRef.current
      if (!toast) return
      toast.textContent = msg
      toast.classList.add('show')
      setTimeout(() => toast.classList.remove('show'), 2200)
    }

    /* ── ACCIÓN ── */
    function handleAction(action: string | null) {
      if (!action || !LINKS[action]) return
      showToast('Abriendo ' + (LABELS[action] || action) + '…')
      setTimeout(() => { window.open(LINKS[action], '_blank') }, 350)
    }

    /* ── ANIMACIÓN DE PANEL ── */
    function animatePanel(
      panel: Element,
      toX: number, toY: number, toZ: number,
      delay: number, dur = 650
    ) {
      setTimeout(() => {
        panel.removeAttribute('animation')
        ;(panel as any).object3D?.position.set(0, 0, -0.15)
        panel.setAttribute('visible', 'true')
        requestAnimationFrame(() => {
          panel.setAttribute(
            'animation',
            `property: position; from: 0 0 -0.15; to: ${toX} ${toY} ${toZ}; dur: ${dur}; easing: easeOutExpo`
          )
        })
      }, delay)
    }

    /* ── RESET ── */
    function resetPanels() {
      deployed  = false
      animating = false
      const panels = ['#panel-profile', '#panel-logo', '#panel-links']
      panels.forEach(sel => {
        const el = document.querySelector(sel)
        if (!el) return
        el.removeAttribute('animation')
        el.setAttribute('visible', 'false')
        ;(el as any).object3D?.position.set(0, 0, -0.15)
      })
    }

    /* ── DESPLIEGUE ── */
    function deployPanels() {
      if (deployed || animating) return
      animating = true

      overlayRef.current?.classList.add('hidden')
      lostRef.current?.classList.remove('show')

      const panelProfile = document.querySelector('#panel-profile')
      const panelLogo    = document.querySelector('#panel-logo')
      const panelLinks   = document.querySelector('#panel-links')

      if (panelProfile) animatePanel(panelProfile, -0.82,  0,    0.05,   0,  700)
      if (panelLogo)    animatePanel(panelLogo,     0.82,  0,    0.05, 180,  700)
      if (panelLinks)   animatePanel(panelLinks,    0,    -0.62, 0.05, 360,  650)

      setTimeout(() => { animating = false; deployed = true }, 1100)
    }

    /* ── CLICKS (raycaster + touch projection) ── */
    function registerClicks() {
      document.querySelectorAll('.clickable').forEach(el => {
        el.addEventListener('click', (evt) => {
          handleAction(el.getAttribute('data-action'))
          evt.stopPropagation()
        })
      })

      const canvas = document.querySelector('canvas')
      if (!canvas) return

      canvas.addEventListener('touchend', (evt: Event) => {
        (evt as TouchEvent).preventDefault()
        const t = (evt as TouchEvent).changedTouches[0]
        checkTouch(t.clientX, t.clientY)
      }, { passive: false })

      canvas.addEventListener('mouseup', (evt: Event) => {
        const me = evt as MouseEvent
        checkTouch(me.clientX, me.clientY)
      })
    }

    function checkTouch(touchX: number, touchY: number) {
      if (!deployed) return
      const scene  = document.querySelector('a-scene')
      const camera = document.querySelector('a-camera')
      if (!scene || !camera) return
      const cam = (camera as any).getObject3D('camera')
      if (!cam) return

      const W    = window.innerWidth
      const H    = window.innerHeight
      const ndcX =  (touchX / W) * 2 - 1
      const ndcY = -(touchY / H) * 2 + 1

      let closest:  Element | null = null
      let closestD = 9999

      document.querySelectorAll('.clickable').forEach(el => {
        if (!(el as any).object3D) return
        const THREE = (window as any).THREE
        const pos = new THREE.Vector3()
        ;(el as any).object3D.getWorldPosition(pos)
        pos.project(cam)
        const dx = pos.x - ndcX
        const dy = pos.y - ndcY
        const d  = Math.sqrt(dx * dx + dy * dy)
        if (d < 0.25 && d < closestD) { closestD = d; closest = el }
      })

      if (closest) handleAction((closest as Element).getAttribute('data-action'))
    }

    /* ── TRACKING EVENTS ── */
    function init() {
      registerClicks()
      const target = document.querySelector('#card-anchor')
      if (!target) return

      target.addEventListener('targetFound', () => {
        if (lostTimer) { clearTimeout(lostTimer); lostTimer = null; lostRef.current?.classList.remove('show') }
        if (deployed) return
        if (stabilizationTimer) clearTimeout(stabilizationTimer)
        stabilizationTimer = setTimeout(() => { stabilizationTimer = null; deployPanels() }, 350)
      })

      target.addEventListener('targetLost', () => {
        if (stabilizationTimer) { clearTimeout(stabilizationTimer); stabilizationTimer = null }
        lostRef.current?.classList.add('show')
        lostTimer = setTimeout(() => {
          lostTimer = null
          resetPanels()
          overlayRef.current?.classList.remove('hidden')
        }, 1200)
      })
    }

    const scene = document.querySelector('a-scene')
    if (!scene) return
    if ((scene as any).hasLoaded) { init() }
    else { scene.addEventListener('loaded', init) }

    /* ── OVERLAY ORIENTATION (equivalente a overlay-orientation.js) ── */
    const ASPECT       = 1.8
    const MAX_WIDTH_PX = 420
    const PERCENT      = 0.85

    function updateScanFrame() {
      const frame = document.querySelector('.scan-frame') as HTMLElement | null
      if (!frame) return
      const isLandscape = window.innerWidth > window.innerHeight
      const reference = Math.min(
        (isLandscape ? window.innerWidth : window.innerHeight) * PERCENT,
        MAX_WIDTH_PX
      )
      const w = Math.round(reference)
      const h = Math.round(w / ASPECT)
      frame.style.width  = w + 'px'
      frame.style.height = h + 'px'
    }

    window.addEventListener('resize',            updateScanFrame)
    window.addEventListener('orientationchange', updateScanFrame)
    updateScanFrame()
    const t1 = setTimeout(updateScanFrame, 300)
    const t2 = setTimeout(updateScanFrame, 800)

    return () => {
      window.removeEventListener('resize',            updateScanFrame)
      window.removeEventListener('orientationchange', updateScanFrame)
      clearTimeout(t1)
      clearTimeout(t2)
      if (stabilizationTimer) clearTimeout(stabilizationTimer)
      if (lostTimer)          clearTimeout(lostTimer)
    }
  }, [card, mindFileUrl])

  /* ══════════════════════════════════════
     JSX — equivalente al HTML del MVP
  ══════════════════════════════════════ */
  return (
    <>
      {/* ── Overlay de escaneo ── */}
      <div id="scan-overlay" ref={overlayRef}>
        <div className="scan-frame">
          <div className="scan-beam"></div>
          <div className="corner-br"></div>
          <div className="corner-bl"></div>
        </div>
        <p className="scan-label">Apunta a la tarjeta</p>
        <p className="scan-hint">Mantén la cámara estable</p>
      </div>

      <div id="tap-toast"      ref={toastRef}></div>
      <div id="lost-indicator" ref={lostRef}>⚠ Reencuadra la tarjeta</div>

      {/*
        A-Frame no es un componente React — se renderiza como string HTML.
        Next.js lo acepta porque 'use client' deshabilita el SSR para este componente.
        Los custom elements (a-scene, a-entity, etc.) se pasan como any.
      */}
      {/* @ts-ignore */}
      <a-scene
        ref={sceneRef}
        mindar-image={`imageTargetSrc: ${mindFileUrl}; autoStart: true; uiScanning: no; filterMinCF: 0.001; filterBeta: 0.005; warmupTolerance: 5; missTolerance: 5;`}
        color-space="sRGB"
        renderer="colorManagement: true; physicallyCorrectLights: true; alpha: true"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
      >
        {/* @ts-ignore */}
        <a-assets>
          <img id="img-perfil"   src={profile.avatar_url} alt="" />
          <img id="img-github"   src="/icons/github.svg"   alt="" />
          <img id="img-linkedin" src="/icons/linkedin.svg" alt="" />
          <img id="img-phone"    src="/icons/whatsapp.svg" alt="" />
          {card.logo_url && <img id="img-logo" src={card.logo_url} alt="" />}
        {/* @ts-ignore */}
        </a-assets>

        {/* @ts-ignore */}
        <a-camera position="0 0 0" look-controls="enabled: false">
          {/* @ts-ignore */}
          <a-entity
            cursor="fuse: false; rayOrigin: mouse;"
            raycaster="objects: .clickable; far: 10"
          />
        {/* @ts-ignore */}
        </a-camera>

        {/* @ts-ignore */}
        <a-entity mindar-image-target="targetIndex: 0" id="card-anchor">

          {/* Ancla invisible ratio 640×429 → 1.0 × 0.67 */}
          {/* @ts-ignore */}
          <a-plane
            id="card-base"
            width="1.0" height="0.67"
            position="0 0 0"
            material="opacity: 0; transparent: true"
          />

          {/* ══ PANEL PERFIL — IZQUIERDA ══ */}
          {/* @ts-ignore */}
          <a-entity id="panel-profile" visible="false" position="0 0 -0.15">
            {/* @ts-ignore */}
            <a-plane width="0.55" height="1.0" color={card.secondary_color}
              material="shader: flat; opacity: 0.95; transparent: true" />
            {/* Línea decorativa derecha */}
            {/* @ts-ignore */}
            <a-plane width="0.004" height="0.67" color={card.primary_color}
              material="shader: flat; opacity: 0.7"
              position="0.273 0 0.005" />
            {/* Círculo foto */}
            {/* @ts-ignore */}
            <a-circle color="#112840" radius="0.155"
              material="shader: flat" position="0 0.25 0.01" />
            {/* @ts-ignore */}
            <a-image src="#img-perfil"
              position="0 0.25 0.02" height="0.5" width="0.5" />
            {/* Nombre (dos líneas) */}
            {/* @ts-ignore */}
            <a-text value={nameLine1} align="center"
              position="0 -0.10 0.01" color={card.primary_color}
              scale="0.46 0.46 0.46" />
            {nameLine2 && (
              // @ts-ignore
              <a-text value={nameLine2} align="center"
                position="0 -0.19 0.01" color={card.primary_color}
                scale="0.46 0.46 0.46" />
            )}
            {/* @ts-ignore */}
            <a-text value={profile.job_title} align="center"
              position="0 -0.29 0.01" color="rgba(255,255,255,0.65)"
              scale="0.22 0.22 0.22" />
          {/* @ts-ignore */}
          </a-entity>

          {/* ══ PANEL LOGO — DERECHA ══ */}
          {/* @ts-ignore */}
          <a-entity id="panel-logo" visible="false" position="0 0 -0.15">
            {/* @ts-ignore */}
            <a-plane width="0.55" height="0.67" color={card.secondary_color}
              material="shader: flat; opacity: 0.95; transparent: true" />
            {/* Línea decorativa izquierda */}
            {/* @ts-ignore */}
            <a-plane width="0.004" height="0.67" color={card.primary_color}
              material="shader: flat; opacity: 0.7"
              position="-0.273 0 0.005" />
            {/* Logo — si no hay logo_url muestra el nombre en grande */}
            {card.logo_url ? (
              // @ts-ignore
              <a-image src="#img-logo"
                position="0 0 0.02" height="0.42" width="0.42" />
            ) : (
              // @ts-ignore
              <a-text value={profile.display_name} align="center"
                position="0 0 0.02" color={card.primary_color}
                scale="0.38 0.38 0.38" />
            )}
          {/* @ts-ignore */}
          </a-entity>

          {/* ══ PANEL LINKS — ABAJO ══ */}
          {/* @ts-ignore */}
          <a-entity id="panel-links" visible="false" position="0 0 -0.15">

            {/* GitHub */}
            {card.github_url && (
              <>
                {/* @ts-ignore */}
                <a-circle className="clickable" data-action="github"
                  position="-0.34 0 0.01" radius="0.11"
                  color={card.secondary_color} segments="36" />
                {/* @ts-ignore */}
                <a-image src="#img-github" className="clickable" data-action="github"
                  position="-0.34 0 0.02" height="0.14" width="0.14"
                  material="color: #ffffff; shader: flat" />
              </>
            )}

            {/* LinkedIn */}
            {card.linkedin_url && (
              <>
                {/* @ts-ignore */}
                <a-circle className="clickable" data-action="linkedin"
                  position="0 0 0.01" radius="0.11"
                  color={card.secondary_color} segments="36" />
                {/* @ts-ignore */}
                <a-image src="#img-linkedin" className="clickable" data-action="linkedin"
                  position="0 0 0.02" height="0.14" width="0.14"
                  material="color: #ffffff; shader: flat" />
              </>
            )}

            {/* WhatsApp */}
            {card.whatsapp && (
              <>
                {/* @ts-ignore */}
                <a-circle className="clickable" data-action="phone"
                  position="0.34 0 0.01" radius="0.11"
                  color={card.secondary_color} segments="36" />
                {/* @ts-ignore */}
                <a-image src="#img-phone" className="clickable" data-action="phone"
                  position="0.34 0 0.02" height="0.14" width="0.14"
                  material="color: #ffffff; shader: flat" />
              </>
            )}

          {/* @ts-ignore */}
          </a-entity>

        {/* @ts-ignore */}
        </a-entity>
      {/* @ts-ignore */}
      </a-scene>
    </>
  )
}