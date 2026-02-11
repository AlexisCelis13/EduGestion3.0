# Plan de Pruebas - EduGestion 3.0

Este documento detalla la estrategia de pruebas implementada para asegurar la calidad del flujo crítico de la aplicación, combinando automatización E2E (End-to-End) con recomendaciones para pruebas manuales.

## 1. Pruebas Automatizadas (Cypress)
El archivo `cypress/e2e/full-flow.cy.ts` ejecuta un recorrido completo del usuario ("Happy Path") para validar que las funciones core funcionen integradas.

### A. Autenticación y Registro (`Auth`)
*   **Prueba**: Registro de nuevo usuario.
*   **Datos**: Se genera un correo dinámico único (`test.user.[timestamp]@gmail.com`) y contraseña estándar.
*   **Validación**:
    *   El usuario se crea correctamente.
    *   El sistema redirige a la pantalla de Onboarding.
    *   *(Backend)* Se dispara el trigger SQL para crear Perfil y Suscripción automáticamente.

### B. Onboarding (Bienvenida)
*   **Prueba**: Completar el asistente de configuración inicial.
*   **Pasos verificados**:
    *   **Paso 1**: Ingreso de Nombre y País.
    *   **Paso 2**: Ingreso de Nombre de Escuela y Teléfono.
    *   **Finalización**: Clic en "Comenzar" y redirección al Dashboard principal.

### C. Gestión de Alumnos (`Students`)
*   **Prueba**: Creación exitosa de un registro.
*   **Acciones**:
    *   Navegar a la sección "Alumnos".
    *   Abrir modal "Nuevo Alumno".
    *   Llenar formulario (Nombre: Juan Pérez, Email, Teléfono).
    *   Guardar.
*   **Validación**: El modal se cierra y el alumno aparece o no genera error.

### D. Gestión de Servicios (`Services`)
*   **Prueba**: Configuración de un servicio ofertable.
*   **Acciones**:
    *   Navegar a "Servicios".
    *   Crear servicio "Clase de Matemáticas".
    *   Asignar precio (50.00) y duración (60 min).
*   **Validación**: Persistencia del servicio en la lista.

### E. Flujo de Pagos y Suscripción (`Payments`)
*   **Prueba**: Upgrade de Plan (Freelance -> Academia).
*   **Escenario Especial**:
    *   Navegar a "Configuración" -> panel de suscripción.
    *   Seleccionar plan "Academia".
    *   **Simulación ("Mocking")**: Debido a que Cypress no puede interactuar con iframes de seguridad bancaria (PayPal/Stripe) ni escribir datos de tarjetas reales por seguridad, la prueba **simula** el evento de éxito.
    *   Se inyecta un evento de "Pago Completado" directamente al componente de Angular para verificar que la aplicación reaccione correctamente al éxito del pago (cierre de modal, mensaje de éxito).

---

## 2. Pruebas Manuales Recomendadas
Aspectos que no pueden o no deben ser automatizados por completo y requieren verificación humana puntual.

1.  **Procesamiento Real de Pagos (Sandbox)**
    *   **Objetivo**: Verificar que la pasarela real procese la tarjeta.
    *   **Acción**: Usar manualmente la tarjeta de prueba (`4000...` o `5101...`) en el formulario de despliegue.
    *   **Verificación**: Comprobar en el Dashboard de PayPal/Stripe que la transacción llegó.

2.  **Verificación de Correo Electrónico**
    *   **Objetivo**: Confirmar entregabilidad.
    *   **Acción**: Revisar la bandeja de entrada del correo usado para confirmar recepción de emails de bienvenida.

3.  **Experiencia Móvil (Responsive)**
    *   **Objetivo**: Verificar maquetación.
    *   **Acción**: Abrir la web en un celular o usar las herramientas de desarrollador del navegador (F12) en modo móvil para asegurar que los menús y botones sean accesibles.
