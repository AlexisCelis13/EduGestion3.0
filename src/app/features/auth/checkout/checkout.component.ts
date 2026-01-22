import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {
  selectedPlan = signal('');
  selectedPrice = signal(0);
  loading = signal(false);

  // Helper para formatear precios en pesos mexicanos
  formatPrice(price: number): string {
    return price.toLocaleString('es-MX');
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.selectedPlan.set(params['plan'] || 'freelance');
      this.selectedPrice.set(parseInt(params['price']) || 399);
    });
  }

  async processPayment() {
    this.loading.set(true);

    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Actualizar el perfil del usuario con el plan seleccionado
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        await this.supabaseService.updateProfile(user.id, {
          subscription_plan: this.selectedPlan() as any,
          subscription_status: 'active'
        });
      }

      // Redirigir al onboarding
      this.router.navigate(['/dashboard/onboarding']);

    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      this.loading.set(false);
    }
  }
}