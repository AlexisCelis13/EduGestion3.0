import { Injectable, signal, computed, OnDestroy } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'edugestion-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  /** The user-selected mode (light | dark | system) */
  currentMode = signal<ThemeMode>(this.getStoredMode());

  /** Whether dark theme is actually active right now */
  isDark = signal<boolean>(false);

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private mediaListener = (e: MediaQueryListEvent) => {
    if (this.currentMode() === 'system') {
      this.applyTheme(e.matches);
    }
  };

  constructor() {
    // Listen for OS-level theme changes
    this.mediaQuery.addEventListener('change', this.mediaListener);

    // Apply initial theme
    this.applyFromMode(this.currentMode());
  }

  ngOnDestroy() {
    this.mediaQuery.removeEventListener('change', this.mediaListener);
  }

  /** Set mode and persist */
  setMode(mode: ThemeMode) {
    this.currentMode.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    this.applyFromMode(mode);
  }

  /** Cycle through modes: light → dark → system → light */
  cycleMode() {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const idx = order.indexOf(this.currentMode());
    const next = order[(idx + 1) % order.length];
    this.setMode(next);
  }

  private applyFromMode(mode: ThemeMode) {
    switch (mode) {
      case 'dark':
        this.applyTheme(true);
        break;
      case 'light':
        this.applyTheme(false);
        break;
      case 'system':
        this.applyTheme(this.mediaQuery.matches);
        break;
    }
  }

  private applyTheme(dark: boolean) {
    this.isDark.set(dark);
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  private getStoredMode(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }
    return 'system';
  }
}
