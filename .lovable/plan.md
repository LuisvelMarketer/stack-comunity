

# Plan: Gestión de Eventos y Lives para Dueños de Comunidad

## Problema

Actualmente, solo los administradores de la plataforma (role "admin") pueden crear eventos y sesiones en vivo desde el panel `/admin`. Un dueño de comunidad que no sea admin de la plataforma no tiene forma de programar clases, eventos o lives para su comunidad.

## Solucion

Agregar dos nuevas pestanas al panel de gestion de comunidad (`/community/:id/manage`):
- **Eventos**: Para crear, editar y eliminar eventos (incluyendo recurrencia semanal para clases)
- **Lives**: Para programar y gestionar sesiones en vivo

Estas pestanas reutilizaran la logica existente de los componentes admin (`EventsManager` y `LivesManager`), pero filtradas exclusivamente para la comunidad del owner.

---

## Nuevos Componentes

### 1. `src/components/community/CommunityEventsManager.tsx`

Componente basado en el `EventsManager` del admin pero:
- Recibe `communityId` como prop (no muestra selector de comunidad)
- Solo muestra eventos de ESA comunidad
- Permite crear eventos con recurrencia (diaria, semanal, mensual)
- Incluye campos: titulo, descripcion, fecha, ubicacion, capacidad maxima, tipo de recurrencia, fecha fin de recurrencia

### 2. `src/components/community/CommunityLivesManager.tsx`

Componente basado en el `LivesManager` del admin pero:
- Recibe `communityId` como prop
- Solo muestra lives de ESA comunidad
- Permite crear lives con: titulo, descripcion, fecha programada, URL del stream, plataforma (YouTube/Twitch/Zoom)
- Permite cambiar estado: programado, en vivo, finalizado

---

## Archivo Modificado

### 3. `src/pages/CommunityManage.tsx`

Agregar dos nuevas pestanas al `TabsList`:
- Pestana "Eventos" con icono Calendar
- Pestana "Lives" con icono Video

Importar y renderizar los nuevos componentes en sus respectivos `TabsContent`.

---

## Detalles Tecnicos

### Base de datos
No se requieren cambios. Las tablas `events` y `live_sessions` ya tienen `community_id` y soportan todos los campos necesarios (recurrencia, estado, etc).

### Seguridad
La verificacion de owner ya existe en `CommunityManage.tsx` (linea 128-143). Solo el owner puede acceder a esta pagina, por lo que los nuevos componentes heredan esa proteccion.

### Flujo del owner

```text
Owner navega a /community/:id/manage
       |
       v
  Tabs existentes + 2 nuevas:
  [Analytics][Miembros][Cursos][Eventos][Lives][Galeria]...
       |                         |        |
       v                         v        v
  (existente)              Crear/editar  Crear/editar
                           eventos con   lives con
                           recurrencia   estado
```

### Campos del formulario de Eventos
- Titulo (obligatorio)
- Descripcion
- Fecha y hora
- Ubicacion (presencial o link)
- Capacidad maxima
- Tipo de recurrencia: Ninguna / Diaria / Semanal / Mensual
- Fecha fin de recurrencia (si aplica)

### Campos del formulario de Lives
- Titulo (obligatorio)
- Descripcion
- Fecha programada
- URL del stream
- Plataforma: YouTube / Twitch / Zoom / Otro
- Imagen miniatura

