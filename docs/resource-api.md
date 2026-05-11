# Resource API y Carga de Datos — Survey Maker

## Introducción

Survey Maker utiliza la **Resource API** de Angular 21 para cargar de forma reactiva los esquemas JSON de las encuestas. Esta API reemplaza los patrones tradicionales de RxJS para el manejo de estado asíncrono, integrándose nativamente con el sistema de Signals.

## Por qué Resource API

| Patrón Tradicional (RxJS) | Resource API (Angular 21) |
|--------------------------|--------------------------|
| `BehaviorSubject` + `switchMap` | `resource()` o `rxResource()` |
| Manejo manual de loading/error | Estados automáticos: `isLoading`, `error`, `value` |
| `async` pipe en templates | Acceso directo como Signal |
| `takeUntilDestroyed()` | Cleanup automático |

## Arquitectura de Carga

```
surveyId (signal) → rxResource() → HTTP GET /schemas/{id}.json
                                          ↓
                                SchemaParser.parseSchema()
                                          ↓
                            SurveySchema tipado y validado
```

## SurveyLoaderService

### Uso básico

```typescript
@Component({ ... })
export class MyComponent {
  private loader = inject(SurveyLoaderService);

  ngOnInit() {
    this.loader.loadSurvey('ejemplo-feedback');
  }
}
```

### Template

```html
@if (loader.survey.isLoading()) {
  <mat-progress-bar mode="indeterminate" />
}

@if (loader.survey.error(); as err) {
  <mat-error>Error al cargar la encuesta: {{ err }}</mat-error>
}

@if (loader.survey.value(); as schema) {
  <app-survey [schema]="schema" />
}
```

### Señales del Resource

| Señal | Tipo | Descripción |
|-------|------|-------------|
| `survey.isLoading()` | `boolean` | `true` mientras se carga |
| `survey.error()` | `unknown` | Error de la última carga, o `undefined` |
| `survey.value()` | `SurveySchema \| undefined` | El esquema cargado y validado |
| `survey.status()` | `ResourceStatus` | Estado detallado: `Idle`, `Loading`, `Resolved`, `Error` |

## SchemaParser

El `SchemaParser` valida estructuralmente el JSON antes de tiparlo.

### Errores de validación

| Condición | Error |
|-----------|-------|
| JSON no es objeto | `"Schema must be a non-null object"` |
| Falta `id` | `"Schema missing required string field: "id""` |
| Tipo de campo inválido | `"Field 'X' has invalid type 'Y'. Valid types: ..."` |
| Falta `label` | `"Field 'X' missing required 'label'"` |

### Uso directo

```typescript
import { parseSchema } from '@app/core/parsers';

const raw = await fetch('/schemas/mi-encuesta.json').then(r => r.json());
const schema = parseSchema(raw); // throws if invalid, returns SurveySchema
```

## Ubicación de Esquemas JSON

Los archivos JSON se ubican en `survey-maker/public/schemas/`. Angular sirve estos archivos como assets estáticos en `/schemas/<filename>.json`.

```
survey-maker/public/schemas/
├── ejemplo-feedback.json    # Encuesta de satisfacción del cliente
└── ejemplo-registro.json   # (Próximamente)
```

## Notas de Implementación

- Se usa `rxResource` (de `@angular/core/rxjs-interop`) en lugar de `resource()` porque el servicio usa `HttpClient`, que expone Observables. `rxResource` acepta un `stream` que retorna un `Observable<T>`, evitando la conversión con `lastValueFrom`.
- Cuando `surveyId` es `null`, el `stream` retorna `of(undefined)`, poniendo el resource en estado `Idle` sin disparar ninguna petición HTTP.
- `parseSchema` lanza un `Error` sincrónicamente si el JSON no es válido; `rxResource` captura esa excepción y la expone en `survey.error()`.
