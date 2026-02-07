import { Component, forwardRef, signal, Input, OnInit, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NG_VALIDATORS, Validator, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';

interface Country {
    code: string;
    name: string;
    dialCode: string;
    flag: string;
}

@Component({
    selector: 'app-phone-input',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PhoneInputComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PhoneInputComponent),
            multi: true
        }
    ],
    template: `
    <div class="flex gap-2">
      <!-- Country Code Selector -->
      <div class="relative" style="min-width: 120px;">
        <button
          type="button"
          (click)="toggleDropdown()"
          class="input-premium w-full flex items-center gap-2 justify-between cursor-pointer"
          [class.ring-2]="dropdownOpen()"
          [class.ring-primary-500]="dropdownOpen()">
          <span class="flex items-center gap-1.5">
            <span class="text-base">{{ selectedCountry().flag }}</span>
            <span class="text-surface-700">+{{ selectedCountry().dialCode }}</span>
          </span>
          <svg class="w-4 h-4 text-surface-400 transition-transform" 
               [class.rotate-180]="dropdownOpen()"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>

        <!-- Dropdown -->
        @if (dropdownOpen()) {
        <div class="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-premium-lg border border-surface-100 z-50 overflow-hidden animate-fade-in">
          <!-- Search -->
          <div class="p-2 border-b border-surface-100">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="filterCountries()"
              placeholder="Buscar país..."
              class="w-full px-3 py-2 text-sm bg-surface-50 border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              #searchInput
            />
          </div>
          
          <!-- Country List -->
          <div class="max-h-60 overflow-y-auto">
            @for (country of filteredCountries(); track country.code) {
            <button
              type="button"
              (click)="selectCountry(country)"
              class="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-primary-50 transition-colors text-left"
              [class.bg-primary-50]="country.code === selectedCountry().code">
              <span class="text-lg">{{ country.flag }}</span>
              <span class="flex-1 text-sm text-surface-700">{{ country.name }}</span>
              <span class="text-sm text-surface-400">+{{ country.dialCode }}</span>
            </button>
            }
            @if (filteredCountries().length === 0) {
            <div class="px-3 py-4 text-sm text-surface-400 text-center">
              No se encontraron países
            </div>
            }
          </div>
        </div>
        }
      </div>

      <!-- Phone Number Input -->
      <input
        type="tel"
        [(ngModel)]="phoneNumber"
        (ngModelChange)="onPhoneChange()"
        (keydown)="onKeyDown($event)"
        (paste)="onPaste($event)"
        (blur)="handleBlur()"
        [placeholder]="placeholder"
        class="input-premium flex-1"
        [class.border-red-300]="showError()"
        [class.focus:ring-red-100]="showError()"
        [class.focus:border-red-400]="showError()"
        [attr.inputmode]="'numeric'"
        maxlength="19"
      />
    </div>
    @if (showError()) {
    <p class="text-xs text-red-500 mt-1">{{ errorMessage() }}</p>
    }
  `,
    styles: [`
    :host {
      display: block;
      position: relative;
      overflow: visible;
    }
    /* Ensure dropdown can overflow parent containers */
    :host ::ng-deep .relative {
      overflow: visible;
    }
  `]
})
export class PhoneInputComponent implements ControlValueAccessor, Validator, OnInit {
    @Input() placeholder: string = '55 1234 5678';
    @Input() defaultCountry: string = 'MX';
    @Input() minDigits: number = 7;
    @Input() maxDigits: number = 15;

    dropdownOpen = signal(false);
    searchQuery = '';
    phoneNumber = '';
    touched = false;

    selectedCountry = signal<Country>({ code: 'MX', name: 'México', dialCode: '52', flag: '🇲🇽' });
    filteredCountries = signal<Country[]>([]);
    showError = signal(false);
    errorMessage = signal('');

    private onChange: (value: string) => void = () => { };
    private onTouched: () => void = () => { };

    countries: Country[] = [
        { code: 'MX', name: 'México', dialCode: '52', flag: '🇲🇽' },
        { code: 'US', name: 'Estados Unidos', dialCode: '1', flag: '🇺🇸' },
        { code: 'ES', name: 'España', dialCode: '34', flag: '🇪🇸' },
        { code: 'CO', name: 'Colombia', dialCode: '57', flag: '🇨🇴' },
        { code: 'AR', name: 'Argentina', dialCode: '54', flag: '🇦🇷' },
        { code: 'CL', name: 'Chile', dialCode: '56', flag: '🇨🇱' },
        { code: 'PE', name: 'Perú', dialCode: '51', flag: '🇵🇪' },
        { code: 'VE', name: 'Venezuela', dialCode: '58', flag: '🇻🇪' },
        { code: 'EC', name: 'Ecuador', dialCode: '593', flag: '🇪🇨' },
        { code: 'GT', name: 'Guatemala', dialCode: '502', flag: '🇬🇹' },
        { code: 'CU', name: 'Cuba', dialCode: '53', flag: '🇨🇺' },
        { code: 'BO', name: 'Bolivia', dialCode: '591', flag: '🇧🇴' },
        { code: 'DO', name: 'República Dominicana', dialCode: '1809', flag: '🇩🇴' },
        { code: 'HN', name: 'Honduras', dialCode: '504', flag: '🇭🇳' },
        { code: 'PY', name: 'Paraguay', dialCode: '595', flag: '🇵🇾' },
        { code: 'SV', name: 'El Salvador', dialCode: '503', flag: '🇸🇻' },
        { code: 'NI', name: 'Nicaragua', dialCode: '505', flag: '🇳🇮' },
        { code: 'CR', name: 'Costa Rica', dialCode: '506', flag: '🇨🇷' },
        { code: 'PA', name: 'Panamá', dialCode: '507', flag: '🇵🇦' },
        { code: 'UY', name: 'Uruguay', dialCode: '598', flag: '🇺🇾' },
        { code: 'PR', name: 'Puerto Rico', dialCode: '1787', flag: '🇵🇷' },
        { code: 'BR', name: 'Brasil', dialCode: '55', flag: '🇧🇷' },
        { code: 'CA', name: 'Canadá', dialCode: '1', flag: '🇨🇦' },
        { code: 'GB', name: 'Reino Unido', dialCode: '44', flag: '🇬🇧' },
        { code: 'FR', name: 'Francia', dialCode: '33', flag: '🇫🇷' },
        { code: 'DE', name: 'Alemania', dialCode: '49', flag: '🇩🇪' },
        { code: 'IT', name: 'Italia', dialCode: '39', flag: '🇮🇹' },
        { code: 'PT', name: 'Portugal', dialCode: '351', flag: '🇵🇹' },
    ];

    constructor(private elementRef: ElementRef) { }

    ngOnInit() {
        this.filteredCountries.set(this.countries);
        const defaultC = this.countries.find(c => c.code === this.defaultCountry);
        if (defaultC) {
            this.selectedCountry.set(defaultC);
        }
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.dropdownOpen.set(false);
        }
    }

    toggleDropdown() {
        this.dropdownOpen.update(v => !v);
        if (this.dropdownOpen()) {
            this.searchQuery = '';
            this.filteredCountries.set(this.countries);
        }
    }

    filterCountries() {
        const query = this.normalize(this.searchQuery);
        if (!query) {
            this.filteredCountries.set(this.countries);
            return;
        }

        this.filteredCountries.set(
            this.countries.filter(c =>
                this.normalize(c.name).includes(query) ||
                c.dialCode.includes(query) ||
                c.code.toLowerCase().includes(query)
            )
        );
    }

    // Remove accents for fuzzy search (mexico -> mexico, México -> mexico)
    private normalize(str: string): string {
        return str.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    selectCountry(country: Country) {
        this.selectedCountry.set(country);
        this.dropdownOpen.set(false);
        this.emitValue();
    }

    handleBlur() {
        this.touched = true;
        this.validateAndEmit();
        this.onTouched();
    }

    // Block non-numeric keys
    onKeyDown(event: KeyboardEvent) {
        // Allow: backspace, delete, tab, escape, enter, arrows
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (allowedKeys.includes(event.key)) {
            return;
        }

        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
            return;
        }

        // Block anything that's not a number or space
        if (!/^[0-9\s]$/.test(event.key)) {
            event.preventDefault();
        }
    }

    // Clean pasted content
    onPaste(event: ClipboardEvent) {
        event.preventDefault();
        const pastedText = event.clipboardData?.getData('text') || '';
        // Only keep digits
        const cleanedText = pastedText.replace(/\D/g, '');

        // Insert at cursor position
        const input = event.target as HTMLInputElement;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const currentValue = this.phoneNumber.replace(/\D/g, '');
        const newValue = currentValue.substring(0, start) + cleanedText + currentValue.substring(end);

        // Apply and format
        this.phoneNumber = newValue.substring(0, this.maxDigits);
        this.onPhoneChange();
    }

    onPhoneChange() {
        // Remove non-numeric characters except spaces
        let cleaned = this.phoneNumber.replace(/[^\d\s]/g, '');

        // Auto-format with spaces every 4 digits for readability
        const digitsOnly = cleaned.replace(/\s/g, '');
        if (digitsOnly.length > 0) {
            // Format: XX XXXX XXXX or similar
            let formatted = '';
            for (let i = 0; i < digitsOnly.length && i < this.maxDigits; i++) {
                if (i > 0 && i % 4 === 0) {
                    formatted += ' ';
                }
                formatted += digitsOnly[i];
            }
            this.phoneNumber = formatted;
        }

        this.validateAndEmit();
    }

    private validateAndEmit() {
        const digitsOnly = this.phoneNumber.replace(/\D/g, '');

        // Clear error if empty (let required validator handle it)
        if (!digitsOnly) {
            this.showError.set(false);
            this.errorMessage.set('');
            this.onChange('');
            return;
        }

        // Validate digit count
        if (digitsOnly.length < this.minDigits) {
            this.showError.set(this.touched);
            this.errorMessage.set('Número inválido (mínimo 7 dígitos)');
        } else if (digitsOnly.length > this.maxDigits) {
            this.showError.set(this.touched);
            this.errorMessage.set('Número inválido (máximo 15 dígitos)');
        } else {
            this.showError.set(false);
            this.errorMessage.set('');
        }

        this.emitValue();
    }

    private emitValue() {
        const phone = this.phoneNumber.trim();
        if (phone) {
            const value = `+${this.selectedCountry().dialCode} ${phone}`;
            this.onChange(value);
        } else {
            this.onChange('');
        }
    }

    // ControlValueAccessor implementation
    writeValue(value: string): void {
        if (value) {
            // Parse existing value like "+52 1234567890"
            const match = value.match(/^\+(\d+)\s*(.*)$/);
            if (match) {
                const dialCode = match[1];
                const phone = match[2];

                // Find country by dial code
                const country = this.countries.find(c => c.dialCode === dialCode);
                if (country) {
                    this.selectedCountry.set(country);
                }
                this.phoneNumber = phone;
            } else {
                // If no format match, just set as phone number
                this.phoneNumber = value.replace(/^\+/, '');
            }
        } else {
            this.phoneNumber = '';
        }
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        // Handle disabled state if needed
    }

    // Validator implementation
    validate(control: AbstractControl): ValidationErrors | null {
        const digitsOnly = this.phoneNumber.replace(/\D/g, '');

        if (!digitsOnly) {
            return null; // Let required validator handle empty
        }

        if (digitsOnly.length < this.minDigits) {
            return { minDigits: { required: this.minDigits, actual: digitsOnly.length } };
        }

        if (digitsOnly.length > this.maxDigits) {
            return { maxDigits: { required: this.maxDigits, actual: digitsOnly.length } };
        }

        return null;
    }
}
