/**
 * Survey Maker — NumberFieldComponent
 *
 * Renders a numeric input field using Angular Material's `mat-form-field`
 * + `matInput` with `type="number"`. Emits `null` when the input is cleared.
 *
 * Used by FieldRendererComponent for field type: `number`.
 */
import { Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { QuestionField } from '../../core/interfaces';

@Component({
  selector: 'app-number-field',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ field().label }}</mat-label>
      <input
        matInput
        type="number"
        [placeholder]="field().placeholder ?? ''"
        [value]="value()"
        (input)="onInput($event)"
      />
      @if (field().hint) {
        <mat-hint>{{ field().hint }}</mat-hint>
      }
    </mat-form-field>
  `,
  styles: ['.full-width { width: 100%; }'],
})
export class NumberFieldComponent {
  /** The field definition from the survey schema. */
  readonly field = input.required<QuestionField>();

  /** Current numeric value of the field. `null` when the field is empty. */
  readonly value = input<number | null>(null);

  /** Emits the new numeric value, or `null` when the input is cleared. */
  readonly valueChange = output<number | null>();

  /**
   * Handles the native `input` event, converting the string value to a number
   * (or `null` if the input is empty) before emitting.
   * @param event - The native DOM InputEvent from the `<input>` element.
   */
  onInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.valueChange.emit(v === '' ? null : Number(v));
  }
}
