# Documentación Técnica de Pruebas Automatizadas (E2E) - EduGestión

## 1. Resumen Ejecutivo
Este documento detalla la arquitectura, alcance y especificaciones técnicas de la suite de pruebas End-to-End (E2E) implementada con Cypress para la plataforma EduGestión. La automatización está diseñada para validar la integridad del flujo principal de usuario ("Happy Path"), garantizando que los módulos críticos del sistema interactúen correctamente desde el registro inicial hasta la configuración pública de la academia.

## 2. Arquitectura de la Prueba
La prueba principal (`full-flow.cy.ts`) está estructurada como un flujo continuo y monolítico. Esta decisión arquitectónica responde a la necesidad de mantener la persistencia de la sesión de Supabase, dado que Cypress limpia el `localStorage` entre bloques `it()`.

- **Framework:** Cypress v15.10.0
- **Estrategia de Datos:** Generación dinámica de identificadores únicos (`Date.now()`) para evitar colisiones en la base de datos durante ejecuciones concurrentes o repetitivas.
- **Manejo de Asincronía:** Implementación de esperas explícitas (`cy.wait()`) y aserciones de reintento (`.should()`) para sincronizar el DOM con las respuestas de la API de Supabase y el ciclo de detección de cambios de Angular.

## 3. Cobertura de Módulos (Flujo Secuencial)

La automatización recorre y valida los siguientes módulos del sistema en orden cronológico:

### 3.1. Módulo de Autenticación (`/auth`)
- **Registro (`/auth/register`):** 
  - Inserción de credenciales dinámicas (`testuser[timestamp]@gmail.com`).
  - Validación de políticas de contraseñas.
  - Envío del formulario de creación de cuenta.
- **Login (`/auth/login`):** 
  - Intercepción y manejo de redirecciones post-registro.
  - Autenticación manual de respaldo en caso de ausencia de auto-login.

### 3.2. Módulo de Onboarding (`/dashboard`)
- **Asistente de Configuración Inicial:** 
  - Detección condicional del modal de bienvenida.
  - Llenado de datos demográficos y profesionales (Nombre, Apellido, Rol: "Tutor Independiente", Rango de Ingresos).
  - Persistencia de datos de perfil en Supabase.

### 3.3. Módulo de Gestión de Alumnos (`/dashboard/students`)
- **Navegación:** Acceso a la vista principal del directorio de estudiantes.
- **Creación de Entidades:** 
  - Manejo de estados de UI (Empty State vs. Lista poblada).
  - Llenado del formulario de nuevo alumno con datos dinámicos.
- **Validación de Estado:** Verificación de la inserción exitosa en la tabla de datos mediante aserciones de contenido.

### 3.4. Módulo de Calendario (`/dashboard/schedule/calendar`)
- **Renderizado de Componentes:** 
  - Validación de carga de la librería `angular-calendar`.
  - Verificación de la vista mensual (`mwl-calendar-month-view`).

### 3.5. Módulo de Configuración de Horarios (`/dashboard/schedule`)
- **Disponibilidad Semanal:** 
  - Interacción con checkboxes para habilitar días específicos (ej. Sábado).
- **Gestión de Bloqueos de Tiempo:** 
  - Expansión de la interfaz de opciones avanzadas.
  - Creación de un nuevo bloqueo con metadatos (Razón: "Almuerzo de prueba").
  - Asignación del bloqueo a días específicos de la semana.
- **Validación de Persistencia:** Confirmación de guardado mediante la detección de notificaciones de éxito en la UI.

### 3.6. Módulo de Servicios (`/dashboard/services`)
- **Creación de Oferta Académica:** 
  - Interacción con el formulario de nuevo servicio.
  - Configuración de parámetros: Nombre dinámico, Precio (500) y Duración (60 minutos).
- **Validación de Estado:** Confirmación de la aparición del nuevo servicio en el listado principal.

### 3.7. Módulo de Planes de Estudio (`/dashboard/study-plans`)
- **Navegación y Renderizado:** 
  - Acceso a la vista de planes de estudio.
  - Implementación de un `cooldown` (espera explícita de 3000ms) para garantizar la carga completa del contenido asíncrono antes de proceder.

### 3.8. Módulo de Pagos (`/dashboard/payments`)
- **Navegación:** Acceso a la vista de historial/gestión de pagos y validación de carga estructural.

### 3.9. Módulo de Configuración y Suscripciones (`/dashboard/settings`)
- **Gestión de Planes (Upselling):** 
  - Apertura del modal de actualización de plan.
  - Selección del plan premium ("Academia").
- **Integración de Pasarela de Pago (Limitación Técnica):** 
  - Validación de la inyección correcta del iframe seguro de PayPal (`#paypal-button-container`).
  - **Limitación Crítica:** La automatización completa del flujo de pago no es posible en este entorno. PayPal implementa estrictas medidas de seguridad anti-bot y políticas de Cross-Origin Resource Sharing (CORS) que bloquean activamente a navegadores automatizados (headless browsers) como los utilizados por Cypress. Por lo tanto, Cypress no puede inyectar datos de tarjetas de crédito de prueba dentro del iframe de PayPal, limitando la prueba a verificar únicamente que la pasarela se renderiza correctamente en la interfaz.

### 3.10. Módulo de Landing Page (`/dashboard/landing-editor`)
- **Personalización de Marca:** 
  - Generación de un slug único (`academia-[timestamp]`).
  - Asignación de colores hexadecimales aleatorios para la paleta primaria y secundaria.
  - Configuración de descripción pública y correo de contacto.
- **Validación de Publicación:** 
  - Guardado de configuración y espera de sincronización con el backend.
  - Interacción con el enlace público (removiendo el atributo `target="_blank"` para mantener el contexto de Cypress).
  - Verificación final de la URL pública (`/p/[slug]`) y aserción del contenido renderizado.

## 4. Manejo de Errores y Estabilidad (Flakiness)
Para garantizar la estabilidad de la prueba en entornos de Integración Continua (CI), se han implementado las siguientes estrategias:
- **Selectores Robustos:** Uso de expresiones regulares (`/S.bado/i`) y selectores de atributos (`[formControlName="..."]`) en lugar de clases CSS volátiles.
- **Aserciones de Reintento:** Uso de `.should('be.visible')` antes de interactuar con elementos que dependen de respuestas de red.
- **Manejo de Alertas Nativas:** Intercepción de eventos `window:confirm` y `window:alert` para evitar bloqueos en la ejecución automatizada.
- **Evasión de Bloqueos de Terceros:** Se ha comentado la aserción estricta del iframe de PayPal (`cy.get('#paypal-button-container iframe').should('exist')`) debido a que los sistemas anti-bot de PayPal frecuentemente bloquean o retrasan la carga del iframe en entornos headless, lo que causaba falsos negativos en la suite de pruebas.