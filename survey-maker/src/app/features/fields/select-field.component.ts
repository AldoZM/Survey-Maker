/**
 * Survey Maker — SelectFieldComponent
 *
 * Renders a dropdown selector using Angular Material's `mat-select` inside a
 * `mat-form-field`. Options are derived from `field().options`.
 *
 * Used by FieldRendererComponent for field type: `select`.
 */
import { Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { QuestionField } from '../../core/interfaces';

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ field().label }}</mat-label>
      <mat-select [value]="value()" (selectionChange)="valueChange.emit($event.value)">
        @for (option of field().options ?? []; track option.value) {
          <mat-option [value]="option.value" [disabled]="option.disabled ?? false">
            {{ option.label }}
          </mat-option>
        }
      </mat-select>
      @if (field().hint) {
        <mat-hint>{{ field().hint }}</mat-hint>
      }
    </mat-form-field>
  `,
  styles: ['.full-width { width: 100%; }'],
})
export class SelectFieldComponent {
  /** The field definition from the survey schema. */
  readonly field = input.required<QuestionField>();

  /** Currently selected option value. Defaults to empty string (no selection). */
  readonly value = input<string>('');

  /** Emits the newly selected option's value string. */
  readonly valueChange = output<string>();
}
