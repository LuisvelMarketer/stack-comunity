
# Plan: Eliminar el Flash de la Página de Pricing

## Problema Identificado

El flash de la página de pricing (LockedDashboard) ocurre debido a múltiples condiciones de carrera:

### Causa Raíz #1: Estado de carga no sincronizado
En `Dashboard.tsx` (líneas 69-75):
```tsx
if (!enrollmentLoading && !isEnrolled && !isAdmin) {
  return <LockedDashboard />;
}
```

El problema es que:
- `enrollmentLoading` termina en ~100ms
- `isAdmin` (verificación RPC) tarda ~200-300ms
- Durante ese gap, `!enrollmentLoading && !isEnrolled && !isAdmin` es `true` → ¡Flash!

### Causa Raíz #2: Múltiples verificaciones de admin
- `Dashboard.tsx` tiene su propia verificación de admin con `checkAdminRole()` (líneas 51-66)
- `useIsAdmin` hook también verifica admin por separado
- Ambas empiezan en `false` y no hay estado de carga coordinado

---

## Solución Propuesta

### Paso 1: Unificar verificación de admin en Dashboard

Reemplazar la verificación manual en Dashboard con el hook `useIsAdmin` que ya tiene un estado `loading`:

```tsx
// Dashboard.tsx - Cambiar de:
const [isAdmin, setIsAdmin] = useState(false);
// ...checkAdminRole useEffect...

// A:
const { isAdmin, loading: adminLoading } = useIsAdmin();
```

### Paso 2: Esperar todas las cargas antes de renderizar

Modificar la condición para esperar que TODAS las verificaciones terminen:

```tsx
// Dashboard.tsx - Cambiar de:
if (!enrollmentLoading && !isEnrolled && !isAdmin) {
  return <LockedDashboard />;
}

// A:
// Mostrar loading mientras cualquier verificación esté en progreso
if (enrollmentLoading || adminLoading) {
  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </MainLayout>
  );
}

// Solo después de que TODAS las cargas terminen, evaluar acceso
if (!isEnrolled && !isAdmin) {
  return <LockedDashboard />;
}
```

### Paso 3: Eliminar código duplicado

Remover el `useEffect` y `checkAdminRole` manuales ya que usaremos `useIsAdmin`:

```tsx
// ELIMINAR estas líneas (47-66):
useEffect(() => {
  checkAdminRole();
}, [user]);

const checkAdminRole = async () => { ... };
```

---

## Cambios de Archivos

### 1. `src/pages/Dashboard.tsx`

```text
Cambios:
1. Importar useIsAdmin (ya existe en el proyecto)
2. Reemplazar useState isAdmin por useIsAdmin hook
3. Eliminar checkAdminRole y su useEffect
4. Agregar estado de carga combinado antes de evaluar acceso
```

Resultado esperado:
- El spinner de carga se muestra hasta que AMBAS verificaciones (enrollment + admin) terminen
- No hay ventana de tiempo donde se pueda mostrar LockedDashboard incorrectamente

---

## Flujo Corregido

```text
Usuario navega a /dashboard
         │
         ▼
   ProtectedRoute
   (loading = true → spinner)
         │
   loading = false, user existe
         │
         ▼
      Dashboard
         │
    ┌────┴────┐
    ▼         ▼
enrollmentLoading  adminLoading
   = true          = true
    │              │
    ▼              ▼
  ¿Loading?  ──────┴──────► SÍ → Spinner (NO flash)
    │
   Ambos = false
    │
    ▼
  ¿isEnrolled || isAdmin?
    │
   YES → Dashboard completo
   NO  → LockedDashboard
```

---

## Detalles Técnicos

Esta solución:
- Elimina duplicación de código (una sola verificación de admin)
- Sincroniza los estados de carga
- Previene cualquier renderizado prematuro de LockedDashboard
- Mantiene la misma lógica de negocio (usuarios no-enrolled y no-admin ven pricing)
