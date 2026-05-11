/**
 * Survey Maker — SurveyComponent
 *
 * Renders a complete survey from a `SurveySchema`. Iterates over sections and
 * fields, delegating each field's rendering to `FieldRendererComponent`.
 *
 * ### State management
 * All answer state is managed by `SurveyStateService`, which provides reactive
 * Signals for answers, progress, and validation. The component initializes the
 * service via `initSurvey()` whenever the schema input changes.
 *
 * ### Progress
 * A Material progress bar reflects the ratio of answered required fields (0–100).
 *
 * ### Submit
 * `onSubmit()` calls `state.touchAll()` to reveal validation errors, then checks
 * `state.isValid()` before marking the survey as submitted.
 */
import { Component, input, inject, effect, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { SurveySchema } from '../../core/interfaces';
import { SurveyStateService } from '../../core/services/survey-state.service';
import { FieldRendererComponent } from './field-renderer.component';

@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [FieldRendererComponent, MatButtonModule, MatCardModule, MatDividerModule, MatProgressBarModule, MatIconModule],
  template: `
    <!-- Pantalla de éxito: se muestra cuando el usuario envió la encuesta -->
    @if (state.isSubmitted()) {
      <mat-card class="survey-card success-card">
        <mat-card-content class="success-content">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <h2 class="success-title">¡Gracias por tu cooperación!</h2>
          <p class="success-subtitle">Tus respuestas han sido registradas.</p>
          <button mat-raised-button color="primary" (click)="resetSurvey()">
            Regresar a la encuesta
          </button>
        </mat-card-content>
      </mat-card>
    }

    <!-- Formulario principal: visible mientras isSubmitted() es false -->
    @if (!state.isSubmitted()) {
      <mat-card class="survey-card">
        <mat-card-header>
          <mat-card-title>{{ schema().title }}</mat-card-title>
          <!-- @if solo renderiza el subtítulo si el schema define una descripción -->
          @if (schema().description) {
            <mat-card-subtitle>{{ schema().description }}</mat-card-subtitle>
          }
        </mat-card-header>

        <!-- Barra de progreso reactiva: state.progress() es un computed() que
             retorna 0-100 basado en campos required respondidos.
             Se actualiza automáticamente al contestar cada campo. -->
        <mat-progress-bar
          mode="determinate"
          [value]="state.progress()"
          class="progress-bar"
        />

        <mat-card-content>
          <!-- @for itera sobre las secciones del schema.
               track section.id es obligatorio: le dice a Angular cómo identificar
               cada elemento del array para hacer diff eficiente del DOM. -->
          @for (section of schema().sections; track section.id) {
            <section class="survey-section">
              <h3 class="section-title">{{ section.title }}</h3>
              @if (section.description) {
                <p class="section-description">{{ section.description }}</p>
              }
              <mat-divider />
              <div class="fields-container">
                @for (field of section.fields; track field.id) {
                  <!--
                    [answers]: mapa { fieldId: valor } para evaluar lógica condicional
                    [value]: valor actual del campo (string | number | string[] | null)
                    [errorMessage]: null si válido o no tocado, mensaje si hay error
                    (valueChange): propaga cada cambio al estado central via setAnswer()
                  -->
                  <app-field-renderer
                    [field]="field"
                    [answers]="answersAsValues()"
                    [value]="state.answers()[field.id]?.value"
                    [errorMessage]="state.getError(field.id)"
                    (valueChange)="state.setAnswer(field.id, $event)"
                  />
                }
              </div>
            </section>
          }
        </mat-card-content>

        <mat-card-actions align="end">
          <span class="progress-label">{{ state.progress() }}% completado</span>
          <!-- ?? usa el submitLabel del schema si existe, sino el texto por defecto -->
          <button mat-raised-button color="primary" (click)="onSubmit()">
            {{ schema().submitLabel ?? 'Enviar' }}
          </button>
        </mat-card-actions>
      </mat-card>
    }
  `,
  styles: [`
    .survey-card { max-width: 720px; margin: 24px auto; padding: 8px; }
    .progress-bar { margin: 8px 0; }
    .survey-section { margin-top: 24px; }
    .section-title { font-size: 18px; font-weight: 500; margin-bottom: 4px; }
    .section-description { color: rgba(0,0,0,.6); margin-bottom: 16px; }
    .fields-container { padding-top: 16px; display: flex; flex-direction: column; gap: 8px; }
    .progress-label { margin-right: auto; color: rgba(0,0,0,.6); font-size: 14px; }

    /* Pantalla de éxito */
    .success-card { text-align: center; }
    .success-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px 24px;
    }
    .success-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #4caf50;
    }
    .success-title { font-size: 24px; font-weight: 500; margin: 0; }
    .success-subtitle { color: rgba(0,0,0,.6); margin: 0; }
  `],
})
export class SurveyComponent {
  /** The validated survey schema to render. Provided by SurveyPageComponent. */
  readonly schema = input.required<SurveySchema>();

  /** Centralized reactive state manager — answers, progress, validation. */
  readonly state = inject(SurveyStateService);

  /**
   * Extracts raw values from the FieldAnswer map for conditional logic evaluation
   * in FieldRendererComponent. Recomputes whenever `state.answers` changes.
   */
  readonly answersAsValues = computed(() => {
    // state.answers() es un Record<string, FieldAnswer> — cada respuesta tiene
    // metadata extra (isValid, isDirty). FieldRendererComponent solo necesita
    // los valores crudos para evaluar la lógica condicional (condition.equals).
    // Transformamos FieldAnswer → valor crudo para no exponer internos del estado.
    const entries = Object.entries(this.state.answers());
    return Object.fromEntries(entries.map(([id, ans]) => [id, ans.value]));
    // Resultado: { "calificacion": "malo", "nombre": "Juan", ... }
  });

  constructor() {
    // effect() reactivo: se ejecuta cuando schema() cambia.
    // Cuando SurveyPageComponent carga un nuevo schema via [schema]="...",
    // este effect detecta el cambio e inicializa el estado del formulario.
    // initSurvey() carga respuestas de localStorage o inicializa valores por defecto.
    effect(() => {
      const s = this.schema();
      if (s) this.state.initSurvey(s);
    });
  }

  /**
   * Handles the survey submit action.
   * Marks all fields as dirty to expose validation errors, then submits only
   * when the full survey is valid.
   */
  onSubmit(): void {
    // touchAll() pone isDirty=true en TODOS los campos.
    // Sin esto, getError() filtra los errores de campos que el usuario no tocó,
    // y el usuario no sabría cuáles campos le faltan completar al hacer submit.
    this.state.touchAll();

    // Solo marcamos como enviado si todos los campos required son válidos.
    // Si no es válido, los errores ya son visibles gracias a touchAll().
    if (this.state.isValid()) {
      console.log('Survey submitted:', this.state.answers());
      // Cambiar a true dispara el @if(state.isSubmitted()) en el template,
      // ocultando el formulario y mostrando la pantalla de éxito.
      this.state.isSubmitted.set(true);
    }
  }

  /**
   * Regresa a la encuesta limpiando las respuestas y el estado de envío.
   * Llamado desde el botón "Regresar a la encuesta" en la pantalla de éxito.
   */
  resetSurvey(): void {
    // Reinicializar con el schema actual: limpia localStorage, crea respuestas vacías
    // y pone isSubmitted de vuelta en false → el formulario vuelve a aparecer.
    this.state.initSurvey(this.schema());
  }
}
