"use client";

import React from 'react';
import { useARTracking } from '@/core/hooks/useARTracking';
import { useARInteraction } from '@/core/hooks/useARInteraction';
import ScanOverlay from '@/ui/components/features/ar/ScanOverlay';
import ARViewer from '@/ui/components/features/ar/ARViewer';
import { Card } from '@/domain/types/card.types';

export interface ARCardWrapperProps {
    card: Card;
}

export const ARCardWrapper: React.FC<ARCardWrapperProps> = ({ card }) => {
    // 1. Estados limpios provistos por el Hook
    const { isTargetFound, isDeployed } = useARTracking('#card-anchor');

    // 2. Interacciones/Acciones
    const handleAction = (action: string) => {
        console.log('Action triggered:', action);

        const LINKS: Record<string, string> = {
            github: card.socialLinks?.github ?? '',
            linkedin: card.socialLinks?.linkedin ?? '',
            phone: card.socialLinks?.phone ?? ''
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
                card={card}
                isDeployed={isDeployed}
            />
        </>
    );
};

export default ARCardWrapper;
