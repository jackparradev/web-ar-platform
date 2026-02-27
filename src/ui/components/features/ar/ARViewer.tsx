"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ARViewerData } from '@/domain/types/card.types';

// ── Constantes de assets (públicos en Supabase Storage) ─────────────────────
const ASSETS = {
    logo: 'https://mnbxsjylwhllkgdkfvoc.supabase.co/storage/v1/object/public/profile-images/devNeg26.png',
    github: 'https://mnbxsjylwhllkgdkfvoc.supabase.co/storage/v1/object/public/profile-images/github-logo_icon-icons.com_73546.svg',
    linkedin: 'https://mnbxsjylwhllkgdkfvoc.supabase.co/storage/v1/object/public/profile-images/LINKEDIN_icon-icons.com_65488.svg',
    whatsapp: 'https://mnbxsjylwhllkgdkfvoc.supabase.co/storage/v1/object/public/profile-images/whatsapp-logo_icon-icons.com_57054.svg',
    email: 'https://mnbxsjylwhllkgdkfvoc.supabase.co/storage/v1/object/public/profile-images/arroba_122776.svg',
    perfil: 'https://mnbxsjylwhllkgdkfvoc.supabase.co/storage/v1/object/public/profile-images/Perfil.jpg',
} as const;

interface ARViewerProps {
    data: ARViewerData;
    isDeployed: boolean;
}

export const ARViewer: React.FC<ARViewerProps> = ({ data, isDeployed }) => {
    const sceneRef = useRef<any>(null);
    const [isAframeReady, setIsAframeReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const { card, profile } = data;

    // Color primario de la tarjeta (default: azul marca)
    const primaryColor = card.primary_color ?? '#3AA3FF';
    const secondaryColor = card.secondary_color ?? '#0F1C2E';

    // Foto de perfil — usa la de Supabase si existe, si no, el asset predefinido
    const avatarUrl = profile.avatar_url ?? ASSETS.perfil;
    // Logo de la tarjeta — usa el de la tarjeta si hay uno, si no PJAPEX
    const logoUrl = card.logo_url ?? ASSETS.logo;

    // ── Polling de AFRAME ────────────────────────────────────────────────────
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
            setCameraError('No se pudieron cargar los scripts de AR. Verifica tu conexión y recarga la página.');
        }, 10_000);

        return () => { clearInterval(interval); clearTimeout(timeout); };
    }, []);

    // ── Errores de MindAR / Cámara ───────────────────────────────────────────
    useEffect(() => {
        if (!isAframeReady) return;
        const sceneEl = sceneRef.current;
        if (!sceneEl) return;

        let fatalErrorTimer: ReturnType<typeof setTimeout> | null = null;

        const handleARError = (event: any) => {
            const detail = event?.detail ?? event;
            const errorMsg = detail?.error?.message ?? detail?.message ?? JSON.stringify(detail);
            console.error('[MindAR] arError — detail:', detail, '| message:', errorMsg);

            if (fatalErrorTimer) clearTimeout(fatalErrorTimer);
            fatalErrorTimer = setTimeout(() => {
                const isCamera = errorMsg.toLowerCase().includes('permission') ||
                    errorMsg.toLowerCase().includes('notallowed') ||
                    errorMsg.toLowerCase().includes('camera');
                setCameraError(isCamera
                    ? 'Permiso de cámara denegado. Habilítalo en los ajustes del navegador y recarga.'
                    : 'No se pudo cargar el archivo AR. Verifica permisos de cámara y conexión HTTPS.'
                );
            }, 2000);
        };

        const handleCameraError = () => {
            setCameraError('Permiso de cámara denegado. Por favor, habilítalo y recarga la página.');
        };

        sceneEl.addEventListener('arError', handleARError);
        sceneEl.addEventListener('camera-error', handleCameraError);
        return () => {
            sceneEl.removeEventListener('arError', handleARError);
            sceneEl.removeEventListener('camera-error', handleCameraError);
            if (fatalErrorTimer) clearTimeout(fatalErrorTimer);
        };
    }, [isAframeReady]);

    // ── Error UI ─────────────────────────────────────────────────────────────
    if (cameraError) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 p-6 z-[9999] text-center text-white">
                <div className="text-red-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
    //  ESCENA AR
    //
    //  Distribución de paneles sobre la tarjeta (vista frontal):
    //
    //   [panel-profile]   [logo central]   [panel-logo]
    //        izq                                der
    //              [panel-links / redes]
    //                     abajo
    //
    //  Sistema de coordenadas MindAR: unidades = ancho del target image (≈ 1 unidad)
    //  La tarjeta física mide ~8.5cm × 5.5cm → ratio ≈ 1.545:1
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
            {/* ── Assets preload ─────────────────────────────────────────── */}
            <a-assets timeout="10000">
                <img id="img-avatar" src={avatarUrl} crossOrigin="anonymous" alt="" />
                <img id="img-logo" src={logoUrl} crossOrigin="anonymous" alt="" />
                <img id="img-github" src={ASSETS.github} crossOrigin="anonymous" alt="" />
                <img id="img-linkedin" src={ASSETS.linkedin} crossOrigin="anonymous" alt="" />
                <img id="img-whatsapp" src={ASSETS.whatsapp} crossOrigin="anonymous" alt="" />
                <img id="img-email" src={ASSETS.email} crossOrigin="anonymous" alt="" />
            </a-assets>

            <a-camera position="0 0 0" look-controls="enabled: false" />

            {/* ── Anchor del target ──────────────────────────────────────── */}
            <a-entity id="card-anchor" mindar-image-target="targetIndex: 0">

                {/* ── PANEL IZQUIERDO — Perfil ──────────────────────────── */}
                {/*
                  Contenido: foto circular + nombre + título
                  Acción: abre GitHub
                */}
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
                    {/* Fondo del panel */}
                    <a-plane
                        width="0.55"
                        height="0.72"
                        color={secondaryColor}
                        opacity="0.92"
                        material={`shader: flat; opacity: 0.92; color: ${secondaryColor}`}
                    />

                    {/* Borde superior de color primario */}
                    <a-plane
                        width="0.55"
                        height="0.025"
                        position="0 0.348 0.001"
                        color={primaryColor}
                        material={`shader: flat; color: ${primaryColor}`}
                    />

                    {/* Foto de perfil circular */}
                    <a-circle
                        src="#img-avatar"
                        radius="0.14"
                        position="0 0.15 0.002"
                        material="shader: flat"
                    />

                    {/* Nombre */}
                    <a-text
                        value={profile.display_name ?? 'Nombre'}
                        align="center"
                        color="#FFFFFF"
                        width="0.95"
                        position="0 -0.06 0.002"
                        font="roboto"
                        letter-spacing="1"
                        wrap-count="18"
                    />

                    {/* Título/cargo */}
                    <a-text
                        value={profile.job_title ?? ''}
                        align="center"
                        color={primaryColor}
                        width="0.78"
                        position="0 -0.16 0.002"
                        font="roboto"
                        letter-spacing="0"
                        wrap-count="20"
                    />

                    {/* Ícono GitHub pequeño abajo */}
                    <a-image
                        src="#img-github"
                        width="0.09"
                        height="0.09"
                        position="0 -0.29 0.002"
                        material="shader: flat; transparent: true"
                    />
                </a-entity>

                {/* ── LOGO CENTRAL — siempre visible sobre la tarjeta ──── */}
                {/*
                  Aparece solo con el tracking, antes de isDeployed
                  para dar continuidad visual desde el cubo de prueba.
                */}
                <a-image
                    src="#img-logo"
                    width="0.38"
                    height="0.18"
                    position="0 0.05 0.001"
                    material="shader: flat; transparent: true"
                />

                {/* ── PANEL DERECHO — LinkedIn ──────────────────────────── */}
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
                    {/* Fondo */}
                    <a-plane
                        width="0.55"
                        height="0.72"
                        color={secondaryColor}
                        opacity="0.92"
                        material={`shader: flat; opacity: 0.92; color: ${secondaryColor}`}
                    />

                    {/* Borde superior */}
                    <a-plane
                        width="0.55"
                        height="0.025"
                        position="0 0.348 0.001"
                        color={primaryColor}
                        material={`shader: flat; color: ${primaryColor}`}
                    />

                    {/* Logo LinkedIn grande */}
                    <a-image
                        src="#img-linkedin"
                        width="0.22"
                        height="0.22"
                        position="0 0.12 0.002"
                        material="shader: flat; transparent: true"
                    />

                    <a-text
                        value="LinkedIn"
                        align="center"
                        color="#FFFFFF"
                        width="0.9"
                        position="0 -0.1 0.002"
                        font="roboto"
                        letter-spacing="2"
                    />

                    <a-text
                        value={profile.username ? `@${profile.username}` : ''}
                        align="center"
                        color={primaryColor}
                        width="0.8"
                        position="0 -0.21 0.002"
                        font="roboto"
                        wrap-count="22"
                    />
                </a-entity>

                {/* ── PANEL INFERIOR — Links / Redes ─────────────────────── */}
                <a-entity
                    id="panel-links"
                    className="clickable"
                    data-action="phone"
                    position={isDeployed ? '0 -0.58 0.05' : '0 0 -0.3'}
                    visible={isDeployed ? 'true' : 'false'}
                    {...(isDeployed && {
                        animation: 'property: position; from: 0 0 -0.3; to: 0 -0.58 0.05; dur: 650; easing: easeOutExpo; delay: 360'
                    })}
                >
                    {/* Fondo horizontal */}
                    <a-plane
                        width="1.85"
                        height="0.28"
                        color={secondaryColor}
                        opacity="0.92"
                        material={`shader: flat; opacity: 0.92; color: ${secondaryColor}`}
                    />

                    {/* Borde izquierdo de color primario */}
                    <a-plane
                        width="0.025"
                        height="0.28"
                        position="-0.9 0 0.001"
                        color={primaryColor}
                        material={`shader: flat; color: ${primaryColor}`}
                    />

                    {/* WhatsApp */}
                    <a-entity position="-0.6 0 0.002" className="clickable" data-action="phone">
                        <a-image
                            src="#img-whatsapp"
                            width="0.1"
                            height="0.1"
                            material="shader: flat; transparent: true"
                        />
                        <a-text
                            value="WhatsApp"
                            align="center"
                            color="#FFFFFF"
                            width="0.65"
                            position="0 -0.1 0"
                            font="roboto"
                        />
                    </a-entity>

                    {/* GitHub */}
                    <a-entity position="0 0 0.002" className="clickable" data-action="github">
                        <a-image
                            src="#img-github"
                            width="0.1"
                            height="0.1"
                            material="shader: flat; transparent: true"
                        />
                        <a-text
                            value="GitHub"
                            align="center"
                            color="#FFFFFF"
                            width="0.65"
                            position="0 -0.1 0"
                            font="roboto"
                        />
                    </a-entity>

                    {/* Email */}
                    <a-entity position="0.6 0 0.002" className="clickable" data-action="email">
                        <a-image
                            src="#img-email"
                            width="0.1"
                            height="0.1"
                            material="shader: flat; transparent: true"
                        />
                        <a-text
                            value="Email"
                            align="center"
                            color="#FFFFFF"
                            width="0.65"
                            position="0 -0.1 0"
                            font="roboto"
                        />
                    </a-entity>
                </a-entity>

            </a-entity>
        </a-scene>
    );
};

export default ARViewer;
