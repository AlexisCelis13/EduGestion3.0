import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div class="flex items-center">
              <h1 class="text-2xl font-bold text-gray-900">EduGestión</h1>
            </div>
            <div class="flex items-center space-x-4">
              <a routerLink="/auth/login" class="text-gray-600 hover:text-gray-900">Iniciar Sesión</a>
              <a routerLink="/auth/register" 
                 class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Comenzar Prueba Gratis
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 class="text-5xl font-bold text-gray-900 mb-6">
            Gestiona tu Academia de Forma
            <span class="text-blue-600">Inteligente</span>
          </h1>
          <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            La plataforma todo-en-uno para academias y tutores independientes. 
            Gestiona alumnos, programa clases, recibe pagos y crea tu landing page profesional.
          </p>
          <div class="flex justify-center space-x-4">
            <a routerLink="/auth/register" 
               class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Comenzar Prueba Gratis
            </a>
            <a routerLink="/auth/pricing" class="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors cursor-pointer">
              Ver Planes
            </a>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para hacer crecer tu academia
            </h2>
            <p class="text-lg text-gray-600">
              Herramientas profesionales diseñadas específicamente para educadores
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <!-- Feature 1 -->
            <div class="text-center p-6">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Gestión de Alumnos</h3>
              <p class="text-gray-600">
                Organiza toda la información de tus estudiantes, historial académico y comunicación con padres.
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="text-center p-6">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Cobros Automáticos</h3>
              <p class="text-gray-600">
                Recibe pagos de forma segura con Stripe. Facturas automáticas y recordatorios de pago.
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="text-center p-6">
              <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Landing Page Propia</h3>
              <p class="text-gray-600">
                Crea tu página web profesional donde los alumnos pueden conocerte y agendar citas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-20 bg-blue-600">
        <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 class="text-3xl font-bold text-white mb-4">
            ¿Listo para transformar tu academia?
          </h2>
          <p class="text-xl text-blue-100 mb-8">
            Únete a cientos de educadores que ya confían en EduGestión
          </p>
          <a routerLink="/auth/register" 
             class="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
            Comenzar Prueba Gratis - 14 días
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <h3 class="text-2xl font-bold mb-4">EduGestión</h3>
            <p class="text-gray-400">
              © 2024 EduGestión. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class LandingComponent { }