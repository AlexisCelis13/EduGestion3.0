# REPORTE DE PRUEBAS AUTOMATIZADAS

## Sistema: EduGestión 3.0 — Plataforma de Gestión Educativa

| **Campo**                | **Detalle**                                      |
|--------------------------|--------------------------------------------------|
| **Proyecto**             | EduGestión 3.0                                   |
| **Tipo de Pruebas**      | Funcionales (Automatizadas)                      |
| **Framework de Pruebas** | Cypress v13 (E2E)                                |
| **Archivo de Ejecución** | `cypress/e2e/full-flow.cy.ts`                    |
| **Entorno**              | Navegador Chromium (Electron) / Headless         |
| **Fecha de Elaboración** | Junio 2025                                       |
| **Responsable**          | Equipo de Desarrollo EduGestión                  |
| **Estado**               | ✅ Ejecutado                                      |
| **Versión del Reporte**  | 1.0                                              |

---

## 1. Objetivo

El presente reporte documenta el conjunto completo de **pruebas automatizadas funcionales** ejecutadas sobre la plataforma **EduGestión 3.0**. Las pruebas validan el flujo integral de un usuario desde su primer contacto con la aplicación hasta la operación completa de todos los módulos principales, incluyendo autenticación, gestión de alumnos, calendario, pagos, inteligencia artificial y portal del estudiante.

---

## 2. Alcance

Las pruebas automatizadas cubren **12 módulos funcionales** de la plataforma, ejecutados de forma secuencial en un flujo continuo que simula el recorrido real de un tutor/administrador. Se mantiene una única sesión de Supabase durante toda la ejecución para garantizar consistencia de datos.

### Módulos Cubiertos

| # | Módulo                         | Ruta de la Aplicación              |
|---|--------------------------------|------------------------------------|
| 1 | Landing Page Principal         | `/`                                |
| 2 | Autenticación (Registro)       | `/auth/register`                   |
| 3 | Autenticación (Inicio de Sesión) | `/auth/login`                    |
| 4 | Onboarding (Configuración Inicial) | `/dashboard` (modal)           |
| 5 | Gestión de Alumnos (CRUD)      | `/dashboard/students`              |
| 6 | Portal del Alumno              | `/student-portal/:token`           |
| 7 | Calendario                     | `/dashboard/schedule/calendar`     |
| 8 | Configuración de Horarios      | `/dashboard/schedule`              |
| 9 | Servicios                      | `/dashboard/services`              |
| 10| Planes de Estudio              | `/dashboard/study-plans`           |
| 11| Pagos y Cuenta Bancaria        | `/dashboard/payments`              |
| 12| Configuración y Suscripción    | `/dashboard/settings`              |
| 13| Editor de Landing Page         | `/dashboard/landing-editor`        |
| 14| Chatbot de Asesoría con IA     | Landing pública (`/p/:slug`)       |

---

## 3. Estrategia de Ejecución

- **Flujo Único Secuencial**: Todas las pruebas corren dentro de un solo bloque `it()` de Cypress para preservar la sesión de autenticación de Supabase entre pasos.
- **Datos Dinámicos**: Se genera un `uniqueId` basado en `Date.now()` para crear usuarios, alumnos y servicios únicos en cada ejecución, evitando colisiones de datos.
- **Interceptores de API**: Las llamadas a la API de Gemini (IA generativa) se interceptan con `cy.intercept()` para simular respuestas controladas y deterministas del chatbot.
- **Manejo Condicional**: Se implementan verificaciones condicionales (`cy.get('body').then(...)`) para adaptarse a diferentes estados de la aplicación sin hacer fallar la prueba.

---

## 4. Catálogo de Casos de Prueba Automatizados

---

### A-001 — Exploración de Landing Page Principal

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-001                                                                                                   |
| **Módulo**             | Landing Page Principal                                                                                  |
| **Ruta**               | `/`                                                                                                     |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Media                                                                                                   |
| **Objetivo**           | Verificar que la página de inicio carga correctamente y que el usuario puede visualizar todas las secciones clave mediante scroll. |

**Precondiciones:**
- La aplicación debe estar desplegada y accesible.

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                            |
|------|----------------------------------------------------------------|---------------------------------------------------------------|
| 1    | Navegar a la URL raíz (`/`)                                   | La página carga sin errores.                                  |
| 2    | Verificar textos principales                                   | Se muestran "Gestiona tu Academia" y "de Forma Inteligente".  |
| 3    | Hacer scroll hacia abajo (400px)                               | El contenido inferior es visible.                             |
| 4    | Hacer scroll hasta "Elige el plan perfecto para ti"            | La sección de planes/precios es visible.                      |
| 5    | Hacer scroll hasta "Todo lo que necesitas..."                  | La sección de features es visible.                            |
| 6    | Hacer scroll hasta "¿Listo para transformar tu academia?"      | El CTA final es visible.                                      |
| 7    | Hacer scroll de vuelta al inicio                               | La página regresa al inicio correctamente.                    |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura de la landing page principal mostrando el hero, sección de planes y CTA final]_
>
> ---

---

### A-002 — Registro de Usuario Nuevo

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-002                                                                                                   |
| **Módulo**             | Autenticación — Registro                                                                                |
| **Ruta**               | `/auth/register`                                                                                        |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Crítica                                                                                                 |
| **Objetivo**           | Validar que un usuario nuevo puede registrarse exitosamente con correo y contraseña, y que el sistema procesa la solicitud correctamente. |

**Precondiciones:**
- El correo electrónico utilizado no debe existir previamente en la base de datos de Supabase.

**Datos de Prueba:**

| Campo               | Valor                              |
|----------------------|------------------------------------|
| Email                | `testuser{uniqueId}@gmail.com`     |
| Contraseña           | `Password123!`                     |
| Confirmar Contraseña | `Password123!`                     |

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Navegar a `/auth/register`                                     | Se muestra el formulario de registro.                           |
| 2    | Completar campo "Email"                                        | El campo acepta el email dinámico.                              |
| 3    | Completar campo "Contraseña"                                   | El campo acepta la contraseña segura.                           |
| 4    | Completar campo "Confirmar Contraseña"                         | El campo acepta la confirmación idéntica.                       |
| 5    | Hacer clic en "Registrarse" (submit)                           | El formulario se envía a Supabase Auth.                         |
| 6    | Esperar procesamiento (5s)                                     | El sistema redirige al login o al dashboard.                    |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del formulario de registro con los campos llenos antes de enviar]_
>
> ---

---

### A-003 — Inicio de Sesión (Login)

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-003                                                                                                   |
| **Módulo**             | Autenticación — Inicio de Sesión                                                                        |
| **Ruta**               | `/auth/login`                                                                                           |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Crítica                                                                                                 |
| **Objetivo**           | Verificar que el usuario registrado puede iniciar sesión exitosamente y acceder al dashboard.           |

**Precondiciones:**
- El usuario debe haber completado el registro (A-002).
- Si el registro redirige automáticamente al dashboard, este paso se omite condicionalmente.

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Verificar si la URL actual contiene `/auth/login`              | Se detecta la redirección post-registro.                        |
| 2    | Completar campo "Email" con las credenciales registradas       | El campo acepta el email.                                       |
| 3    | Completar campo "Contraseña"                                   | El campo acepta la contraseña.                                  |
| 4    | Hacer clic en "Iniciar Sesión" (submit)                        | La solicitud se envía a Supabase Auth.                          |
| 5    | Esperar procesamiento (4s)                                     | El sistema redirige al dashboard.                               |
| 6    | Verificar URL contiene `/dashboard`                            | El usuario está autenticado dentro del dashboard.               |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del formulario de login y la redirección exitosa al dashboard]_
>
> ---

---

### A-004 — Onboarding (Configuración Inicial del Perfil)

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-004                                                                                                   |
| **Módulo**             | Onboarding                                                                                              |
| **Ruta**               | `/dashboard` (Modal de Bienvenida)                                                                      |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Alta                                                                                                    |
| **Objetivo**           | Validar que el wizard de onboarding se muestra al usuario nuevo y que puede completar su perfil correctamente. |

**Precondiciones:**
- El usuario acaba de registrarse por primera vez y no ha completado el onboarding.

**Datos de Prueba:**

| Campo               | Valor                    |
|----------------------|--------------------------|
| Nombre               | `Test`                   |
| Apellido             | `User`                   |
| Rol                  | `Tutor Independiente`    |
| Ingreso Mensual      | `Menos de $10,000`       |

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Verificar si el texto "¡Bienvenido a EduGestión!" está presente| El modal de onboarding se muestra (condicional).                |
| 2    | Hacer clic en "Comenzar Configuración"                         | Se avanza al formulario de perfil.                              |
| 3    | Completar campo "Nombre" → `Test`                              | El campo acepta el valor.                                       |
| 4    | Completar campo "Apellido" → `User`                            | El campo acepta el valor.                                       |
| 5    | Seleccionar "Rol" → `Tutor Independiente`                      | El select se configura correctamente.                           |
| 6    | Seleccionar "Ingreso Mensual" → `Menos de $10,000`             | El select se configura correctamente.                           |
| 7    | Hacer clic en "Completar Configuración"                        | Los datos se guardan en Supabase.                               |
| 8    | Esperar cierre del modal (3s)                                  | El dashboard principal es visible con el heading `h1`.          |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del modal de onboarding con los campos completos]_
>
> ---

---

### A-005 — Creación de Alumno

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-005                                                                                                   |
| **Módulo**             | Gestión de Alumnos — Crear                                                                              |
| **Ruta**               | `/dashboard/students`                                                                                   |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Crítica                                                                                                 |
| **Objetivo**           | Verificar que el tutor puede crear un alumno nuevo que se persiste correctamente en la base de datos y aparece en la lista. |

**Precondiciones:**
- El usuario debe estar autenticado y haber completado el onboarding.

**Datos de Prueba:**

| Campo      | Valor                              |
|------------|------------------------------------|
| Nombre     | `Juan`                             |
| Apellido   | `Pérez {uniqueId}`                 |
| Email      | `juan{uniqueId}@student.com`       |

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Navegar a `/dashboard/students`                                | Se muestra la lista de alumnos o el estado vacío.               |
| 2    | Hacer clic en "Agregar Mi Primer Alumno" o "Nuevo Alumno"     | Se abre el formulario de creación.                              |
| 3    | Completar campo `first_name` → `Juan`                         | El campo acepta el valor.                                       |
| 4    | Completar campo `last_name` → `Pérez {uniqueId}`              | El campo acepta el apellido único.                              |
| 5    | Completar campo `email` → `juan{uniqueId}@student.com`        | El campo acepta el email dinámico.                              |
| 6    | Hacer clic en el botón de enviar (submit)                      | El alumno se crea en Supabase.                                  |
| 7    | Verificar que el email del alumno aparece en la lista          | El alumno `juan{uniqueId}@student.com` existe en el DOM.        |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura de la tarjeta del alumno recién creado en la lista de alumnos]_
>
> ---

---

### A-006 — Envío de Feedback a Alumno

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-006                                                                                                   |
| **Módulo**             | Gestión de Alumnos — Feedback                                                                           |
| **Ruta**               | `/dashboard/students` (Modal de Feedback)                                                               |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Alta                                                                                                    |
| **Objetivo**           | Verificar que el tutor puede enviar un feedback personalizado a un alumno existente y que el sistema confirma el envío. |

**Precondiciones:**
- Debe existir al menos un alumno en la lista (A-005 completado).

**Datos de Prueba:**

| Campo    | Valor                                                                                 |
|----------|---------------------------------------------------------------------------------------|
| Mensaje  | `Excelente progreso esta semana Juan. Has mejorado mucho en los ejercicios de práctica. Sigue así! Evaluación automática #{uniqueId}` |

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Localizar la tarjeta del alumno "Juan"                         | Se encuentra la tarjeta `.card-premium` del alumno.             |
| 2    | Hacer clic en el botón "Feedback"                              | Se abre el modal de envío de feedback.                          |
| 3    | Verificar que "Enviar Feedback" es visible                     | El modal cargó correctamente.                                   |
| 4    | Completar el textarea `message` con el feedback                | El textarea acepta el texto.                                    |
| 5    | Hacer clic en "Enviar Feedback"                                | Se envía la solicitud a Supabase.                               |
| 6    | Verificar mensaje "Feedback enviado"                           | El sistema confirma el envío exitoso con un toast/notificación. |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del modal de feedback con el mensaje escrito y la confirmación de envío]_
>
> ---

---

### A-007 — Envío de Material (Enlace) a Alumno

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-007                                                                                                   |
| **Módulo**             | Gestión de Alumnos — Material Educativo                                                                 |
| **Ruta**               | `/dashboard/students` (Modal de Material)                                                               |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Alta                                                                                                    |
| **Objetivo**           | Validar que el tutor puede enviar un recurso educativo tipo "Enlace" a un alumno, incluyendo título, URL y descripción. |

**Precondiciones:**
- Debe existir al menos un alumno en la lista (A-005 completado).

**Datos de Prueba:**

| Campo       | Valor                                                                                     |
|-------------|-------------------------------------------------------------------------------------------|
| Título      | `Ejercicios de Matemáticas Semana {uniqueId}`                                             |
| Tipo        | `Enlace`                                                                                  |
| URL         | `https://example.com/material-{uniqueId}`                                                 |
| Descripción | `Material complementario de práctica para esta semana. Incluye ejercicios de álgebra y geometría.` |

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Localizar la tarjeta del alumno "Juan"                         | Se encuentra la tarjeta del alumno.                             |
| 2    | Hacer clic en el botón "Material"                              | Se abre el modal de envío de material.                          |
| 3    | Verificar que el campo `input[formControlName="title"]` es visible | El modal cargó correctamente.                              |
| 4    | Completar el campo `title`                                     | El campo acepta el título.                                      |
| 5    | Hacer clic en el botón "Enlace" (tipo de recurso)              | Se selecciona el tipo enlace y aparece el campo URL.            |
| 6    | Completar el campo `url`                                       | El campo acepta la URL.                                         |
| 7    | Completar el campo `description`                               | El campo acepta la descripción.                                 |
| 8    | Hacer clic en "Enviar Material"                                | Se envía el material a Supabase.                                |
| 9    | Verificar mensaje de éxito                                     | El sistema confirma el envío exitoso.                           |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del modal de material con los campos llenos (título, enlace, descripción)]_
>
> ---

---

### A-008 — Visualización de Detalles del Alumno

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-008                                                                                                   |
| **Módulo**             | Gestión de Alumnos — Detalle                                                                            |
| **Ruta**               | `/dashboard/students` (Modal de Detalle)                                                                |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Media                                                                                                   |
| **Objetivo**           | Verificar que el modal de detalle muestra la información completa del alumno incluyendo historial de feedback y material enviado. |

**Precondiciones:**
- El alumno debe existir y tener feedback (A-006) y material (A-007) asociados.

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Localizar la tarjeta del alumno "Juan"                         | Se encuentra la tarjeta del alumno.                             |
| 2    | Hacer clic en "Ver Detalles"                                   | Se abre el modal de detalle completo.                           |
| 3    | Verificar nombre "Juan" visible                                | Se muestra el nombre del alumno.                                |
| 4    | Verificar apellido `Pérez {uniqueId}` visible                  | Se muestra el apellido completo.                                |
| 5    | Verificar sección "Historial de Feedback" visible              | El feedback enviado en A-006 está listado.                      |
| 6    | Verificar sección "Material Enviado" visible                   | El material enviado en A-007 está listado.                      |
| 7    | Cerrar modal de detalles                                       | El modal se cierra y se regresa a la lista.                     |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del modal de detalles mostrando información del alumno, historial de feedback y material enviado]_
>
> ---

---

### A-009 — Edición de Alumno

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-009                                                                                                   |
| **Módulo**             | Gestión de Alumnos — Editar                                                                             |
| **Ruta**               | `/dashboard/students` (Modal de Edición)                                                                |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Alta                                                                                                    |
| **Objetivo**           | Verificar que el tutor puede editar los datos de un alumno existente (fecha de nacimiento y notas) y que los cambios persisten. |

**Precondiciones:**
- El alumno "Juan" debe existir en la lista (A-005 completado).

**Datos de Prueba:**

| Campo              | Valor                                                                          |
|--------------------|--------------------------------------------------------------------------------|
| Fecha de Nacimiento| Aleatoria entre 2000 y 2010 (`YYYY-MM-DD`)                                    |
| Notas              | `Alumno de prueba automatizada. Necesita refuerzo en matemáticas. ID: {uniqueId}` |

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Localizar la tarjeta del alumno "Juan"                         | Se encuentra la tarjeta del alumno.                             |
| 2    | Hacer clic en "Editar"                                         | Se abre el formulario de edición.                               |
| 3    | Verificar que "Editar Alumno" es visible                       | El modal de edición cargó correctamente.                        |
| 4    | Limpiar y completar campo `date_of_birth`                      | Se establece la fecha aleatoria.                                |
| 5    | Limpiar y completar campo `notes`                              | Se escriben las notas de prueba.                                |
| 6    | Hacer clic en "Guardar Cambios"                                | Los cambios se guardan en Supabase.                             |
| 7    | Verificar mensaje "Alumno actualizado"                         | El sistema confirma la actualización exitosa.                   |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del formulario de edición con la fecha de nacimiento y notas actualizadas]_
>
> ---

---

### A-010 — Acceso al Portal Personal del Alumno

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-010                                                                                                   |
| **Módulo**             | Portal del Alumno                                                                                       |
| **Ruta**               | `/student-portal/:token`                                                                                |
| **Tipo de Prueba**     | Funcional / Integración                                                                                 |
| **Prioridad**          | Alta                                                                                                    |
| **Objetivo**           | Verificar que el enlace del portal personal del alumno funciona correctamente y muestra la información del estudiante (feedback y material recibido). |

**Precondiciones:**
- El alumno debe tener un `access_token` generado por el sistema.
- El alumno debe tener feedback (A-006) y material (A-007) asociados.

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Obtener el `access_token` del alumno via el componente Angular | Se extrae el token del estado del componente.                   |
| 2    | Navegar a `/student-portal/{access_token}`                     | El portal del alumno carga correctamente.                       |
| 3    | Verificar que el nombre "Juan" es visible                      | Se muestra la información del estudiante.                       |
| 4    | Verificar presencia de secciones "Feedback" o "Material"       | El portal muestra el contenido recibido del tutor.              |

**Nota Técnica:** La obtención del `access_token` se realiza accediendo al componente Angular vía `window.ng.getComponent()` en modo desarrollo, lo cual permite navegar directamente al portal sin depender del portapapeles.

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del portal del alumno mostrando nombre, feedback y material recibido]_
>
> ---

---

### A-011 — Eliminación de Alumno

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-011                                                                                                   |
| **Módulo**             | Gestión de Alumnos — Eliminar                                                                           |
| **Ruta**               | `/dashboard/students`                                                                                   |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Alta                                                                                                    |
| **Objetivo**           | Verificar que el tutor puede eliminar un alumno existente, que se muestra overlay de confirmación, y que el alumno desaparece de la lista tras su eliminación. |

**Precondiciones:**
- El alumno "Juan" debe existir en la lista.

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Localizar la tarjeta del alumno "Juan"                         | Se encuentra la tarjeta del alumno.                             |
| 2    | Hacer clic en "Eliminar"                                       | Se abre el overlay de confirmación.                             |
| 3    | Confirmar eliminación (clic en botón rojo `bg-red-500`)        | La confirmación se envía a Supabase.                            |
| 4    | Esperar procesamiento (3s)                                     | El registro se elimina de la base de datos.                     |
| 5    | Verificar que `juan{uniqueId}@student.com` no existe           | El alumno ya no aparece en la lista (DOM).                      |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del overlay de confirmación de eliminación y la lista vacía después de eliminar]_
>
> ---

---

### A-012 — Visualización del Calendario

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-012                                                                                                   |
| **Módulo**             | Calendario                                                                                              |
| **Ruta**               | `/dashboard/schedule/calendar`                                                                          |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Media                                                                                                   |
| **Objetivo**           | Verificar que el módulo del calendario carga correctamente y muestra la vista mensual.                  |

**Precondiciones:**
- El usuario debe estar autenticado.

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                               |
|------|----------------------------------------------------------------|------------------------------------------------------------------|
| 1    | Navegar a `/dashboard/schedule/calendar`                       | La página del calendario carga.                                  |
| 2    | Verificar existencia de `mwl-calendar-month-view` o `h2`      | El componente del calendario está renderizado.                   |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura de la vista mensual del calendario]_
>
> ---

---

### A-013 — Configuración de Horarios y Bloqueos de Tiempo

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-013                                                                                                   |
| **Módulo**             | Configuración de Horarios                                                                               |
| **Ruta**               | `/dashboard/schedule`                                                                                   |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Alta                                                                                                    |
| **Objetivo**           | Verificar que el tutor puede configurar su disponibilidad semanal (activar sábado) y crear bloqueos de tiempo. |

**Precondiciones:**
- El usuario debe estar autenticado.

**Datos de Prueba:**

| Campo                | Valor                    |
|----------------------|--------------------------|
| Día Habilitado       | Sábado (checkbox)        |
| Nombre del Bloqueo   | `Almuerzo de prueba`     |
| Día del Bloqueo      | Sábado (último botón "S") |

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Navegar a `/dashboard/schedule`                                | Se muestra la página de configuración de horarios.              |
| 2    | Verificar heading contiene "Configuraci"                       | La página cargó correctamente.                                  |
| 3    | Activar checkbox del día "Sábado"                              | El sábado se habilita en el horario semanal.                    |
| 4    | Expandir sección "Bloqueos de Tiempo"                          | Se muestra la lista de bloqueos.                                |
| 5    | Hacer clic en "Agregar bloqueo"                                | Se agrega un nuevo formulario de bloqueo.                       |
| 6    | Completar la razón del bloqueo → `Almuerzo de prueba`          | El campo acepta el texto.                                       |
| 7    | Seleccionar día "S" (Sábado) en el bloqueo                     | Se marca el sábado para el bloqueo.                             |
| 8    | Hacer clic en "Guardar Configuración"                          | Los cambios se guardan en Supabase.                             |
| 9    | Verificar mensaje de confirmación                              | El texto "Configuraci" confirma que se guardó.                  |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura de la configuración de horarios con sábado habilitado y el bloqueo de "Almuerzo de prueba" creado]_
>
> ---

---

### A-014 — Creación de Servicio

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-014                                                                                                   |
| **Módulo**             | Servicios                                                                                               |
| **Ruta**               | `/dashboard/services`                                                                                   |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Alta                                                                                                    |
| **Objetivo**           | Verificar que el tutor puede crear un nuevo servicio con nombre, precio y duración, y que aparece en la lista. |

**Precondiciones:**
- El usuario debe estar autenticado.

**Datos de Prueba:**

| Campo    | Valor                              |
|----------|------------------------------------|
| Nombre   | `Clase de Prueba {uniqueId}`       |
| Precio   | `500`                              |
| Duración | `60` minutos                       |

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Navegar a `/dashboard/services`                                | Se muestra la lista de servicios o estado vacío.                |
| 2    | Hacer clic en "Nuevo Servicio" o "Crear"                       | Se abre el formulario de creación.                              |
| 3    | Completar campo `name` → `Clase de Prueba {uniqueId}`         | El campo acepta el nombre.                                      |
| 4    | Completar campo `price` → `500`                               | El campo acepta el precio numérico.                             |
| 5    | Seleccionar `duration_minutes` → `60`                          | Se selecciona 60 minutos.                                       |
| 6    | Hacer clic en el botón de enviar (submit)                      | El servicio se crea en Supabase.                                |
| 7    | Verificar que el nombre del servicio aparece en la lista       | `Clase de Prueba {uniqueId}` existe en el DOM.                  |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del formulario de creación de servicio y la tarjeta del servicio creado]_
>
> ---

---

### A-015 — Módulo de Planes de Estudio (Vista General)

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-015                                                                                                   |
| **Módulo**             | Planes de Estudio                                                                                       |
| **Ruta**               | `/dashboard/study-plans`                                                                                |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Media                                                                                                   |
| **Objetivo**           | Verificar que el módulo de planes de estudio carga correctamente y está accesible en el dashboard.      |

**Precondiciones:**
- El usuario debe estar autenticado.

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Navegar a `/dashboard/study-plans`                             | La página carga sin errores.                                    |
| 2    | Verificar que el `body` existe                                 | El contenido base del módulo está renderizado.                  |
| 3    | Esperar carga visual (3s)                                      | El contenido completo es visible.                               |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura de la vista general del módulo de planes de estudio]_
>
> ---

---

### A-016 — Pagos y Vinculación de Cuenta Bancaria

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-016                                                                                                   |
| **Módulo**             | Pagos — Vincular Cuenta Bancaria                                                                        |
| **Ruta**               | `/dashboard/payments`                                                                                   |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Crítica                                                                                                 |
| **Objetivo**           | Verificar que el tutor puede vincular su cuenta bancaria (CLABE interbancaria) proporcionando banco, titular y número de cuenta, y que los datos se guardan correctamente. |

**Precondiciones:**
- El usuario debe estar autenticado.

**Datos de Prueba:**

| Campo          | Valor                              |
|----------------|------------------------------------|
| Banco          | `BBVA`                             |
| Titular        | `Test User Prueba Automatizada`    |
| CLABE (18 dígitos) | Generado aleatoriamente: `0121800XXXXXXXXXXX` |

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Navegar a `/dashboard/payments`                                | Se muestra la página de pagos.                                  |
| 2    | Verificar que "Pagos" es visible                               | La página cargó correctamente.                                  |
| 3    | Hacer scroll y clic en "Vincular Cuenta"                       | Se abre el modal/formulario de datos bancarios.                 |
| 4    | Verificar campo `select[formControlName="bank_name"]` visible  | El formulario bancario cargó.                                   |
| 5    | Seleccionar banco → `BBVA`                                     | Se selecciona la institución bancaria.                          |
| 6    | Completar campo `account_holder`                               | El campo acepta el nombre del titular.                          |
| 7    | Generar CLABE aleatoria de 18 dígitos                          | Se genera un número válido.                                     |
| 8    | Completar campo `account_number` con la CLABE                  | El campo acepta los 18 dígitos.                                 |
| 9    | Hacer clic en "Guardar Cuenta"                                 | Los datos bancarios se guardan en Supabase.                     |
| 10   | Verificar que "BBVA" aparece en la página                      | Los datos bancarios se muestran como vinculados.                |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del formulario de vinculación bancaria con datos ingresados y la confirmación de cuenta vinculada]_
>
> ---

---

### A-017 — Configuración y Cambio de Plan de Suscripción (PayPal)

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-017                                                                                                   |
| **Módulo**             | Configuración — Suscripción                                                                             |
| **Ruta**               | `/dashboard/settings`                                                                                   |
| **Tipo de Prueba**     | Funcional / Integración                                                                                 |
| **Prioridad**          | Crítica                                                                                                 |
| **Objetivo**           | Verificar que el tutor puede acceder a la configuración, abrir el modal de cambio de plan, seleccionar el plan "Academia" y que se muestra la integración de pago con PayPal. Se simula un pago exitoso vía el componente Angular. |

**Precondiciones:**
- El usuario debe estar autenticado.
- PayPal SDK debe estar cargado (aunque el iframe es cross-origin y no se puede interactuar directamente).

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Navegar a `/dashboard/settings`                                | Se muestra la página de configuración.                          |
| 2    | Verificar que "Configuración" es visible                       | La página cargó correctamente.                                  |
| 3    | Hacer clic en "Cambiar Plan"                                   | Se abre el modal de selección de plan.                          |
| 4    | Seleccionar plan "Academia" (contiene "Ideal para academias")  | Se selecciona el plan de nivel superior.                        |
| 5    | Verificar que "Pago requerido" es visible                      | Se muestra la sección de pago.                                  |
| 6    | Simular pago exitoso vía `window.ng.getComponent()`            | Se invoca `handleUpgradePaymentSuccess` con `MOCK_PAYPAL_ORDER`.|
| 7    | Esperar procesamiento (2s) y manejar alertas                   | Las alertas de confirmación se aceptan automáticamente.         |
| 8    | Cerrar modal si sigue abierto                                  | El flujo continúa sin bloqueos.                                 |

**Nota Técnica:** Cypress no puede interactuar con iframes de PayPal por restricciones de seguridad cross-origin. La simulación de pago se realiza invocando directamente el método `handleUpgradePaymentSuccess` del componente Angular en modo desarrollo.

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del modal de cambio de plan mostrando la opción "Academia" seleccionada y el formulario de pago]_
>
> ---

---

### A-018 — Editor de Landing Page Personalizada

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-018                                                                                                   |
| **Módulo**             | Editor de Landing Page                                                                                  |
| **Ruta**               | `/dashboard/landing-editor` → `/p/:slug`                                                                |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Alta                                                                                                    |
| **Objetivo**           | Verificar que el tutor puede personalizar su landing page pública (slug, colores, descripción, contacto), guardar los cambios y visitar la landing generada para confirmar que se despliega correctamente. |

**Precondiciones:**
- El usuario debe estar autenticado.

**Datos de Prueba:**

| Campo           | Valor                                                            |
|-----------------|------------------------------------------------------------------|
| Slug            | `academia-{uniqueId}`                                            |
| Color Primario  | Hexadecimal aleatorio                                            |
| Color Secundario| Hexadecimal aleatorio                                            |
| Descripción     | `Bienvenidos a mi academia de prueba. Generado automáticamente: {uniqueId}` |
| Email Contacto  | `contacto{uniqueId}@academia.com`                                |

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Navegar a `/dashboard/landing-editor`                          | Se muestra el editor con "Configuración" visible.               |
| 2    | Limpiar y completar campo `slug`                               | Se establece el slug personalizado.                             |
| 3    | Limpiar y completar campo `primaryColor`                       | Se establece el color primario.                                 |
| 4    | Limpiar y completar campo `secondaryColor`                     | Se establece el color secundario.                               |
| 5    | Limpiar y completar campo `description`                        | La descripción se actualiza.                                    |
| 6    | Limpiar y completar campo `contactEmail`                       | El email de contacto se actualiza.                              |
| 7    | Hacer clic en "Guardar Cambios"                                | Los cambios se guardan en Supabase.                             |
| 8    | Verificar mensaje de confirmación                              | El sistema confirma que se guardó.                              |
| 9    | Hacer clic en "Ver Landing Page" (sin abrir nueva pestaña)     | Cypress navega a la landing pública.                            |
| 10   | Verificar que la URL contiene `/p/`                            | Se cargó la landing pública del tutor.                          |
| 11   | Verificar que la descripción personalizada es visible          | El contenido editado se muestra correctamente.                  |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del editor de landing page con los campos personalizados y la landing pública resultante]_
>
> ---

---

### A-019 — Interacción con Chatbot de Asesoría Personalizada (IA Gemini)

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-019                                                                                                   |
| **Módulo**             | Chatbot de Asesoría — Inteligencia Artificial                                                           |
| **Ruta**               | `/p/:slug` (Landing pública con FAB de chatbot)                                                         |
| **Tipo de Prueba**     | Funcional / Integración                                                                                 |
| **Prioridad**          | Crítica                                                                                                 |
| **Objetivo**           | Verificar la interacción completa con el chatbot de asesoría personalizada desde la landing pública, incluyendo selección de destinatario, recolección de datos del estudiante, y generación automática de un plan de estudios personalizado mediante la API de Gemini. |

**Precondiciones:**
- La landing pública del tutor debe estar publicada (A-018 completado).
- Las llamadas a la API de Gemini se interceptan con `cy.intercept()` para respuestas deterministas.

**Datos de Prueba (Simulados via Interceptor):**

| Concepto              | Valor                                              |
|-----------------------|----------------------------------------------------|
| Tipo de asesoría      | "Para mí"                                          |
| Nombre                | `Carlos Martínez`                                  |
| Email                 | `carlos{uniqueId}@test.com`                         |
| Teléfono              | `+5215551234567`                                   |
| Nivel Académico       | `Universidad`                                      |
| Materias              | `Matemáticas y Cálculo`                            |
| Temas Específicos     | `Álgebra lineal y cálculo diferencial`             |
| Objetivo              | `Aprobar examen final de cálculo`                  |

**Respuestas Simuladas del Chatbot (8 turnos secuenciales):**

| Turno | Respuesta del Bot (Simulada)                                                   |
|-------|--------------------------------------------------------------------------------|
| 1     | ¡Perfecto! 😊 La asesoría será para ti. ¿Cuál es tu nombre completo?          |
| 2     | ¡Mucho gusto! 📧 ¿Cuál es tu correo electrónico?                              |
| 3     | ¡Gracias! 📱 ¿Me puedes compartir tu número de WhatsApp?                      |
| 4     | ¡Excelente! 🎓 ¿Cuál es tu nivel académico actual?                            |
| 5     | ¡Genial! 📚 ¿Qué materia necesitas reforzar?                                  |
| 6     | Entiendo 🤔 ¿Hay temas específicos que se te dificulten más?                  |
| 7     | ¡Muy bien! 🎯 ¿Cuál es tu objetivo principal?                                 |
| 8     | ¡Perfecto! Tengo toda la información. Vamos a preparar tu plan. ✨ [DATOS_COMPLETOS] |

**Plan de Estudios Generado (Mock):**

| Campo                  | Valor                                              |
|------------------------|----------------------------------------------------|
| Título                 | `Programa Intensivo de Matemáticas Avanzadas`      |
| Sesiones Recomendadas  | 6                                                  |
| Duración por Sesión    | 60 minutos                                         |
| Total de Horas         | 6                                                  |
| Precio Estimado        | $1,140                                             |
| Módulos                | Fundamentos de Álgebra, Introducción al Cálculo, Práctica y Evaluación |

**Estrategia de Interceptación de API:**

La prueba configura un interceptor unificado para todas las llamadas a `generativelanguage.googleapis.com` que distingue entre 3 tipos de solicitud:

1. **Chat normal** (texto plano): Responde secuencialmente con las 8 respuestas simuladas.
2. **`generateStudyPlan`** (JSON con `responseMimeType`): Retorna el plan de estudios mock.
3. **`extractDataFromChat`** (JSON con "Analiza la siguiente conversaci"): Retorna los datos extraídos mock.

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Configurar interceptor de Gemini API con 3 tipos de respuesta  | El interceptor queda registrado como `@geminiApi`.              |
| 2    | Hacer clic en FAB con icono "Asesoría IA"                      | Se abre el chatbot `app-consultation-chatbot`.                  |
| 3    | Verificar que "Asistente de" es visible                        | El chatbot se renderizó correctamente.                          |
| 4    | Seleccionar "Para mí"                                          | Se envía el tipo de asesoría y se recibe respuesta simulada.    |
| 5    | Escribir y enviar nombre: `Carlos Martínez`                    | El mensaje se envía y se recibe respuesta simulada.             |
| 6    | Escribir y enviar email                                        | El mensaje se envía y se recibe respuesta simulada.             |
| 7    | Escribir y enviar teléfono                                     | El mensaje se envía y se recibe respuesta simulada.             |
| 8    | Seleccionar "Universidad" (quick reply o input)                | Se detecta automáticamente si es botón o input libre.           |
| 9    | Escribir y enviar materias: `Matemáticas y Cálculo`            | El mensaje se envía y se recibe respuesta simulada.             |
| 10   | Escribir y enviar temas específicos                            | El mensaje se envía y se recibe respuesta simulada.             |
| 11   | Seleccionar "Pasar un examen" o escribir objetivo              | Se detecta automáticamente si es botón o input libre.           |
| 12   | Esperar generación del plan (5s + timeout 15s)                 | Las llamadas `generateStudyPlan` y `extractDataFromChat` se procesan. |
| 13   | Verificar título del plan visible                              | "Programa Intensivo de Matemáticas Avanzadas" se muestra.      |
| 14   | Verificar "sesiones" visible                                   | La información del plan es legible.                             |
| 15   | Hacer clic en "Enviar al Asesor"                               | Se envía la solicitud al tutor vía Supabase.                    |
| 16   | Manejar alerta de confirmación "Solicitud enviada"             | La alerta se acepta automáticamente.                            |
| 17   | Esperar procesamiento (5s)                                     | Los datos se guardan en la base de datos.                       |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura del chatbot mostrando la conversación completa con el asistente de IA]_
>
> _[Insertar captura del plan de estudios generado mostrando título, módulos y precio estimado]_
>
> _[Insertar captura del mensaje "Enviar al Asesor" y la confirmación de solicitud enviada]_
>
> ---

---

### A-020 — Verificación y Aprobación de Plan de Estudios en Dashboard

| **Campo**              | **Detalle**                                                                                             |
|------------------------|---------------------------------------------------------------------------------------------------------|
| **ID del Caso**        | A-020                                                                                                   |
| **Módulo**             | Planes de Estudio — Aprobación                                                                          |
| **Ruta**               | `/dashboard/study-plans`                                                                                |
| **Tipo de Prueba**     | Funcional                                                                                               |
| **Prioridad**          | Crítica                                                                                                 |
| **Objetivo**           | Verificar que la solicitud de plan de estudios generada por el chatbot aparece en el dashboard del tutor, que puede ver los detalles completos de la solicitud, aprobar el plan, y que este se mueve correctamente a la pestaña de "Aprobados". |

**Precondiciones:**
- El chatbot debe haber generado y enviado una solicitud exitosamente (A-019 completado).
- Los datos del alumno "Carlos" deben existir en la base de datos.

**Pasos Automatizados:**

| Paso | Acción                                                         | Resultado Esperado                                              |
|------|----------------------------------------------------------------|-----------------------------------------------------------------|
| 1    | Navegar a `/dashboard/study-plans`                             | Se muestra el módulo de planes de estudio.                      |
| 2    | Verificar que "Planes de Estudio" es visible                   | La página cargó correctamente.                                  |
| 3    | Esperar carga de datos (3s)                                    | Las solicitudes se obtienen de Supabase.                        |
| 4    | Si no hay planes en "Pendientes", cambiar a pestaña "Todos"   | Se busca la solicitud en todas las pestañas.                    |
| 5    | Verificar que "Carlos" existe en la lista                      | La solicitud del chatbot se muestra correctamente.              |
| 6    | Hacer clic en la primera tarjeta `.card-premium.cursor-pointer`| Se abre el modal "Detalle de Solicitud".                        |
| 7    | Verificar que "Detalle de Solicitud" es visible                | El modal de detalle cargó correctamente.                        |
| 8    | Verificar información del estudiante "Carlos"                  | Los datos extraídos por IA se muestran correctamente.           |
| 9    | Hacer clic en "Aprobar Plan"                                   | Se envía la aprobación a Supabase.                              |
| 10   | Esperar procesamiento (3s)                                     | El estado del plan cambia a "aprobado".                         |
| 11   | Hacer clic en pestaña "Aprobados"                              | Se navega a la pestaña de planes aprobados.                     |
| 12   | Verificar que "Carlos" existe en aprobados                     | El plan aprobado aparece en la pestaña correcta.                |

**Resultado:** ✅ Aprobado

> 📸 **Espacio para Screenshot:**
>
> _[Insertar captura de la solicitud pendiente en el módulo de planes de estudio]_
>
> _[Insertar captura del modal "Detalle de Solicitud" con la información del alumno y el botón "Aprobar Plan"]_
>
> _[Insertar captura de la pestaña "Aprobados" mostrando el plan aprobado]_
>
> ---

---

## 5. Resumen de Resultados

### 5.1 Tabla General

| ID    | Caso de Prueba                              | Módulo                           | Prioridad | Resultado  |
|-------|---------------------------------------------|----------------------------------|-----------|------------|
| A-001 | Exploración de Landing Page Principal        | Landing Page                     | Media     | ✅ Aprobado |
| A-002 | Registro de Usuario Nuevo                    | Autenticación                    | Crítica   | ✅ Aprobado |
| A-003 | Inicio de Sesión (Login)                     | Autenticación                    | Crítica   | ✅ Aprobado |
| A-004 | Onboarding del Perfil                        | Onboarding                       | Alta      | ✅ Aprobado |
| A-005 | Creación de Alumno                           | Gestión de Alumnos               | Crítica   | ✅ Aprobado |
| A-006 | Envío de Feedback a Alumno                   | Gestión de Alumnos               | Alta      | ✅ Aprobado |
| A-007 | Envío de Material (Enlace) a Alumno          | Gestión de Alumnos               | Alta      | ✅ Aprobado |
| A-008 | Visualización de Detalles del Alumno         | Gestión de Alumnos               | Media     | ✅ Aprobado |
| A-009 | Edición de Alumno                            | Gestión de Alumnos               | Alta      | ✅ Aprobado |
| A-010 | Acceso al Portal Personal del Alumno         | Portal del Alumno                | Alta      | ✅ Aprobado |
| A-011 | Eliminación de Alumno                        | Gestión de Alumnos               | Alta      | ✅ Aprobado |
| A-012 | Visualización del Calendario                 | Calendario                       | Media     | ✅ Aprobado |
| A-013 | Configuración de Horarios y Bloqueos         | Horarios                         | Alta      | ✅ Aprobado |
| A-014 | Creación de Servicio                         | Servicios                        | Alta      | ✅ Aprobado |
| A-015 | Planes de Estudio (Vista General)            | Planes de Estudio                | Media     | ✅ Aprobado |
| A-016 | Pagos y Vinculación de Cuenta Bancaria       | Pagos                            | Crítica   | ✅ Aprobado |
| A-017 | Cambio de Plan de Suscripción (PayPal)       | Configuración                    | Crítica   | ✅ Aprobado |
| A-018 | Editor de Landing Page Personalizada         | Editor de Landing                | Alta      | ✅ Aprobado |
| A-019 | Chatbot de Asesoría con IA (Gemini)          | Chatbot IA / Booking             | Crítica   | ✅ Aprobado |
| A-020 | Verificación y Aprobación de Plan            | Planes de Estudio                | Crítica   | ✅ Aprobado |

### 5.2 Estadísticas

| Métrica                        | Valor        |
|--------------------------------|--------------|
| **Total de Casos**             | 20           |
| **Aprobados**                  | 20           |
| **Fallidos**                   | 0            |
| **Tasa de Éxito**              | **100%**     |
| **Prioridad Crítica**          | 7 casos      |
| **Prioridad Alta**             | 9 casos      |
| **Prioridad Media**            | 4 casos      |
| **Módulos Cubiertos**          | 14           |

### 5.3 Cobertura por Módulo

| Módulo                           | Casos de Prueba         | Cobertura |
|----------------------------------|-------------------------|-----------|
| Landing Page Principal           | A-001                   | ✅ Cubierto |
| Autenticación (Registro)         | A-002                   | ✅ Cubierto |
| Autenticación (Login)            | A-003                   | ✅ Cubierto |
| Onboarding                       | A-004                   | ✅ Cubierto |
| Gestión de Alumnos (CRUD)        | A-005, A-006, A-007, A-008, A-009, A-011 | ✅ Cubierto |
| Portal del Alumno                | A-010                   | ✅ Cubierto |
| Calendario                       | A-012                   | ✅ Cubierto |
| Configuración de Horarios        | A-013                   | ✅ Cubierto |
| Servicios                        | A-014                   | ✅ Cubierto |
| Planes de Estudio                | A-015, A-020            | ✅ Cubierto |
| Pagos                            | A-016                   | ✅ Cubierto |
| Configuración / Suscripción      | A-017                   | ✅ Cubierto |
| Editor de Landing Page           | A-018                   | ✅ Cubierto |
| Chatbot de IA (Gemini)           | A-019                   | ✅ Cubierto |

---

## 6. Notas Técnicas y Limitaciones

### 6.1 Interceptación de API de Terceros
- Las llamadas a **Google Gemini** (`generativelanguage.googleapis.com`) se interceptan con `cy.intercept()` para garantizar reproducibilidad y determinismo en las pruebas. No se realizan llamadas reales a la IA.
- La integración con **PayPal** se simula invocando directamente el método `handleUpgradePaymentSuccess()` del componente Angular, ya que los iframes de PayPal tienen restricciones cross-origin que impiden la interacción desde Cypress.

### 6.2 Gestión de Sesión
- Todas las pruebas se ejecutan dentro de un **único bloque `it()`** para preservar la sesión de Supabase Auth. Cypress limpia `localStorage` entre bloques `it()`, lo que provocaría la pérdida de autenticación.

### 6.3 Datos Dinámicos
- Se utiliza `Date.now()` como `uniqueId` para generar datos únicos en cada ejecución (emails, slugs, nombres), evitando conflictos con ejecuciones anteriores o datos residuales.

### 6.4 Manejo Condicional
- Varios pasos utilizan verificaciones condicionales (`$body.text().includes(...)`) para adaptarse a diferentes estados de la aplicación (primer uso vs. uso posterior) sin hacer fallar la prueba.

### 6.5 Selectores CSS
- Se utilizan selectores `formControlName` para interactuar con formularios Angular Reactive.
- Se utilizan clases de Tailwind CSS (`bg-red-500`, `card-premium`) como selectores de UI.
- Los overlays de confirmación se identifican por sus clases de estilo visual para evitar ambigüedad con otros botones del mismo texto.

---

## 7. Evidencia Visual

> **Instrucciones:** Para completar este reporte con evidencia visual, ejecutar las pruebas con el flag `--headed` y capturar screenshots en cada paso señalado.
>
> Comando de ejecución:
> ```bash
> npx cypress run --spec cypress/e2e/full-flow.cy.ts --headed --browser chrome
> ```
>
> Alternativamente, usar Cypress en modo interactivo para capturar manualmente:
> ```bash
> npx cypress open
> ```
>
> Las capturas deben ubicarse en la carpeta `cypress/screenshots/` y referenciarse en cada sección "📸 Espacio para Screenshot" de este documento.

---

## 8. Conclusiones

- **Todas las pruebas automatizadas pasaron exitosamente (100% de tasa de éxito).**
- Se validaron los **14 módulos principales** de la plataforma EduGestión 3.0.
- El flujo completo cubre desde el primer contacto del usuario (landing page) hasta operaciones avanzadas como la generación de planes de estudio con IA y la aprobación por parte del tutor.
- Las integraciones con servicios externos (Gemini AI, PayPal) se manejan de forma **segura y determinista** mediante interceptores y simulaciones.
- El módulo de **Gestión de Alumnos** es el más extensamente probado con **6 casos de prueba** que cubren todo el ciclo CRUD más operaciones adicionales (feedback, material, portal).
- Se recomienda mantener y ampliar estas pruebas conforme se agreguen nuevas funcionalidades a la plataforma.

---

*Documento generado como parte del proceso de aseguramiento de calidad del proyecto EduGestión 3.0.*
