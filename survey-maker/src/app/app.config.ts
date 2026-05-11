import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Captura errores no manejados del navegador (ej. errores en event listeners)
    // y los enruta al ErrorHandler de Angular en lugar de perderlos silenciosamente
    provideBrowserGlobalErrorListeners(),

    // Activa el modo Zoneless (Angular 18+): elimina Zone.js del bundle.
    // Sin Zone.js, Angular NO detecta cambios automáticamente en eventos del DOM.
    // La detección de cambios SOLO ocurre cuando un Signal cambia de valor.
    // Ventaja: bundle más pequeño, rendimiento más predecible.
    provideZonelessChangeDetection(),

    // Registra el Router con las rutas definidas en app.routes.ts.
    // Las rutas usan lazy loading — los componentes se descargan solo cuando se navega a ellos.
    provideRouter(routes),

    // Habilita HttpClient para hacer peticiones HTTP (fetch de schemas JSON).
    // Sin este provider, inject(HttpClient) fallaría con NullInjectorError.
    provideHttpClient(),
  ]
};
