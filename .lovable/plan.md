

# Plan: Eliminar Logo del Hero

## Cambios en `src/components/Hero.tsx`

### 1. Hero para usuarios NO autenticados (líneas 32-39)
Eliminar el bloque del logo:
```tsx
{/* LOGO OPTIMIZADO PARA MÓVIL */}
<div className="mb-4 sm:mb-6 md:mb-8 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
  <img 
    src="/lovable-uploads/fighter-id-logo-official.png" 
    alt="Fighter ID"
    className="h-32 sm:h-40 md:h-48 lg:h-56 w-auto mx-auto transition-all duration-500"
  />
</div>
```

### 2. Hero para usuarios autenticados (líneas 101-107)
Eliminar el bloque del logo:
```tsx
<div className="mb-3 sm:mb-4 md:mb-6 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
  <img 
    src="/lovable-uploads/fighter-id-logo-official.png" 
    alt="Fighter ID Logo"
    className="h-28 sm:h-36 md:h-44 lg:h-52 w-auto mx-auto"
  />
</div>
```

## Resultado

```text
ANTES:                          DESPUÉS:
┌───────────────────┐           ┌───────────────────┐
│   [LOGO GRANDE]   │           │                   │
│                   │           │   Subtítulo       │
│   Subtítulo       │    →      │   [Botones]       │
│   [Botones]       │           │                   │
└───────────────────┘           └───────────────────┘
```

El Hero quedará más limpio, mostrando directamente el subtítulo y los botones de acción.

