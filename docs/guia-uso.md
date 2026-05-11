# Guía de Uso — Survey Maker

## Inicio Rápido

Para mostrar una encuesta, simplemente configura el `SurveyPageComponent` como ruta y coloca tu archivo JSON en `public/schemas/`.

### 1. Crear tu esquema JSON

Crea `survey-maker/public/schemas/mi-encuesta.json` siguiendo el contrato definido en [esquema-json.md](./esquema-json.md).

### 2. Cargar la encuesta

```typescript
// En SurveyPageComponent (o cualquier componente)
this.loader.loadSurvey('mi-encuesta');  // Carga /schemas/mi-encuesta.json
```

### 3. La UI se construye automáticamente

El motor de renderizado interpreta el JSON y genera los campos correspondientes.

---

## Agregar una Nueva Encuesta

1. Crea `survey-maker/public/schemas/nueva-encuesta.json`
2. Asegúrate que el JSON tiene `id`, `title`, `version` y al menos una `section` con `fields`
3. Llama `loader.loadSurvey('nueva-encuesta')` desde el componente de página

---

## Tipos de Campo Disponibles

### text / email

```json
{
  "id": "nombre",
  "type": "text",
  "label": "¿Cuál es tu nombre?",
  "placeholder": "Ej: Juan García",
  "validation": { "required": true, "min": 2, "max": 100 }
}
```

### number

```json
{
  "id": "edad",
  "type": "number",
  "label": "¿Cuántos años tienes?",
  "validation": { "required": true, "min": 0, "max": 120 }
}
```

### textarea

```json
{
  "id": "comentario",
  "type": "textarea",
  "label": "Comentarios adicionales",
  "placeholder": "Escribe aquí tus comentarios...",
  "validation": { "required": false, "max": 500 }
}
```

### select

```json
{
  "id": "pais",
  "type": "select",
  "label": "País de origen",
  "validation": { "required": true },
  "options": [
    { "value": "mx", "label": "México" },
    { "value": "es", "label": "España" },
    { "value": "ar", "label": "Argentina" }
  ]
}
```

### radio

```json
{
  "id": "satisfaccion",
  "type": "radio",
  "label": "¿Qué tan satisfecho estás?",
  "validation": { "required": true },
  "options": [
    { "value": "muy-satisfecho", "label": "Muy satisfecho" },
    { "value": "satisfecho", "label": "Satisfecho" },
    { "value": "insatisfecho", "label": "Insatisfecho" }
  ]
}
```

### checkbox

```json
{
  "id": "preferencias",
  "type": "checkbox",
  "label": "¿Qué características te gustan?",
  "options": [
    { "value": "velocidad", "label": "Velocidad" },
    { "value": "diseño", "label": "Diseño" },
    { "value": "precio", "label": "Precio" }
  ]
}
```

---

## Lógica Condicional

Un campo se muestra solo cuando otro campo tiene un valor específico.

### Caso 1: Igualdad simple

```json
{
  "id": "motivo",
  "type": "textarea",
  "label": "¿Por qué estás insatisfecho?",
  "condition": {
    "dependsOn": "satisfaccion",
    "equals": "insatisfecho"
  }
}
```

### Caso 2: Múltiples valores (OR)

```json
{
  "id": "detalles",
  "type": "textarea",
  "label": "Cuéntanos más",
  "condition": {
    "dependsOn": "satisfaccion",
    "equals": ["insatisfecho", "muy-insatisfecho"]
  }
}
```

---

## Validaciones

| Regla | JSON | Descripción |
|-------|------|-------------|
| Requerido | `"required": true` | Campo no puede estar vacío |
| Longitud mínima | `"min": 5` | Texto: al menos 5 caracteres |
| Longitud máxima | `"max": 200` | Texto: máximo 200 caracteres |
| Valor mínimo | `"min": 0` | Número: valor mínimo |
| Valor máximo | `"max": 100` | Número: valor máximo |
| Patrón | `"pattern": "^[A-Za-z]+$"` | Solo letras |
| Mensaje custom | `"message": "Solo letras"` | Mensaje de error personalizado |

### Ejemplo completo con validación

```json
{
  "id": "codigo-postal",
  "type": "text",
  "label": "Código Postal",
  "validation": {
    "required": true,
    "pattern": "^[0-9]{5}$",
    "message": "El código postal debe tener 5 dígitos"
  }
}
```

---

## Estado Persistente

Survey Maker guarda automáticamente el progreso en `localStorage` bajo la clave `survey-state-{surveyId}`. Si el usuario cierra y vuelve a abrir la página, sus respuestas se restauran automáticamente.

Para limpiar el estado guardado:
```typescript
localStorage.removeItem('survey-state-mi-encuesta');
```

---

## Acceso al Estado Programáticamente

Inyectar `SurveyStateService` en cualquier componente standalone:

```typescript
import { Component, inject } from '@angular/core';
import { SurveyStateService } from '../core/services';

@Component({ selector: 'app-my', standalone: true, template: `...` })
export class MyComponent {
  readonly state = inject(SurveyStateService);

  showSummary(): void {
    console.log(this.state.progress());      // 0–100
    console.log(this.state.isValid());       // true/false
    console.log(this.state.getValue('nombre'));  // valor actual (unknown)
    console.log(this.state.getError('email'));   // 'email es requerido' | null
  }
}
```

En template (con `@if` y `@let`):

```html
@let progress = state.progress();
<mat-progress-bar [value]="progress" />
<span>{{ progress }}% completado</span>

@if (!state.isValid()) {
  <p>Hay campos requeridos sin completar.</p>
}
```

---

## Estructura de Archivos del Proyecto

```
survey-maker/
├── public/schemas/          ← Coloca aquí tus JSON de encuestas
│   └── ejemplo-feedback.json
├── src/
│   └── app/
│       ├── core/
│       │   ├── interfaces/  ← Tipos TypeScript del esquema
│       │   ├── parsers/     ← Validación del JSON
│       │   └── services/    ← SurveyLoaderService, SurveyStateService
│       ├── features/
│       │   ├── survey/      ← SurveyComponent, FieldRenderer, Page
│       │   └── fields/      ← Componentes de campo por tipo
│       └── shared/
│           └── directives/  ← RequiredMark, FieldError
└── docs/                    ← Esta documentación
```
