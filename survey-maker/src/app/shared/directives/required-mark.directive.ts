import { Directive, ElementRef, input, OnInit, Renderer2 } from '@angular/core';

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

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    if (this.appRequiredMark()) {
      const span = this.renderer.createElement('span');
      this.renderer.setProperty(span, 'textContent', ' *');
      this.renderer.setStyle(span, 'color', '#f44336');
      this.renderer.setAttribute(span, 'aria-hidden', 'true');
      this.renderer.appendChild(this.el.nativeElement, span);
    }
  }
}
