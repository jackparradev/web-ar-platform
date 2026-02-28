"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ARViewerData } from '@/domain/types/card.types';

// ── Assets públicos en Supabase Storage ──────────────────────────────────────
const ASSETS = {
    logo: 'https://mnbxsjylwhllkgdkfvoc.supabase.co/storage/v1/object/public/profile-images/devNeg26.png',
    github: 'https://mnbxsjylwhllkgdkfvoc.supabase.co/storage/v1/object/public/profile-images/github-logo_icon-icons.com_73546.svg',
    linkedin: 'https://mnbxsjylwhllkgdkfvoc.supabase.co/storage/v1/object/public/profile-images/LINKEDIN_icon-icons.com_65488.svg',
    whatsapp: 'https://mnbxsjylwhllkgdkfvoc.supabase.co/storage/v1/object/public/profile-images/whatsapp-logo_icon-icons.com_57054.svg',
    email: 'https://mnbxsjylwhllkgdkfvoc.supabase.co/storage/v1/object/public/profile-images/at-sign-svgrepo-com.svg',
    perfil: 'https://mnbxsjylwhllkgdkfvoc.supabase.co/storage/v1/object/public/profile-images/Perfil26.png',
} as const;

// Color de fondo de los paneles (navy oscuro — fijo, no viene de la tarjeta)
const PANEL_BG = '#0A1F33';
// Acento de borde superior (viene de primary_color de la tarjeta)
const ACCENT_DEF = '#3AA3FF';

interface ARViewerProps {
    data: ARViewerData;
    isDeployed: boolean;
}

export const ARViewer: React.FC<ARViewerProps> = ({ data, isDeployed }) => {
    const sceneRef = useRef<any>(null);
    const [isAframeReady, setIsAframeReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const { card, profile } = data;

    const accentColor = card.primary_color ?? ACCENT_DEF;
    // Forzamos Perfil.jpg directamente — avatar_url en la DB apunta al logo incorrecto
    const avatarUrl = ASSETS.perfil;

    // ── Polling AFRAME ───────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if ((window as any).AFRAME) { setIsAframeReady(true); return; }

        const interval = setInterval(() => {
            if ((window as any).AFRAME) {
                setIsAframeReady(true);
                clearInterval(interval);
                clearTimeout(timeout);
            }
        }, 50);
        const timeout = setTimeout(() => {
            clearInterval(interval);
            setCameraError('No se pudieron cargar los scripts de AR. Verifica tu conexión y recarga.');
        }, 10_000);

        return () => { clearInterval(interval); clearTimeout(timeout); };
    }, []);

    // ── Errores MindAR / cámara ──────────────────────────────────────────────
    useEffect(() => {
        if (!isAframeReady) return;
        const sceneEl = sceneRef.current;
        if (!sceneEl) return;

        let timer: ReturnType<typeof setTimeout> | null = null;

        const handleARError = (event: any) => {
            const detail = event?.detail ?? event;
            const msg: string = detail?.error?.message ?? detail?.message ?? JSON.stringify(detail);
            console.error('[MindAR] arError:', msg);
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                const isCamera = msg.toLowerCase().includes('permission') ||
                    msg.toLowerCase().includes('notallowed');
                setCameraError(isCamera
                    ? 'Permiso de cámara denegado. Habilítalo en los ajustes y recarga.'
                    : 'No se pudo cargar el archivo AR. Verifica permisos y conexión HTTPS.');
            }, 2000);
        };

        const handleCameraError = () =>
            setCameraError('Permiso de cámara denegado. Habilítalo y recarga la página.');

        sceneEl.addEventListener('arError', handleARError);
        sceneEl.addEventListener('camera-error', handleCameraError);
        return () => {
            sceneEl.removeEventListener('arError', handleARError);
            sceneEl.removeEventListener('camera-error', handleCameraError);
            if (timer) clearTimeout(timer);
        };
    }, [isAframeReady]);

    // ── Error UI ─────────────────────────────────────────────────────────────
    if (cameraError) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 p-6 z-[9999] text-center text-white">
                <div className="text-red-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Error de Cámara</h2>
                <p className="mb-8 max-w-sm text-gray-300">{cameraError}</p>
                <button onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition-colors duration-200">
                    Recargar página
                </button>
            </div>
        );
    }

    // ── Loader ───────────────────────────────────────────────────────────────
    if (!isAframeReady) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-[9999] text-white gap-4">
                <div className="w-10 h-10 border-4 border-[#3AA3FF] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm tracking-widest uppercase text-white/60">Iniciando AR…</p>
            </div>
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    //  LAYOUT DE PANELES
    //
    //   [panel-profile]          (vacío)          [panel-logo]
    //    foto+nombre+cargo       —nada—            devNeg26.png
    //
    //        [panel-links — strip horizontal]
    //         WhatsApp | GitHub | Email | LinkedIn
    //
    // ────────────────────────────────────────────────────────────────────────
    return (
        <a-scene
            ref={sceneRef}
            mindar-image={`imageTargetSrc: ${data.mindUrl}; autoStart: true; filterMinCF: 0.0005; filterBeta: 0.1;`}
            color-space="sRGB"
            renderer="colorManagement: true, physicallyCorrectLights"
            vr-mode-ui="enabled: false"
            device-orientation-permission-ui="enabled: false"
        >
            {/* ── Preload de assets ─────────────────────────────────────── */}
            <a-assets timeout="10000">
                <img id="img-avatar" src={avatarUrl} crossOrigin="anonymous" alt="" />
                <img id="img-logo" src={ASSETS.logo} crossOrigin="anonymous" alt="" />
                <img id="img-github" src={ASSETS.github} crossOrigin="anonymous" alt="" />
                <img id="img-linkedin" src={ASSETS.linkedin} crossOrigin="anonymous" alt="" />
                <img id="img-whatsapp" src={ASSETS.whatsapp} crossOrigin="anonymous" alt="" />
                <img id="img-email" src={ASSETS.email} crossOrigin="anonymous" alt="" />
            </a-assets>

            <a-camera position="0 0 0" look-controls="enabled: false" />

            {/* ── Target anchor ─────────────────────────────────────────── */}
            <a-entity id="card-anchor" mindar-image-target="targetIndex: 0">

                {/* ════════════════════════════════════════════════════════
                    PANEL IZQUIERDO — Perfil
                    Foto circular + Nombre + Cargo
                    Tap → abre GitHub
                   ════════════════════════════════════════════════════════ */}
                <a-entity
                    id="panel-profile"
                    className="clickable"
                    data-action="github"
                    position={isDeployed ? '-0.82 0.05 0.05' : '0 0 -0.3'}
                    visible={isDeployed ? 'true' : 'false'}
                    {...(isDeployed && {
                        animation: 'property: position; from: 0 0 -0.3; to: -0.82 0.05 0.05; dur: 700; easing: easeOutExpo; delay: 0'
                    })}
                >
                    {/* Fondo oscuro navy — sin borde de acento */}
                    <a-plane
                        width="0.55" height="0.70"
                        color={PANEL_BG}
                        material={`shader: flat; color: ${PANEL_BG}`}
                    />

                    {/* Foto circular — sin marco/relleno extra */}
                    <a-image
                        src="#img-avatar"
                        width="0.27"
                        height="0.27"
                        position="0 0.15 0.002"
                        material="shader: flat; transparent: true"
                    />

                    {/* Nombre — ancho limitado al panel (≤0.50) */}
                    <a-text
                        value={profile.display_name ?? 'Nombre'}
                        align="center"
                        color="#FFFFFF"
                        width="0.48"
                        position="0 -0.08 0.002"
                        wrap-count="16"
                    />

                    {/* Cargo — ancho limitado */}
                    <a-text
                        value={profile.job_title ?? ''}
                        align="center"
                        color={accentColor}
                        width="0.46"
                        position="0 -0.21 0.002"
                        wrap-count="18"
                    />
                </a-entity>

                {/* ════════════════════════════════════════════════════════
                    CENTRO — Vacío (sin logo)
                    No se renderiza nada aquí.
                   ════════════════════════════════════════════════════════ */}

                {/* ════════════════════════════════════════════════════════
                    PANEL DERECHO — Logo devNeg26.png
                    La imagen del logo ocupa todo el panel.
                    Tap → abre LinkedIn
                   ════════════════════════════════════════════════════════ */}
                <a-entity
                    id="panel-logo"
                    className="clickable"
                    data-action="linkedin"
                    position={isDeployed ? '0.82 0.05 0.05' : '0 0 -0.3'}
                    visible={isDeployed ? 'true' : 'false'}
                    {...(isDeployed && {
                        animation: 'property: position; from: 0 0 -0.3; to: 0.82 0.05 0.05; dur: 700; easing: easeOutExpo; delay: 180'
                    })}
                >
                    {/* Fondo oscuro navy — sin borde de acento */}
                    <a-plane
                        width="0.55" height="0.70"
                        color={PANEL_BG}
                        material={`shader: flat; color: ${PANEL_BG}`}
                    />

                    {/* Logo devNeg26.png — centrado, grande */}
                    <a-image
                        src="#img-logo"
                        width="0.42"
                        height="0.42"
                        position="0 0.02 0.002"
                        material="shader: flat; transparent: true"
                    />
                </a-entity>

                {/* ════════════════════════════════════════════════════════
                    PANEL INFERIOR — Strip de links
                    4 columnas: WhatsApp | GitHub | Email | LinkedIn
                   ════════════════════════════════════════════════════════ */}
                <a-entity
                    id="panel-links"
                    position={isDeployed ? '0 -0.58 0.05' : '0 0 -0.3'}
                    visible={isDeployed ? 'true' : 'false'}
                    {...(isDeployed && {
                        animation: 'property: position; from: 0 0 -0.3; to: 0 -0.58 0.05; dur: 650; easing: easeOutExpo; delay: 360'
                    })}
                >
                    {/* Fondo horizontal — sin borde de acento */}
                    <a-plane
                        width="2.0" height="0.30"
                        color={PANEL_BG}
                        material={`shader: flat; color: ${PANEL_BG}`}
                    />

                    {/* WhatsApp — columna 1 */}
                    <a-entity position="-0.72 0 0.002" className="clickable" data-action="phone">
                        <a-image
                            src="#img-whatsapp"
                            width="0.11" height="0.11"
                            material="shader: flat; transparent: true"
                        />
                        <a-text
                            value="WhatsApp"
                            align="center" color="#FFFFFF"
                            width="0.65" position="0 -0.1 0"
                        />
                    </a-entity>

                    {/* GitHub — columna 2 */}
                    <a-entity position="-0.24 0 0.002" className="clickable" data-action="github">
                        <a-image
                            src="#img-github"
                            width="0.11" height="0.11"
                            material="shader: flat; transparent: true"
                        />
                        <a-text
                            value="GitHub"
                            align="center" color="#FFFFFF"
                            width="0.65" position="0 -0.1 0"
                        />
                    </a-entity>

                    {/* Email — columna 3 */}
                    <a-entity position="0.24 0 0.002" className="clickable" data-action="email">
                        <a-image
                            src="#img-email"
                            width="0.11" height="0.11"
                            material="shader: flat; transparent: true"
                        />
                        <a-text
                            value="Email"
                            align="center" color="#FFFFFF"
                            width="0.65" position="0 -0.1 0"
                        />
                    </a-entity>

                    {/* LinkedIn — columna 4 */}
                    <a-entity position="0.72 0 0.002" className="clickable" data-action="linkedin">
                        <a-image
                            src="#img-linkedin"
                            width="0.11" height="0.11"
                            material="shader: flat; transparent: true"
                        />
                        <a-text
                            value="LinkedIn"
                            align="center" color="#FFFFFF"
                            width="0.65" position="0 -0.1 0"
                        />
                    </a-entity>
                </a-entity>

            </a-entity>
        </a-scene>
    );
};

export default ARViewer;
