/**
 * Survey Maker — RadioFieldComponent
 *
 * Renders a group of mutually exclusive radio buttons using Angular Material's
 * `mat-radio-group` and `mat-radio-button`. Options are derived from
 * `field().options`.
 *
 * Used by FieldRendererComponent for field type: `radio`.
 */
import { Component, input, output } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { QuestionField } from '../../core/interfaces';

@Component({
  selector: 'app-radio-field',
  standalone: true,
  imports: [MatRadioModule],
  template: `
    <div class="field-label">{{ field().label }}</div>
    <mat-radio-group [value]="value()" (change)="valueChange.emit($event.value)" class="radio-group">
      @for (option of field().options ?? []; track option.value) {
        <mat-radio-button [value]="option.value" [disabled]="option.disabled ?? false">
          {{ option.label }}
        </mat-radio-button>
      }
    </mat-radio-group>
    @if (field().hint) {
      <span class="field-hint">{{ field().hint }}</span>
    }
  `,
  styles: [`
    .field-label { font-size: 14px; color: rgba(0,0,0,.6); margin-bottom: 8px; }
    .radio-group { display: flex; flex-direction: column; gap: 4px; }
    .field-hint { font-size: 12px; color: rgba(0,0,0,.6); margin-top: 4px; display: block; }
  `],
})
export class RadioFieldComponent {
  /** The field definition from the survey schema. */
  readonly field = input.required<QuestionField>();

  /** Currently selected radio value. Defaults to empty string (nothing selected). */
  readonly value = input<string>('');

  /** Emits the value string of the newly selected radio button. */
  readonly valueChange = output<string>();
}
