# CalistenIA — PWA de Calistenia (plan final consolidado)

App web mobile-first para entrenar calistenia con registro de series/reps/RPE, cronómetro robusto, Wake Lock y visualización de sobrecarga progresiva. Todo el progreso en el navegador (IndexedDB), sin backend.

## Stack

- **Framework**: TanStack Start + React 19.
- **Estilos**: Tailwind v4 + tokens semánticos en `src/styles.css` (dark permanente).
- **Iconos**: `lucide-react`.
- **Persistencia**: IndexedDB vía **Dexie** (`dexie` + `dexie-react-hooks`).
- **Gráficos**: `recharts`.
- **Fechas**: `date-fns`.
- **PWA**: solo manifest instalable (sin service worker).
- **Audio**: WebAudio API (beep generado).

## Diseño

- **Paleta dark**: fondo negro (`oklch(0.12 0 0)`), superficies grafito (`0.18` / `0.22`), texto claro, **acento azul eléctrico** `oklch(0.74 0.18 240)` (~#00BFFF), destructive rojo cálido.
- **Tipografía**: Space Grotesk (titulares y números del cronómetro) + Inter (cuerpo) vía Google Fonts en `__root.tsx`.
- **Componentes**: cards con borde sutil + glow azul en estado activo; botones grandes (≥56px) con `select-none touch-manipulation`; bottom-nav fijo de 4 íconos con safe-area.
- **Mobile-first**: 360–430px; en desktop centrado en `max-w-md`.

## Rutas (TanStack file-based)

- `/` — Hoy / Entrenar
- `/rutinas` — listado CRUD
- `/rutinas/$id` — editor de rutina
- `/historial` — sesiones pasadas
- `/dashboard` — gráfico de volumen + KPIs

Cada ruta con `head()` propio. `__root.tsx` añade manifest, theme-color, viewport `viewport-fit=cover`, fuentes, layout con BottomNav + RestTimer sticky, `WorkoutProvider`.

## Modelo de datos (Dexie)

```ts
routines:    ++id, name, split, createdAt
exercises:   ++id, routineId, name, order, targetSets, targetReps, defaultRestSec
sessions:    ++id, routineId, startedAt, endedAt
setLogs:     ++id, sessionId, exerciseId, setNumber, reps, rpe, restSec, completedAt
settings:    key, value   // restDefault=90, soundOn, vibrateOn
```

Seed inicial — rutina **Empuje / Tracción / Pierna**:
- Empuje: Flexiones diamante, Fondos en paralelas, Pike push-ups
- Tracción: Dominadas, Remo australiano, Curl en barra baja
- Pierna: Sentadillas búlgaras, Pistol squat asistido, Puente glúteo a una pierna

## Flujo de entrenamiento (`WorkoutContext`)

- **"Empezar Entrenamiento"** (primer gesto del usuario):
  1. Inicializa `AudioContext` + `resume()` y guarda la instancia (desbloquea autoplay).
  2. Crea la `session` en Dexie.
- **"Completar serie"**: guarda `setLog` (reps + RPE) → arranca `RestTimer` con `defaultRestSec` del ejercicio.
- **"Terminar sesión"**: si `setLogsCount === 0` → `AlertDialog` "¿Seguro que quieres terminar la sesión? No has completado ninguna serie y se perderá el registro." (Cancelar / Terminar).
- **`beforeunload`**: mientras haya sesión activa, listener que setea `e.preventDefault()` + `e.returnValue` para que el navegador muestre "¿Salir del sitio? Cambios sin guardar". Se añade al iniciar sesión y se elimina al terminarla.

## RestTimer — robusto

- **Reloj de alta precisión**: estado calculado vía `requestAnimationFrame` comparando `performance.now()` contra `endTimestamp = startedAt + durationMs`. Esto sobrevive a throttling: aunque el navegador pause rAF en background o reduzca a 1Hz, al volver a foreground el siguiente frame recalcula `remaining = endTimestamp - performance.now()` y nunca se "saltan" segundos visualmente porque siempre se deriva del reloj wall-clock, no de un acumulador.
- Fallback `setInterval(..., 250)` que también recalcula contra `endTimestamp` por si rAF está totalmente suspendido (pestaña oculta en algunos navegadores).
- **Wake Lock API** activo durante el timer:
  - `await navigator.wakeLock.request('screen')` al iniciar; guardar el `WakeLockSentinel` y `.release()` al terminar/saltar/desmontar.
  - Re-solicitar en `document.visibilitychange` cuando vuelva a `visible` (los sentinels se sueltan al cambiar de pestaña).
  - Try/catch silencioso (no soportado en Safari iOS <16.4 y otros).
- **Botones +15s / −15s / Saltar**: ajustan `endTimestamp`; `select-none touch-manipulation`.
- **Al llegar a 0** (cuando `remaining <= 0`):
  - `navigator.vibrate([200, 100, 200])` si `vibrateOn` y existe la API.
  - Beep WebAudio (oscillator 880Hz, 150ms × 2 con 100ms gap) reutilizando el `AudioContext` desbloqueado.
  - Flash visual del acento azul + badge "¡A entrenar!".
  - Liberar Wake Lock.
- Sticky encima del bottom-nav.

## ExerciseCard — botón "Completar serie" prioritario

- Layout: nombre + progreso `●●○○` arriba, inputs reps + `RpeSlider` en medio, **botón "Completar serie" full-width abajo con altura 64px**, fuente bold, color acento azul, sombra/glow.
- **Feedback táctil inmediato**:
  - `active:scale-[0.97] transition-transform duration-75` (escalado al tocar).
  - `active:brightness-110` (cambio de brillo).
  - `touch-manipulation select-none` + tap-highlight transparent.
  - `aria-label="Completar serie"`.
- Es el único botón primario de la card (otros controles son íconos pequeños secundarios) para que sea el elemento más accesible para manos sudadas.

## UI / accesibilidad táctil (global)

- Inputs numéricos: `inputMode="decimal"`, `pattern="[0-9]*"`.
- Regla global en `styles.css`:
  - `button { user-select: none; -webkit-tap-highlight-color: transparent; }`
  - `.touch-action-manipulation { touch-action: manipulation; }` (o usar la utility de Tailwind `touch-manipulation`).
- Hit area mínimo 56×56 en botones del flujo activo.

## PWA instalable (sin SW)

- `public/manifest.webmanifest`:
  - `name: "CalistenIA"`, `short_name: "CalistenIA"`
  - `display: "standalone"`, `start_url: "/"`, `scope: "/"`
  - `theme_color: "#00BFFF"`, `background_color: "#000000"`
  - **Iconos con `purpose: "any maskable"`** (un solo set 192/512 marcado como any maskable, para que Android lo recorte correctamente en máscaras circulares/squircle).
- Iconos generados con imagegen: logo "C" estilizado azul eléctrico sobre negro, **con safe area interna del 20%** (zona maskable) para que no se recorten los bordes.
- `__root.tsx`: `<link rel="manifest">`, `<meta name="theme-color" content="#00BFFF">`, viewport `viewport-fit=cover`, `apple-mobile-web-app-capable`.
- **Sin service worker** (per guidelines del entorno).

## Hooks utilitarios

- `useWakeLock(active)` — request/release + re-acquire en visibilitychange.
- `useBeep()` — devuelve `beep()` usando el AudioContext del contexto.
- `useVibrate()` — wrapper seguro sobre `navigator.vibrate`.
- `useBeforeUnload(active, message?)` — listener `beforeunload` mientras `active`.
- `useCountdown(endTimestamp)` — rAF + interval de respaldo, devuelve `remainingMs`.

## Dashboard

- KPI cards: volumen semana actual, % vs semana anterior, RPE promedio, sesiones del mes.
- `VolumeChart` (recharts): barras semanales, últimas 8 semanas, volumen = Σ(reps) por semana.
- Botón "Borrar todo el historial" con confirmación.

## Dependencias a instalar

`dexie`, `dexie-react-hooks`, `recharts`, `date-fns`.

## Archivos a crear/modificar

- `src/styles.css` — tokens dark + azul eléctrico, fuentes, reglas globales tap-highlight/select-none.
- `src/routes/__root.tsx` — manifest, theme-color, fuentes, layout, providers.
- `src/routes/index.tsx` — pantalla "Hoy".
- `src/routes/rutinas.tsx`, `src/routes/rutinas.$id.tsx`.
- `src/routes/historial.tsx`, `src/routes/dashboard.tsx`.
- `src/lib/db.ts` — schema Dexie + seed.
- `src/lib/audio.ts`, `src/lib/wakeLock.ts`, `src/lib/haptics.ts`.
- `src/context/WorkoutContext.tsx`.
- `src/hooks/useWakeLock.ts`, `useBeep.ts`, `useVibrate.ts`, `useBeforeUnload.ts`, `useCountdown.ts`.
- `src/components/BottomNav.tsx`, `ExerciseCard.tsx`, `RestTimer.tsx`, `RoutineEditor.tsx`, `VolumeChart.tsx`, `RpeSlider.tsx`, `EndSessionDialog.tsx`.
- `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png` (maskable, generados).
