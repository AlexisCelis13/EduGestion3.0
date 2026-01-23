import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { OnboardingGuard } from './core/guards/onboarding.guard';

export const routes: Routes = [
  // Landing Page Pública
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },

  // Auth Routes
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      },
      {
        path: 'pricing',
        loadComponent: () => import('./features/auth/pricing/pricing.component').then(m => m.PricingComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/auth/checkout/checkout.component').then(m => m.CheckoutComponent),
        canActivate: [AuthGuard]
      }
    ]
  },

  // Dashboard Routes (Protegidas)
  {
    path: 'dashboard',
    loadComponent: () => import('./layouts/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent),
        canActivate: [OnboardingGuard]
      },
      {
        path: 'onboarding',
        loadComponent: () => import('./features/onboarding/onboarding-wizard/onboarding-wizard.component').then(m => m.OnboardingWizardComponent)
      },
      {
        path: 'landing-editor',
        loadComponent: () => import('./features/user-landing/user-landing-editor/user-landing-editor.component').then(m => m.UserLandingEditorComponent)
      },
      {
        path: 'services',
        loadComponent: () => import('./features/services/services-list/services-list.component').then(m => m.ServicesListComponent)
      }
    ]
  },

  // Landing Pages Públicas de Usuarios
  {
    path: 'p/:slug',
    loadComponent: () => import('./features/user-landing/public-landing/public-landing.component').then(m => m.PublicLandingComponent)
  },

  // Redirect
  { path: '**', redirectTo: '' }
];