
# Plan: Navegación Global Persistente

## Objetivo
Crear una barra de navegación superior que se mantenga visible en **todas las secciones** de la aplicación (no solo en el Dashboard), proporcionando una experiencia de navegación consistente.

## Análisis del Estado Actual

| Página | Navegación Actual |
|--------|-------------------|
| Dashboard | Completa (logo, enlaces, UserMenu) |
| Build in Public | Solo botón "Volver" |
| Marketplace | Solo botón "Volver" + título |
| Incubator | Solo botón "Volver" + título + UserMenu |
| Courses | Logo + título + UserMenu (sin enlaces) |
| Calendar | Solo botón "Volver" + título |
| Communities | Solo botón "Volver" + título + UserMenu |
| Profile | Solo botón "Volver" |
| Messages | Personalizado |

## Solución Propuesta

### 1. Crear componente `MainNavbar`
Un nuevo componente reutilizable que contendrá:
- Logo Skoolify (clickeable → Dashboard)
- Enlaces de navegación principales:
  - Inicio
  - Comunidades
  - Classroom
  - Calendario
  - Build in Public
  - Marketplace
- UserMenu (búsqueda global, tema, mensajes, notificaciones, avatar)
- Versión responsive para móvil (menú hamburguesa)

### 2. Crear `MainLayout` wrapper
Un componente de layout que:
- Envuelve el contenido de cada página
- Incluye `MainNavbar` de forma automática
- Maneja la estructura consistente (sticky header, contenido principal)

### 3. Actualizar páginas afectadas
Reemplazar los headers individuales con el nuevo `MainLayout`:
- BuildInPublic
- Marketplace
- Incubator
- CalendarPage
- Courses
- Communities
- Profile
- Messages
- Subscriptions
- Affiliate
- MyCommunities
- CommunityManage
- MyPortfolio
- Library
- SnippetDetail

---

## Detalles Técnicos

### Nuevo archivo: `src/components/layout/MainNavbar.tsx`
```text
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo] Skoolify    │ Inicio │ Comunidades │ Classroom │ ...  │ [UserMenu] │
└─────────────────────────────────────────────────────────────────────┘
```

Características:
- `sticky top-0 z-50` para mantenerlo fijo
- Backdrop blur para efecto visual
- Highlight del enlace activo según la ruta actual
- Menú hamburguesa en móvil con Sheet/Drawer

### Nuevo archivo: `src/components/layout/MainLayout.tsx`
```typescript
// Estructura básica
const MainLayout = ({ children }) => (
  <div className="min-h-screen bg-background">
    <MainNavbar />
    <main>{children}</main>
  </div>
);
```

### Props opcionales para el layout
- `showAdminLink?: boolean` - para mostrar enlace a Admin en UserMenu
- `className?: string` - para estilos personalizados del contenedor main

---

## Beneficios
1. **Navegación consistente** en toda la app
2. **Código DRY** - elimina duplicación de headers
3. **Fácil mantenimiento** - un solo lugar para actualizar navegación
4. **Mejor UX** - usuarios siempre pueden navegar sin volver al Dashboard
5. **Mobile-first** - menú responsive incluido

## Archivos a Crear
- `src/components/layout/MainNavbar.tsx`
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/MobileNav.tsx` (menú hamburguesa)

## Archivos a Modificar
Actualizar ~15 páginas para usar el nuevo `MainLayout` en lugar de sus headers individuales.
