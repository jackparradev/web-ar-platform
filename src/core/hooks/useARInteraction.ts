import { useEffect, useCallback } from 'react';



interface UseARInteractionProps {
    isDeployed: boolean;
    onAction: (action: string) => void;
}

export const useARInteraction = ({ isDeployed, onAction }: UseARInteractionProps) => {
    const checkTouch = useCallback((touchX: number, touchY: number) => {
        if (!isDeployed) return;

        const scene = document.querySelector('a-scene');
        const camera = document.querySelector('a-camera');

        // @ts-ignore
        if (!scene || !camera || !camera.getObject3D) return;

        // @ts-ignore
        const cam = camera.getObject3D('camera');
        if (!cam) return;

        const W = window.innerWidth;
        const H = window.innerHeight;
        const ndcX = (touchX / W) * 2 - 1;
        const ndcY = -(touchY / H) * 2 + 1;

        let closest: Element | null = null;
        let closestD = 9999;

        document.querySelectorAll('.clickable').forEach((el) => {
            // @ts-ignore
            if (!el.object3D) return;

            const THREE = window.THREE || window.AFRAME?.THREE;
            if (!THREE) return;

            const pos = new THREE.Vector3();
            // @ts-ignore
            el.object3D.getWorldPosition(pos);
            pos.project(cam);

            const dx = pos.x - ndcX;
            const dy = pos.y - ndcY;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < 0.25 && d < closestD) {
                closestD = d;
                closest = el;
            }
        });

        if (closest) {
            const el = closest as Element;
            const action = el.getAttribute('data-action');
            if (action) {
                onAction(action);
            }
        }
    }, [isDeployed, onAction]);

    useEffect(() => {
        const handleTouchEnd = (evt: TouchEvent) => {
            if (evt.target instanceof HTMLCanvasElement) {
                evt.preventDefault();
                const t = evt.changedTouches[0];
                checkTouch(t.clientX, t.clientY);
            }
        };

        const handleMouseUp = (evt: MouseEvent) => {
            if (evt.target instanceof HTMLCanvasElement) {
                checkTouch(evt.clientX, evt.clientY);
            }
        };

        // Registrar Event listeners directos en el DOM
        document.addEventListener('touchend', handleTouchEnd, { passive: false });
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [checkTouch]);

    return { checkTouch };
};
