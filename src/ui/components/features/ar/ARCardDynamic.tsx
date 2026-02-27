"use client";

import dynamic from 'next/dynamic';
import { ARCardWrapperProps } from './ARCardWrapper';

const ARCardWrapperDynamic = dynamic(
    () => import('./ARCardWrapper'),
    { ssr: false }
);

export default function ARCardDynamic(props: ARCardWrapperProps) {
    return <ARCardWrapperDynamic {...props} />;
}
