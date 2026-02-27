import { useState, useEffect, useRef } from 'react';

export const useARTracking = (targetSelector: string = '#card-anchor') => {
    const [isTargetFound, setIsTargetFound] = useState(false);
    const [isDeployed, setIsDeployed] = useState(false);

    const stabilizationTimer = useRef<NodeJS.Timeout | null>(null);
    const lostTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const target = document.querySelector(targetSelector);
        if (!target) return;

        const handleTargetFound = () => {
            setIsTargetFound(true);

            // Limpiar timer de pérdida si lo recuperamos rápido
            if (lostTimer.current) {
                clearTimeout(lostTimer.current);
                lostTimer.current = null;
            }

            if (isDeployed) return;

            // Iniciar timer de estabilización antes de desplegar
            if (stabilizationTimer.current) {
                clearTimeout(stabilizationTimer.current);
            }

            stabilizationTimer.current = setTimeout(() => {
                stabilizationTimer.current = null;
                setIsDeployed(true);
            }, 350);
        };

        const handleTargetLost = () => {
            setIsTargetFound(false);

            // Limpiar timer de estabilización si se pierde el target antes de que termine
            if (stabilizationTimer.current) {
                clearTimeout(stabilizationTimer.current);
                stabilizationTimer.current = null;
            }

            // Iniciar timer para reiniciar la experiencia si se pierde por mucho tiempo
            lostTimer.current = setTimeout(() => {
                lostTimer.current = null;
                setIsDeployed(false);
            }, 1200);
        };

        target.addEventListener('targetFound', handleTargetFound);
        target.addEventListener('targetLost', handleTargetLost);

        return () => {
            target.removeEventListener('targetFound', handleTargetFound);
            target.removeEventListener('targetLost', handleTargetLost);
            if (stabilizationTimer.current) clearTimeout(stabilizationTimer.current);
            if (lostTimer.current) clearTimeout(lostTimer.current);
        };
    }, [isDeployed, targetSelector]);

    return { isTargetFound, isDeployed };
};
