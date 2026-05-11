/**
 * Survey Maker — FieldRendererComponent
 *
 * Generic dispatcher that selects the correct field component based on
 * `field().type` and evaluates conditional display logic before rendering.
 *
 * ### Conditional logic
 * If `field().condition` is defined, `isVisible` (a `computed()` signal) checks
 * whether the answer to the field referenced by `condition.dependsOn` equals
 * `condition.equals`. The field is not rendered at all when the condition is
 * not met — this keeps hidden fields out of the DOM entirely.
 *
 * ### Email fields
 * Fields with `type === 'email'` are rendered via `TextFieldComponent`, which
 * internally switches the `<input>` to `type="email"`.
 *
 * ### Error messages
 * When `errorMessage` is provided (non-null), it is displayed below the field
 * using a `mat-error` element from MatFormFieldModule.
 */
import { Component, computed, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { QuestionField } from '../../core/interfaces';
import { TextFieldComponent } from '../fields/text-field.component';
import { NumberFieldComponent } from '../fields/number-field.component';
import { TextareaFieldComponent } from '../fields/textarea-field.component';
import { SelectFieldComponent } from '../fields/select-field.component';
import { RadioFieldComponent } from '../fields/radio-field.component';
import { CheckboxFieldComponent } from '../fields/checkbox-field.component';

@Component({
  selector: 'app-field-renderer',
  standalone: true,
  imports: [
    TextFieldComponent,
    NumberFieldComponent,
    TextareaFieldComponent,
    SelectFieldComponent,
    RadioFieldComponent,
    CheckboxFieldComponent,
    MatFormFieldModule,
  ],
  template: `
    @if (isVisible()) {
      <div class="field-wrapper">
        @let f = field();

        @switch (f.type) {
          @case ('text') {
            <app-text-field
              [field]="f"
              [value]="stringValue()"
              (valueChange)="valueChange.emit($event)"
            />
          }
          @case ('email') {
            <app-text-field
              [field]="f"
              [value]="stringValue()"
              (valueChange)="valueChange.emit($event)"
            />
          }
          @case ('number') {
            <app-number-field
              [field]="f"
              [value]="numberValue()"
              (valueChange)="valueChange.emit($event)"
            />
          }
          @case ('textarea') {
            <app-textarea-field
              [field]="f"
              [value]="stringValue()"
              (valueChange)="valueChange.emit($event)"
            />
          }
          @case ('select') {
            <app-select-field
              [field]="f"
              [value]="stringValue()"
              (valueChange)="valueChange.emit($event)"
            />
          }
          @case ('radio') {
            <app-radio-field
              [field]="f"
              [value]="stringValue()"
              (valueChange)="valueChange.emit($event)"
            />
          }
          @case ('checkbox') {
            <app-checkbox-field
              [field]="f"
              [value]="arrayValue()"
              (valueChange)="valueChange.emit($event)"
            />
          }
        }

        @if (errorMessage()) {
          <mat-error class="field-error">{{ errorMessage() }}</mat-error>
        }
      </div>
    }
  `,
  styles: [
    '.field-wrapper { margin-bottom: 16px; }',
    '.field-error { font-size: 12px; margin-top: 4px; display: block; }',
  ],
})
export class FieldRendererComponent {
  /** The field definition from the survey schema. */
  readonly field = input.required<QuestionField>();

  /**
   * Map of all current answers in the survey, keyed by field ID.
   * Required for evaluating conditional display logic.
   */
  readonly answers = input<Record<string, unknown>>({});

  /** The current value for this specific field. Type varies by field type. */
  readonly value = input<unknown>(undefined);

  /**
   * Validation error message to display below the field.
   * Null when the field is valid or has not yet been touched.
   */
  readonly errorMessage = input<string | null>(null);

  /** Emits the new value whenever the user interacts with the field. */
  readonly valueChange = output<unknown>();

  /**
   * Computed signal that evaluates whether this field should be visible.
   *
   * Returns `true` when:
   * - The field has no `condition` defined, OR
   * - The answer to `condition.dependsOn` matches `condition.equals`.
   *
   * When `condition.equals` is an array, the current answer must be included
   * in that array for the field to be visible.
   */
  readonly isVisible = computed(() => {
    const condition = this.field().condition;
    if (!condition) return true;
    const answer = this.answers()[condition.dependsOn];
    const expected = condition.equals;
    if (Array.isArray(expected)) {
      return expected.includes(answer as string);
    }
    return answer === expected;
  });

  /**
   * Casts the current value to `string` for text-based fields.
   * Returns empty string when the value is not a string.
   */
  readonly stringValue = computed(() => {
    const v = this.value();
    return typeof v === 'string' ? v : '';
  });

  /**
   * Casts the current value to `number | null` for number fields.
   * Returns `null` when the value is not a number.
   */
  readonly numberValue = computed(() => {
    const v = this.value();
    return typeof v === 'number' ? v : null;
  });

  /**
   * Casts the current value to `string[]` for checkbox fields.
   * Returns an empty array when the value is not an array.
   */
  readonly arrayValue = computed(() => {
    const v = this.value();
    return Array.isArray(v) ? (v as string[]) : [];
  });
}
