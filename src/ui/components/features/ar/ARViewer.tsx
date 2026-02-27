"use client";

import { useARTracking } from '@/core/hooks/useARTracking';
import { useARInteraction } from '@/core/hooks/useARInteraction';



export const ARViewer = () => {
    // 1. Estados limpios provistos por el Hook
    const { isTargetFound, isDeployed } = useARTracking('#card-anchor');

    // 2. Interacciones/Acciones
    const handleAction = (action: string) => {
        // Ejemplo de un mapper simplificado o callback hacia features/toast
        console.log('Action triggered:', action);

        const LINKS: Record<string, string> = {
            github: 'https://github.com/jackparradev',
            linkedin: 'https://www.linkedin.com/in/jackparradev/',
            phone: 'https://wa.me/51950886127'
        };

        if (LINKS[action]) {
            setTimeout(() => {
                window.open(LINKS[action], '_blank');
            }, 350);
        }
    };

    useARInteraction({ isDeployed, onAction: handleAction });

    return (
        <>
            <a-scene
                mindar-image="imageTargetSrc: /targets.mind; filterMinCF: 0.0005; filterBeta: 0.1;"
                color-space="sRGB"
                renderer="colorManagement: true, physicallyCorrectLights"
                vr-mode-ui="enabled: false"
                device-orientation-permission-ui="enabled: false"
            >
                <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

                <a-entity id="card-anchor" mindar-image-target="targetIndex: 0">

                    {/* PERFIL - panel-profile */}
                    <a-entity
                        id="panel-profile"
                        className="clickable"
                        data-action="github"
                        visible={isDeployed ? "true" : "false"}
                        position={isDeployed ? "-0.82 0 0.05" : "0 0 -0.15"}
                        animation={isDeployed ? "property: position; from: 0 0 -0.15; to: -0.82 0 0.05; dur: 700; easing: easeOutExpo; delay: 0" : undefined}
                    >
                        {/* ... children render de perfil 3D (GLTF/Textos) ... */}
                    </a-entity>

                    {/* LOGO - panel-logo */}
                    <a-entity
                        id="panel-logo"
                        className="clickable"
                        data-action="logo"
                        visible={isDeployed ? "true" : "false"}
                        position={isDeployed ? "0.82 0 0.05" : "0 0 -0.15"}
                        animation={isDeployed ? "property: position; from: 0 0 -0.15; to: 0.82 0 0.05; dur: 700; easing: easeOutExpo; delay: 180" : undefined}
                    >
                        {/* ... children render logo 3D ... */}
                    </a-entity>

                    {/* LINKS - panel-links */}
                    <a-entity
                        id="panel-links"
                        className="clickable"
                        data-action="links"
                        visible={isDeployed ? "true" : "false"}
                        position={isDeployed ? "0 -0.62 0.05" : "0 0 -0.15"}
                        animation={isDeployed ? "property: position; from: 0 0 -0.15; to: 0 -0.62 0.05; dur: 650; easing: easeOutExpo; delay: 360" : undefined}
                    >
                        {/* ... children render de redes ... */}
                    </a-entity>

                </a-entity>
            </a-scene>
        </>
    );
};

export default ARViewer;
