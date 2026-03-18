import { Component, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { RouterModule } from '@angular/router';

interface Particle {
  x: number; y: number;
  originX: number; originY: number;
  size: number; color: string; alpha: number; baseAlpha: number;
  noiseOffsetX: number; noiseOffsetY: number; noiseSpeed: number;
  vx: number; vy: number;
  twinkleSpeed: number; twinklePhase: number;
  colorPhase: number; colorSpeed: number;
}

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-page">
      <!-- Particle Canvas Background -->
      <canvas #particleCanvas class="particle-canvas"></canvas>

      <!-- Logo -->
      <div class="fixed top-0 left-0 p-6 lg:p-8 z-50 animate-slide-down">
        <a routerLink="/" class="block hover:opacity-80 transition-opacity">
          <img src="assets/LogoCompleto.png" alt="EduGestión" class="h-8 lg:h-10">
        </a>
      </div>

      <!-- Center Content -->
      <div class="login-content">
        <!-- Logo Icon -->
        <div class="animate-pop" style="animation-delay: 0.2s">
          <img src="assets/Icono.png" alt="EduGestión" class="h-14 w-auto mx-auto mb-6 drop-shadow-lg">
        </div>

        <!-- Title -->
        <h2 class="animate-slide-up text-center text-4xl font-extrabold text-white mb-3" style="animation-delay: 0.35s">
          Portal de Alumno
        </h2>
        <p class="animate-slide-up text-center text-sm text-gray-400 font-medium mb-8" style="animation-delay: 0.45s">
          Ingresa tu correo para recibir un enlace de acceso
        </p>

        <!-- Glass Card Form -->
        <div class="animate-slide-up glass-card" style="animation-delay: 0.55s">
          @if (successMessage()) {
            <div class="rounded-xl bg-green-500/15 border border-green-500/30 p-4 mb-6 animate-pop">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-semibold text-green-300">¡Enlace enviado!</h3>
                  <p class="mt-1 text-sm text-green-400/80">{{ successMessage() }}</p>
                </div>
              </div>
            </div>
            <div class="text-center">
              <button (click)="successMessage.set('')" class="text-primary-400 hover:text-primary-300 font-medium text-sm transition-colors">
                Intentar con otro correo
              </button>
            </div>
          } @else {
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-300 mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  formControlName="email"
                  class="login-input"
                  placeholder="ejemplo&#64;correo.com"
                />
                @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                  <p class="mt-2 text-sm text-red-400">Por favor ingresa un correo válido</p>
                }
              </div>

              @if (errorMessage()) {
                <div class="rounded-xl bg-red-500/15 border border-red-500/30 p-4 animate-pop">
                  <div class="flex">
                    <svg class="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                    <div class="ml-3">
                      <p class="text-sm text-red-300">{{ errorMessage() }}</p>
                    </div>
                  </div>
                </div>
              }

              <button
                type="submit"
                [disabled]="loginForm.invalid || loading()"
                class="login-button"
              >
                @if (loading()) {
                  <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando enlace...
                } @else {
                  Enviar Enlace de Acceso
                }
              </button>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: #0a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      position: relative;
      overflow: hidden;
    }

    .particle-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    .login-content {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 420px;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1.25rem;
      padding: 2rem;
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.04),
        0 8px 32px rgba(0, 0, 0, 0.4),
        0 24px 64px rgba(0, 0, 0, 0.2);
    }

    .login-input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      color: #f5f5f7;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      outline: none;
    }
    .login-input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
    .login-input:focus {
      border-color: #48C9B0;
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 0 0 3px rgba(72, 201, 176, 0.15);
    }

    .login-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #48C9B0, #36a893);
      color: white;
      font-weight: 600;
      font-size: 0.9375rem;
      border-radius: 0.75rem;
      border: none;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 14px rgba(72, 201, 176, 0.3);
    }
    .login-button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(72, 201, 176, 0.4);
    }
    .login-button:active:not(:disabled) {
      transform: scale(0.98);
    }
    .login-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Entrance animations */
    .animate-slide-up {
      opacity: 0;
      transform: translateY(20px);
      animation: slideUp 0.6s ease forwards;
    }
    .animate-slide-down {
      opacity: 0;
      transform: translateY(-20px);
      animation: slideDown 0.5s ease forwards;
    }
    .animate-pop {
      opacity: 0;
      transform: scale(0.8);
      animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes slideUp {
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideDown {
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes popIn {
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class StudentLoginComponent implements AfterViewInit, OnDestroy {
  @ViewChild('particleCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  loginForm: FormGroup;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationFrameId: number = 0;
  private mouseX = -1000;
  private mouseY = -1000;
  private isAnimating = false;
  private time = 0;
  private readonly PARTICLE_COUNT = 120;
  private readonly MOUSE_RADIUS = 90;
  private readonly RETURN_SPEED = 0.02;
  private readonly DAMPING = 0.92;

  // Easter egg: apple contour
  private mouseStillTimer: any = null;
  private lastMouseX = -1000;
  private lastMouseY = -1000;
  private easterEggActive = false;
  private easterEggCenter = { x: 0, y: 0 };
  private readonly STILL_THRESHOLD = 5;
  private readonly STILL_DURATION = 10000;
  private readonly APPLE_SIZE = 110;

  private appleContour: { x: number; y: number }[] = [
    { x: 0.00, y: -0.48 }, { x: -0.02, y: -0.55 }, { x: -0.04, y: -0.62 },
    { x: -0.06, y: -0.69 }, { x: -0.08, y: -0.76 }, { x: -0.09, y: -0.80 },
    { x: -0.03, y: -0.64 }, { x: 0.02, y: -0.68 }, { x: 0.08, y: -0.74 },
    { x: 0.15, y: -0.80 }, { x: 0.22, y: -0.85 }, { x: 0.28, y: -0.88 },
    { x: 0.32, y: -0.89 }, { x: 0.28, y: -0.84 }, { x: 0.20, y: -0.78 },
    { x: 0.12, y: -0.72 }, { x: 0.04, y: -0.66 }, { x: -0.01, y: -0.63 },
    { x: -0.04, y: -0.42 }, { x: 0.00, y: -0.40 }, { x: 0.04, y: -0.42 },
    { x: 0.10, y: -0.45 }, { x: 0.18, y: -0.48 }, { x: 0.25, y: -0.50 },
    { x: 0.34, y: -0.49 }, { x: 0.44, y: -0.46 }, { x: 0.55, y: -0.40 },
    { x: 0.66, y: -0.30 }, { x: 0.76, y: -0.18 }, { x: 0.84, y: -0.05 },
    { x: 0.88, y: 0.00 },  { x: 0.90, y: 0.06 },  { x: 0.88, y: 0.14 },
    { x: 0.84, y: 0.24 },  { x: 0.76, y: 0.34 },  { x: 0.66, y: 0.42 },
    { x: 0.54, y: 0.48 },  { x: 0.40, y: 0.53 },  { x: 0.28, y: 0.56 },
    { x: 0.18, y: 0.55 },  { x: 0.10, y: 0.52 },  { x: 0.05, y: 0.48 },
    { x: 0.00, y: 0.46 },  { x: -0.05, y: 0.48 }, { x: -0.10, y: 0.52 },
    { x: -0.18, y: 0.55 }, { x: -0.28, y: 0.56 }, { x: -0.40, y: 0.53 },
    { x: -0.54, y: 0.48 }, { x: -0.66, y: 0.42 }, { x: -0.76, y: 0.34 },
    { x: -0.84, y: 0.24 }, { x: -0.88, y: 0.14 }, { x: -0.90, y: 0.06 },
    { x: -0.88, y: 0.00 }, { x: -0.84, y: -0.05 },{ x: -0.76, y: -0.18 },
    { x: -0.66, y: -0.30 },{ x: -0.55, y: -0.40 },{ x: -0.44, y: -0.46 },
    { x: -0.34, y: -0.49 },{ x: -0.25, y: -0.50 },{ x: -0.18, y: -0.48 },
    { x: -0.10, y: -0.45 },
  ];

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngAfterViewInit() {
    this.initCanvas();
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();
    this.createParticles();
    this.startAnimation();

    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMoveHandler);
    window.addEventListener('mouseleave', this.onMouseLeaveHandler);
  }

  private onResize = () => {
    this.resizeCanvas();
    this.createParticles();
  };

  private onMouseMoveHandler = (e: MouseEvent) => {
    const newX = e.clientX;
    const newY = e.clientY;
    const moved = Math.abs(newX - this.lastMouseX) + Math.abs(newY - this.lastMouseY);

    this.mouseX = newX;
    this.mouseY = newY;

    if (moved > this.STILL_THRESHOLD) {
      this.lastMouseX = newX;
      this.lastMouseY = newY;
      this.resetStillTimer();
      if (this.easterEggActive) this.deactivateEasterEgg();
    }
  };

  private onMouseLeaveHandler = () => {
    this.mouseX = -1000;
    this.mouseY = -1000;
    this.resetStillTimer();
    if (this.easterEggActive) this.deactivateEasterEgg();
  };

  private resetStillTimer(): void {
    if (this.mouseStillTimer) { clearTimeout(this.mouseStillTimer); this.mouseStillTimer = null; }
    if (this.mouseX > 0 && this.mouseY > 0) {
      this.mouseStillTimer = setTimeout(() => this.activateEasterEgg(), this.STILL_DURATION);
    }
  }

  private activateEasterEgg(): void {
    this.easterEggActive = true;
    this.easterEggCenter = { x: this.mouseX, y: this.mouseY };
    const contourTargets = this.appleContour.map(p => ({
      x: this.easterEggCenter.x + p.x * this.APPLE_SIZE,
      y: this.easterEggCenter.y + p.y * this.APPLE_SIZE
    }));
    const used = new Set<number>();
    for (const target of contourTargets) {
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < this.particles.length; i++) {
        if (used.has(i)) continue;
        const dx = this.particles[i].x - target.x;
        const dy = this.particles[i].y - target.y;
        const d = dx * dx + dy * dy;
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      if (bestIdx >= 0) {
        (this.particles[bestIdx] as any).easterTarget = target;
        used.add(bestIdx);
      }
    }
  }

  private deactivateEasterEgg(): void {
    this.easterEggActive = false;
    for (const p of this.particles) delete (p as any).easterTarget;
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
        const jitterX = (Math.random() - 0.5) * cellW * 0.7;
        const jitterY = (Math.random() - 0.5) * cellH * 0.7;
        const x = cellW * (col + 0.5) + jitterX;
        const y = cellH * (row + 0.5) + jitterY;
        const size = Math.random() * 2 + 1.5;
        const baseAlpha = Math.random() * 0.4 + 0.5;

        this.particles.push({
          x, y,
          originX: x, originY: y,
          size, color: '',
          alpha: baseAlpha, baseAlpha,
          noiseOffsetX: Math.random() * 1000,
          noiseOffsetY: Math.random() * 1000,
          noiseSpeed: Math.random() * 0.003 + 0.001,
          vx: 0, vy: 0,
          twinkleSpeed: Math.random() * 0.025 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
          colorPhase: Math.random() * Math.PI * 2,
          colorSpeed: Math.random() * 0.008 + 0.004
        });
        count++;
      }
    }
  }

  private noise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  }

  private smoothNoise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const n00 = this.noise(ix, iy);
    const n10 = this.noise(ix + 1, iy);
    const n01 = this.noise(ix, iy + 1);
    const n11 = this.noise(ix + 1, iy + 1);
    const nx0 = n00 + (n10 - n00) * sx;
    const nx1 = n01 + (n11 - n01) * sx;
    return nx0 + (nx1 - nx0) * sy;
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
          // Color cycling: red ↔ green (same as landing page)
          p.colorPhase += p.colorSpeed;
          const t = (Math.sin(p.colorPhase) + 1) / 2;
          const hue = Math.round(t * 145);
          const saturation = 70 + Math.round((1 - t) * 15);
          const lightness = 50 + Math.round(t * 10);
          p.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

          // Twinkle
          p.twinklePhase += p.twinkleSpeed;
          p.alpha = p.baseAlpha + Math.sin(p.twinklePhase) * 0.15;
          p.alpha = Math.max(0.3, Math.min(0.95, p.alpha));

          // Noise drift
          const noiseX = this.smoothNoise(p.noiseOffsetX + this.time * 0.3, p.noiseOffsetY);
          const noiseY = this.smoothNoise(p.noiseOffsetX, p.noiseOffsetY + this.time * 0.3);
          const targetX = p.originX + noiseX * 4;
          const targetY = p.originY + noiseY * 4;

          // Mouse repulsion
          const dx = this.mouseX - p.x;
          const dy = this.mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < this.MOUSE_RADIUS && dist > 0) {
            const force = (1 - dist / this.MOUSE_RADIUS) * 1.5;
            const angle = Math.atan2(dy, dx);
            p.vx -= Math.cos(angle) * force;
            p.vy -= Math.sin(angle) * force;
          }

          p.vx *= this.DAMPING;
          p.vy *= this.DAMPING;

          p.vx += (targetX - p.x) * this.RETURN_SPEED;
          p.vy += (targetY - p.y) * this.RETURN_SPEED;

          p.x += p.vx;
          p.y += p.vy;

          // Easter egg: override target if particle has a contour assignment
          const eTarget = (p as any).easterTarget;
          if (eTarget) {
            p.x += (eTarget.x - p.x) * 0.06;
            p.y += (eTarget.y - p.y) * 0.06;
            p.vx *= 0.5;
            p.vy *= 0.5;
          }

          // Draw
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          const [h, s, l] = p.color.match(/\d+/g)!.map(Number);
          this.ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${p.alpha})`;
          this.ctx.fill();
        }
        this.animationFrameId = requestAnimationFrame(animate);
      };

      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      const { email } = this.loginForm.value;

      try {
        const { data, error } = await this.supabaseService.sendMagicLink(email);

        if (error) {
          throw error;
        }

        this.successMessage.set(`Hemos enviado un enlace de acceso a ${email}. Revisa tu bandeja de entrada (y la carpeta de spam por si acaso). El enlace expira en 15 minutos.`);
        this.loginForm.reset();
      } catch (error: any) {
        console.error('Error sending magic link:', error);
        let detailedError = 'Hubo un error al enviar el enlace. Por favor intenta de nuevo.';
        if (error instanceof Error) {
          detailedError += ` Detalle: ${error.message} `;
          const errAny = error as any;
          if (errAny && errAny.context instanceof Response && !errAny.context.bodyUsed) {
            errAny.context.json().then((body: any) => {
              console.error('Edge Function Error Body:', body);
              if (body.error) {
                this.errorMessage.set(`Error: ${body.error} `);
              }
            }).catch((parsingErr: any) => {
              console.error('Error parsing error body:', parsingErr);
            });
          } else if (errAny && errAny.context instanceof Response && errAny.context.bodyUsed) {
            console.log('Response body already read, cannot extract detailed error.');
          }
        }
        this.errorMessage.set(detailedError);
      } finally {
        this.loading.set(false);
      }
    }
  }

  ngOnDestroy() {
    this.isAnimating = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.mouseStillTimer) clearTimeout(this.mouseStillTimer);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMoveHandler);
    window.removeEventListener('mouseleave', this.onMouseLeaveHandler);
  }
}
