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
    loadComponent: () =>
      import('./features/survey/survey-page.component').then(m => m.SurveyPageComponent),
  },
];
