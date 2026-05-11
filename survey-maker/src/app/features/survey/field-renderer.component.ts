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
    <!-- @if elimina el campo del DOM completamente cuando no es visible.
         No es solo CSS display:none — el componente no existe en memoria. -->
    @if (isVisible()) {
      <div class="field-wrapper">
        <!-- @let crea una variable local para no llamar a field() múltiples veces.
             Angular 17+ — equivalente a hacer const f = field() en TypeScript. -->
        @let f = field();

        <!-- @switch despacha al componente correcto según el tipo del campo.
             Cada @case renderiza UN componente diferente con la misma interfaz:
             recibe [field] y [value], emite (valueChange). -->
        @switch (f.type) {
          @case ('text') {
            <!-- stringValue() garantiza que el valor sea string (no number ni array) -->
            <app-text-field
              [field]="f"
              [value]="stringValue()"
              (valueChange)="valueChange.emit($event)"
            />
          }
          @case ('email') {
            <!-- email reutiliza TextFieldComponent — internamente cambia type="email" -->
            <app-text-field
              [field]="f"
              [value]="stringValue()"
              (valueChange)="valueChange.emit($event)"
            />
          }
          @case ('number') {
            <!-- numberValue() convierte el valor a number | null -->
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
            <!-- arrayValue() convierte el valor a string[] (array de valores seleccionados) -->
            <app-checkbox-field
              [field]="f"
              [value]="arrayValue()"
              (valueChange)="valueChange.emit($event)"
            />
          }
        }

        <!-- El error se muestra solo si errorMessage() no es null.
             getError() de SurveyStateService retorna null si isDirty=false o si es válido. -->
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

    // Si el campo no tiene lógica condicional, siempre está visible
    if (!condition) return true;

    // Buscamos la respuesta actual del campo del que depende este campo.
    // condition.dependsOn contiene el ID del campo controlador.
    const answer = this.answers()[condition.dependsOn];
    const expected = condition.equals;

    // condition.equals puede ser un array para aceptar múltiples valores.
    // Ej: { dependsOn: "calificacion", equals: ["malo", "regular"] }
    // → el campo aparece si eligieron "malo" O "regular"
    if (Array.isArray(expected)) {
      return expected.includes(answer as string);
    }

    // Comparación directa para valor único.
    // Ej: { dependsOn: "calificacion", equals: "malo" }
    return answer === expected;
  });

  /**
   * Casts the current value to `string` for text-based fields.
   * Returns empty string when the value is not a string.
   */
  readonly stringValue = computed(() => {
    const v = this.value();
    // El valor guardado en FieldAnswer es `unknown` para soportar todos los tipos.
    // Aquí garantizamos que TextFieldComponent siempre recibe un string.
    return typeof v === 'string' ? v : '';
  });

  /**
   * Casts the current value to `number | null` for number fields.
   * Returns `null` when the value is not a number.
   */
  readonly numberValue = computed(() => {
    const v = this.value();
    // NumberFieldComponent espera number | null — null representa "campo vacío"
    return typeof v === 'number' ? v : null;
  });

  /**
   * Casts the current value to `string[]` for checkbox fields.
   * Returns an empty array when the value is not an array.
   */
  readonly arrayValue = computed(() => {
    const v = this.value();
    // CheckboxFieldComponent espera string[] — array de valores seleccionados
    return Array.isArray(v) ? (v as string[]) : [];
  });
}
