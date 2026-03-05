import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useARTracking
 * ─────────────
 * Escucha los eventos `targetFound` / `targetLost` de MindAR en el
 * elemento `<a-entity id="card-anchor">`.
 *
 * FIX: Race condition de timing
 * ──────────────────────────────
 * El bug anterior: el hook corría document.querySelector('#card-anchor')
 * inmediatamente al montar, pero en ese momento ARViewer todavía no había
 * renderizado <a-scene> (estaba esperando isAframeReady). Devolvía null,
 * salía sin adjuntar listeners, y los eventos de tracking se perdían para
 * siempre.
 *
 * La solución: polling con setInterval hasta que el elemento exista en el
 * DOM, y solo entonces adjuntar los listeners de targetFound/targetLost.
 */
export const useARTracking = (targetSelector: string = '#card-anchor') => {
    const [isTargetFound, setIsTargetFound] = useState(false);
    const [isDeployed, setIsDeployed] = useState(false);

    const stabilizationTimer = useRef<NodeJS.Timeout | null>(null);
    const lostTimer = useRef<NodeJS.Timeout | null>(null);
    const isDeployedRef = useRef(isDeployed);

    // Mantener la ref sincronizada con el estado para usarla sin closure staleness
    useEffect(() => {
        isDeployedRef.current = isDeployed;
    }, [isDeployed]);

    const handleTargetFound = useCallback(() => {
        setIsTargetFound(true);

        if (lostTimer.current) {
            clearTimeout(lostTimer.current);
            lostTimer.current = null;
        }

        // Si ya está desplegado, no reiniciar el timer de estabilización
        if (isDeployedRef.current) return;

        if (stabilizationTimer.current) {
            clearTimeout(stabilizationTimer.current);
        }

        stabilizationTimer.current = setTimeout(() => {
            stabilizationTimer.current = null;
            setIsDeployed(true);
        }, 350);
    }, []);

    const handleTargetLost = useCallback(() => {
        setIsTargetFound(false);

        if (stabilizationTimer.current) {
            clearTimeout(stabilizationTimer.current);
            stabilizationTimer.current = null;
        }

        lostTimer.current = setTimeout(() => {
            lostTimer.current = null;
            setIsDeployed(false);
        }, 1200);
    }, []);

    useEffect(() => {
        let target: Element | null = null;
        let pollInterval: NodeJS.Timeout | null = null;

        const attachListeners = (el: Element) => {
            target = el;
            el.addEventListener('targetFound', handleTargetFound);
            el.addEventListener('targetLost', handleTargetLost);
            console.log('[useARTracking] ✅ Listeners adjuntados a:', targetSelector);
        };

        const tryAttach = () => {
            const el = document.querySelector(targetSelector);
            if (el) {
                // Elemento encontrado — adjuntar y dejar de hacer polling
                if (pollInterval) {
                    clearInterval(pollInterval);
                    pollInterval = null;
                }
                attachListeners(el);
            }
        };

        // Intentar inmediatamente (si el componente ya está renderizado)
        tryAttach();

        // Si no encontramos el elemento, hacer polling cada 100ms hasta que aparezca.
        // Esto resuelve el race condition donde <a-scene> todavía no ha montado
        // cuando useARTracking corre por primera vez.
        if (!target) {
            console.log('[useARTracking] ⏳ Esperando elemento:', targetSelector);
            pollInterval = setInterval(tryAttach, 100);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
            if (target) {
                target.removeEventListener('targetFound', handleTargetFound);
                target.removeEventListener('targetLost', handleTargetLost);
            }
            if (stabilizationTimer.current) clearTimeout(stabilizationTimer.current);
            if (lostTimer.current) clearTimeout(lostTimer.current);
        };
        // Solo re-ejecutar si cambia el selector — NO depende de isDeployed para
        // evitar el ciclo infinito que tenía el hook original.
    }, [targetSelector, handleTargetFound, handleTargetLost]);

    return { isTargetFound, isDeployed };
};
