# Motor de Renderizado Dinámico — Survey Maker

## Introducción

El motor de renderizado convierte un `SurveySchema` en una interfaz de usuario interactiva. No hay HTML estático predefinido — cada campo se renderiza dinámicamente en función del esquema JSON cargado.

## Arquitectura de Componentes

```
SurveyPageComponent
  ├── (loading)  → <mat-progress-bar>
  ├── (error)    → mensaje de error
  └── (success)  → SurveyComponent
                     └── @for sections → SurveySection
                           └── @for fields → FieldRendererComponent
                                 ├── @if isVisible (ConditionalLogic)
                                 └── @switch field.type
                                       ├── TextFieldComponent (text, email)
                                       ├── NumberFieldComponent
                                       ├── TextareaFieldComponent
                                       ├── SelectFieldComponent
                                       ├── RadioFieldComponent
                                       └── CheckboxFieldComponent
```

## SurveyPageComponent

Componente de página que usa `SurveyLoaderService` para cargar el esquema.

```html
<!-- Integración en router -->
{ path: '', loadComponent: () => import('./features/survey/survey-page.component') }
```

Para cambiar qué encuesta se muestra, modificar el ID en `ngOnInit()`:
```typescript
this.loader.loadSurvey('mi-encuesta');
```

## SurveyComponent

Renderiza un `SurveySchema` completo. Mantiene el estado de respuestas en un `signal<Record<string, unknown>>`.

**Inputs:**
| Input | Tipo | Descripción |
|-------|------|-------------|
| `schema` | `SurveySchema` | El esquema de la encuesta a renderizar |

**Uso:**
```html
<app-survey [schema]="mySchema" />
```

## FieldRendererComponent

Actúa como puente entre la estructura del esquema y los componentes de campo específicos.

**Inputs:**
| Input | Tipo | Descripción |
|-------|------|-------------|
| `field` | `QuestionField` | La definición del campo |
| `answers` | `Record<string, unknown>` | Respuestas actuales (para lógica condicional) |
| `value` | `unknown` | Valor actual de este campo |

**Outputs:**
| Output | Tipo | Descripción |
|--------|------|-------------|
| `valueChange` | `unknown` | Emite cuando el usuario cambia el valor |

**Lógica condicional:**
La propiedad `isVisible` es un `computed()` que evalúa `field.condition` contra las respuestas actuales. Si el campo referenciado en `condition.dependsOn` no coincide con `condition.equals`, el campo no se renderiza.

## Componentes de Campo

Todos los field components comparten el mismo contrato:

| Input | Tipo | Descripción |
|-------|------|-------------|
| `field` | `QuestionField` | Definición del campo |
| `value` | variable | Valor actual del campo |

| Output | Tipo | Descripción |
|--------|------|-------------|
| `valueChange` | variable | Nuevo valor cuando el usuario edita |

| Componente | Tipo de campo | Material |
|-----------|--------------|---------|
| `TextFieldComponent` | text, email | `mat-form-field + input[matInput]` |
| `NumberFieldComponent` | number | `mat-form-field + input[matInput type=number]` |
| `TextareaFieldComponent` | textarea | `mat-form-field + textarea[matInput]` |
| `SelectFieldComponent` | select | `mat-form-field + mat-select` |
| `RadioFieldComponent` | radio | `mat-radio-group + mat-radio-button` |
| `CheckboxFieldComponent` | checkbox | múltiples `mat-checkbox` |

## Uso de Control Flow Nativo

El motor usa exclusivamente el control flow moderno de Angular 21:

```html
@for (section of schema().sections; track section.id) { ... }
@for (field of section.fields; track field.id) { ... }
@if (isVisible()) { ... }
@switch (field.type) {
  @case ('text') { ... }
  @case ('select') { ... }
}
@let f = field();   ← @let para limpiar lógica
```
