# Documento Formal de Plan y Reporte de Pruebas - EduGestión 3.0

El presente documento establece la estrategia, ejecución y resultados de las pruebas de software aplicadas a la plataforma EduGestión 3.0. Su propósito es garantizar la calidad, estabilidad y correcto funcionamiento del flujo crítico del sistema, alineándose con los requerimientos de evaluación del proyecto.

---

## 1. Tipo de Prueba Realizada

Para asegurar una cobertura integral del sistema, se ha implementado una estrategia de pruebas híbrida:

- **Pruebas Dinámicas Automatizadas End-to-End (E2E):** Pruebas de caja negra orientadas a simular el comportamiento real de un usuario final interactuando con la interfaz gráfica (UI). Estas pruebas validan el flujo principal de negocio ("Happy Path") de forma secuencial y monolítica, asegurando la correcta integración entre el frontend (Angular) y el backend (Supabase).
- **Pruebas Manuales Exploratorias y de Integración:** Verificaciones puntuales destinadas a evaluar aspectos no automatizables por restricciones de seguridad de terceros (ej. pasarelas de pago reales) y la adaptabilidad responsiva del diseño.

---

## 2. Actividades de la Prueba

El ciclo de pruebas comprendió las siguientes fases y actividades operativas:

1. **Diseño de Casos de Prueba:** Definición del flujo crítico de usuario, estableciendo precondiciones, datos de prueba dinámicos (generación de identificadores únicos mediante *timestamps* para evitar colisiones) y resultados esperados.
2. **Configuración del Entorno:** Preparación de la base de datos de pruebas en Supabase y configuración del entorno de ejecución local.
3. **Ejecución de Flujos de Validación:**
   - **Autenticación:** Inserción de credenciales, validación de políticas de seguridad y verificación de redireccionamientos.
   - **Onboarding:** Llenado de formularios demográficos y profesionales, y validación de persistencia de datos de perfil.
   - **Gestión de Entidades:** Creación, lectura y validación de registros en los módulos de Alumnos y Servicios.
   - **Simulación Transaccional:** Interacción con el panel de suscripciones y simulación de eventos de actualización de plan (Upselling).
4. **Monitoreo y Depuración:** Intercepción de peticiones de red y aserciones de estado del DOM para garantizar la sincronía entre la UI y las respuestas del servidor.

---

## 3. Uso de Herramienta de Prueba

La automatización del aseguramiento de calidad se apoyó en las siguientes tecnologías:

- **Cypress (Framework Principal):** Seleccionado como la herramienta central para la automatización E2E. A diferencia de alternativas tradicionales como **Selenium**, Cypress opera directamente dentro del ciclo de vida del navegador, lo que permite un manejo nativo de la asincronía, acceso directo a los objetos del DOM y de red, y una integración superior con aplicaciones Single Page Application (SPA) desarrolladas en Angular.
- **Postman:** Utilizado en fases tempranas para la validación manual y automatizada de los endpoints RESTful y funciones RPC de Supabase antes de su integración con el frontend.
- **Chrome DevTools:** Empleado para la auditoría de rendimiento, simulación de dispositivos móviles (Responsive Design Testing) y depuración de la consola durante las pruebas manuales.

---

## 4. Resultados del Análisis de Pruebas (Reporte)

### 4.1. Estado General de Ejecución
La suite de pruebas automatizadas, consolidada en el archivo `cypress/e2e/full-flow.cy.ts`, se ejecuta de manera exitosa y estable. El análisis confirma que la arquitectura del sistema soporta adecuadamente el flujo operativo principal sin interrupciones críticas.

### 4.2. Cobertura Exacta de Módulos Automatizados
El script de automatización recorre, interactúa y valida explícitamente los siguientes módulos del sistema:

1. **Módulo de Autenticación (`/auth`):** Validación de registro de nuevos usuarios, encriptación de contraseñas y generación automática de perfiles mediante triggers de base de datos.
2. **Módulo de Onboarding (`/dashboard`):** Verificación del asistente de configuración inicial y persistencia de datos de la academia.
3. **Módulo de Gestión de Alumnos (`/dashboard/students`):** Validación de la interfaz de directorio, apertura de modales y creación exitosa de expedientes de estudiantes.
4. **Módulo de Calendario (`/dashboard/schedule/calendar`):** Comprobación del correcto renderizado de la librería de calendario y vistas mensuales.
5. **Módulo de Configuración de Horarios (`/dashboard/schedule`):** Interacción con la matriz de disponibilidad semanal y creación de bloqueos de tiempo personalizados.
6. **Módulo de Servicios (`/dashboard/services`):** Automatización de la creación de ofertas académicas, asignando parámetros de precio y duración.
7. **Módulo de Planes de Estudio (`/dashboard/study-plans`):** Navegación y validación de carga de contenido asíncrono.
8. **Módulo de Pagos y Suscripciones (`/dashboard/payments`, `/dashboard/settings`):** Verificación de la interfaz de historial de pagos y validación del flujo de actualización de planes (Upselling).
9. **Módulo de Landing Page (`/dashboard/landing-editor`):** Generación de URLs públicas dinámicas (slugs), personalización de paleta de colores y validación de la publicación de la página web de la academia.

### 4.3. Hallazgos, Limitaciones y Resoluciones
- **Incidencia Detectada (Seguridad de Terceros):** Durante la automatización del módulo de pagos, se identificó que las pasarelas financieras (PayPal/Stripe) implementan estrictas políticas anti-bot y restricciones CORS que bloquean la inyección de datos dentro de sus *iframes* cuando se detecta un entorno de navegador *headless* (automatizado).
- **Resolución Implementada:** Para mantener la continuidad de la prueba sin comprometer la seguridad, se implementó una estrategia de *Mocking* (simulación). El script de Cypress verifica el correcto renderizado del contenedor de pago y, posteriormente, inyecta un evento sintético de "Pago Completado" a nivel de componente Angular. Esto permite validar que el sistema de EduGestión reacciona correctamente ante una transacción exitosa, delegando la prueba transaccional estricta a las validaciones manuales en entorno Sandbox.
