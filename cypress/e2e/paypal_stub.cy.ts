    // --- PASO 8: CONFIGURACIÓN ---
    cy.log('📍 REVISANDO CONFIGURACIÓN');
    cy.visit('/dashboard/settings');
    cy.contains('Configuración').should('exist');
    
    // Verificar que card de suscripción existe
    cy.contains('Tu Suscripción').should('exist'); // Título de la tarjeta

    // Verificar botón Cambiar Plan
    cy.contains('Cambiar Plan').should('exist').click();
    
    // Verificar que abre el modal y seleccionar Academia
    cy.contains('Selecciona el plan').should('exist'); 
    
    // Seleccionar plan Academia
    // Buscamos el div que contiene "Academia" y hacemos click en él
    cy.contains('Academia').click();
    
    // Confirmar cambio
    cy.contains('Confirmar Cambio').click();

    // --- NUEVO: Simulación de Pago ---
    // Según la captura, esto va a checkout o pasarela. Si el flujo es real,
    // podríamos intentar interactuar, pero PayPal en sandbox tiene iframes complejos.
    // El usuario pidió: "que pruebe paypal y las credenciales sean estas siempre"
    
    // Si la redirección es a una página interna nuestra de checkout primero:
    cy.wait(3000);
    cy.url().then(url => {
        if (url.includes('checkout')) {
            cy.log('📍 CHECKOUT PAGE DETECTADA');
            
            // Seleccionar PayPal si hay selector
            // cy.contains('PayPal').click();
            
            // Nota: La interacción real con el popup de PayPal dentro de Cypress
            // es extremadamente difícil y suele fallar por seguridad cross-origin.
            // Lo que haremos es verificar que llegamos al punto de pago.
            
            cy.log('⚠️ NOTA: La interacción automática con el popup de login de PayPal NO es soportada por Cypress debido a restricciones de seguridad de iframes cross-origin.');
            cy.log('El test verificará que se llega a la selección de método de pago.');
            
            cy.contains('PayPal').should('exist');
        }
    });

    // --- PASO 9: EDITOR DE LANDING ---
