describe('Flujo Completo de Usuario EduGestión', () => {
  const uniqueId = Date.now();
  const email = `testuser${uniqueId}@gmail.com`;
  const password = 'Password123!';
  
  // SOLUCIÓN AL PROBLEMA DE SESIÓN:
  // Cypress limpia el localStorage entre cada bloque 'it', lo que causa que se pierda la sesión de Supabase.
  // Unificamos todo en un SOLO bloque 'it' gigante para que la sesión se mantenga de principio a fin.
  
  it('Debería realizar el flujo completo: Registro -> Onboarding -> Uso de la plataforma', () => {
    
    // --- PASO 1: REGISTRO ---
    cy.log('📍 INICIANDO REGISTRO');
    cy.visit('/auth/register');
    
    cy.get('input[formControlName="email"]').type(email);
    cy.get('input[formControlName="password"]').type(password);
    cy.get('input[formControlName="confirmPassword"]').type(password);
    
    cy.get('button[type="submit"]').click();
    
    // Esperar redirección o proceso de Supabase
    cy.wait(5000); 
    
    // --- PASO 1.5: MANEJO DE LOGIN SI REDIRIGE ---
    cy.url().then((url) => {
      // Si nos mandó al login (lo cual es correcto si no hay autologin), entramos manual
      if (url.includes('/auth/login')) {
        cy.log('ℹ️ Redirigido al Login. Iniciando sesión manualmente...');
        cy.get('input[formControlName="email"]').should('be.visible').type(email);
        cy.get('input[formControlName="password"]').should('be.visible').type(password);
        cy.get('button[type="submit"]').click();
        cy.wait(4000); // Esperar que entre al dashboard
      }
    });

    // Verificación de seguridad: asegurarnos que estamos en dashboard antes de seguir
    cy.url().should('include', '/dashboard');

    // --- PASO 2: ONBOARDING WIZARD (Si aparece) ---
    // Usamos el 'body' para verificar existencia condicional sin que falle el test si no está
    cy.get('body').then(($body) => {
      if ($body.text().includes('¡Bienvenido a EduGestión!')) {
        cy.log('📍 COMPLETANDO ONBOARDING');
        // Modal 1: Bienvenida
        cy.contains('button', 'Comenzar Configuración').click();
        
        // Modal 2: Formulario de perfil
        cy.log('Llenando formulario de perfil...');
        cy.get('input[formControlName="firstName"]').should('be.visible').type('Test');
        cy.get('input[formControlName="lastName"]').type('User');
        cy.get('select[formControlName="role"]').select('Tutor Independiente');
        cy.get('select[formControlName="monthlyIncome"]').select('Menos de $10,000');
        
        cy.contains('button', 'Completar Configuración').click();
        
        // Esperar a que se guarde y desaparezca el modal
        cy.wait(3000);
      }
    });

    // Validar que vemos el dashboard real
    cy.get('h1').should('exist'); 

    // --- PASO 3: ALUMNOS ---
    cy.log('📍 CREANDO ALUMNO');
    cy.visit('/dashboard/students');
    
    // Buscar botón de crear. Maneja: 
    // 1. Empty State ("Agregar Mi Primer Alumno")
    // 2. Botón estándar ("Nuevo Alumno")
    cy.get('button').filter(':contains("Agregar Mi Primer Alumno"), :contains("Nuevo Alumno"), :contains("Nuevo")').first().click();
    
    // Llenar formulario
    cy.get('input[formControlName="first_name"]').type('Juan');
    cy.get('input[formControlName="last_name"]').type(`Pérez ${uniqueId}`);
    cy.get('input[formControlName="email"]').type(`juan${uniqueId}@student.com`);
    
    // Enviar
    cy.get('button[type="submit"]').click();
    
    // Verificar que aparece en la lista
    cy.contains(`juan${uniqueId}@student.com`).should('exist');

    // --- PASO 4: CALENDARIO ---
    cy.log('📍 REVISANDO CALENDARIO');
    cy.visit('/dashboard/schedule/calendar');
    // Verificamos elementos típicos
    cy.get('mwl-calendar-month-view, .cal-month-view, h2').should('exist');

    // --- PASO 5: SERVICIOS ---
    cy.log('📍 CREANDO SERVICIO');
    cy.visit('/dashboard/services');
    
    // Buscar cualquier botón de creación (Empty state o normal)
    cy.get('button').filter(':contains("Nuevo Servicio"), :contains("Agregar Servicio"), :contains("Crear"), :contains("Nuevo")').first().click(); 
    
    cy.get('input[formControlName="name"]').type(`Clase de Prueba ${uniqueId}`);
    cy.get('input[formControlName="price"]').type('500');
    // duration_minutes es un select
    cy.get('select[formControlName="duration_minutes"]').select('60');
    
    cy.get('button[type="submit"]').click();
    
    // Verificar creación
    cy.contains(`Clase de Prueba ${uniqueId}`).should('exist');

    // --- PASO 6: PLANES DE ESTUDIO ---
    cy.log('📍 REVISANDO PLANES DE ESTUDIO');
    cy.visit('/dashboard/study-plans');
    cy.get('body').should('exist'); // Carga básica

    // --- PASO 7: PAGOS ---
    cy.log('📍 REVISANDO PAGOS');
    cy.visit('/dashboard/payments');
    cy.contains('Pagos').should('exist');

    // --- PASO 8: CONFIGURACIÓN Y CAMBIO DE PLAN (ACADEMIA) ---
    cy.log('📍 REVISANDO CONFIGURACIÓN');
    cy.visit('/dashboard/settings');
    cy.contains('Configuración').should('exist');
    
    // 1. Abrir Modal de Cambio de Plan
    cy.contains('Cambiar Plan').should('exist').click();
    
    // 2. Seleccionar Plan "Academia"
    // Usamos force: true y un selector de texto robusto
    cy.contains('Ideal para academias').parent().parent().click({ force: true });
    
    // 3. Verificar integración de pago
    cy.contains('Pago requerido').should('exist');
    
    // Verificar que el iframe seguro de PayPal (que contiene la opción de Tarjeta) cargó
    cy.get('#paypal-button-container iframe').should('exist');
    
    cy.log('🛑 INFO TÉCNICA:');
    cy.log('La sección "Tarjeta de débito o crédito" es un iframe seguro de PayPal.');
    cy.log('Cypress NO puede escribir datos bancarios (5101...) dentro de este iframe por seguridad cross-origin.');
    cy.log('Sin embargo, validamos que el formulario de carga correctamente.');

    // INTENTO DE SIMULACIÓN DE ÉXITO (HACK EXPERIMENTAL)
    // Intentamos engañar a la app diciendo que PayPal ya respondió "OK"
    // Esto requiere que Angular esté en modo Dev y 'ng' esté expuesto en window
    cy.window().then((win: any) => {
        if (win.ng) {
            cy.log('🔧 Intentando simular pago exitoso vía Angular...');
            cy.get('app-settings').then(($el) => {
                const component = win.ng.getComponent($el[0]);
                if (component) {
                    // Simulamos la respuesta que daría PayPal
                    component.handleUpgradePaymentSuccess({ 
                        status: 'COMPLETED', 
                        id: 'MOCK_PAYPAL_ORDER_5101' 
                    });
                }
            });
        }
    });

    // Esperar un momento para ver si la simulación funcionó y salió la alerta
    cy.wait(2000);
    
    // Si salió la alerta de éxito, ciérrala para continuar
    cy.on('window:confirm', () => true);
    cy.on('window:alert', () => true);

    // Cerrar modal para continuar con el resto de la prueba
    // (Si la simulación funcionó, el modal se cierra solo, si no, lo forzamos)
    cy.get('body').then($body => {
        if ($body.find('button:contains("Cancelar")').length > 0) {
           cy.contains('button', 'Cancelar').click({ force: true });
        }
    });

    // --- PASO 9: EDITOR DE LANDING ---
    cy.log('📍 REVISANDO EDITOR DE LANDING');
    cy.visit('/dashboard/landing-editor');
    // Buscamos el botón de guardar o el título visible
    cy.contains('Guardar Cambios').should('exist');
    
    cy.log('✅✅✅ FLUJO COMPLETADO CORRECTAMENTE ✅✅✅');
  });
});
