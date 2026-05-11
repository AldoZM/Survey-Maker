/**
 * Survey Maker — SurveyLoaderService
 *
 * Reactive service that loads and validates survey JSON schemas from the
 * application's static asset folder.  Built on Angular's Resource API so
 * loading state, errors, and resolved values are all exposed as Signals —
 * no manual subscription management required.
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SurveySchema } from '../interfaces';
import { parseSchema } from '../parsers/schema.parser';

/**
 * Loads and validates survey JSON schemas using Angular's reactive Resource API.
 *
 * JSON files are resolved from the application's `/schemas/` public path:
 * `survey-maker/public/schemas/<id>.json`.
 *
 * ### Basic usage
 * ```typescript
 * const loader = inject(SurveyLoaderService);
 * loader.loadSurvey('ejemplo-feedback');
 * ```
 *
 * ### Template bindings
 * ```html
 * @if (loader.survey.isLoading()) {
 *   <mat-progress-bar mode="indeterminate" />
 * }
 * @if (loader.survey.error(); as err) {
 *   <mat-error>Error al cargar la encuesta: {{ err }}</mat-error>
 * }
 * @if (loader.survey.value(); as schema) {
 *   <app-survey [schema]="schema" />
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class SurveyLoaderService {
  private readonly http = inject(HttpClient);

  /**
   * The survey ID currently queued for loading.
   *
   * Setting this signal to a non-null string triggers the resource to fetch
   * `/schemas/<id>.json` and parse the result.  Setting it to `null` puts the
   * resource into an idle state with `value() === undefined`.
   */
  readonly surveyId = signal<string | null>(null);

  /**
   * Reactive resource for the current survey schema.
   *
   * Automatically re-fetches and re-validates whenever {@link surveyId} changes.
   *
   * | Signal | Type | Description |
   * |---|---|---|
   * | `survey.isLoading()` | `boolean` | `true` while the HTTP request is in flight |
   * | `survey.error()` | `unknown` | Error thrown by the last failed load, or `undefined` |
   * | `survey.value()` | `SurveySchema \| undefined` | The validated schema, or `undefined` when idle/loading |
   * | `survey.status()` | `ResourceStatus` | Detailed status: `Idle`, `Loading`, `Resolved`, `Error` |
   */
  readonly survey = rxResource({
    params: () => this.surveyId(),
    stream: ({ params: id }) => {
      if (!id) {
        return of(undefined);
      }
      return this.http
        .get<unknown>(`/schemas/${id}.json`)
        .pipe(map((raw) => parseSchema(raw)));
    },
  });

  /**
   * Triggers loading of a survey by its ID.
   *
   * Internally updates {@link surveyId}, which causes the reactive resource to
   * fetch `/schemas/<id>.json`, parse it through {@link parseSchema}, and
   * expose the result via `survey.value()`.
   *
   * @param id - Survey identifier that matches a filename in
   *   `survey-maker/public/schemas/<id>.json`.
   */
  loadSurvey(id: string): void {
    this.surveyId.set(id);
  }
}
