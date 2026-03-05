"use client";

import React from 'react';
import { useARTracking } from '@/core/hooks/useARTracking';
import { useARInteraction } from '@/core/hooks/useARInteraction';
import ScanOverlay from '@/ui/components/features/ar/ScanOverlay';
import ARViewer from '@/ui/components/features/ar/ARViewer';
import { ARViewerData } from '@/domain/types/card.types';

export interface ARCardWrapperProps {
    data: ARViewerData;
}

export const ARCardWrapper: React.FC<ARCardWrapperProps> = ({ data }) => {
    const { card } = data;

    // 1. Estados limpios provistos por el Hook
    const { isTargetFound, isDeployed } = useARTracking('#card-anchor');

    // 2. Interacciones/Acciones
    const handleAction = (action: string) => {
        console.log('Action triggered:', action);

        const LINKS: Record<string, string> = {
            github: card.github_url ?? '',
            linkedin: card.linkedin_url ?? '',
            phone: card.whatsapp ? `https://wa.me/${card.whatsapp.replace(/\D/g, '')}` : '',
            email: card.email ? `mailto:${card.email}` : '',
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
            <ScanOverlay isScanning={!isTargetFound} isLost={!isDeployed} />
            <ARViewer
                data={data}
                isDeployed={isDeployed}
            />
        </>
    );
};

export default ARCardWrapper;
