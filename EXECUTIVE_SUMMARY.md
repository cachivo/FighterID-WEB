# 🥊 Fighter ID - Resumen Ejecutivo
## Plataforma Integral de Gestión para Deportes de Combate

**Fecha**: Enero 2026  
**Versión**: 2.0  
**Estado**: Producción Activa

---

## 📊 MÉTRICAS ACTUALES DEL SISTEMA

| Métrica | Valor |
|---------|-------|
| 👤 Peleadores Registrados | **42** |
| 📜 Licencias Emitidas | **41** |
| 🏋️ Gimnasios Registrados | **1** |
| 👨‍⚖️ Jueces Certificados | **4** |
| 👥 Usuarios de Plataforma | **98** |
| 📱 Posts Sociales | **3,817** |
| 📰 Noticias Deportivas | **284** |
| 🥊 Peleas Registradas | **8** |
| 🤝 Aliados Estratégicos | **3** |
| 🧪 Tests de Dopaje | **1** |

---

## 🎯 RESUMEN EJECUTIVO

**Fighter ID** es una plataforma integral diseñada para digitalizar y profesionalizar la industria de los deportes de combate en Latinoamérica. El sistema abarca desde la certificación de peleadores hasta el scoring en tiempo real de eventos, creando un ecosistema completo que beneficia a peleadores, promotores, jueces y fanáticos.

### Propuesta de Valor Única

1. **Primera plataforma en LATAM** que integra licenciamiento digital con scoring en tiempo real
2. **Sistema de certificación verificable** con códigos QR y verificación pública
3. **IA para detección de golpes** en desarrollo (visión por computadora)
4. **Red social especializada** para la comunidad de deportes de combate
5. **Sistema de predicciones** con mercados en tiempo real

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilos** | Tailwind CSS + shadcn/ui |
| **Backend** | Supabase (PostgreSQL + Edge Functions) |
| **Tiempo Real** | Supabase Realtime (WebSockets) |
| **Autenticación** | Supabase Auth (Email + OAuth) |
| **Almacenamiento** | Supabase Storage |
| **IA (Planificado)** | Python + YOLOv8 + FastAPI |
| **Mobile** | PWA + Capacitor (iOS/Android) |

### Infraestructura de Base de Datos

**82 tablas en producción** organizadas en los siguientes dominios:

#### 1. Gestión de Peleadores (6 tablas)
- `fighter_profiles` - 51 columnas con información completa
- `fighter_licenses` - Sistema de licencias digitales
- `fighter_status_updates` - Estados de disponibilidad
- `fighter_updates` - Historial de cambios
- `fighter_invitations` - Sistema de invitaciones
- `external_fighters` - Peleadores externos (oponentes)

#### 2. Sistema de Licencias (5 tablas)
- `fighter_licenses` - Licencias con estado y vencimiento
- `license_documents` - Documentos adjuntos
- `license_audit_log` - Auditoría de cambios
- `license_verification_tokens` - Verificación pública
- `doping_tests` - Historial antidopaje

#### 3. Eventos y Peleas (9 tablas)
- `events` - Eventos deportivos
- `fights` - Peleas individuales
- `fight_rounds` - Rounds por pelea
- `fight_results` - Resultados oficiales
- `fight_statistics` - Estadísticas detalladas
- `fight_scorecards` - Tarjetas de puntuación
- `fight_bookings` - Reservas de peleas
- `fights_history` - Historial de combates
- `fight_control_events` - Control de árbitros

#### 4. Sistema de Jueces (5 tablas)
- `judges` - Jueces certificados
- `fight_judges` - Asignaciones a peleas
- `fight_officials` - Oficiales de pelea
- `judge_station_pins` - PINs de estaciones
- `judge_station_sessions` - Sesiones activas

#### 5. Scoring en Tiempo Real (4 tablas)
- `scoring_events` - Eventos de puntuación
- `scoring_weights` - Pesos configurables
- `rounds` - Rounds activos
- `round_totals` - Totales calculados

#### 6. Red Social (11 tablas)
- `social_posts` - Publicaciones
- `post_comments` - Comentarios
- `post_likes` - Likes
- `post_media` - Imágenes/videos
- `post_hashtags` - Hashtags
- `post_mentions` - Menciones
- `trending_hashtags` - Tendencias
- `friendships` - Amistades
- `friend_requests` - Solicitudes
- `user_follows` - Seguimientos
- `notifications` - Notificaciones

#### 7. Sistema de Predicciones/Apuestas (6 tablas)
- `bdg_event` - Eventos de apuestas
- `market` - Mercados
- `outcome` - Resultados posibles
- `bet_ticket` - Tickets de apuestas
- `bet_delay_queue` - Cola de procesamiento
- `settlement` - Liquidaciones

#### 8. IA y Vision (4 tablas)
- `ai_strike_events` - Golpes detectados
- `ai_inference_sessions` - Sesiones de IA
- `ai_model_versions` - Versiones de modelos
- `ai_inference_logs` - Logs del sistema

#### 9. Gimnasios y Entrenadores (2 tablas)
- `gyms` - 21 columnas completas
- `coaches` - 20 columnas completas

#### 10. Usuarios y Roles (4 tablas)
- `app_user` - Usuarios de plataforma
- `user_roles` - Roles asignados
- `user_limit` - Límites de uso
- `wallet` + `wallet_tx` - Sistema de billetera

---

## 🛡️ MÓDULOS FUNCIONALES

### 1. PORTAL DE LICENCIAS FIGHTER ID ✅

**Objetivo**: Digitalizar el proceso de certificación de peleadores profesionales.

#### Funcionalidades Implementadas:
- ✅ Registro y solicitud de licencia digital
- ✅ Onboarding guiado en múltiples pasos
- ✅ Subida de documentos (ID, certificados médicos)
- ✅ Verificación de identidad
- ✅ Estados de licencia (ACTIVE, SUSPENDED, PENDING_REVIEW)
- ✅ Dashboard personal del peleador
- ✅ Código QR para verificación pública
- ✅ Sistema de renovación automática

#### Flujo de Usuario:
```
Registro → Onboarding → Documentos → Revisión Admin → Aprobación → Licencia Activa
```

#### Rutas del Sistema:
- `/license/welcome` - Página de bienvenida
- `/license/auth` - Autenticación
- `/license/onboarding` - Proceso de registro
- `/license/dashboard` - Dashboard del peleador
- `/license/pending` - Estado de espera
- `/verify/license/:licenseNumber` - Verificación pública

---

### 2. SISTEMA DE SCORING EN TIEMPO REAL ✅

**Objetivo**: Proveer scoring profesional en vivo para eventos de MMA/Boxing.

#### Características Técnicas:
- ✅ **Desktop-Only**: Restricción automática a computadores de escritorio
- ✅ **Latencia Ultra-Baja**: < 20ms end-to-end
- ✅ **Controles de Mouse**: Click izquierdo = golpe, Click derecho = defensa
- ✅ **Multi-Juez**: 3+ jueces simultáneos sin conflictos
- ✅ **HUD Público**: Pantalla para venue y transmisión
- ✅ **Auditoría Completa**: Todos los eventos registrados

#### Sistema de Estaciones con PIN:
- ✅ Login por PIN (sin contraseña)
- ✅ Estaciones físicas numeradas (1, 2, 3)
- ✅ Validación de sesión activa
- ✅ Rate limiting por estación

#### Rutas del Sistema:
- `/estacion/:stationNumber` - Login por PIN
- `/estacion/1/scoring/:fightId` - Estación de scoring
- `/estacion/2/scoring/:fightId` - Estación de scoring
- `/estacion/3/control/:fightId` - Control de rounds
- `/judge/fight/:fightId` - Panel de juez completo
- `/hud/fight/:fightId` - HUD público en vivo
- `/referee/control/:fightId` - Sala de control del árbitro

#### Hardware Recomendado:
- PC con mouse USB (no inalámbrico)
- Conexión Ethernet (no WiFi)
- Monitor 24" Full HD
- UPS de respaldo

---

### 3. SISTEMA DE VISIÓN POR COMPUTADORA (IA) 🚧

**Objetivo**: Detección automática de golpes mediante análisis de video en tiempo real.

#### Arquitectura Diseñada:
```
OBS/ATEM → FFmpeg → FastAPI + YOLOv8 → Supabase → React UI
```

#### Componentes Implementados:
- ✅ **Backend (Edge Functions)**:
  - `ai-strike-ingest` - Recepción de eventos
  - Endpoints: `/event`, `/start`, `/stop`, `/log`, `/health`, `/metrics`
  
- ✅ **Tablas de Base de Datos**:
  - `ai_strike_events` - Golpes detectados
  - `ai_inference_sessions` - Sesiones activas
  - `ai_model_versions` - Versionamiento de modelos
  - `ai_inference_logs` - Logs del sistema
  - `ai_config` - Configuración de umbrales

- ✅ **UI Admin**:
  - `/admin/ai-strike-monitor` - Monitoreo en tiempo real
  - `/admin/ai-strike-test` - Panel de pruebas

- ✅ **Overlay para Transmisión**:
  - `/ai-overlay` - Overlay transparente para OBS
  - Layouts: side-by-side, compact, minimal

#### Pendiente de Implementación:
- 🚧 Microservicio Python con modelo YOLOv8-pose
- 🚧 Clasificador temporal de golpes
- 🚧 Entrenamiento con dataset de MMA/Boxing

---

### 4. PLATAFORMA SOCIAL ✅

**Objetivo**: Red social especializada para la comunidad de deportes de combate.

#### Funcionalidades Implementadas:
- ✅ Feed de publicaciones con imágenes/videos
- ✅ Sistema de likes y comentarios
- ✅ Hashtags con trending topics
- ✅ Menciones de usuarios (@usuario)
- ✅ Sistema de amigos y solicitudes
- ✅ Seguimiento de perfiles
- ✅ Notificaciones en tiempo real
- ✅ Búsqueda unificada de usuarios
- ✅ Preview de links automático
- ✅ Perfiles verificados de peleadores

#### Estadísticas de Uso:
- **3,817 posts** publicados
- **284 noticias deportivas** integradas
- Sistema de auto-publicación de noticias

#### Rutas del Sistema:
- `/social/feed` - Feed principal
- `/social/friends` - Gestión de amigos
- `/social/discover` - Descubrir contenido
- `/social/notifications` - Notificaciones
- `/social/profile` - Perfil propio
- `/social/profile/:id` - Perfiles de otros

---

### 5. SISTEMA DE PREDICCIONES/APUESTAS 🚧

**Objetivo**: Sistema de predicciones para eventos de deportes de combate.

#### Componentes Implementados:
- ✅ Estructura de base de datos completa
- ✅ Creación de eventos BDG
- ✅ Mercados con múltiples outcomes
- ✅ Sistema de tickets con delay
- ✅ Cola de procesamiento de apuestas
- ✅ Sistema de liquidación
- ✅ Wallet integrada

#### Rutas del Sistema:
- `/predicciones` - Lista de eventos
- `/evento/:eventId/betting` - Interfaz de apuestas
- `/admin/betting` - Administración

#### Pendiente:
- 🚧 Integración con pasarela de pagos
- 🚧 Cumplimiento regulatorio

---

### 6. DIRECTORIO DE GIMNASIOS Y ENTRENADORES ✅

**Objetivo**: Conectar peleadores con gimnasios y entrenadores certificados.

#### Funcionalidades Implementadas:
- ✅ Registro de gimnasios con información completa
- ✅ Perfiles de entrenadores
- ✅ Vinculación entrenador-gimnasio
- ✅ Búsqueda por ubicación y disciplina
- ✅ Información de contacto (WhatsApp, email, web)
- ✅ Galería de fotos
- ✅ Especialidades y disciplinas

#### Rutas del Sistema:
- `/gimnasios` - Directorio de gimnasios
- `/gimnasios/:slug` - Detalle de gimnasio
- `/entrenadores` - Directorio de entrenadores
- `/entrenadores/:slug` - Detalle de entrenador

---

### 7. PANEL DE ADMINISTRACIÓN ✅

**Objetivo**: Control centralizado de toda la plataforma.

#### Módulos Implementados:

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/admin` | Estadísticas generales + AI Assistant |
| Peleadores | `/admin/fighters-profiles` | CRUD de perfiles |
| Crear Peleador | `/admin/fighters-profiles/create` | Formulario de creación |
| Invitar Peleador | `/admin/fighters-profiles/invite` | Sistema de invitaciones |
| Licencias | `/admin/licencias` | Validación de solicitudes |
| Eventos | `/admin/eventos-pelea` | Gestión de eventos |
| Control en Vivo | `/admin/live-events` | Eventos en progreso |
| Resultados | `/admin/fight-results` | Resultados oficiales |
| Jueces | `/admin/judges` | Gestión de jueces |
| Estaciones | `/admin/scoring/stations` | Configuración de estaciones |
| Roles | `/admin/user-roles` | Asignación de permisos |
| Cambios Pendientes | `/admin/pending-changes` | Hub de aprobaciones |
| Solicitudes de Perfil | `/admin/profile-requests` | Cambios solicitados |
| Aliados | `/admin/aliados-estrategicos` | Partners y sponsors |
| Gimnasios | `/admin/gimnasios` | Administrar gimnasios |
| Entrenadores | `/admin/entrenadores` | Administrar coaches |
| Comunidad | `/admin/comunidad` | Moderación social |
| Votaciones | `/admin/votaciones` | Sistema de votos |
| Apuestas | `/admin/betting` | Gestión de mercados |
| Configuración | `/admin/configuracion` | Settings generales |
| Email Campaigns | `/admin/email-campaigns` | Campañas de email |
| Email Monitoring | `/admin/email-monitoring` | Monitoreo |
| Email Validation | `/admin/email-validation` | Validación |
| Inbox | `/admin/inbox` | Mensajes de contacto |
| AI Monitor | `/admin/ai-strike-monitor` | Monitoreo de IA |
| AI Test | `/admin/ai-strike-test` | Testing de IA |

#### Características del Admin:
- ✅ **Asistente AI Integrado** - Chat contextual para ayuda
- ✅ **Estadísticas en tiempo real** - Métricas actualizadas
- ✅ **Sistema de notificaciones** - Alertas de eventos
- ✅ **Auditoría completa** - Log de acciones
- ✅ **Exportación de datos** - CSV/JSON

---

### 8. EDGE FUNCTIONS (SERVERLESS) ✅

**17 funciones desplegadas** para lógica de backend:

| Función | Propósito |
|---------|-----------|
| `admin-ai-assistant` | Asistente AI para administradores |
| `ai-strike-ingest` | Ingesta de eventos de IA |
| `ai-strike-test-simulator` | Simulador de pruebas |
| `bet-delay-processor` | Procesador de delay de apuestas |
| `delete-user` | Eliminación de usuarios |
| `fetch-link-metadata` | Metadata de links para previews |
| `fetch-sports-news` | Obtener noticias deportivas |
| `finalize-fight-auto` | Finalización automática de peleas |
| `notify-admin-pending` | Notificaciones a admins |
| `populate-batalla-gimnasios` | Poblar datos de gimnasios |
| `publish-news-to-social` | Auto-publicar noticias |
| `receive-contact` | Recibir formularios de contacto |
| `send-fighter-invitation` | Enviar invitaciones |
| `send-license-approval` | Notificar aprobación de licencia |
| `send-mass-email` | Campañas de email masivo |
| `send-password-recovery` | Recuperación de contraseña |
| `send-signup-confirmation` | Confirmación de registro |

---

### 9. SISTEMA DE AUTENTICACIÓN ✅

#### Métodos Implementados:
- ✅ Email + contraseña
- ✅ Recuperación de contraseña
- ✅ Confirmación de email
- ✅ Tokens de verificación
- ✅ Sesiones seguras

#### Rutas del Sistema:
- `/auth` - Login/Registro
- `/auth/forgot-password` - Recuperar contraseña
- `/auth/reset-password` - Restablecer contraseña

#### Sistema de Roles:
- `admin` - Acceso completo
- `moderator` - Moderación de contenido
- `user` - Usuario estándar
- `judge` - Acceso a scoring

---

### 10. SISTEMA DE EMAILS ✅

#### Funcionalidades:
- ✅ Emails transaccionales (confirmación, recovery)
- ✅ Campañas masivas con editor HTML
- ✅ Templates predefinidos
- ✅ Monitoreo de envíos
- ✅ Validación de emails

---

## 📱 APLICACIÓN MÓVIL (PWA + Capacitor)

**Objetivo**: Acceso móvil a la plataforma con capacidades nativas.

### Características:
- ✅ Progressive Web App (instalable)
- ✅ Capacitor para iOS/Android
- ✅ Iconos y splash screens
- ✅ Manifest.json configurado
- ✅ Service Worker para offline
- ✅ Push notifications (preparado)

### Archivos de Configuración:
- `capacitor.config.ts` - Configuración Capacitor
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service Worker

---

## 🔒 SEGURIDAD IMPLEMENTADA

### Row Level Security (RLS)
- ✅ Políticas en todas las tablas sensibles
- ✅ Separación por usuario/rol
- ✅ Validación de permisos a nivel de BD

### Validaciones:
- ✅ Triggers para integridad de datos
- ✅ Constraints de unicidad
- ✅ Validación de timestamps
- ✅ Rate limiting por IP/estación

### Auditoría:
- ✅ `audit_log` - Acciones importantes
- ✅ `license_audit_log` - Cambios de licencias
- ✅ `change_request_audit` - Solicitudes de cambios

### Restricciones de Dispositivo:
- ✅ Detección de móviles/tablets
- ✅ Bloqueo de touchscreens para scoring
- ✅ Validación de user-agent

---

## 🎨 DISEÑO Y UX

### Sistema de Diseño:
- Tailwind CSS con tokens personalizados
- Componentes shadcn/ui
- Tema oscuro nativo (combates = oscuridad)
- Animaciones con Framer Motion

### Responsive Design:
- Mobile-first en plataforma social
- Desktop-only en módulos de scoring
- Adaptación a todas las pantallas

---

## 📈 ROADMAP FUTURO

### Fase 2: Funcionalidades Avanzadas
- [ ] Microservicio de IA para detección de golpes
- [ ] Integración con pasarelas de pago
- [ ] App nativa iOS/Android completa
- [ ] Sistema de ranking algorítmico
- [ ] Estadísticas avanzadas con ML

### Fase 3: Escalabilidad
- [ ] CDN para assets
- [ ] Caché distribuido
- [ ] Sharding de base de datos
- [ ] Load balancing

### Fase 4: Expansión
- [ ] Multi-idioma (EN, PT)
- [ ] Internacionalización
- [ ] APIs públicas para terceros
- [ ] SDK para promotores

---

## 💰 MODELO DE NEGOCIO

### Streams de Ingresos:
1. **Licencias Fighter ID** - Suscripción anual de peleadores
2. **Comisiones Predicciones** - % de apuestas
3. **Suscripciones Premium** - Features avanzados
4. **Servicios para Promotores** - Scoring en eventos
5. **Publicidad** - Espacios para sponsors
6. **API/Datos** - Acceso a estadísticas

---

## 🏆 DIFERENCIADORES COMPETITIVOS

1. **Único en Latinoamérica** - No hay competencia directa
2. **Integración Vertical** - Desde licencias hasta transmisión
3. **Tecnología de Punta** - IA, tiempo real, PWA
4. **Comunidad** - Red social integrada
5. **Verificabilidad** - QR codes, blockchain-ready
6. **Escalable** - Arquitectura moderna serverless

---

## 📞 CONTACTO Y SOPORTE

- **URL Producción**: https://fighterid.lovable.app
- **URL Preview**: https://id-preview--c4add1c8-f68d-4715-9b10-5a9613b9085b.lovable.app

---

## 📎 DOCUMENTOS TÉCNICOS ADICIONALES

- `AI_VISION_SYSTEM_README.md` - Sistema de visión por computadora
- `SCORING_SYSTEM_README.md` - Sistema de scoring en vivo
- `SECURITY_FIGHTER_DATA.md` - Seguridad de datos de peleadores

---

*Documento generado automáticamente - Enero 2026*
*Fighter ID © Todos los derechos reservados*
