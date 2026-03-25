# Pruebas Automatizadas - EduGestión 3.0

El archivo `cypress/e2e/full-flow.cy.ts` ejecuta un único flujo continuo de principio a fin, manteniendo la sesión de usuario activa durante toda la prueba. A continuación se describe exactamente lo que hace cada paso.

---

## Módulo 1: Autenticación (`/auth/register` y `/auth/login`)

El script genera un correo único usando el timestamp actual (`testuser[timestamp]@gmail.com`) para evitar colisiones en la base de datos. Navega a la pantalla de registro, escribe el correo, la contraseña y la confirmación de contraseña, y hace clic en el botón de submit.

Después de esperar 5 segundos para que Supabase procese el registro, verifica la URL actual. Si el sistema redirigió al login (porque no hay autologin configurado), el script inicia sesión manualmente con las mismas credenciales antes de continuar. Al final de este paso confirma que la URL contiene `/dashboard`.

---

## Módulo 2: Onboarding (`/dashboard`)

Antes de continuar, el script inspecciona el contenido del `body` de la página buscando el texto `¡Bienvenido a EduGestión!`. Si el modal de bienvenida está presente, lo completa:

- Hace clic en "Comenzar Configuración".
- Escribe "Test" en el campo `firstName` y "User" en `lastName`.
- Selecciona el rol "Tutor Independiente" y el rango de ingresos "Menos de $10,000".
- Hace clic en "Completar Configuración" y espera 3 segundos para confirmar que los datos se guardaron en Supabase.

Si el modal no aparece (porque el perfil ya existe), este paso se omite sin fallar.

---

## Módulo 3: Gestión de Alumnos (`/dashboard/students`)

Navega a la sección de alumnos y busca cualquier botón de creación disponible, ya sea el del estado vacío ("Agregar Mi Primer Alumno") o el botón estándar ("Nuevo Alumno"). Hace clic en el primero que encuentre y llena el formulario:

- **Nombre:** `Juan`
- **Apellido:** `Pérez [timestamp]` (único por ejecución)
- **Correo:** `juan[timestamp]@student.com` (único por ejecución)

Envía el formulario y verifica que el correo del alumno recién creado aparece en la tabla de registros.

---

## Módulo 4: Calendario (`/dashboard/schedule/calendar`)

Navega a la vista del calendario y verifica que el componente principal de renderizado existe en la página (`mwl-calendar-month-view` o `.cal-month-view`). Es una validación de carga estructural.

---

## Módulo 5: Configuración de Horarios (`/dashboard/schedule`)

Navega a la configuración de horarios y realiza dos acciones:

1. **Disponibilidad semanal:** Localiza el contenedor del día "Sábado" y activa su checkbox de disponibilidad.
2. **Bloqueos de tiempo:** Hace clic en el botón "Bloqueos de Tiempo" para expandir la sección, luego en "Agregar bloqueo". Escribe `Almuerzo de prueba` en el campo de razón y selecciona el día Sábado como día afectado.

Finalmente hace clic en "Guardar Configuración" y espera que el texto de confirmación sea visible en la UI.

---

## Módulo 6: Servicios (`/dashboard/services`)

Navega a la sección de servicios y hace clic en el primer botón de creación disponible ("Nuevo Servicio", "Agregar Servicio", etc.). Llena el formulario con:

- **Nombre:** `Clase de Prueba [timestamp]` (único por ejecución)
- **Precio:** `500`
- **Duración:** `60` minutos (seleccionado desde un `<select>`)

Envía el formulario y verifica que el nombre del servicio aparece en la lista principal.

---

## Módulo 7: Planes de Estudio (`/dashboard/study-plans`)

Navega a la vista de planes de estudio y verifica carga básica del `body`. Espera 3 segundos para dar tiempo a que el contenido asíncrono termine de renderizarse.

---

## Módulo 8: Pagos (`/dashboard/payments`)

Navega a la vista de pagos y verifica que el texto "Pagos" existe en la página. Es una validación de carga estructural.

---

## Módulo 9: Suscripciones y Simulación de Pago (`/dashboard/settings`)

Navega a configuración y realiza el flujo de cambio de plan:

1. Hace clic en el botón "Cambiar Plan".
2. Selecciona el plan "Academia" (identificado por el texto "Ideal para academias").
3. Verifica que aparece el texto "Pago requerido", confirmando que el modal de pago cargó.
4. **Limitación técnica:** PayPal protege su iframe con políticas de Cross-Origin que impiden que Cypress inyecte datos de tarjeta. Por eso, el script intenta una simulación experimental: accede a la instancia del componente Angular a través de `window.ng.getComponent()` e invoca directamente el método `handleUpgradePaymentSuccess()` con un objeto de respuesta mockeado (`{ status: 'COMPLETED', id: 'MOCK_PAYPAL_ORDER_5101' }`).
5. Si la simulación activa alertas del navegador, estas se interceptan y aceptan automáticamente.
6. Si el modal de pago permanece abierto (simulación no exitosa), el script lo cierra con el botón "Cancelar" para poder continuar.

---

## Módulo 10: Landing Page (`/dashboard/landing-editor`)

Navega al editor de landing page y llena el formulario con valores generados dinámicamente:

- **Slug:** `academia-[timestamp]`
- **Color primario:** color hexadecimal aleatorio
- **Color secundario:** color hexadecimal aleatorio
- **Descripción:** `Bienvenidos a mi academia de prueba. Generado automáticamente: [timestamp]`
- **Email de contacto:** `contacto[timestamp]@academia.com`

Hace clic en "Guardar Cambios" y espera confirmación. Luego elimina el atributo `target="_blank"` del enlace "Ver Landing Page" (para evitar que Cypress pierda el control al abrir una nueva pestaña) y hace clic en él.

Verifica que la URL cambia a `/p/academia-[timestamp]` y que el texto de la descripción configurada es visible en la página pública.

