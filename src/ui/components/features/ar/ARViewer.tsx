"use client";

import React from 'react';
import { Card } from '@/domain/types/card.types';

interface ARViewerProps {
    card: Card;
    isDeployed: boolean;
}

export const ARViewer: React.FC<ARViewerProps> = ({ card, isDeployed }) => {
    return (
        <>
            <a-scene
                mindar-image={`imageTargetSrc: ${card.mindFileUrl}; filterMinCF: 0.0005; filterBeta: 0.1;`}
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
                        {/* Ejemplo de renderizado de texto 3D con datos de Profile */}
                    </a-entity>

                    {/* LOGO - panel-logo */}
                    <a-entity
                        id="panel-logo"
                        className="clickable"
                        data-action="linkedin"
                        visible={isDeployed ? "true" : "false"}
                        position={isDeployed ? "0.82 0 0.05" : "0 0 -0.15"}
                        animation={isDeployed ? "property: position; from: 0 0 -0.15; to: 0.82 0 0.05; dur: 700; easing: easeOutExpo; delay: 180" : undefined}
                    >
                        {/* logo 3D */}
                    </a-entity>

                    {/* LINKS - panel-links */}
                    <a-entity
                        id="panel-links"
                        className="clickable"
                        data-action="phone"
                        visible={isDeployed ? "true" : "false"}
                        position={isDeployed ? "0 -0.62 0.05" : "0 0 -0.15"}
                        animation={isDeployed ? "property: position; from: 0 0 -0.15; to: 0 -0.62 0.05; dur: 650; easing: easeOutExpo; delay: 360" : undefined}
                    >
                        {/* redes */}
                    </a-entity>

                </a-entity>
            </a-scene>
        </>
    );
};

export default ARViewer;
