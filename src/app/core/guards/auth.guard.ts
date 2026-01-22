import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.supabaseService.getCurrentUser();
    
    if (user) {
      return true;
    } else {
      this.router.navigate(['/auth/login']);
      return false;
    }
  }
}