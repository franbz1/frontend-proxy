<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Backend API (tallerProxy) — guía para el frontend

Este documento describe los endpoints REST del backend Spring Boot, el flujo de uso de la aplicación y los contratos JSON relevantes para implementar la UI (chat, cuotas, rate limit, historial, upgrade).

## URL base y CORS

- **Base URL por defecto:** `http://localhost:8080` (configurable con variable de entorno en el cliente, p. ej. `NEXT_PUBLIC_API_BASE_URL` — ver `.env.example`).
- Todas las rutas de API bajo **`/api/...`**.
- El backend debe permitir el **origen** del frontend en CORS (variable `APP_CORS_ALLOWED_ORIGINS` en el servidor, p. ej. `http://localhost:3000`).
- **OpenAPI (referencia detallada):** `GET /v3/api-docs` · **Swagger UI:** `/swagger-ui.html` (mismo host que el backend).

## Identificación del usuario

No hay login OAuth en el taller: cada petición lleva el header obligatorio:

| Header       | Descripción |
|-------------|-------------|
| `X-User-Id` | Identificador lógico del usuario (string). Usuarios demo en BD: `demo-free`, `demo-pro`, `demo-enterprise`, `demo-rate-limit` (plan `DEMO_THROTTLED`), `demo-near-quota` (FREE con uso mensual casi agotado). Listado: `GET /api/demo/users`. |

Si falta o el usuario no existe: respuestas **400** (`BAD_REQUEST`) o **404** (`USER_NOT_FOUND`) según el caso.

## Planes y límites (lado servidor)

| Plan         | Req/min | Tokens / mes |
|-------------|---------|----------------|
| `FREE`      | 10      | 50_000         |
| `PRO`       | 60      | 500_000        |
| `DEMO_THROTTLED` | 2 (taller) | 50_000 (igual que FREE; sirve para ver 429 rápido) |
| `ENTERPRISE`| sin tope práctico | ilimitado (tokens y rate limit efectivamente sin bloqueo) |

Al arrancar el backend, un `CommandLineRunner` puede sembrar **uso diario y mensual** de ejemplo para que `GET /api/quota/history` muestre una curva en el gráfico de 7 días sin enviar prompts antes.

## Estimación de tokens (debe coincidir con el estimador de la UI)

Para cada generación el servidor cobra **antes** de llamar a la IA simulada:

- **Entrada:** `max(1, ceil(length(prompt) / 4))` (aprox. caracteres/4).
- **Salida:** constante configurable en backend (`app.token-estimation.fixed-output-tokens`, por defecto **100**).
- **Total cobrado** = entrada + salida fija → reflejado en `tokensCharged` y en el acumulado mensual/diario.

El frontend puede mostrar el mismo cálculo **antes de enviar** para alinear el estimador con el backend.

---

## Endpoints

### 1. `POST /api/ai/generate`

Genera texto mock tras la cadena **Rate limit → Cuota mensual → Mock IA** (~1,2 s de latencia simulada).

**Headers**

- `X-User-Id`: obligatorio.
- `Content-Type`: `application/json`.

**Body (JSON)**

```json
{
  "prompt": "string no vacío"
}
```

**200 OK — `GenerationResponse`**

- `text` (string): texto generado (mock).
- `tokensCharged` (number): total de tokens descontados en esta petición.
- `estimatedInputTokens` (number): parte entrada del cargo.
- `estimatedOutputTokens` (number): parte salida fija del cargo.
- `quotaStatus` (`QuotaStatusResponse`): estado actualizado tras la generación (útil para refrescar barra de cuota y rate limit sin otro GET).

**Errores**

- **429 Too Many Requests:** límite de peticiones por minuto del plan. Cuerpo `ApiErrorResponse` con `code: "RATE_LIMIT"`, `retryAfterSeconds`. Header **`Retry-After`** (segundos) presente.
- **402 Payment Required:** cuota mensual de tokens agotada. `code: "QUOTA_EXHAUSTED"`.

---

### 2. `GET /api/quota/status`

Devuelve el estado de cuota y rate limit **sin** generar texto (p. ej. al cargar la página o en polling ligero).

**Headers**

- `X-User-Id`: obligatorio.

**200 OK — `QuotaStatusResponse`**

- `plan` (string): `FREE` | `PRO` | `ENTERPRISE` | `DEMO_THROTTLED`, etc.
- `tokensUsedThisMonth` (number).
- `tokensRemainingThisMonth` (number | null): `null` si ilimitado (Enterprise).
- `monthlyTokenLimit` (number | null): tope mensual; `null` si ilimitado.
- `monthlyResetAt` (string ISO-8601 instant): inicio del **siguiente** mes de facturación (zona del servidor, expresado como instant UTC).
- `rateLimit` (`RateLimitInfo`):
  - `requestsUsedThisWindow` (number): peticiones en la ventana actual (~1 minuto).
  - `requestsLimitPerMinute` (number | null): `null` en Enterprise.
  - `rateLimitResetAt` (string ISO-8601 instant): fin de la ventana actual de conteo (UTC).

---

### 3. `GET /api/quota/history`

Historial de uso diario de tokens para **los últimos 7 días** (incluye días con 0).

**Headers**

- `X-User-Id`: obligatorio.

**200 OK — `DailyUsageHistoryResponse`**

```json
{
  "days": [
    { "date": "2026-04-11", "tokensUsed": 0 },
    { "date": "2026-04-12", "tokensUsed": 150 }
  ]
}
```

`date` es fecha local (`YYYY-MM-DD`). Usar para gráfica de barras.

---

### 4. `POST /api/quota/upgrade`

Simula upgrade **FREE → PRO** con pago mock.

**Headers**

- `X-User-Id`: obligatorio (debe ser un usuario con plan `FREE`).

**Body (JSON)**

```json
{
  "simulateSuccess": true,
  "paymentMethod": "mock-card"
}
```

- `simulateSuccess`: si es `false`, el servidor responde error (pago rechazado simulado).
- `paymentMethod`: informativo para la demo.

**200 OK — `UpgradeResponse`**

- `plan` (string): p. ej. `"PRO"`.
- `paymentAccepted` (boolean).

**400** si el usuario ya es `PRO` o `ENTERPRISE` (`INVALID_UPGRADE`).

---

## Cuerpo de error genérico (`ApiErrorResponse`)

En muchos errores estructurados:

- `code` (string): `RATE_LIMIT`, `QUOTA_EXHAUSTED`, `USER_NOT_FOUND`, `INVALID_UPGRADE`, `BAD_REQUEST`, `VALIDATION_ERROR`, etc.
- `message` (string).
- `retryAfterSeconds` (number | null): relevante para **429**.

---

## Flujo recomendado para usar la app (UI)

1. **Configuración**
   - Definir `NEXT_PUBLIC_API_BASE_URL` (o equivalente) apuntando al backend.
   - Asegurar que el origen del dev server del frontend está en `APP_CORS_ALLOWED_ORIGINS` del backend.

2. **Al cargar la pantalla principal**
   - Llamar `GET /api/quota/status` con el `X-User-Id` seleccionado (o guardado en `localStorage`).
   - Opcional: `GET /api/quota/history` para la gráfica de 7 días.
   - Mostrar **badge de plan** (`plan`) y barra **tokens usados / límite** (`tokensUsedThisMonth`, `monthlyTokenLimit`, `tokensRemainingThisMonth`).

3. **Estimador antes de enviar (chat)**
   - Con el prompt en el input, calcular en cliente: `ceil(prompt.length / 4) + FIXED_OUTPUT` (usar el mismo `FIXED_OUTPUT` que el backend expone por documentación, p. ej. 100, o leerlo de configuración compartida).
   - Mostrar “~X tokens” para alinear expectativas con `tokensCharged` real.

4. **Enviar mensaje (`POST /api/ai/generate`)**
   - Incluir siempre `X-User-Id` y `{ "prompt": "..." }`.
   - En éxito: mostrar `text` en el hilo del chat y actualizar UI con `quotaStatus` devuelto (o refrescar con `GET /api/quota/status`).
   - **429:** deshabilitar envío hasta `retryAfterSeconds` o hasta `rateLimit.rateLimitResetAt`; mostrar cuenta atrás; respetar header `Retry-After` si se parsea desde la respuesta cruda.
   - **402:** mostrar modal de upgrade; llamada a `POST /api/quota/upgrade` solo aplica a usuarios `FREE`.

5. **Upgrade (modal de pago simulado)**
   - `POST /api/quota/upgrade` con `simulateSuccess: true` para éxito.
   - Tras 200: refrescar `GET /api/quota/status` y actualizar badge/límites.

6. **Polling / tiempo “casi real”**
   - Tras cada generación, el backend ya devuelve `quotaStatus` en la respuesta; para rate limit sin enviar prompt, puede usarse `GET /api/quota/status` con intervalo razonable (evitar spam).

7. **Usuarios demo**
   - `demo-free`, `demo-pro`, `demo-enterprise`, `demo-rate-limit`, `demo-near-quota` — listar con `GET /api/demo/users` (el frontend usa esta ruta para el selector y hace fallback local si el backend no está).

8. **Demo (taller local)**
   - `GET /api/demo/users` — lista usuarios sembrados con `externalId`, `plan`, `requestsPerMinute` (o `null` si Enterprise), `monthlyTokenLimit`, `displayLabel`. Sin header `X-User-Id`.
   - `POST /api/demo/reset-rate-limit` — pone a cero los contadores **en memoria** de rate limit (todos los usuarios). Sin `X-User-Id`.

---

## Resumen rápido de rutas

| Método | Ruta | Uso |
|--------|------|-----|
| `POST` | `/api/ai/generate` | Chat / generación |
| `GET` | `/api/quota/status` | Barra de cuota, badge de plan, rate limit |
| `GET` | `/api/quota/history` | Gráfica 7 días |
| `POST` | `/api/quota/upgrade` | FREE → PRO (mock) |
| `GET` | `/api/demo/users` | Lista usuarios demo (selector UI) |
| `POST` | `/api/demo/reset-rate-limit` | Reinicia ventana de rate limit en memoria |

Las rutas bajo `/api/quota/*` y `POST /api/ai/generate` requieren header **`X-User-Id`**. Las rutas `/api/demo/*` indicadas arriba no lo requieren.
