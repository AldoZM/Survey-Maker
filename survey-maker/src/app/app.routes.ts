import { Routes } from '@angular/router';

/**
 * Application routes for Survey Maker.
 *
 * The root path lazy-loads `SurveyPageComponent`, which orchestrates
 * schema fetching and delegates rendering to the Dynamic Form Engine.
 */
export const routes: Routes = [
  {
    path: '',
    // loadComponent hace lazy loading: SurveyPageComponent y todo su árbol de
    // dependencias NO se incluyen en el bundle inicial (main.js).
    // Solo se descargan cuando el usuario llega a esta ruta por primera vez.
    // En el build esto genera un chunk separado: chunk-XXXX.js (survey-page-component)
    loadComponent: () =>
      import('./features/survey/survey-page.component').then(m => m.SurveyPageComponent),
  },
];
