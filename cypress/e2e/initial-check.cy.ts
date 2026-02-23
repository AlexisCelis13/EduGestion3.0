describe('Prueba de Carga Inicial', () => {
  it('Deber├¡a cargar la p├ígina de inicio correctamente', () => {
    // Visita la url base configurada en cypress.config.ts (localhost:4200)
    cy.visit('/');
    
    // Verifica que el t├¡tulo o un elemento principal exista
    // Ajusta este selector seg├║n el contenido real de tu landing page
    cy.get('body').should('exist');
    
    // Ejemplo: Verificar que la URL es la correcta
    cy.url().should('include', 'localhost');
  });

  it('Deber├¡a navegar a la p├ígina de login', () => {
    cy.visit('/auth/login');
    cy.url().should('include', '/auth/login');
  });
});
