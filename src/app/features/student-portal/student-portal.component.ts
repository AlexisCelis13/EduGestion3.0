import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService, StudentPortalData, StudentFeedback, StudentMaterial } from '../../core/services/supabase.service';
import { LucideAngularModule, Download, FileText, MessageCircle, ExternalLink, Calendar, User } from 'lucide-angular';

@Component({
  selector: 'app-student-portal',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  providers: [{ provide: 'LUCIDE_ICONS', useValue: { Download, FileText, MessageCircle, ExternalLink, Calendar, User } }],
  templateUrl: './student-portal.component.html'
})
export class StudentPortalComponent implements OnInit {
  loading = signal(true);
  error = signal('');
  data = signal<StudentPortalData | null>(null);
  activeTab = signal<'feedback' | 'materials'>('feedback');

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    
    if (!token) {
      this.error.set('Enlace inválido');
      this.loading.set(false);
      return;
    }

    try {
      const { data, error } = await this.supabaseService.getStudentPortalData(token);
      
      if (error) {
        console.error('Portal Error:', error);
        this.error.set(`Error: ${error.message || 'Error desconocido'}`);
        return;
      }

      if (data) {
        this.data.set(data);
        // If no feedback but has materials, switch directly to materials
        if (data.feedback.length === 0 && data.materials.length > 0) {
            this.activeTab.set('materials');
        }
      } else {
        this.error.set('No se encontró información o el enlace ha caducado');
      }
    } catch (err: any) {
      this.error.set(`Error crítico: ${err.message || err}`);
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  }

  getInitials(first: string, last: string): string {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }
}
