/**
 * Survey Maker — SurveyComponent
 *
 * Renders a complete survey from a `SurveySchema`. Iterates over sections and
 * fields, delegating each field's rendering to `FieldRendererComponent`.
 *
 * ### State management
 * Answers are stored locally in a `signal<Record<string, unknown>>` keyed by
 * field ID. This local state will be migrated to a dedicated `SurveyStateService`
 * in a later task phase.
 *
 * ### Submit
 * `onSubmit()` logs current answers to the console. Full submission logic
 * (validation, service call, navigation) will be added with `SurveyStateService`.
 */
import { Component, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { SurveySchema } from '../../core/interfaces';
import { FieldRendererComponent } from './field-renderer.component';

@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [FieldRendererComponent, MatButtonModule, MatCardModule, MatDividerModule],
  template: `
    <mat-card class="survey-card">
      <mat-card-header>
        <mat-card-title>{{ schema().title }}</mat-card-title>
        @if (schema().description) {
          <mat-card-subtitle>{{ schema().description }}</mat-card-subtitle>
        }
      </mat-card-header>

      <mat-card-content>
        @for (section of schema().sections; track section.id) {
          <section class="survey-section">
            <h3 class="section-title">{{ section.title }}</h3>
            @if (section.description) {
              <p class="section-description">{{ section.description }}</p>
            }
            <mat-divider />
            <div class="fields-container">
              @for (field of section.fields; track field.id) {
                <app-field-renderer
                  [field]="field"
                  [answers]="answers()"
                  [value]="answers()[field.id]"
                  (valueChange)="setAnswer(field.id, $event)"
                />
              }
            </div>
          </section>
        }
      </mat-card-content>

      <mat-card-actions align="end">
        <button mat-raised-button color="primary" (click)="onSubmit()">
          {{ schema().submitLabel ?? 'Enviar' }}
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .survey-card { max-width: 720px; margin: 24px auto; padding: 8px; }
    .survey-section { margin-top: 24px; }
    .section-title { font-size: 18px; font-weight: 500; margin-bottom: 4px; }
    .section-description { color: rgba(0,0,0,.6); margin-bottom: 16px; }
    .fields-container { padding-top: 16px; display: flex; flex-direction: column; gap: 8px; }
  `],
})
export class SurveyComponent {
  /** The validated survey schema to render. Provided by SurveyPageComponent. */
  readonly schema = input.required<SurveySchema>();

  /**
   * Reactive map of current field answers.
   * Keys are field IDs; values are the typed answer for each field.
   * Passed down to every FieldRendererComponent for conditional logic evaluation.
   */
  readonly answers = signal<Record<string, unknown>>({});

  /**
   * Updates the answer for a single field without mutating the existing map.
   * Called by FieldRendererComponent's `valueChange` output.
   *
   * @param fieldId - The `id` of the field whose answer changed.
   * @param value   - The new value emitted by the field component.
   */
  setAnswer(fieldId: string, value: unknown): void {
    this.answers.update(prev => ({ ...prev, [fieldId]: value }));
  }

  /**
   * Handles the survey submit action.
   * Currently logs answers to the console; full submission logic will be added
   * with `SurveyStateService` in a later task phase.
   */
  onSubmit(): void {
    console.log('Survey answers:', this.answers());
    // TODO (Task 6): delegate to SurveyStateService.submit()
  }
}
