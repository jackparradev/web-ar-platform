# Project Context: Card AR Platform

## Visión General
"card-ar-platform" es un SaaS multi-tenant diseñado para crear, gestionar y visualizar experiencias de Realidad Aumentada (AR) vinculadas a tarjetas (ej. tarjetas de presentación, invitaciones, postales). La plataforma está construida utilizando **Clean Architecture** adaptada para el App Router de Next.js, buscando separar claramente la presentación, la lógica de negocio (dominio), la infraestructura (Base de Datos, APIs, AR engine) y el estado del cliente.

## Stack Tecnológico
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Base de Datos / Backend-as-a-Service:** Supabase (Auth, Database, Storage)
- **Motor AR:** A-Frame + MindAR (WebAR ligero basado en image tracking)
- **Lenguaje:** TypeScript estricto

## Arquitectura (Clean Architecture adaptada a Next.js App Router)
El proyecto utiliza una estructura modular orientada al dominio y la responsabilidad de cada capa:

1. **Capa de Dominio (`src/domain/`)**
   - Contiene tipos de TypeScript (`types/`), interfaces y entidades de negocio compartidas (`entities/`).
   - Define constantes globales y esquemas de validación (ej. Zod) independientes del framework.
   - *Regla:* No puede depender de ninguna otra capa.

2. **Capa de Infraestructura (`src/infra/`)**
   - **Base de Datos / Backend:** Clientes de Supabase (`src/infra/db/`).
   - **Mutaciones:** Server Actions para comunicación con DB (`src/infra/actions/`).
   - **Servicios Externos:** Integraciones de terceros (`src/infra/services/`).

3. **Capa de Lógica de Cliente (`src/core/`)**
   - **Custom Hooks:** Toda la lógica de estado del cliente, ciclos de vida de React y lógica de negocio AR (`src/core/hooks/`).
   - Gestión del estado global (`src/core/store/`).
   - *Regla:* La UI debe estar "muda" (dumb); la lógica compleja (ej. conexión MindAR, Auth) reside aquí.

4. **Capa de Presentación y UI (`src/ui/` + `src/app/`)**
   - **App Router (`src/app/`):** Definición de rutas, layouts, y Server Components que orquestan llamadas a `infra` para pasarlas a la UI.
   - **Componentes (`src/ui/components/`):**
     - `base/`: Componentes atómicos/reutilizables (botones, inputs, modales). Reemplaza al clásico `ui/` para evitar redundancia (`ui/components/ui`).
     - `features/`: Componentes complejos formados por componentes base (ej. `ARViewer`, `TenantSettingsForm`).
   - **Layouts (`src/ui/layouts/`):** Estructuras de vista reutilizables como Sidebar, Headers.
   - *Regla:* Cero estado pesado en UI. Aislar el `'use client'` a ramas específicas.

## Reglas Estrictas de Desarrollo

1. **Server Components por Defecto:**
   - Asume que todo componente es un Server Component. Usa `"use client"` únicamente en la capa más profunda posible o donde se necesite acceso a hooks de React (useState, useEffect), interactividad del usuario o acceso a APIs del navegador (WebXR, cámara para MindAR).

2. **Cero Lógica en la UI:**
   - Los archivos `.tsx` en `src/ui/components/` solo deben recibir props y retornan JSX (o usar hooks dedicados). Si un componente de cliente necesita calcular estados complejos o gestionar el ciclo de vida de A-Frame/MindAR, debe extraer esa lógica a un hook (ej. `useMindAR()`).

3. **Aislamiento del Multi-Tenant:**
   - Todo acceso a datos en Supabase debe validar el `tenant_id` del usuario autenticado vía Row Level Security (RLS) en la base de datos y validaciones en los Server Actions.
   - Las rutas deben organizarse para soportar tenants, ya sea usando subdominios (requiere middleware) o rutas parametrizadas (ej. `/app/[tenantId]/dashboard`).

4. **Principio de Responsabilidad Única (SRP):**
   - Un Server Action hace mutación de datos. Un Server Component obtiene datos. Un Client Component renderiza interactividad.

5. **Inyección de Dependencias (Implícita):**
   - Evita acoplar fuertemente los componentes a Supabase. Los componentes de UI solo saben que invocan una función async (Server Action) pasada como prop, o usan un hook que encapsula la llamada a la infraestructura.

## Gestión de la Realidad Aumentada (AR)
- **A-Frame y MindAR** operan en el navegador. Requieren acceso directo al DOM y objetos globales de `window`.
- *Implementación:* Los componentes de AR SIEMPRE deben ser **Client Components** (`"use client"`) cargados dinámicamente usando `next/dynamic` con `ssr: false` para evitar que Next.js intente renderizarlos en el servidor (lo cual causaría errores de "window is not defined").
