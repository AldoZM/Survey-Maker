/**
 * Survey Maker — TextareaFieldComponent
 *
 * Renders a multi-line text area using Angular Material's `mat-form-field`
 * + `textarea[matInput]`. Defaults to 4 rows.
 *
 * Used by FieldRendererComponent for field type: `textarea`.
 */
import { Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { QuestionField } from '../../core/interfaces';

@Component({
  selector: 'app-textarea-field',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ field().label }}</mat-label>
      <textarea
        matInput
        [placeholder]="field().placeholder ?? ''"
        [value]="value()"
        rows="4"
        (input)="onInput($event)"
      ></textarea>
      @if (field().hint) {
        <mat-hint>{{ field().hint }}</mat-hint>
      }
    </mat-form-field>
  `,
  styles: ['.full-width { width: 100%; }'],
})
export class TextareaFieldComponent {
  /** The field definition from the survey schema. */
  readonly field = input.required<QuestionField>();

  /** Current string value of the textarea. Defaults to empty string. */
  readonly value = input<string>('');

  /** Emits the new string value whenever the user types. */
  readonly valueChange = output<string>();

  /**
   * Handles the native `input` event and emits the updated value.
   * @param event - The native DOM InputEvent from the `<textarea>` element.
   */
  onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
