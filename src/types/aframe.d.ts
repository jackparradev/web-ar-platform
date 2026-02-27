declare global {
    interface Window {
        AFRAME?: {
            THREE?: any;
            [key: string]: any;
        };
        THREE?: any;
    }

    namespace React {
        namespace JSX {
            interface IntrinsicElements {
                // A-Frame core elements
                'a-scene': any;
                'a-camera': any;
                'a-entity': any;
                // A-Frame primitives
                'a-box': any;
                'a-sphere': any;
                'a-cylinder': any;
                'a-plane': any;
                'a-circle': any;
                'a-image': any;
                'a-text': any;
                'a-light': any;
                'a-sky': any;
                'a-assets': any;
                'a-asset-item': any;
                'a-video': any;
                'a-videosphere': any;
                'a-cursor': any;
                'a-ring': any;
                'a-cone': any;
                'a-torus': any;
                'a-triangle': any;
            }
        }
    }
}

export { };
