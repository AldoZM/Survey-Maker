import { Directive, input, ElementRef, effect, inject, Injector } from '@angular/core';

/**
 * Applies error styling to the host element when `hasError` is true.
 * Adds the `field--error` CSS class and sets `aria-invalid` for accessibility.
 *
 * @example
 * ```html
 * <div class="field-wrapper" [appFieldError]="!!errorMessage()">
 *   <app-radio-field ... />
 * </div>
 * ```
 */
@Directive({
  selector: '[appFieldError]',
  standalone: true,
})
export class FieldErrorDirective {
  private readonly injector = inject(Injector);

  /** When true, applies the `field--error` class and sets `aria-invalid="true"`. */
  readonly appFieldError = input<boolean>(false);

  constructor(private readonly el: ElementRef<HTMLElement>) {
    effect(() => {
      const hasError = this.appFieldError();
      this.el.nativeElement.classList.toggle('field--error', hasError);
      this.el.nativeElement.setAttribute('aria-invalid', String(hasError));
    }, { injector: this.injector });
  }
}
