
# Plan: Rebranding Completo a STACK

## Resumen Ejecutivo
Transformación total de la identidad visual de "Skoolify" a **STACK** con la nueva estética premium y oscura, siguiendo el brand kit proporcionado.

---

## Nueva Identidad Visual

### Paleta de Colores (del Brand Kit)

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Midnight Core** | `#14181E` | Fondo principal (background) |
| **Neural Blue** | `#5A8CFF` | Color primario, acentos, CTAs |
| **Steel Gray** | `#223440` | Cards, elementos secundarios |
| **Cloud White** | `#F5F7FA` | Texto principal, iconos |

### Logo
- Icono de 3 capas apiladas (layers) con gradiente cyan-gris-oscuro
- Tipografía: Sans-serif moderna, tracking amplio, mayúsculas

### Tagline
**"Infrastructure for the Elite"**

---

## Fase 1: Activos de Marca

### Archivos a Crear/Copiar
```text
src/assets/stack-logo.png       ← Logo principal (desde imagen subida)
public/favicon.png              ← Favicon actualizado
public/pwa-192x192.png          ← PWA icon
public/pwa-512x512.png          ← PWA icon grande
```

### Archivos a Eliminar
```text
src/assets/skoolify-logo.png    ← Logo anterior
src/assets/codigo-cero-logo.png ← Obsoleto
```

---

## Fase 2: Sistema de Colores

### Archivo: `src/index.css`

**Cambios en Light Mode:**
```css
:root {
  --background: 220 15% 97%;      /* Gris claro neutro */
  --foreground: 216 20% 10%;      /* #14181E adaptado */
  --primary: 220 100% 68%;        /* #5A8CFF */
  --primary-foreground: 220 15% 97%;
  /* ... resto adaptado a la paleta */
}
```

**Cambios en Dark Mode:**
```css
.dark {
  --background: 216 23% 10%;      /* #14181E - Midnight Core */
  --foreground: 220 20% 97%;      /* #F5F7FA - Cloud White */
  --card: 203 30% 17%;            /* #223440 - Steel Gray */
  --primary: 220 100% 68%;        /* #5A8CFF - Neural Blue */
  --gradient-primary: linear-gradient(135deg, #5A8CFF, #4A7AEE);
  --shadow-glow: 0 0 80px hsl(220 100% 68% / 0.2);
  /* ... */
}
```

### Archivo: `tailwind.config.ts`
Actualizar referencias de glow desde púrpura (262°) a azul (220°)

---

## Fase 3: Componentes de Navegación

### `src/components/layout/MainNavbar.tsx`
```diff
- import skoolifyLogo from "@/assets/skoolify-logo.png";
+ import stackLogo from "@/assets/stack-logo.png";

- <img src={skoolifyLogo} alt="Skoolify" .../>
- <h1>Skoolify</h1>
+ <img src={stackLogo} alt="STACK" .../>
+ <h1 className="tracking-widest font-semibold">STACK</h1>
```

### `src/components/layout/MobileNav.tsx`
Mismos cambios de logo y nombre

---

## Fase 4: Metadata y SEO

### `index.html`
```html
<title>STACK - Infrastructure for the Elite</title>
<meta name="description" content="Plataforma de aprendizaje y comunidades para desarrolladores de élite" />
<meta name="author" content="STACK" />
<meta name="theme-color" content="#5A8CFF" />
<meta name="apple-mobile-web-app-title" content="STACK" />
<meta property="og:title" content="STACK - Infrastructure for the Elite" />
```

---

## Fase 5: Páginas Afectadas

### Cambios de Texto "Skoolify" → "STACK"
| Archivo | Referencias |
|---------|-------------|
| `src/pages/Auth.tsx` | Logo, título, copyright |
| `src/pages/Index.tsx` | Header, footer, demo, CTAs |
| `src/pages/CodigoQuantumLanding.tsx` | Footer link |
| `src/pages/CommunityLanding.tsx` | Header, footer |
| `src/pages/Library.tsx` | Meta title |
| `src/components/LockedDashboard.tsx` | Título "Código Cero" |
| `src/components/social/MyCommunities.tsx` | Referencias |

### Cambios de "Código Cero" → "STACK" (cuando aplique)
- `src/components/LockedDashboard.tsx`
- `src/pages/CommunityLanding.tsx`
- Edge function: `supabase/functions/create-codigo-cero-checkout/`

---

## Fase 6: Efectos Visuales Premium

### Nuevos efectos de glow azul
```css
.glow-primary {
  box-shadow: 0 0 40px hsl(220 100% 68% / 0.4);
}

.glow-text {
  text-shadow: 0 0 30px hsl(220 100% 68% / 0.5);
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px hsl(220 100% 68% / 0.4); }
  50% { box-shadow: 0 0 60px hsl(220 100% 68% / 0.7); }
}
```

### Estética de capas (Stack layers)
Agregar elementos visuales que evoquen las capas del logo en backgrounds y decoraciones

---

## Resumen de Archivos

### A Crear/Copiar
1. `src/assets/stack-logo.png` ← desde imagen subida
2. `public/favicon.png` ← nuevo favicon
3. PWA icons actualizados

### A Modificar (Alta Prioridad)
1. `src/index.css` - Sistema de colores completo
2. `tailwind.config.ts` - Referencias de color
3. `src/components/layout/MainNavbar.tsx` - Logo global
4. `src/components/layout/MobileNav.tsx` - Logo móvil
5. `index.html` - Metadata SEO

### A Modificar (Contenido)
6. `src/pages/Auth.tsx` - Página de login
7. `src/pages/Index.tsx` - Landing page
8. `src/pages/CommunityLanding.tsx` - Landing de comunidades
9. `src/pages/CodigoQuantumLanding.tsx` - Referencia footer
10. `src/pages/Library.tsx` - Meta tags
11. `src/components/LockedDashboard.tsx` - Paywall

---

## Notas Importantes

- El modo oscuro será el **modo por defecto** recomendado para la estética premium
- La tipografía del nombre "STACK" usará tracking amplio (`tracking-widest`) para coincidir con el brand kit
- Los efectos de glow cambiarán de púrpura (#8B5CF6) a Neural Blue (#5A8CFF)
- El tagline "Infrastructure for the Elite" se integrará en secciones estratégicas (landing, auth)
