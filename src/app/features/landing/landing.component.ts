import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, HostListener, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface PricingPlan {
  id: 'freelance' | 'academia';
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
}

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  // Noise-based drift
  noiseOffsetX: number;
  noiseOffsetY: number;
  noiseSpeed: number;
  // Damped velocity for mouse interaction
  vx: number;
  vy: number;
  // Twinkle
  twinkleSpeed: number;
  twinklePhase: number;
  // Color cycling phase
  colorPhase: number;
  colorSpeed: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-surface-50">
      <!-- Particle Canvas Background -->
      <canvas #particleCanvas class="particle-canvas"></canvas>

      <!-- Header with glassmorphism -->
      <header class="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div class="max-w-6xl mx-auto px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <img src="assets/LogoCompleto.png" class="h-10 cursor-pointer hover:opacity-80 transition-opacity" (click)="scrollToTop()">
            </div>
            <div class="flex items-center gap-4">
              <a routerLink="/auth/login" 
                 class="text-surface-700 hover:text-primary-600 font-medium text-sm">
                Iniciar Sesión
              </a>
              <a routerLink="/auth/register" class="btn-premium text-sm !py-2.5 !px-5">
                Comenzar Gratis
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="hero-fullscreen relative">
        <div class="max-w-6xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <h1 class="text-hero text-surface-700 mb-6">
            <span>{{ typedLine1() }}</span>
            <span class="text-gradient block">{{ typedLine2() }}</span>
            <span class="typewriter-cursor" [class.typing]="!typingDone()">|</span>
          </h1>
          <p class="text-subtitle text-surface-400 mb-10 max-w-2xl mx-auto hero-reveal"
             [class.revealed]="typingDone()">
            La plataforma todo-en-uno para academias y tutores independientes. 
            Gestiona alumnos, programa clases, recibe pagos y crea tu landing page profesional.
          </p>
          <div class="flex flex-col sm:flex-row justify-center gap-4 hero-reveal hero-reveal-delay"
               [class.revealed]="typingDone()">
            <a routerLink="/auth/register" class="btn-premium text-lg !py-4 !px-8">
              Comenzar Prueba Gratis
            </a>
            <button (click)="scrollToPlans()" class="btn-secondary text-lg !py-4 !px-8">
              Ver Planes
            </button>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section id="pricing-section" class="py-24 lg:py-32 relative z-10">
        <div class="max-w-6xl mx-auto px-6 lg:px-8">
          <!-- Header -->
          <div class="text-center mb-16">
            <h2 class="text-title text-surface-700 mb-4 scroll-reveal reveal-up">
              Elige el plan perfecto para ti
            </h2>
            <p class="text-subtitle text-surface-400 mb-4 scroll-reveal reveal-up" style="transition-delay:0.1s">
              Comienza con 14 días gratis. Cancela cuando quieras.
            </p>
            <div class="flex items-center justify-center gap-2 text-sm text-surface-500 bg-surface-50 inline-flex px-4 py-2 rounded-full border border-surface-200 scroll-reveal reveal-up" style="transition-delay:0.2s">
               <svg class="w-5 h-5 text-[#003087]" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M20.067 8.284c.642 4.606-2.583 8.358-8.24 8.358h-2.14l-1.026 6.551a.602.602 0 01-.595.507H4.558a.5.5 0 01-.497-.577l2.843-18.006a.8.8 0 01.789-.675h5.45c4.086 0 7.378 1.487 6.924 3.843z"/>
                 <path d="M7.076 21.337l.732-4.634h2.695c4.221 0 7.716-2.029 8.281-6.623.364-2.964-1.343-4.832-3.832-5.753-1.638-.606-3.805-.487-3.805-.487l-.46 2.87s1.396-.062 2.456.326c1.556.57 2.213 1.764 1.959 3.827-.406 3.328-3.085 4.098-5.368 4.098h-1.61L7.076 21.337z" fill="#009cde"/>
               </svg>
               Pagos seguros procesados por <strong>PayPal</strong>
            </div>
          </div>

          <!-- Pricing Cards -->
          <div class="grid lg:grid-cols-2 gap-8 max-w-3xl mx-auto">
            @for (plan of plans; track plan.id; let idx = $index) {
              <div class="card-premium p-8 hover-lift scroll-reveal"
                   [class.reveal-left]="idx === 0"
                   [class.reveal-right]="idx === 1"
                   [class.card-featured]="plan.popular"
                   [class.ring-2]="plan.popular"
                   [class.ring-primary-500]="plan.popular"
                   [style.transition-delay]="idx * 0.15 + 's'">
                @if (plan.popular) {
                  <div class="flex justify-center -mt-4 mb-4">
                    <span class="badge-premium">
                      Más Popular
                    </span>
                  </div>
                }
                <h3 class="text-xl font-semibold text-surface-700 text-center">
                  {{ plan.name }}
                </h3>
                <p class="mt-3 text-sm text-surface-400 text-center min-h-[40px]">
                  {{ plan.description }}
                </p>
                <p class="mt-6 text-center">
                  <span class="text-5xl font-semibold text-surface-700 tracking-tight">\${{ plan.price }}</span>
                  <span class="text-surface-400 ml-1">/{{ plan.period }}</span>
                </p>
                <button
                  (click)="selectPlan(plan)"
                  [class]="plan.popular 
                    ? 'btn-premium w-full mt-8' 
                    : 'btn-secondary w-full mt-8 border border-surface-200'">
                  Seleccionar Plan
                </button>
                <div class="mt-8 pt-8 border-t border-surface-100">
                  <h4 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-4">
                    Incluye:
                  </h4>
                  <ul class="space-y-3">
                    @for (feature of plan.features; track feature) {
                      <li class="flex items-start gap-3">
                        <svg class="flex-shrink-0 w-5 h-5 text-accent-green mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span class="text-sm text-surface-500">{{ feature }}</span>
                      </li>
                    }
                  </ul>
                </div>
              </div>
            }
          </div>

          <!-- Trust Indicators -->
          <div class="mt-16 flex flex-wrap justify-center gap-8 text-sm text-surface-400 scroll-reveal reveal-up" style="transition-delay:0.3s">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Pago seguro con PayPal</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>Soporte 24/7</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              <span>Garantía de 30 días</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="py-24 lg:py-32 bg-white relative z-10">
        <div class="max-w-6xl mx-auto px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-title text-surface-700 mb-4 scroll-reveal reveal-up">
              Todo lo que necesitas para hacer crecer tu academia
            </h2>
            <p class="text-subtitle text-surface-400 max-w-2xl mx-auto scroll-reveal reveal-up" style="transition-delay:0.1s">
              Herramientas profesionales diseñadas específicamente para educadores
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8 lg:gap-12">
            <!-- Feature 1 -->
            <div class="card-premium p-8 text-center hover-lift scroll-reveal reveal-left">
              <div class="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-surface-700 mb-3">Gestión de Alumnos</h3>
              <p class="text-surface-400 leading-relaxed">
                Organiza toda la información de tus estudiantes, historial académico y comunicación con padres.
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="card-premium p-8 text-center hover-lift scroll-reveal reveal-up" style="transition-delay:0.15s">
              <div class="w-16 h-16 bg-accent-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                  <path d="M12 18V6"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-surface-700 mb-3">Cobros Automáticos</h3>
              <p class="text-surface-400 leading-relaxed">
                Recibe pagos de forma segura con PayPal. Facturas automáticas y recordatorios de pago.
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="card-premium p-8 text-center hover-lift scroll-reveal reveal-right" style="transition-delay:0.3s">
              <div class="w-16 h-16 bg-accent-indigo/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg class="w-8 h-8 text-accent-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-surface-700 mb-3">Landing Page Propia</h3>
              <p class="text-surface-400 leading-relaxed">
                Crea tu página web profesional donde los alumnos pueden conocerte y agendar citas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-24 lg:py-32 bg-gradient-to-br from-primary-600 to-primary-700 relative z-10">
        <div class="max-w-4xl mx-auto text-center px-6 lg:px-8">
          <h2 class="text-display text-white mb-6 scroll-reveal reveal-up">
            ¿Listo para transformar tu academia?
          </h2>
          <p class="text-xl text-white/80 mb-10 max-w-2xl mx-auto scroll-reveal reveal-up" style="transition-delay:0.1s">
            Únete a cientos de educadores que ya confían en EduGestión
          </p>
          <a routerLink="/auth/register" 
             class="inline-block bg-white text-primary-600 px-10 py-4 rounded-full text-lg font-semibold hover:bg-surface-100 hover:scale-105 transition-all shadow-lg scroll-reveal reveal-up" style="transition-delay:0.2s">
            Comenzar Prueba Gratis — 14 días
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-surface-700 text-white py-16 relative z-10">
        <div class="max-w-6xl mx-auto px-6 lg:px-8">
          <div class="text-center scroll-reveal reveal-up">
            <h3 class="text-2xl font-semibold mb-4">EduGestión</h3>
            <p class="text-surface-300 text-sm">
              © 2024 EduGestión. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .particle-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }
    .hero-fullscreen {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: 4rem;
      padding-bottom: 4rem;
    }
    .typewriter-cursor {
      display: inline-block;
      font-weight: 300;
      color: #10b981;
      animation: none;
      margin-left: 2px;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .typewriter-cursor.typing {
      opacity: 1;
      animation: blink 0.6s step-end infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    .hero-reveal {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .hero-reveal.revealed {
      opacity: 1;
      transform: translateY(0);
    }
    .hero-reveal-delay {
      transition-delay: 0.2s;
    }
    /* Scroll Reveal System */
    .scroll-reveal {
      opacity: 0;
      transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: opacity, transform;
    }
    .scroll-reveal.reveal-up {
      transform: translateY(40px);
    }
    .scroll-reveal.reveal-left {
      transform: translateX(-40px);
    }
    .scroll-reveal.reveal-right {
      transform: translateX(40px);
    }
    .scroll-reveal:not(.reveal-up):not(.reveal-left):not(.reveal-right) {
      transform: translateY(30px);
    }
    .scroll-reveal.revealed {
      opacity: 1 !important;
      transform: translate(0, 0) !important;
    }
  `]
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('particleCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationFrameId: number = 0;
  private mouseX = -1000;
  private mouseY = -1000;
  private isAnimating = false;
  private readonly PARTICLE_COUNT = 180;
  private readonly MOUSE_RADIUS = 100;
  private readonly MOUSE_ATTRACT_RADIUS = 200;
  private readonly RETURN_SPEED = 0.02;
  private readonly DAMPING = 0.92;
  private scrollObserver!: IntersectionObserver;
  private time = 0;

  // Easter egg: apple contour
  private mouseStillTimer: any = null;
  private lastMouseX = -1000;
  private lastMouseY = -1000;
  private easterEggActive = false;
  private easterEggCenter = { x: 0, y: 0 };
  private readonly STILL_THRESHOLD = 5; // px movement tolerance
  private readonly STILL_DURATION = 10000; // 10 seconds
  private readonly APPLE_SIZE = 110; // px radius of the apple shape

  // Apple contour precisely traced from isotipo geometric description:
  // - Bilobed body, V-notch top, max width at 60% from base
  // - Stem at 105° (tilts slightly LEFT), 3:1 aspect
  // - Lanceolate leaf at 45° upper-right, anchored 1/3 up stem
  private appleContour: { x: number; y: number }[] = [
    // ═══ STEM (105° from horizontal → tilts slightly left) ═══
    { x: 0.00, y: -0.48 },  // base of notch
    { x: -0.02, y: -0.55 },
    { x: -0.04, y: -0.62 },
    { x: -0.06, y: -0.69 },
    { x: -0.08, y: -0.76 },
    { x: -0.09, y: -0.80 },  // rounded cap

    // ═══ LEAF (lanceolate, 45° into upper-right, at 1/3 up stem) ═══
    { x: -0.03, y: -0.64 },  // narrow insertion
    { x: 0.02, y: -0.68 },
    { x: 0.08, y: -0.74 },   // upper edge (higher tension)
    { x: 0.15, y: -0.80 },
    { x: 0.22, y: -0.85 },
    { x: 0.28, y: -0.88 },   // approach tip
    { x: 0.32, y: -0.89 },   // tip (rounded vertex)
    { x: 0.28, y: -0.84 },   // lower edge (more open radius)
    { x: 0.20, y: -0.78 },
    { x: 0.12, y: -0.72 },
    { x: 0.04, y: -0.66 },
    { x: -0.01, y: -0.63 },  // back to insertion

    // ═══ APPLE BODY ═══
    // — Top V-notch (inverted V with Bézier-smooth transition) —
    { x: -0.04, y: -0.42 },  // center of notch (lowest)
    { x: 0.00, y: -0.40 },   // deepest point
    { x: 0.04, y: -0.42 },

    // — Right shoulder (lobe rising, peaks at 1/4 width from axis) —
    { x: 0.10, y: -0.45 },
    { x: 0.18, y: -0.48 },
    { x: 0.25, y: -0.50 },   // shoulder peak (1/4 width)
    { x: 0.34, y: -0.49 },
    { x: 0.44, y: -0.46 },

    // — Right flank (large-radius convex, widening) —
    { x: 0.55, y: -0.40 },
    { x: 0.66, y: -0.30 },
    { x: 0.76, y: -0.18 },
    { x: 0.84, y: -0.05 },

    // — Right max width (at ~60% from base, y ≈ -0.05) —
    { x: 0.88, y: 0.00 },
    { x: 0.90, y: 0.06 },    // widest point
    { x: 0.88, y: 0.14 },

    // — Right lower curve —
    { x: 0.84, y: 0.24 },
    { x: 0.76, y: 0.34 },
    { x: 0.66, y: 0.42 },
    { x: 0.54, y: 0.48 },

    // — Bottom-right, approaching base support —
    { x: 0.40, y: 0.53 },
    { x: 0.28, y: 0.56 },
    { x: 0.18, y: 0.55 },    // right "support"

    // — Base (concave center, two supports) —
    { x: 0.10, y: 0.52 },
    { x: 0.05, y: 0.48 },    // concave dip approaching center
    { x: 0.00, y: 0.46 },    // center (slightly concave/flat)
    { x: -0.05, y: 0.48 },
    { x: -0.10, y: 0.52 },

    // — Bottom-left support —
    { x: -0.18, y: 0.55 },   // left "support"
    { x: -0.28, y: 0.56 },
    { x: -0.40, y: 0.53 },

    // — Left lower curve —
    { x: -0.54, y: 0.48 },
    { x: -0.66, y: 0.42 },
    { x: -0.76, y: 0.34 },
    { x: -0.84, y: 0.24 },

    // — Left max width (mirror) —
    { x: -0.88, y: 0.14 },
    { x: -0.90, y: 0.06 },   // widest point
    { x: -0.88, y: 0.00 },

    // — Left flank —
    { x: -0.84, y: -0.05 },
    { x: -0.76, y: -0.18 },
    { x: -0.66, y: -0.30 },
    { x: -0.55, y: -0.40 },

    // — Left shoulder —
    { x: -0.44, y: -0.46 },
    { x: -0.34, y: -0.49 },
    { x: -0.25, y: -0.50 },  // shoulder peak
    { x: -0.18, y: -0.48 },
    { x: -0.10, y: -0.45 },
  ];

  // Colors are dynamically generated via red↔green cycling

  plans: PricingPlan[] = [
    {
      id: 'freelance',
      name: 'Freelance',
      price: 199,
      period: 'mes',
      description: 'Perfecto para tutores independientes',
      features: [
        'Hasta 50 alumnos',
        'Landing page personalizada',
        'Gestión de citas',
        'Pagos con PayPal',
        'Soporte por email'
      ]
    },
    {
      id: 'academia',
      name: 'Academia',
      price: 299,
      period: 'mes',
      description: 'Ideal para academias pequeñas y medianas',
      features: [
        'Hasta 200 alumnos',
        'Múltiples profesores',
        'Landing page personalizada',
        'Gestión avanzada de citas',
        'Pagos con PayPal',
        'Reportes y estadísticas',
        'Soporte prioritario'
      ],
      popular: true
    }
  ];

  // Typewriter animation
  typedLine1 = signal('');
  typedLine2 = signal('');
  typingDone = signal(false);
  private typewriterTimeout: any;

  constructor(private router: Router, private ngZone: NgZone) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initCanvas();
    this.createParticles();
    this.startAnimation();
    this.startTypewriter();
    this.initScrollReveal();
  }

  ngOnDestroy(): void {
    this.stopAnimation();
    if (this.typewriterTimeout) clearTimeout(this.typewriterTimeout);
    if (this.mouseStillTimer) clearTimeout(this.mouseStillTimer);
    if (this.scrollObserver) this.scrollObserver.disconnect();
  }

  private initScrollReveal(): void {
    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        } else {
          entry.target.classList.remove('revealed');
        }
      });
    }, { threshold: 0.15 });

    // Observe after a tick so Angular has rendered the DOM
    setTimeout(() => {
      const elements = document.querySelectorAll('.scroll-reveal');
      elements.forEach(el => this.scrollObserver.observe(el));
    });
  }

  private startTypewriter(): void {
    const line1 = 'Gestiona tu Academia';
    const line2 = 'de Forma Inteligente';
    const speed = 50; // ms per character
    let i = 0;
    let j = 0;

    const typeLine1 = () => {
      if (i <= line1.length) {
        this.typedLine1.set(line1.substring(0, i));
        i++;
        this.typewriterTimeout = setTimeout(typeLine1, speed);
      } else {
        typeLine2Step();
      }
    };

    const typeLine2Step = () => {
      if (j <= line2.length) {
        this.typedLine2.set(line2.substring(0, j));
        j++;
        this.typewriterTimeout = setTimeout(typeLine2Step, speed);
      } else {
        // Typing complete — reveal subtitle and buttons
        setTimeout(() => this.typingDone.set(true), 200);
      }
    };

    // Small initial delay before typing starts
    this.typewriterTimeout = setTimeout(typeLine1, 400);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
    this.createParticles();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const newX = event.clientX;
    const newY = event.clientY;
    const moved = Math.abs(newX - this.lastMouseX) + Math.abs(newY - this.lastMouseY);

    this.mouseX = newX;
    this.mouseY = newY;

    if (moved > this.STILL_THRESHOLD) {
      // Mouse moved significantly — reset stillness timer
      this.lastMouseX = newX;
      this.lastMouseY = newY;
      this.resetStillTimer();

      if (this.easterEggActive) {
        this.deactivateEasterEgg();
      }
    }
  }

  @HostListener('document:mouseleave')
  onMouseLeave(): void {
    this.mouseX = -1000;
    this.mouseY = -1000;
    this.resetStillTimer();
    if (this.easterEggActive) {
      this.deactivateEasterEgg();
    }
  }

  private resetStillTimer(): void {
    if (this.mouseStillTimer) {
      clearTimeout(this.mouseStillTimer);
      this.mouseStillTimer = null;
    }
    // Start new timer
    if (this.mouseX > 0 && this.mouseY > 0) {
      this.mouseStillTimer = setTimeout(() => {
        this.activateEasterEgg();
      }, this.STILL_DURATION);
    }
  }

  private activateEasterEgg(): void {
    this.easterEggActive = true;
    this.easterEggCenter = { x: this.mouseX, y: this.mouseY };

    // Assign contour target to the closest particles
    const contourTargets = this.appleContour.map(p => ({
      x: this.easterEggCenter.x + p.x * this.APPLE_SIZE,
      y: this.easterEggCenter.y + p.y * this.APPLE_SIZE
    }));

    // For each contour point, find the nearest available particle
    const used = new Set<number>();
    for (const target of contourTargets) {
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < this.particles.length; i++) {
        if (used.has(i)) continue;
        const dx = this.particles[i].x - target.x;
        const dy = this.particles[i].y - target.y;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0) {
        (this.particles[bestIdx] as any).easterTarget = target;
        used.add(bestIdx);
      }
    }
  }

  private deactivateEasterEgg(): void {
    this.easterEggActive = false;
    for (const p of this.particles) {
      delete (p as any).easterTarget;
    }
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private createParticles(): void {
    this.particles = [];
    const canvas = this.canvasRef.nativeElement;
    const cols = Math.ceil(Math.sqrt(this.PARTICLE_COUNT * (canvas.width / canvas.height)));
    const rows = Math.ceil(this.PARTICLE_COUNT / cols);
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    let count = 0;
    for (let row = 0; row < rows && count < this.PARTICLE_COUNT; row++) {
      for (let col = 0; col < cols && count < this.PARTICLE_COUNT; col++) {
        // Grid position with jitter
        const jitterX = (Math.random() - 0.5) * cellW * 0.7;
        const jitterY = (Math.random() - 0.5) * cellH * 0.7;
        const x = cellW * (col + 0.5) + jitterX;
        const y = cellH * (row + 0.5) + jitterY;
        const size = Math.random() * 2 + 1.5; // 1.5 - 3.5px
        const baseAlpha = Math.random() * 0.4 + 0.5; // 0.5 - 0.9

        this.particles.push({
          x, y,
          originX: x,
          originY: y,
          size,
          color: '',
          alpha: baseAlpha,
          baseAlpha,
          noiseOffsetX: Math.random() * 1000,
          noiseOffsetY: Math.random() * 1000,
          noiseSpeed: Math.random() * 0.003 + 0.001,
          vx: 0,
          vy: 0,
          twinkleSpeed: Math.random() * 0.025 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
          colorPhase: Math.random() * Math.PI * 2,
          colorSpeed: Math.random() * 0.008 + 0.004
        });
        count++;
      }
    }
  }

  // Simple pseudo-noise function (smooth randomness)
  private noise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  }

  private smoothNoise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    // Smoothstep
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const n00 = this.noise(ix, iy);
    const n10 = this.noise(ix + 1, iy);
    const n01 = this.noise(ix, iy + 1);
    const n11 = this.noise(ix + 1, iy + 1);
    const nx0 = n00 + sx * (n10 - n00);
    const nx1 = n01 + sx * (n11 - n01);
    return nx0 + sy * (nx1 - nx0);
  }

  private startAnimation(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        if (!this.isAnimating) return;
        this.time += 0.016;

        const canvas = this.canvasRef.nativeElement;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const p of this.particles) {
          // Color cycling: red ↔ green
          p.colorPhase += p.colorSpeed;
          const t = (Math.sin(p.colorPhase) + 1) / 2; // 0..1
          // Interpolate hue: 0 (red) → 145 (green)
          const hue = Math.round(t * 145);
          const saturation = 70 + Math.round((1 - t) * 15); // slightly more saturated on red
          const lightness = 50 + Math.round(t * 10); // slightly lighter on green
          p.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

          // Twinkle
          p.twinklePhase += p.twinkleSpeed;
          p.alpha = p.baseAlpha + Math.sin(p.twinklePhase) * 0.15;
          p.alpha = Math.max(0.3, Math.min(0.95, p.alpha));

          // Noise-based drift (organic perlin-like movement)
          const noiseX = this.smoothNoise(p.noiseOffsetX + this.time * 0.3, p.noiseOffsetY);
          const noiseY = this.smoothNoise(p.noiseOffsetX, p.noiseOffsetY + this.time * 0.3);
          const driftX = noiseX * 4; // max 4px drift
          const driftY = noiseY * 4;
          const targetX = p.originX + driftX;
          const targetY = p.originY + driftY;

          // Mouse interaction (damped)
          const dx = this.mouseX - p.x;
          const dy = this.mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < this.MOUSE_RADIUS && dist > 0) {
            // Gentle repulsion
            const force = (1 - dist / this.MOUSE_RADIUS) * 1.5;
            const angle = Math.atan2(dy, dx);
            p.vx -= Math.cos(angle) * force;
            p.vy -= Math.sin(angle) * force;
          } else if (dist < this.MOUSE_ATTRACT_RADIUS && dist > 0) {
            // Very subtle attraction
            const force = (1 - dist / this.MOUSE_ATTRACT_RADIUS) * 0.15;
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * force;
            p.vy += Math.sin(angle) * force;
          }

          // Apply damping to velocity
          p.vx *= this.DAMPING;
          p.vy *= this.DAMPING;

          // Easter egg: override target if this particle has a contour assignment
          const eTarget = (p as any).easterTarget;
          if (eTarget) {
            // Smoothly move toward the apple contour point
            p.x += (eTarget.x - p.x) * 0.06;
            p.y += (eTarget.y - p.y) * 0.06;
            p.vx *= 0.5; // heavy damping during formation
            p.vy *= 0.5;
          } else {
            // Normal: move towards noise target + velocity
            p.x += (targetX - p.x) * this.RETURN_SPEED + p.vx;
            p.y += (targetY - p.y) * this.RETURN_SPEED + p.vy;
          }

          // Draw
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          // color is already HSL string, apply alpha
          const [h, s, l] = p.color.match(/\d+/g)!.map(Number);
          this.ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${p.alpha})`;
          this.ctx.fill();
        }

        this.animationFrameId = requestAnimationFrame(animate);
      };

      animate();
    });
  }

  private stopAnimation(): void {
    this.isAnimating = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  scrollToPlans(): void {
    const element = document.getElementById('pricing-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectPlan(plan: PricingPlan): void {
    this.router.navigate(['/auth/register'], {
      queryParams: { plan: plan.id, price: plan.price }
    });
  }
}