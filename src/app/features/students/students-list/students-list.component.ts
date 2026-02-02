import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService, Student, StudentFeedback, StudentMaterial } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-students-list',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './students-list.component.html'
})
export class StudentsListComponent implements OnInit {
    students = signal<Student[]>([]);
    showCreateForm = signal(false);
    loading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');
    studentForm: FormGroup;

    // Edit mode
    editingStudent = signal<Student | null>(null);
    showDeleteConfirm = signal<string | null>(null);

    // Feedback modal
    showFeedbackModal = signal(false);
    selectedStudentForFeedback = signal<Student | null>(null);
    feedbackForm: FormGroup;
    studentFeedback = signal<StudentFeedback[]>([]);
    loadingFeedback = signal(false);

    // Material modal
    showMaterialModal = signal(false);
    selectedStudentForMaterial = signal<Student | null>(null);
    materialForm: FormGroup;
    studentMaterials = signal<StudentMaterial[]>([]);
    loadingMaterials = signal(false);
    selectedFile = signal<File | null>(null);
    uploadProgress = signal(false);

    // Student detail view
    showStudentDetail = signal(false);
    selectedStudent = signal<Student | null>(null);

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService
    ) {
        this.studentForm = this.fb.group({
            first_name: ['', Validators.required],
            last_name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            date_of_birth: [''],
            parent_name: [''],
            parent_email: [''],
            parent_phone: [''],
            notes: ['']
        });

        this.feedbackForm = this.fb.group({
            message: ['', Validators.required]
        });

        this.materialForm = this.fb.group({
            title: ['', Validators.required],
            type: ['file', Validators.required],
            url: [''],
            description: ['']
        });
    }

    async ngOnInit() {
        await this.loadStudents();
    }

    private async loadStudents() {
        const user = await this.supabaseService.getCurrentUser();
        if (user) {
            const { data, error } = await this.supabaseService.getStudents(user.id);
            if (data) {
                this.students.set(data);
            }
        }
    }

    async createStudent() {
        if (this.studentForm.valid) {
            this.loading.set(true);
            this.errorMessage.set('');

            try {
                const user = await this.supabaseService.getCurrentUser();
                if (!user) {
                    this.errorMessage.set('Error de autenticación');
                    return;
                }

                const formData = this.studentForm.value;
                const studentData = {
                    user_id: user.id,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone || null,
                    date_of_birth: formData.date_of_birth || null,
                    parent_name: formData.parent_name || null,
                    parent_email: formData.parent_email || null,
                    parent_phone: formData.parent_phone || null,
                    notes: formData.notes || null,
                    is_active: true
                };

                const { error } = await this.supabaseService.createStudent(studentData);

                if (error) {
                    this.errorMessage.set('Error al crear el alumno');
                    return;
                }

                await this.loadStudents();
                this.cancelCreate();
                this.showSuccess('Alumno creado correctamente');

            } catch (error: any) {
                this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
            } finally {
                this.loading.set(false);
            }
        }
    }

    cancelCreate() {
        this.showCreateForm.set(false);
        this.editingStudent.set(null);
        this.studentForm.reset();
        this.errorMessage.set('');
    }

    // Edit methods
    startEdit(student: Student) {
        this.editingStudent.set(student);
        this.showCreateForm.set(true);
        this.studentForm.patchValue({
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email,
            phone: student.phone || '',
            date_of_birth: student.date_of_birth || '',
            parent_name: student.parent_name || '',
            parent_email: student.parent_email || '',
            parent_phone: student.parent_phone || '',
            notes: student.notes || ''
        });
    }

    async saveEdit() {
        if (this.studentForm.valid && this.editingStudent()) {
            this.loading.set(true);
            this.errorMessage.set('');

            try {
                const formData = this.studentForm.value;
                const updates = {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone || null,
                    date_of_birth: formData.date_of_birth || null,
                    parent_name: formData.parent_name || null,
                    parent_email: formData.parent_email || null,
                    parent_phone: formData.parent_phone || null,
                    notes: formData.notes || null
                };

                const { error } = await this.supabaseService.updateStudent(
                    this.editingStudent()!.id,
                    updates
                );

                if (error) {
                    this.errorMessage.set('Error al actualizar el alumno');
                    return;
                }

                await this.loadStudents();
                this.cancelCreate();
                this.showSuccess('Alumno actualizado correctamente');

            } catch (error: any) {
                this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
            } finally {
                this.loading.set(false);
            }
        }
    }

    // Delete methods
    confirmDelete(studentId: string) {
        this.showDeleteConfirm.set(studentId);
    }

    cancelDelete() {
        this.showDeleteConfirm.set(null);
    }

    async deleteStudent(studentId: string) {
        this.loading.set(true);

        try {
            const { error } = await this.supabaseService.deleteStudent(studentId);

            if (error) {
                this.errorMessage.set('Error al eliminar el alumno');
                return;
            }

            await this.loadStudents();
            this.showDeleteConfirm.set(null);
            this.showSuccess('Alumno eliminado correctamente');

        } catch (error: any) {
            this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
        } finally {
            this.loading.set(false);
        }
    }

    // Student Detail
    async viewStudent(student: Student) {
        this.selectedStudent.set(student);
        this.showStudentDetail.set(true);
        await this.loadStudentFeedbackAndMaterials(student.id);
    }

    closeStudentDetail() {
        this.showStudentDetail.set(false);
        this.selectedStudent.set(null);
        this.studentFeedback.set([]);
        this.studentMaterials.set([]);
    }

    private async loadStudentFeedbackAndMaterials(studentId: string) {
        this.loadingFeedback.set(true);
        this.loadingMaterials.set(true);

        const { data: feedback } = await this.supabaseService.getStudentFeedback(studentId);
        if (feedback) {
            this.studentFeedback.set(feedback);
        }
        this.loadingFeedback.set(false);

        const { data: materials } = await this.supabaseService.getStudentMaterials(studentId);
        if (materials) {
            this.studentMaterials.set(materials);
        }
        this.loadingMaterials.set(false);
    }

    // Feedback methods
    openFeedbackModal(student: Student) {
        this.selectedStudentForFeedback.set(student);
        this.showFeedbackModal.set(true);
        this.feedbackForm.reset();
    }

    closeFeedbackModal() {
        this.showFeedbackModal.set(false);
        this.selectedStudentForFeedback.set(null);
        this.feedbackForm.reset();
    }

    async sendFeedback() {
        if (this.feedbackForm.valid && this.selectedStudentForFeedback()) {
            this.loading.set(true);
            this.errorMessage.set('');

            try {
                const user = await this.supabaseService.getCurrentUser();
                if (!user) {
                    this.errorMessage.set('Error de autenticación');
                    return;
                }

                // Save student ID before closing modal
                const studentId = this.selectedStudentForFeedback()!.id;
                const shouldReloadDetail = this.selectedStudent()?.id === studentId;

                const { error } = await this.supabaseService.createFeedback({
                    user_id: user.id,
                    student_id: studentId,
                    message: this.feedbackForm.value.message
                });

                if (error) {
                    this.errorMessage.set('Error al enviar el feedback');
                    return;
                }

                this.closeFeedbackModal();
                this.showSuccess('Feedback enviado correctamente');

                // Reload if detail view is open
                if (shouldReloadDetail) {
                    await this.loadStudentFeedbackAndMaterials(studentId);
                }

            } catch (error: any) {
                this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
            } finally {
                this.loading.set(false);
            }
        }
    }

    // Material methods
    openMaterialModal(student: Student) {
        this.selectedStudentForMaterial.set(student);
        this.showMaterialModal.set(true);
        this.materialForm.reset({ type: 'link' });
    }

    closeMaterialModal() {
        this.showMaterialModal.set(false);
        this.selectedStudentForMaterial.set(null);
        this.materialForm.reset({ type: 'file' });
        this.selectedFile.set(null);
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                this.errorMessage.set('Solo se permiten archivos PDF y Word');
                return;
            }
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                this.errorMessage.set('El archivo no puede superar los 10MB');
                return;
            }
            this.selectedFile.set(file);
            // Auto-fill title if empty
            if (!this.materialForm.get('title')?.value) {
                this.materialForm.patchValue({ title: file.name.replace(/\.[^/.]+$/, '') });
            }
        }
    }

    getFileTypeFromMime(file: File): 'pdf' | 'doc' {
        if (file.type === 'application/pdf') return 'pdf';
        return 'doc';
    }

    async sendMaterial() {
        if (this.selectedStudentForMaterial()) {
            const formData = this.materialForm.value;
            const materialType = formData.type;

            // Validate based on type
            if (materialType === 'link' && !formData.url) {
                this.errorMessage.set('Por favor ingresa una URL');
                return;
            }
            if (materialType === 'file' && !this.selectedFile()) {
                this.errorMessage.set('Por favor selecciona un archivo');
                return;
            }
            if (!formData.title) {
                this.errorMessage.set('Por favor ingresa un título');
                return;
            }

            this.loading.set(true);
            this.uploadProgress.set(true);
            this.errorMessage.set('');

            try {
                const user = await this.supabaseService.getCurrentUser();
                if (!user) {
                    this.errorMessage.set('Error de autenticación');
                    return;
                }

                // Save student ID before closing modal
                const studentId = this.selectedStudentForMaterial()!.id;
                const shouldReloadDetail = this.selectedStudent()?.id === studentId;

                let url = formData.url;
                let type: 'pdf' | 'doc' | 'link' = 'link';

                // If file type, upload the file first
                if (materialType === 'file' && this.selectedFile()) {
                    const uploadedUrl = await this.supabaseService.uploadStudentMaterial(
                        user.id,
                        studentId,
                        this.selectedFile()!
                    );

                    if (!uploadedUrl) {
                        this.errorMessage.set('Error al subir el archivo. Verifica que el bucket esté configurado.');
                        return;
                    }
                    url = uploadedUrl;
                    type = this.getFileTypeFromMime(this.selectedFile()!);
                }

                const { error } = await this.supabaseService.createMaterial({
                    user_id: user.id,
                    student_id: studentId,
                    title: formData.title,
                    type: type,
                    url: url,
                    description: formData.description || null
                });

                if (error) {
                    console.error('Error creating material:', error);
                    this.errorMessage.set('Error al guardar el material: ' + (error.message || 'Error desconocido'));
                    return;
                }

                this.closeMaterialModal();
                this.showSuccess('Material enviado correctamente');

                // Reload if detail view is open
                if (shouldReloadDetail) {
                    await this.loadStudentFeedbackAndMaterials(studentId);
                }

            } catch (error: any) {
                this.errorMessage.set('Error inesperado. Inténtalo de nuevo.');
            } finally {
                this.loading.set(false);
                this.uploadProgress.set(false);
            }
        }
    }

    // Helpers
    private showSuccess(message: string) {
        this.successMessage.set(message);
        setTimeout(() => this.successMessage.set(''), 3000);
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getMaterialTypeIcon(type: string): string {
        switch (type) {
            case 'pdf': return '📄';
            case 'doc': return '📝';
            case 'link': return '🔗';
            default: return '📎';
        }
    }

    async deleteFeedback(feedbackId: string) {
        if (!confirm('¿Estás seguro de eliminar este feedback?')) return;

        const { error } = await this.supabaseService.deleteFeedback(feedbackId);
        if (error) {
            this.errorMessage.set('Error al eliminar el feedback');
            return;
        }

        // Reload feedback list
        if (this.selectedStudent()) {
            await this.loadStudentFeedbackAndMaterials(this.selectedStudent()!.id);
        }
        this.showSuccess('Feedback eliminado correctamente');
    }

    async deleteMaterial(materialId: string) {
        if (!confirm('¿Estás seguro de eliminar este material?')) return;

        const { error } = await this.supabaseService.deleteMaterial(materialId);
        if (error) {
            this.errorMessage.set('Error al eliminar el material');
            return;
        }

        // Reload materials list
        if (this.selectedStudent()) {
            await this.loadStudentFeedbackAndMaterials(this.selectedStudent()!.id);
        }
        this.showSuccess('Material eliminado correctamente');
    }
}
