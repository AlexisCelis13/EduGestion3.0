import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService, TenantSettings } from '../../../core/services/supabase.service';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
}

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-landing.component.html'
})
export class PublicLandingComponent implements OnInit {
  settings = signal<TenantSettings | null>(null);
  services = signal<Service[]>([]);
  loading = signal(true);
  notFound = signal(false);
  slug = signal('');

  // Helper para formatear precios en pesos mexicanos
  formatPrice(price: number): string {
    return price.toLocaleString('es-MX');
  }

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    this.route.params.subscribe(async params => {
      this.slug.set(params['slug']);
      await this.loadLandingData();
    });
  }

  private async loadLandingData() {
    try {
      const slug = this.slug();
      
      // Cargar configuración del tenant
      const tenantSettings = await this.supabaseService.getTenantSettingsBySlug(slug);
      
      if (!tenantSettings) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }

      this.settings.set(tenantSettings);

      // Cargar servicios del usuario
      const { data: services } = await this.supabaseService.getServices(tenantSettings.user_id);
      if (services) {
        this.services.set(services);
      }

    } catch (error) {
      console.error('Error loading landing data:', error);
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  getDisplayName(): string {
    const settings = this.settings();
    if (!settings) return '';
    
    // Usar el nombre de la empresa si existe, sino usar el slug formateado
    if (settings.slug) {
      return settings.slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    return 'Mi Academia';
  }
}