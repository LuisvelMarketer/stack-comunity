

# Plan: Corrección de Paleta de Colores - STACK

## Análisis del Logo

Analizando las imágenes del logo STACK, identifico 3 colores principales en las capas:

```text
┌─────────────────────────────────────┐
│     Capa Superior: Gris Oscuro      │  #2D3748 / #1A202C
├─────────────────────────────────────┤
│      Capa Media: Steel Gray         │  #4A5568 / #223440
├─────────────────────────────────────┤
│     Capa Inferior: Cyan/Turquesa    │  #4FD1C5 / #5DE0E6 ← COLOR DE ACENTO
└─────────────────────────────────────┘
```

## Problema Actual

El sistema usa **Neural Blue (#5A8CFF)** como color primario, pero el logo tiene **Cyan/Turquesa** como color de acento real.

| Actual | Correcto |
|--------|----------|
| `#5A8CFF` (Azul) | `#4FD1C5` (Cyan/Turquesa) |
| HSL: 220° 100% 68% | HSL: 171° 52% 56% |

---

## Nueva Paleta Propuesta

### Colores Principales

| Nombre | Hex | HSL | Uso |
|--------|-----|-----|-----|
| **Midnight Core** | `#14181E` | 216° 23% 10% | Fondo principal |
| **Stack Cyan** | `#4FD1C5` | 171° 52% 56% | Color primario, acentos, glow |
| **Steel Gray** | `#223440` | 203° 30% 17% | Cards, elementos secundarios |
| **Cloud White** | `#F5F7FA` | 220° 20% 97% | Texto principal |
| **Dark Layer** | `#2D3748` | 218° 23% 23% | Capa superior del logo |
| **Mid Layer** | `#4A5568` | 218° 17% 35% | Capa media del logo |

---

## Fase 1: Variables CSS Base

### Archivo: `src/index.css`

**Cambios en Light Mode:**
```css
:root {
  --primary: 171 52% 56%;           /* #4FD1C5 - Stack Cyan */
  --primary-foreground: 220 15% 97%;
  --ring: 171 52% 56%;
  /* ... resto mantiene estructura */
}
```

**Cambios en Dark Mode:**
```css
.dark {
  --background: 216 23% 10%;        /* #14181E - Midnight Core */
  --foreground: 220 20% 97%;        /* #F5F7FA - Cloud White */
  --card: 203 30% 17%;              /* #223440 - Steel Gray */
  --primary: 171 52% 56%;           /* #4FD1C5 - Stack Cyan */
  --ring: 171 52% 56%;
  
  /* Gradientes actualizados a Cyan */
  --gradient-primary: linear-gradient(135deg, hsl(171 52% 56%), hsl(176 60% 45%));
  --shadow-glow: 0 0 80px hsl(171 52% 56% / 0.2);
}
```

---

## Fase 2: Efectos de Glow

### Archivo: `src/index.css` - Utilities

Todos los efectos de glow deben cambiar de azul (220°) a cyan (171°):

```css
/* Glow effects - STACK Cyan */
.glow-primary {
  box-shadow: 0 0 40px hsl(171 52% 56% / 0.4);
}

.glow-text {
  text-shadow: 0 0 30px hsl(171 52% 56% / 0.5);
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px hsl(171 52% 56% / 0.4); }
  50% { box-shadow: 0 0 60px hsl(171 52% 56% / 0.7); }
}

.hover-lift:hover {
  box-shadow: 0 20px 40px -15px hsl(171 52% 56% / 0.3);
}

.hover-glow:hover {
  box-shadow: 0 0 40px hsl(171 52% 56% / 0.4);
}
```

---

## Fase 3: Tailwind Config

### Archivo: `tailwind.config.ts`

```typescript
boxShadow: {
  elegant: "var(--shadow-elegant)",
  glow: "var(--shadow-glow)",
  "glow-lg": "0 0 60px hsl(171 52% 56% / 0.3)",  // Cambio de 220° a 171°
},
```

---

## Fase 4: Metadata SEO

### Archivo: `index.html`

```html
<meta name="theme-color" content="#4FD1C5" />  <!-- Stack Cyan -->
```

---

## Resumen de Cambios

### Archivos a Modificar

1. **`src/index.css`**
   - Variables CSS (--primary, --ring)
   - Gradientes (--gradient-primary, --gradient-hero)
   - Sombras (--shadow-glow, --shadow-elegant)
   - Efectos glow (.glow-primary, .glow-text)
   - Animaciones (pulse-glow, hover effects)

2. **`tailwind.config.ts`**
   - boxShadow.glow-lg

3. **`index.html`**
   - meta theme-color

### Cambio Principal

| Componente | De (Azul) | A (Cyan) |
|------------|-----------|----------|
| Hue | 220° | 171° |
| Hex | #5A8CFF | #4FD1C5 |
| Nombre | Neural Blue | Stack Cyan |

---

## Resultado Visual Esperado

- Botones primarios en **cyan/turquesa**
- Efectos de glow en **cyan** (más consistente con el logo)
- Gradientes de **cyan a teal**
- Links y acentos en el mismo tono **turquesa**
- Estética más fiel al logo de STACK con sus capas

