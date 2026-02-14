describe('Prueba de Carga Inicial', () => {
  it('Debería cargar la página de inicio correctamente', () => {
    // Visita la url base configurada en cypress.config.ts (localhost:4200)
    cy.visit('/');
    
    // Verifica que el título o un elemento principal exista
    // Ajusta este selector según el contenido real de tu landing page
    cy.get('body').should('exist');
    
    // Ejemplo: Verificar que la URL es la correcta
    cy.url().should('include', 'localhost');
  });

  it('Debería navegar a la página de login', () => {
    cy.visit('/auth/login');
    cy.url().should('include', '/auth/login');
  });
});
