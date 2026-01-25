import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  category: string;
  is_active: boolean;
}

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './services-list.component.html'
})
export class ServicesListComponent implements OnInit {
  services = signal<Service[]>([]);
  showCreateForm = signal(false);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  serviceForm: FormGroup;

  // Edit mode
  editingService = signal<Service | null>(null);
  showDeleteConfirm = signal<string | null>(null);

  // Helper para formatear precios en pesos mexicanos
  formatPrice(price: number): string {
    return price.toLocaleString('es-MX');
  }

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {
    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: ['', [Validators.required, Validators.min(0)]],
      duration_minutes: [60, Validators.required],
      category: ['']
    });
  }

  async ngOnInit() {
    await this.loadServices();
  }

  private async loadServices() {
    const user = await this.supabaseService.getCurrentUser();
    if (user) {
      const { data, error } = await this.supabaseService.getServices(user.id);
      if (data) {
        this.services.set(data);
      }
    }
  }

  async createService() {
    if (this.serviceForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      try {
        const user = await this.supabaseService.getCurrentUser();
        if (!user) {
          this.errorMessage.set('Error de autenticación');
          return;
        }

        const formData = this.serviceForm.value;
        const serviceData = {
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          duration_minutes: parseInt(formData.duration_minutes),
          category: formData.category,
          is_active: true
        };

        const { error } = await this.supabaseService.createService(serviceData);

        if (error) {
          this.errorMessage.set('Error al crear el servicio');
          return;
        }

        // Marcar paso de onboarding como completado
        await this.supabaseService.updateOnboardingStep(user.id, 'first-service', true);

        // Recargar servicios y cerrar formulario
        await this.loadServices();
        this.cancelCreate();
        this.showSuccess('Servicio creado correctamente');

      } catch (error: any) {
        this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
      } finally {
        this.loading.set(false);
      }
    }
  }

  cancelCreate() {
    this.showCreateForm.set(false);
    this.editingService.set(null);
    this.serviceForm.reset({
      duration_minutes: 60
    });
    this.errorMessage.set('');
  }

  // Edit methods
  startEdit(service: Service) {
    this.editingService.set(service);
    this.showCreateForm.set(true);
    this.serviceForm.patchValue({
      name: service.name,
      description: service.description || '',
      price: service.price,
      duration_minutes: service.duration_minutes,
      category: service.category || ''
    });
  }

  async saveEdit() {
    if (this.serviceForm.valid && this.editingService()) {
      this.loading.set(true);
      this.errorMessage.set('');

      try {
        const formData = this.serviceForm.value;
        const updates = {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          duration_minutes: parseInt(formData.duration_minutes),
          category: formData.category
        };

        const { error } = await this.supabaseService.updateService(
          this.editingService()!.id,
          updates
        );

        if (error) {
          this.errorMessage.set('Error al actualizar el servicio');
          return;
        }

        await this.loadServices();
        this.cancelCreate();
        this.showSuccess('Servicio actualizado correctamente');

      } catch (error: any) {
        this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
      } finally {
        this.loading.set(false);
      }
    }
  }

  // Delete methods
  confirmDelete(serviceId: string) {
    this.showDeleteConfirm.set(serviceId);
  }

  cancelDelete() {
    this.showDeleteConfirm.set(null);
  }

  async deleteService(serviceId: string) {
    this.loading.set(true);

    try {
      const { error } = await this.supabaseService.deleteService(serviceId);

      if (error) {
        this.errorMessage.set('Error al eliminar el servicio');
        return;
      }

      await this.loadServices();
      this.showDeleteConfirm.set(null);
      this.showSuccess('Servicio eliminado correctamente');

    } catch (error: any) {
      this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 3000);
  }
}