/**
 * Survey Maker — CheckboxFieldComponent
 *
 * Renders a group of independent checkboxes using Angular Material's
 * `mat-checkbox`. Value is a `string[]` of the currently checked option values.
 * Each toggle adds or removes a value from the array without mutating state
 * directly.
 *
 * A required asterisk is appended to the label via `RequiredMarkDirective`
 * when `field().validation?.required` is true.
 *
 * Used by FieldRendererComponent for field type: `checkbox`.
 */
import { Component, input, output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { QuestionField } from '../../core/interfaces';
import { RequiredMarkDirective } from '../../shared/directives/required-mark.directive';

@Component({
  selector: 'app-checkbox-field',
  standalone: true,
  imports: [MatCheckboxModule, RequiredMarkDirective],
  template: `
    <div class="field-label" [appRequiredMark]="field().validation?.required ?? false">{{ field().label }}</div>
    <div class="checkbox-group">
      @for (option of field().options ?? []; track option.value) {
        <mat-checkbox
          [checked]="isChecked(option.value)"
          [disabled]="option.disabled ?? false"
          (change)="toggle(option.value, $event.checked)"
        >
          {{ option.label }}
        </mat-checkbox>
      }
    </div>
    @if (field().hint) {
      <span class="field-hint">{{ field().hint }}</span>
    }
  `,
  styles: [`
    .field-label { font-size: 14px; color: rgba(0,0,0,.6); margin-bottom: 8px; }
    .checkbox-group { display: flex; flex-direction: column; gap: 4px; }
    .field-hint { font-size: 12px; color: rgba(0,0,0,.6); margin-top: 4px; display: block; }
  `],
})
export class CheckboxFieldComponent {
  /** The field definition from the survey schema. */
  readonly field = input.required<QuestionField>();

  /** Array of currently checked option values. Defaults to empty array. */
  readonly value = input<string[]>([]);

  /** Emits the updated array of checked option values after each toggle. */
  readonly valueChange = output<string[]>();

  /**
   * Returns `true` if the given option value is present in the current selection.
   * @param optionValue - The option value to check.
   */
  isChecked(optionValue: string): boolean {
    return this.value().includes(optionValue);
  }

  /**
   * Adds or removes `optionValue` from the current selection array and emits
   * the new array. Does not mutate the existing array.
   * @param optionValue - The option value that was toggled.
   * @param checked - `true` if the checkbox was checked, `false` if unchecked.
   */
  toggle(optionValue: string, checked: boolean): void {
    const current = this.value();
    // Nunca mutamos el array existente — creamos uno nuevo con spread operator.
    // checked=true: agregamos el valor al final del array
    // checked=false: filtramos el valor fuera del array
    // En ambos casos emitimos el array nuevo para que el estado central lo procese.
    const next = checked
      ? [...current, optionValue]
      : current.filter(v => v !== optionValue);
    this.valueChange.emit(next);
  }
}
