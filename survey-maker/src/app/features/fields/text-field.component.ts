/**
 * Survey Maker — TextFieldComponent
 *
 * Renders a single-line text input (type="text") or an email input
 * (type="email") depending on `field().type`. Wraps Angular Material's
 * `mat-form-field` + `matInput` directive pair.
 *
 * Used by FieldRendererComponent for field types: `text`, `email`.
 */
import { Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { QuestionField } from '../../core/interfaces';

@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ field().label }}</mat-label>
      <input
        matInput
        [type]="field().type === 'email' ? 'email' : 'text'"
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
export class TextFieldComponent {
  /** The field definition from the survey schema. */
  readonly field = input.required<QuestionField>();

  /** Current string value of the field. Defaults to empty string. */
  readonly value = input<string>('');

  /** Emits the new string value whenever the user types. */
  readonly valueChange = output<string>();

  /**
   * Handles the native `input` event and emits the updated value.
   * @param event - The native DOM InputEvent from the `<input>` element.
   */
  onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
