import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    LucideAngularModule,
    HelpCircle,
    Mail,
    MessageCircle,
    BookOpen,
    Video,
    ChevronDown,
    ChevronUp,
    Send,
    CheckCircle,
    AlertCircle
} from 'lucide-angular';
import { SupabaseService } from '../../core/services/supabase.service';

interface FAQ {
    question: string;
    answer: string;
    isOpen: boolean;
}

@Component({
    selector: 'app-support',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    template: `
    <div class="min-h-screen pb-12">
      <!-- Header Section -->
      <div class="bg-gradient-to-r from-primary-900 to-primary-800 border-b border-primary-700/50 text-white pb-16 pt-10 px-6 lg:px-8 relative overflow-hidden">
        <!-- Background decoration -->
        <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div class="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"></div>
          <div class="absolute bottom-0 left-10 w-64 h-64 bg-accent-blue/20 rounded-full blur-3xl"></div>
        </div>

        <div class="max-w-5xl mx-auto relative z-10 text-center">
          <div class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
            <i-lucide [img]="HelpCircle" class="w-8 h-8 text-white"></i-lucide>
          </div>
          <h1 class="text-4xl font-bold mb-4">¿Cómo podemos ayudarte hoy?</h1>
          <p class="text-primary-100/80 text-lg max-w-2xl mx-auto">
            Encuentra respuestas rápidas en nuestras preguntas frecuentes, revisa los tutoriales en video, o contacta directo con el equipo de soporte de EduGestion.
          </p>
        </div>
      </div>

      <div class="max-w-5xl mx-auto px-6 lg:px-8 -mt-8 relative z-20">
        <!-- Quick Action Cards -->
        <div class="grid md:grid-cols-3 gap-6 mb-12">
          <!-- Card 1 -->
          <div class="card-premium p-6 hover-lift cursor-pointer flex flex-col items-center text-center group" (click)="scrollToTab('faq')">
            <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300">
              <i-lucide [img]="BookOpen" class="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300"></i-lucide>
            </div>
            <h3 class="font-bold text-surface-800 mb-2">Guías y FAQs</h3>
            <p class="text-sm text-surface-500">Respuestas rápidas a las preguntas más comunes de los tutores.</p>
          </div>

          <!-- Card 2 -->
          <div class="card-premium p-6 hover-lift cursor-pointer flex flex-col items-center text-center group">
            <div class="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors duration-300">
              <i-lucide [img]="Video" class="w-7 h-7 text-purple-600 group-hover:text-white transition-colors duration-300"></i-lucide>
            </div>
            <h3 class="font-bold text-surface-800 mb-2">Video Tutoriales</h3>
            <p class="text-sm text-surface-500">Aprende a usar la plataforma paso a paso con nuestros videos cortos.</p>
          </div>

          <!-- Card 3 -->
          <div class="card-premium p-6 hover-lift cursor-pointer flex flex-col items-center text-center group" (click)="scrollToTab('contact')">
            <div class="w-14 h-14 bg-accent-green/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-accent-green transition-colors duration-300">
              <i-lucide [img]="MessageCircle" class="w-7 h-7 text-accent-green group-hover:text-white transition-colors duration-300"></i-lucide>
            </div>
            <h3 class="font-bold text-surface-800 mb-2">Contáctanos</h3>
            <p class="text-sm text-surface-500">¿Tienes un problema específico? Escríbenos y te ayudaremos.</p>
          </div>
        </div>

        <div class="grid lg:grid-cols-5 gap-8">
          <!-- Main Content Area -->
          <div class="lg:col-span-3 space-y-8">
            
            <!-- FAQs Section -->
            <div id="faq" class="card-premium p-8">
              <div class="flex items-center gap-3 mb-6 pb-4 border-b border-surface-100">
                <i-lucide [img]="HelpCircle" class="w-6 h-6 text-primary-600"></i-lucide>
                <h2 class="text-xl font-bold text-surface-800">Preguntas Frecuentes</h2>
              </div>
              
              <div class="space-y-4">
                <div *ngFor="let faq of faqs; let i = index" class="border border-surface-200 rounded-xl overflow-hidden transition-all duration-200" [class.border-primary-300]="faq.isOpen" [class.shadow-md]="faq.isOpen">
                  <button (click)="toggleFaq(i)" class="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-surface-50 transition-colors">
                    <span class="font-medium text-surface-800" [class.text-primary-700]="faq.isOpen">{{ faq.question }}</span>
                    <i-lucide [img]="faq.isOpen ? ChevronUp : ChevronDown" class="w-5 h-5 text-surface-400" [class.text-primary-500]="faq.isOpen"></i-lucide>
                  </button>
                  <div *ngIf="faq.isOpen" class="p-4 pt-0 text-surface-600 text-sm bg-white leading-relaxed border-t border-surface-100 mt-2">
                    {{ faq.answer }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar Area -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Contact Form -->
            <div id="contact" class="card-premium p-6">
              <h3 class="font-bold text-surface-800 mb-2">Enviar Mensaje a Soporte</h3>
              <p class="text-sm text-surface-500 mb-6">Te responderemos al correo asociado a tu cuenta a la brevedad posible.</p>

              <div *ngIf="messageSent()" class="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col items-center text-center animate-fade-in mb-4">
                <i-lucide [img]="CheckCircle" class="w-10 h-10 text-green-500 mb-2"></i-lucide>
                <h4 class="font-bold text-green-800">¡Mensaje Enviado!</h4>
                <p class="text-sm text-green-700 mt-1">Nuestro equipo se pondrá en contacto contigo muy pronto.</p>
                <button (click)="resetForm()" class="mt-4 text-sm font-medium text-green-800 hover:text-green-900 underline">Enviar otro mensaje</button>
              </div>

              <form *ngIf="!messageSent()" (ngSubmit)="sendMessage()" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-1">Categoría del problema</label>
                  <select [(ngModel)]="contactCategory" name="category" class="w-full px-4 py-3 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-surface-50">
                    <option value="billing">Pagos e Ingresos</option>
                    <option value="technical">Problema Técnico o Bug</option>
                    <option value="account">Mi Cuenta y Perfil</option>
                    <option value="students">Gestión de Alumnos</option>
                    <option value="other">Otro asunto</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-surface-700 mb-1">Descripción detallada</label>
                  <textarea [(ngModel)]="contactMessage" name="message" rows="4" placeholder="Explica tu problema o duda con la mayor cantidad de detalles posibles..." class="w-full px-4 py-3 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-surface-50 resize-none"></textarea>
                </div>

                <div *ngIf="errorMessage()" class="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                   <i-lucide [img]="AlertCircle" class="w-4 h-4 mt-0.5 shrink-0"></i-lucide>
                   <span>{{ errorMessage() }}</span>
                </div>

                <button type="submit" [disabled]="isSubmitting() || !contactMessage" class="w-full py-3 px-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <span *ngIf="isSubmitting()" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <i-lucide *ngIf="!isSubmitting()" [img]="Send" class="w-4 h-4"></i-lucide>
                  {{ isSubmitting() ? 'Enviando...' : 'Enviar Mensaje' }}
                </button>
              </form>
            </div>

            <!-- System Status -->
            <div class="card-premium p-6">
              <h3 class="font-bold text-surface-800 mb-4 pb-3 border-b border-surface-100">Estado del Sistema</h3>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span class="text-sm font-medium text-surface-700">Plataforma Principal</span>
                  </div>
                  <span class="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-md border border-green-100">Operacional</span>
                </div>
                
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                     <div class="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span class="text-sm font-medium text-surface-700">Pasarela de Pagos</span>
                  </div>
                  <span class="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-md border border-green-100">Operacional</span>
                </div>
                
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                     <div class="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span class="text-sm font-medium text-surface-700">Envío de Correos</span>
                  </div>
                  <span class="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-md border border-green-100">Operacional</span>
                </div>
              </div>
              
              <div class="mt-6 pt-4 border-t border-surface-100 text-center">
                <p class="text-xs text-surface-400">EduGestion App Version 3.0.0</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .animate-spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SupportComponent {
    // Icons
    HelpCircle = HelpCircle;
    Video = Video;
    BookOpen = BookOpen;
    MessageCircle = MessageCircle;
    Mail = Mail;
    ChevronDown = ChevronDown;
    ChevronUp = ChevronUp;
    Send = Send;
    CheckCircle = CheckCircle;
    AlertCircle = AlertCircle;

    // Form State
    contactCategory = 'technical';
    contactMessage = '';
    isSubmitting = signal(false);
    messageSent = signal(false);
    errorMessage = signal('');

    // FAQs Data
    faqs: FAQ[] = [
        {
            question: '¿Cómo recibo el dinero de mis clases?',
            answer: 'Para poder recibir los pagos de tus estudiantes debes ir a la sección de "Pagos" en el menú principal y vincular tu cuenta bancaria o PayPal. Una vez hecho esto, los ingresos por cada clase que los estudiantes reserven se abonarán a tu saldo y se procesarán automáticamente.',
            isOpen: true
        },
        {
            question: '¿Dónde veo mi Landing Page pública?',
            answer: 'Tu perfil público se encuentra en "Mi Landing Page". Ahí puedes personalizar los colores, subir tu foto de perfil, añadir tu bio y configurar la visibilidad general. Al guardar, verás el enlace público en la parte superior que podrás compartir con tus estudiantes.',
            isOpen: false
        },
        {
            question: '¿Qué pasa si un alumno cancela una clase?',
            answer: 'Si un estudiante cancela la clase dentro del periodo de tiempo permitido (usualmente 24 horas antes del inicio), en tu panel aparecerá la alerta de cancelación. Si ya se había cobrado, se puede realizar el reembolso dependiendo de tus propias políticas o agendar otra clase.',
            isOpen: false
        },
        {
            question: '¿Puedo bloquear días libres o vacaciones?',
            answer: 'Sí. Dentro del módulo "Horarios", puedes ir a la pestaña "Excepciones" y añadir un bloqueo completo para un día o especificar un rango de días en donde los alumnos no podrán reservar clases, sin necesidad de modificar tu horario habitual de la semana.',
            isOpen: false
        },
        {
            question: '¿Cómo sugiero más clases a un alumno?',
            answer: 'Ve a la lista de "Alumnos", entra a los detalles del estudiante puntual y usa la opción de Mandar Feedback. En el formulario, selecciona "Sugerir nuevas clases", elige un paquete y el servicio de origen. Al estudiante le llegará un aviso en su portal para pagar y confirmar los nuevos horarios con un solo click.',
            isOpen: false
        }
    ];

    constructor(private supabaseService: SupabaseService) { }

    toggleFaq(index: number) {
        this.faqs[index].isOpen = !this.faqs[index].isOpen;
    }

    scrollToTab(id: string) {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    resetForm() {
        this.messageSent.set(false);
        this.contactMessage = '';
        this.errorMessage.set('');
    }

    async sendMessage() {
        if (!this.contactMessage.trim()) return;

        this.isSubmitting.set(true);
        this.errorMessage.set('');

        try {
            const user = await this.supabaseService.getCurrentUser();

            if (!user) {
                this.errorMessage.set('Debes iniciar sesión para enviar un mensaje.');
                this.isSubmitting.set(false);
                return;
            }

            // Simulate network request to send support email logic
            // Ideally, there should be an RPC or an insert into a `support_tickets` table here.
            await new Promise(resolve => setTimeout(resolve, 1500));

            this.messageSent.set(true);

        } catch (err: any) {
            console.error(err);
            this.errorMessage.set(err.message || 'Hubo un error al enviar tu mensaje. Intenta de nuevo.');
        } finally {
            this.isSubmitting.set(false);
        }
    }
}
