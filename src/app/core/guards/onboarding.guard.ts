import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class OnboardingGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const user = await this.supabaseService.getCurrentUser();
    
    if (!user) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    const profile = await this.supabaseService.getProfile(user.id);
    
    if (!profile?.onboarding_completed) {
      this.router.navigate(['/dashboard/onboarding']);
      return false;
    }

    return true;
  }
}