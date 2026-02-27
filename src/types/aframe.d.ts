import React from 'react';

declare global {
    interface Window {
        AFRAME?: {
            THREE?: any;
        };
        THREE?: any;
    }

    namespace JSX {
        interface IntrinsicElements {
            'a-scene': any;
            'a-camera': any;
            'a-entity': any;
        }
    }

    namespace React {
        namespace JSX {
            interface IntrinsicElements {
                'a-scene': any;
                'a-camera': any;
                'a-entity': any;
            }
        }
    }
}
