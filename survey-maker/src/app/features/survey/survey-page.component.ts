/**
 * Survey Maker — SurveyPageComponent
 *
 * Top-level routed page component that orchestrates survey loading and display.
 *
 * Uses `SurveyLoaderService` (built on Angular's Resource API) to fetch the
 * survey schema reactively. Renders the appropriate UI state:
 * - **Loading**: `<mat-progress-bar>` while the HTTP request is in-flight.
 * - **Error**: an error message with the raw error detail.
 * - **Success**: delegates to `SurveyComponent` with the validated schema.
 *
 * To change which survey is displayed, update the ID string passed to
 * `this.loader.loadSurvey(id)` in `ngOnInit()`.
 */
import { Component, inject, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SurveyLoaderService } from '../../core/services';
import { SurveyComponent } from './survey.component';

@Component({
  selector: 'app-survey-page',
  standalone: true,
  imports: [SurveyComponent, MatProgressBarModule],
  template: `
    <!-- Estado 1: Cargando — se muestra mientras el HTTP request está en vuelo.
         isLoading() es true desde que se llama loadSurvey() hasta que el JSON llega. -->
    @if (loader.survey.isLoading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <!-- Estado 2: Error — aparece si el HTTP falla (404, red caída) o si
         parseSchema() lanza un Error por JSON con estructura inválida.
         "as err" captura el valor de error en la variable local err. -->
    @if (loader.survey.error(); as err) {
      <div class="error-container">
        <p>Error al cargar la encuesta.</p>
        <pre>{{ err }}</pre>
      </div>
    }

    <!-- Estado 3: Éxito — survey.value() tiene el SurveySchema validado.
         "as schema" captura el valor en variable local para pasarlo como input. -->
    @if (loader.survey.value(); as schema) {
      <app-survey [schema]="schema" />
    }

    <footer class="app-footer">Made by Aldo Zetina</footer>
  `,
  styles: [`
    .error-container { padding: 24px; color: red; }
    .app-footer {
      text-align: center;
      padding: 16px;
      margin-top: 32px;
      font-size: 0.85rem;
      color: #757575;
      border-top: 1px solid #e0e0e0;
    }
  `],
})
export class SurveyPageComponent implements OnInit {
  /** Injected service that manages survey schema loading via Angular's Resource API. */
  readonly loader = inject(SurveyLoaderService);

  /**
   * Triggers loading of the default survey on component initialization.
   * Change the ID string to load a different survey schema file from
   * `survey-maker/public/schemas/<id>.json`.
   */
  ngOnInit(): void {
    this.loader.loadSurvey('ejemplo-feedback');
  }
}
