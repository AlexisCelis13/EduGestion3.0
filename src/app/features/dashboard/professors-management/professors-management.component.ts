import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfessorService } from '../../../core/services/professor.service';
import { SupabaseService, Service } from '../../../core/services/supabase.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { Professor } from '../../../core/models/professor.model';

@Component({
  selector: 'app-professors-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './professors-management.component.html',
  styleUrls: ['./professors-management.component.css']
})
export class ProfessorsManagementComponent implements OnInit {
  professors: Professor[] = [];
  services: Service[] = [];
  isLoading = true;
  showModal = false;
  isSaving = false;
  canCreateProfessor = true;
  professorLimitMessage = '';
  
  professorForm: FormGroup;
  editingProfessorId: string | null = null;
  selectedServiceIds: Set<string> = new Set();
  
  constructor(
    private professorService: ProfessorService,
    private supabaseService: SupabaseService,
    private subscriptionService: SubscriptionService,
    private fb: FormBuilder
  ) {
    this.professorForm = this.fb.group({
      name: ['', Validators.required],
      specialty: [''],
      bio: [''],
      is_active: [true]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        const limitCheck = await this.subscriptionService.canAddProfessor(user.id);
        this.canCreateProfessor = limitCheck.allowed;
        this.professorLimitMessage = limitCheck.limit === null
          ? ''
          : `Tu plan actual permite ${limitCheck.limit} profesor${limitCheck.limit === 1 ? '' : 'es'} activo${limitCheck.limit === 1 ? '' : 's'}. Tienes ${limitCheck.current}/${limitCheck.limit}.`;

        // En SupabaseService de tu proyecto original, getServices REQUIERE que le pases el user.id
        // y opcionalmente si deseas incluir o no las inactivas, pasaremos true para ver todas en el formulario del profesor.
        const res = await this.supabaseService.getServices(user.id, true);
        this.services = res.data || [];
      }
      this.professors = await this.professorService.getProfessors();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  openNewProfessorModal() {
    if (!this.canCreateProfessor) {
      alert(this.professorLimitMessage || 'Tu plan actual no permite agregar más profesores.');
      return;
    }

    this.editingProfessorId = null;
    this.selectedServiceIds.clear();
    this.professorForm.reset({
      name: '',
      specialty: '',
      bio: '',
      is_active: true
    });
    this.showModal = true;
  }

  async openEditModal(professor: Professor) {
    this.editingProfessorId = professor.id;
    this.professorForm.patchValue({
      name: professor.name,
      specialty: professor.specialty || '',
      bio: professor.bio || '',
      is_active: professor.is_active
    });
    
    // Load assigned services
    try {
      this.isLoading = true;
      const { serviceIds } = await this.professorService.getProfessorWithServices(professor.id);
      this.selectedServiceIds = new Set(serviceIds);
    } catch (error) {
      console.error('Error loading professor services', error);
    } finally {
      this.isLoading = false;
    }
    
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  toggleServiceSeletion(serviceId: string) {
    if (this.selectedServiceIds.has(serviceId)) {
      this.selectedServiceIds.delete(serviceId);
    } else {
      this.selectedServiceIds.add(serviceId);
    }
  }

  async saveProfessor() {
    if (this.professorForm.invalid) return;

    this.isSaving = true;
    const formValue = this.professorForm.value;
    const serviceIdsArray = Array.from(this.selectedServiceIds);

    try {
      if (this.editingProfessorId) {
        await this.professorService.updateProfessor(this.editingProfessorId, formValue, serviceIdsArray);
      } else {
        await this.professorService.createProfessor(formValue, serviceIdsArray);
      }
      
      this.closeModal();
      await this.loadData(); // Tocar endpoint para refrescar
    } catch (error) {
      console.error('Error saving professor:', error);
      alert('Hubo un error al guardar el profesor.');
    } finally {
      this.isSaving = false;
    }
  }

  async toggleStatus(professor: Professor) {
    try {
      const newStatus = !professor.is_active;
      await this.professorService.toggleProfessorStatus(professor.id, newStatus);
      professor.is_active = newStatus;
    } catch (error) {
      console.error('Error toggling status', error);
    }
  }
}
