import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  template: '<p>Verificando tu correo...</p>'
})
export class EmailVerificationComponent implements OnInit {
  constructor(private supabase: SupabaseService, private router: Router) {}

  ngOnInit() {
    this.supabase.currentUser$.subscribe(user => {
      if (user) {
        this.router.navigate(['/auth/login']);
      }
    });
  }
}