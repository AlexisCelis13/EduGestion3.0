import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, ChatMessage, GeneratedStudyPlan } from '../../../core/services/gemini.service';

type ChatStep = 'chatting' | 'generating' | 'plan_ready' | 'refining';

interface QuickReply {
    text: string;
    value: string;
}

@Component({
    selector: 'app-consultation-chatbot',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="chatbot-container flex flex-col h-[600px] bg-white rounded-2xl shadow-xl border border-surface-100 overflow-hidden">
      
      <!-- Header -->
      <div class="p-4 border-b border-surface-100 bg-gradient-to-r from-primary-600 to-primary-700">
        <div class="flex items-center gap-3">
          <button (click)="handleClose()" class="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white" title="Cerrar">
            ✕
          </button>
          <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
            ✨
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-white">Asistente de {{ tutorName }}</h3>
            <p class="text-sm text-white/80">{{ getStepSubtitle() }}</p>
          </div>
        </div>
      </div>

      <!-- Confirm Close Modal -->
      <div *ngIf="showCloseConfirm()" class="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl">
        <div class="bg-white rounded-xl p-6 m-4 max-w-sm shadow-2xl">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">¿Salir del chat?</h3>
          <p class="text-gray-600 mb-4">Se perderá todo el progreso de la conversación.</p>
          <div class="flex gap-3">
            <button 
              (click)="showCloseConfirm.set(false)"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button 
              (click)="confirmClose()"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Salir
            </button>
          </div>
        </div>
      </div>

      <!-- Chat Messages -->
      <div *ngIf="step() === 'chatting' || step() === 'generating'" 
           class="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50" 
           #chatContainer>
        
        @for (message of messages(); track $index) {
          <div class="flex gap-3" [class.flex-row-reverse]="message.role === 'user'">
            <!-- Avatar -->
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                 [class.bg-primary-100]="message.role === 'assistant'"
                 [class.bg-surface-200]="message.role === 'user'">
              <span class="text-sm">{{ message.role === 'assistant' ? '🤖' : '👤' }}</span>
            </div>
            
            <!-- Message Bubble -->
            <div class="max-w-[80%] p-3 rounded-2xl animate-fade-in"
                 [class.bg-white]="message.role === 'assistant'"
                 [class.border]="message.role === 'assistant'"
                 [class.border-surface-100]="message.role === 'assistant'"
                 [class.shadow-sm]="message.role === 'assistant'"
                 [class.bg-primary-600]="message.role === 'user'"
                 [class.text-white]="message.role === 'user'">
              <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
            </div>
          </div>
        }

        <!-- Typing Indicator -->
        <div *ngIf="isTyping()" class="flex gap-3">
          <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span class="text-sm">🤖</span>
          </div>
          <div class="bg-white border border-surface-100 p-3 rounded-2xl shadow-sm">
            <div class="flex gap-1">
              <span class="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
              <span class="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
              <span class="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
            </div>
          </div>
        </div>

        <!-- Generating Plan Indicator -->
        <div *ngIf="step() === 'generating'" class="flex flex-col items-center justify-center py-8">
          <div class="relative">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-3xl animate-pulse">
              ✨
            </div>
            <div class="absolute inset-0 w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
          <p class="mt-4 text-surface-600 font-medium">Generando tu plan de estudios personalizado...</p>
          <p class="text-sm text-surface-400">Esto puede tomar unos segundos ✨</p>
        </div>
      </div>

      <!-- Quick Replies (when available, hide input) -->
      <div *ngIf="quickReplies().length > 0 && step() === 'chatting'" class="px-4 py-3 border-t border-surface-100 bg-white">
        <p class="text-xs text-gray-500 mb-2 text-center">Selecciona una opción:</p>
        <div class="flex gap-2 flex-wrap justify-center">
          @for (reply of quickReplies(); track reply.value) {
            <button 
              (click)="selectQuickReply(reply)"
              class="px-4 py-2 text-sm bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors border border-primary-200 font-medium">
              {{ reply.text }}
            </button>
          }
        </div>
      </div>

      <!-- Input Area (only when NO quick replies) -->
      <div *ngIf="quickReplies().length === 0 && step() === 'chatting'" class="p-4 border-t border-surface-100 bg-white">
        <form (ngSubmit)="sendMessage()" class="flex gap-2">
          <input 
            type="text"
            [(ngModel)]="currentMessage"
            name="message"
            placeholder="Escribe tu mensaje..."
            class="flex-1 px-4 py-3 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            [disabled]="isTyping()">
          <button 
            type="submit"
            [disabled]="!currentMessage.trim() || isTyping()"
            class="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium">
            Enviar →
          </button>
        </form>
      </div>

      <!-- Plan Ready View -->
      <div *ngIf="step() === 'plan_ready' && generatedPlan()" class="flex-1 overflow-y-auto p-6 bg-surface-50">
        <div class="card-premium p-6 mb-4">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-xl font-bold text-surface-700">{{ generatedPlan()!.planTitle }}</h2>
              <p class="text-surface-500 mt-1">{{ generatedPlan()!.planDescription }}</p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-primary-600">{{ formatPrice(generatedPlan()!.estimatedPrice) }}</p>
              <p class="text-sm text-surface-400">{{ generatedPlan()!.recommendedSessions }} sesiones</p>
            </div>
          </div>

          <!-- Módulos -->
          <div class="space-y-3 mb-6">
            <h4 class="font-semibold text-surface-600 text-sm uppercase tracking-wider">📚 Contenido del Plan</h4>
            @for (module of generatedPlan()!.planContent; track module.module) {
              <div class="p-4 bg-surface-50 rounded-xl border border-surface-100">
                <div class="flex justify-between items-start mb-2">
                  <h5 class="font-semibold text-surface-700">{{ module.module }}</h5>
                  <span class="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                    {{ module.sessions }} sesión(es)
                  </span>
                </div>
                <p class="text-sm text-surface-500 mb-2">{{ module.description }}</p>
                <div class="flex flex-wrap gap-1">
                  @for (topic of module.topics; track topic) {
                    <span class="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded">{{ topic }}</span>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Detalles -->
          <div class="grid grid-cols-3 gap-4 p-4 bg-primary-50 rounded-xl mb-6">
            <div class="text-center">
              <p class="text-2xl font-bold text-primary-600">{{ generatedPlan()!.recommendedSessions }}</p>
              <p class="text-xs text-primary-700">Sesiones</p>
            </div>
            <div class="text-center border-x border-primary-100">
              <p class="text-2xl font-bold text-primary-600">{{ generatedPlan()!.sessionDurationMinutes }}</p>
              <p class="text-xs text-primary-700">Min/sesión</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-primary-600">{{ generatedPlan()!.totalHours }}h</p>
              <p class="text-xs text-primary-700">Total</p>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex gap-3">
            <button 
              (click)="requestChanges()"
              [disabled]="isSubmitting()"
              class="flex-1 px-4 py-3 border border-surface-200 text-surface-600 rounded-xl hover:bg-surface-50 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              🔄 Solicitar Cambios
            </button>
            <button 
              (click)="acceptPlan()"
              [disabled]="isSubmitting()"
              class="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center">
              <span *ngIf="isSubmitting()">⏳ Enviando...</span>
              <span *ngIf="!isSubmitting()">📤 Enviar al Asesor</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Refining View -->
      <div *ngIf="step() === 'refining'" class="flex-1 overflow-y-auto p-6 bg-surface-50">
        <div class="card-premium p-6">
          <h3 class="font-semibold text-surface-700 mb-4">¿Qué cambios te gustaría hacer?</h3>
          <textarea 
            [(ngModel)]="refineFeedback"
            rows="4"
            placeholder="Ej: Me gustaría más sesiones de práctica, menos teoría, enfocarme más en álgebra..."
            class="w-full px-4 py-3 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-4"></textarea>
          <div class="flex gap-3">
            <button 
              (click)="cancelRefine()"
              class="flex-1 px-4 py-3 border border-surface-200 text-surface-600 rounded-xl hover:bg-surface-50 transition-all">
              Cancelar
            </button>
            <button 
              (click)="submitRefinement()"
              [disabled]="!refineFeedback.trim() || isRefining()"
              class="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {{ isRefining() ? '⏳ Regenerando...' : '🔄 Regenerar Plan' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    :host {
      position: relative;
      display: block;
    }
  `]
})
export class ConsultationChatbotComponent implements OnInit {
    @Input() tutorId: string = '';
    @Input() tutorName: string = 'Tu Tutor';
    @Input() pricePerHour: number = 200;

    @Output() planAccepted = new EventEmitter<{
        plan: GeneratedStudyPlan;
        chatHistory: ChatMessage[];
        extractedData: any;
    }>();
    @Output() cancelled = new EventEmitter<void>();

    step = signal<ChatStep>('chatting');
    messages = signal<ChatMessage[]>([]);
    quickReplies = signal<QuickReply[]>([]);
    isTyping = signal(false);
    isRefining = signal(false);
    isSubmitting = signal(false);
    generatedPlan = signal<GeneratedStudyPlan | null>(null);
    showCloseConfirm = signal(false);

    currentMessage = '';
    refineFeedback = '';

    private conversationStage = 0;

    constructor(private geminiService: GeminiService) { }

    ngOnInit() {
        // Mensaje inicial del bot
        this.addBotMessage(
            `¡Hola! 👋 Soy el asistente de ${this.tutorName}. Estoy aquí para ayudarte a crear un plan de estudios personalizado.\n\n¿La asesoría es para ti o para alguien más (como un hijo/a)?`
        );

        this.quickReplies.set([
            { text: 'Para mí', value: 'me' },
            { text: 'Para mi hijo/a', value: 'other' }
        ]);
    }

    handleClose() {
        // Si hay progreso (más de 1 mensaje), mostrar confirmación
        if (this.messages().length > 1 || this.step() !== 'chatting') {
            this.showCloseConfirm.set(true);
        } else {
            this.cancelled.emit();
        }
    }

    confirmClose() {
        this.showCloseConfirm.set(false);
        this.cancelled.emit();
    }

    getStepSubtitle(): string {
        switch (this.step()) {
            case 'chatting': return 'Cuéntame sobre tus necesidades';
            case 'generating': return 'Preparando tu plan...';
            case 'plan_ready': return 'Tu plan personalizado';
            case 'refining': return 'Ajustando el plan';
            default: return '';
        }
    }

    async sendMessage() {
        if (!this.currentMessage.trim() || this.isTyping()) return;

        const userMessage = this.currentMessage.trim();
        this.currentMessage = '';
        this.quickReplies.set([]);

        // Agregar mensaje del usuario
        this.addUserMessage(userMessage);

        // Mostrar indicador de escritura
        this.isTyping.set(true);

        try {
            // Obtener respuesta de Gemini
            const response = await this.geminiService.getChatResponse(
                userMessage,
                this.messages(),
                this.tutorName
            );

            // Simular delay de escritura natural
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

            this.isTyping.set(false);

            // Verificar si se completó la recopilación de datos
            if (response.includes('[DATOS_COMPLETOS]')) {
                const cleanResponse = response.replace('[DATOS_COMPLETOS]', '').trim();
                this.addBotMessage(cleanResponse || '¡Perfecto! Ya tengo toda la información. Dame un momento mientras preparo tu plan de estudios personalizado... ✨');

                // Generar el plan
                await this.generatePlan();
            } else {
                this.addBotMessage(response);
                this.updateQuickReplies(response);
            }

        } catch (error) {
            console.error('Error in chat:', error);
            this.isTyping.set(false);
            this.addBotMessage('Lo siento, hubo un problema. ¿Puedes repetir tu mensaje?');
        }
    }

    selectQuickReply(reply: QuickReply) {
        this.currentMessage = reply.text;
        this.sendMessage();
    }

    private async generatePlan() {
        this.step.set('generating');

        try {
            // Extraer datos del chat
            const extractedData = await this.geminiService.extractDataFromChat(this.messages());

            // Generar plan
            const plan = await this.geminiService.generateStudyPlan({
                name: `${extractedData.studentFirstName} ${extractedData.studentLastName}`,
                academicLevel: extractedData.academicLevel,
                subjects: extractedData.subjects,
                specificTopics: extractedData.specificTopics,
                currentStruggles: extractedData.currentStruggles,
                learningGoals: extractedData.learningGoals
            }, this.pricePerHour);

            this.generatedPlan.set(plan);
            this.step.set('plan_ready');

        } catch (error) {
            console.error('Error generating plan:', error);
            this.step.set('chatting');
            this.addBotMessage('Hubo un problema generando el plan. ¿Puedes darme más detalles sobre las materias que necesitas reforzar?');
        }
    }

    requestChanges() {
        this.step.set('refining');
    }

    cancelRefine() {
        this.refineFeedback = '';
        this.step.set('plan_ready');
    }

    async submitRefinement() {
        if (!this.refineFeedback.trim() || !this.generatedPlan()) return;

        this.isRefining.set(true);

        try {
            const refinedPlan = await this.geminiService.refineStudyPlan(
                this.generatedPlan()!,
                this.refineFeedback,
                this.pricePerHour
            );

            this.generatedPlan.set(refinedPlan);
            this.refineFeedback = '';
            this.step.set('plan_ready');

        } catch (error) {
            console.error('Error refining plan:', error);
        } finally {
            this.isRefining.set(false);
        }
    }

    async acceptPlan() {
        if (!this.generatedPlan() || this.isSubmitting()) return;

        this.isSubmitting.set(true);

        // Extraer datos para pasar al siguiente paso
        const extractedData = await this.geminiService.extractDataFromChat(this.messages());

        this.planAccepted.emit({
            plan: this.generatedPlan()!,
            chatHistory: this.messages(),
            extractedData
        });
    }

    goBack() {
        if (this.step() === 'refining') {
            this.step.set('plan_ready');
        } else if (this.step() === 'plan_ready') {
            this.step.set('chatting');
        } else {
            this.cancelled.emit();
        }
    }

    private addUserMessage(content: string) {
        this.messages.update(msgs => [...msgs, {
            role: 'user',
            content,
            timestamp: new Date()
        }]);
    }

    private addBotMessage(content: string) {
        this.messages.update(msgs => [...msgs, {
            role: 'assistant',
            content,
            timestamp: new Date()
        }]);
    }

    private updateQuickReplies(response: string) {
        // Detectar contexto y ofrecer respuestas rápidas relevantes
        const lowerResponse = response.toLowerCase();

        if (lowerResponse.includes('nivel académico') || lowerResponse.includes('nivel de estudios') || lowerResponse.includes('grado')) {
            this.quickReplies.set([
                { text: 'Primaria', value: 'primaria' },
                { text: 'Secundaria', value: 'secundaria' },
                { text: 'Preparatoria', value: 'preparatoria' },
                { text: 'Universidad', value: 'universidad' }
            ]);
        } else if (lowerResponse.includes('objetivo') || lowerResponse.includes('meta') || lowerResponse.includes('lograr')) {
            this.quickReplies.set([
                { text: 'Pasar un examen', value: 'pasar_examen' },
                { text: 'Mejorar mi promedio', value: 'mejorar_promedio' },
                { text: 'Entender bien la materia', value: 'entender' },
                { text: 'Prepararme para admisión', value: 'admision' }
            ]);
        } else {
            // No hay quick replies, permitir escritura libre
            this.quickReplies.set([]);
        }
    }

    formatPrice(amount: number): string {
        return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    }
}
