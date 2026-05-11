# Gestión de Estado con Signals — Survey Maker

## Introducción

Survey Maker usa la arquitectura **Signal-First** de Angular 21 para gestionar el estado de las respuestas, la validación y el progreso de la encuesta. Esto elimina la necesidad de RxJS en la UI y mejora la detección de cambios gracias a la integración Zoneless.

## SurveyStateService

El servicio central de estado. Todas las respuestas, validaciones y el progreso de la encuesta viven aquí.

### Signals expuestos

| Signal | Tipo | Descripción |
|--------|------|-------------|
| `answers` | `Signal<Record<string, FieldAnswer>>` | Mapa de fieldId → respuesta actual |
| `schema` | `Signal<SurveySchema \| null>` | Esquema actualmente cargado |
| `isSubmitted` | `Signal<boolean>` | true si la encuesta fue enviada |
| `progress` | `computed` → `number` | Porcentaje de campos requeridos completados (0–100) |
| `isValid` | `computed` → `boolean` | true cuando todos los campos requeridos son válidos |

### API de métodos

| Método | Descripción |
|--------|-------------|
| `initSurvey(schema)` | Inicializa el estado. Restaura desde localStorage si existe |
| `setAnswer(fieldId, value)` | Actualiza la respuesta y valida el campo |
| `getValue(fieldId)` | Retorna el valor actual del campo |
| `getError(fieldId)` | Retorna el mensaje de error si el campo es dirty e inválido |
| `touchAll()` | Marca todos los campos como dirty (para mostrar errores al submit) |

## Flujo de Estado

```
Usuario interactúa → setAnswer(id, value)
                           ↓
                   validate(field, value) → isValid: boolean
                           ↓
             answers.update() [inmutable, spread]
                           ↓
            computed: progress() se actualiza
            computed: isValid() se actualiza
                           ↓
          effect: localStorage.setItem (persistencia automática)
```

## computed() — Cálculos Reactivos

### progress()

Calcula el porcentaje de completitud basado en campos requeridos con respuestas válidas:

```typescript
readonly progress = computed(() => {
  const requiredFields = allFields.filter(f => f.validation?.required);
  const answeredRequired = requiredFields.filter(f => answers()[f.id]?.isValid);
  return Math.round((answeredRequired.length / requiredFields.length) * 100);
});
```

### isValid()

```typescript
readonly isValid = computed(() =>
  allRequiredFields.every(f => answers()[f.id]?.isValid ?? false)
);
```

## effect() — Persistencia en localStorage

```typescript
effect(() => {
  const answers = this.answers();       // reactivo
  const schema = untracked(() => this.schema()); // no-reactivo (evita doble trigger)
  if (!schema) return;
  localStorage.setItem(`survey-state-${schema.id}`, JSON.stringify(answers));
}, { injector: this.injector });
```

`untracked()` evita que el efecto se re-ejecute cuando `schema` cambia — solo queremos persistir cuando `answers` cambia.

## Directivas Personalizadas

### RequiredMarkDirective

Agrega un asterisco (*) rojo al label de campos requeridos que no usan `mat-form-field`.

```html
<div class="field-label" [appRequiredMark]="field().validation?.required ?? false">
  {{ field().label }}
</div>
```

### FieldErrorDirective

Agrega la clase CSS `field--error` y el atributo `aria-invalid` cuando el campo tiene error.

```html
<div [appFieldError]="!!errorMessage()">
  <app-radio-field ... />
</div>
```

## Validación

La validación ocurre en `SurveyStateService.validate()`:

| Regla | Aplica a | Lógica |
|-------|----------|--------|
| `required: true` | Todos | value !== null && value !== '' && array.length > 0 |
| `min` (texto) | text, email, textarea | value.length >= min |
| `max` (texto) | text, email, textarea | value.length <= max |
| `min` (número) | number | value >= min |
| `max` (número) | number | value <= max |
| `pattern` | text, email, textarea | new RegExp(pattern).test(value) |

Los errores solo se muestran cuando el campo es **dirty** (el usuario lo ha tocado). Llamar a `touchAll()` antes del submit fuerza todos los errores a mostrarse.
