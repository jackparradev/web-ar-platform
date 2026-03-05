# Análisis Arquitectónico: Desacoplamiento de ARCard.tsx

## 1. Estado Actual vs MVP Monolítico
En el MVP original, `src/app/card/[slug]/ARCard.tsx` era un componente masivo (más de 400 líneas) que rompía varios principios de Clean Architecture al mezclar:
- Definición de Tipos (Domain).
- Lógica de ciclo de vida de React y DOM para A-Frame (Core).
- Renderizado de interfaz 2D, como el overlay y el toast (UI Base/Features).
- Renderizado de interfaz 3D y callbacks de interacción en el canvas (Core/UI).

### Lo que se ha hecho bien (El nuevo desacoplamiento):
Se ha iniciado correctamente la separación respetando la nueva propuesta:
1. **Composición en `src/ui/components/features/ar/`**:
   - `ARViewer.tsx`: Ahora se centra *exclusivamente* en estructurar la escena `<a-scene>` y mapear los nodos 3D (perfil, logo, links). Está limpio y libre de `document.querySelector` o `setTimeout` directos.
   - `ScanOverlay.tsx`: Se convirtió de forma excelente en un *Dumb Component*, que solo recibe `isScanning` e `isLost` por props y renderiza Tailwind. Cero lógica de negocio.
2. **Extracción de Lógica a `src/core/hooks/`**:
   - `useARTracking.ts` y `useARInteraction.ts` asumen la mutación del DOM, manejo de eventos del raycaster y touch projection. Esto "limpia" a los componentes de UI, permitiendo que la interacción de A-Frame resida en el Core de la aplicación, como dictan las reglas del `PROJECT_CONTEXT.md`.

---

## 2. Inconsistencias Actuales y Deuda Técnica Detectada
Aunque los nuevos archivos están bien estructurados, el proyecto todavía arrastra el código legado y piezas fuera de lugar:

1. **El Monolito sigue vivo en `app/`**:
   - El archivo `src/app/card/[slug]/ARCard.tsx` actual *sigue manteniendo* todo el código monolítico. Este archivo debe ser refactorizado inmediatamente para simplemente actuar como un orquestador que importe e integre `<ARViewer />` y `<ScanOverlay />`.
2. **Violación de la Capa de Dominio**:
   - Los interfaces `Profile`, `Card`, y `ARCardProps` están "hardcodeados" dentro del archivo de UI (`ARCard.tsx`). Estos pertenecen estrictamente a la capa de **Dominio**.
3. **Falta de uso de la Capa de Infraestructura**:
   - La obtención de datos (fetching del perfil, la tarjeta y la generación del `mindFileUrl` firmado) probablemente se esté haciendo directamente en los Server Components de la ruta, o peor, en el cliente. Esto debe extraerse a acciones en `src/infra/actions/` (ej. `getCardBySlug.action.ts`).
4. **Constantes Mágicas Múltiples**:
   - En `ARViewer.tsx` y los hooks hay constantes de tiempo (700ms, 650ms, 350ms para timeouts) y URLs duras como la de GitHub o WhatsApp. Esto debe moverse a `src/domain/constants/ar.constants.ts`.

---

## 3. Plan de Acción Recomendado (Estructura Final Propuesta)

Para alinear el 100% del código a la arquitectura, se deben ejecutar los siguientes pasos de refactorización:

### A. Capa de Dominio (`src/domain/`)
- Mover los tipos `Profile` y `Card` a `src/domain/types/card.types.ts`.
- Mover los tiempos de animación y parámetros del escáner a `src/domain/constants/ar.constants.ts`.

### B. Capa de Infraestructura (`src/infra/`)
- Crear `src/infra/actions/card.actions.ts` para contener la lógica que consulta a Supabase (ej. `fetchCardData(slug: string)`).

### C. Capa de Presentación y Enrutamiento (`src/ui/` y `src/app/`)
- Refactorizar `src/app/card/[slug]/page.tsx` para que sea un **Server Component** puro que llame a `infra/actions` y pase la data limpia hacia abajo.
- Refactorizar `src/app/card/[slug]/ARCard.tsx` para que pase de ser el monolito a un componente contenedor que simplemente retorne:
  ```tsx
  return (
    <>
      <ScanOverlay isScanning={!isTargetFound} isLost={!isDeployed} />
      <ARViewer profile={profile} card={card} mindUrl={mindUrl} />
    </>
  )
  ```
  *(Nota: El archivo `ARCard.tsx` podría incluso moverse a `src/ui/components/features/ar/ARCardPage.tsx` para mantener `src/app/` puramente para enrutamiento (`page.tsx`))*

### D. Capa Core (`src/core/`)
- Interconectar la data traída desde `infra` pasándola limpiamente a los hooks `useARTracking` y `useARInteraction`.

## Conclusión
El desacoplamiento de la UI de AR (Viewer y Overlay) hacia `features` y el de la lógica de negocio SDK hacia `core/hooks` fue un **éxito y está 100% alineado con las reglas**. El siguiente paso necesario es destruir el monolito restante en `app/card/[slug]/ARCard.tsx`, redistribuir sus tipos hacia `domain/` y asegurar que la carga de datos venga de `infra/actions`.
