import { Directive, ElementRef, input, OnInit } from '@angular/core';

/**
 * Appends a required asterisk (*) to the host element's text content
 * when the associated field is marked as required.
 *
 * Use on label elements for field types that don't use mat-form-field
 * (e.g., radio groups, checkbox groups).
 *
 * @example
 * ```html
 * <div class="field-label" [appRequiredMark]="field().validation?.required ?? false">
 *   {{ field().label }}
 * </div>
 * ```
 */
@Directive({
  selector: '[appRequiredMark]',
  standalone: true,
})
export class RequiredMarkDirective implements OnInit {
  /** When true, appends a red asterisk (*) to the host element. */
  readonly appRequiredMark = input<boolean>(false);

  constructor(private readonly el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    if (this.appRequiredMark()) {
      const span = document.createElement('span');
      span.textContent = ' *';
      span.style.color = '#f44336';
      span.setAttribute('aria-hidden', 'true');
      this.el.nativeElement.appendChild(span);
    }
  }
}
