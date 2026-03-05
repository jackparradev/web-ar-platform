import React from 'react';

interface ScanOverlayProps {
    /** Indica si la tarjeta está siendo buscada/escaneada (true) o si ya fue encontrada (false) */
    isScanning: boolean;
    /** Indica si el tracking se perdió y requiere reencuadre */
    isLost: boolean;
}

/**
 * ScanOverlay
 * 
 * Un Dumb Component (UI pura) encargado de mostrar el marco de escaneo 
 * para la experiencia de Realidad Aumentada.
 * No contiene lógica de negocio ni dependencias de SDKs de AR.
 */
export const ScanOverlay: React.FC<ScanOverlayProps> = ({ isScanning, isLost }) => {
    return (
        <>
            {/* Indicador de pérdida de tracking */}
            <div
                className={`fixed top-5 left-1/2 -translate-x-1/2 bg-[#FF5722]/15 border border-[#FF5722]/50 text-[#FF5722] text-[11px] px-4 py-1.5 rounded-full tracking-widest uppercase pointer-events-none z-[200] transition-opacity duration-400 ease-in-out ${isLost ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                ⚠ Reencuadra la tarjeta
            </div>

            {/* Overlay de escaneo principal */}
            <div
                id="scan-overlay"
                className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/65 backdrop-blur-md transition-opacity duration-500 ease-in-out ${!isScanning ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
            >
                <div
                    className="relative mb-7 flex items-center justify-center w-[85%] max-w-[420px] aspect-[1.8/1] max-h-[200px] portrait:max-h-none transition-all duration-[220ms] ease-in-out 
          before:absolute before:top-0 before:left-0 before:h-8 before:w-8 before:border-t-3 before:border-l-3 before:border-brand-primary 
          after:absolute after:top-0 after:right-0 after:h-8 after:w-8 after:border-t-3 after:border-r-3 after:border-brand-primary"
                >
                    {/* Línea de escaneo animada */}
                    <div
                        className="absolute left-0 w-full h-[2px] bg-[linear-gradient(90deg,transparent,#3AA3FF,#00EEFF,#3AA3FF,transparent)] shadow-[0_0_14px_#3AA3FF] animate-[beam-sweep_2s_ease-in-out_infinite]"
                    />

                    {/* Esquinas inferiores */}
                    <div className="absolute bottom-0 right-0 h-8 w-8 border-b-3 border-r-3 border-brand-primary" />
                    <div className="absolute bottom-0 left-0 h-8 w-8 border-b-3 border-l-3 border-brand-primary" />
                </div>

                <p className="text-brand-primary text-[15px] font-semibold tracking-[3px] uppercase mt-2.5">
                    Apunta a la tarjeta
                </p>
                <p className="text-white/60 text-[12px] mt-1.5">
                    Mantén la cámara estable
                </p>
            </div>
        </>
    );
};

export default ScanOverlay;
