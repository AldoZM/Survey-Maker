# Esquema JSON de Encuestas — Survey Maker

## Introducción

El motor de Survey Maker está dirigido por datos. Las encuestas no se definen en HTML ni en TypeScript directamente, sino mediante un **archivo JSON** que describe la estructura, los campos, las validaciones y la lógica condicional de la encuesta.

Este documento describe el contrato completo del esquema JSON.

## Estructura Raíz (`SurveySchema`)

```json
{
  "id": "string (único, requerido)",
  "title": "string (requerido)",
  "description": "string (opcional)",
  "version": "string (requerido, ej: '1.0.0')",
  "submitLabel": "string (opcional, default: 'Enviar')",
  "sections": [ /* Array de SurveySection */ ]
}
```

## Secciones (`SurveySection`)

```json
{
  "id": "string (único dentro de la encuesta)",
  "title": "string",
  "description": "string (opcional)",
  "fields": [ /* Array de QuestionField */ ]
}
```

## Campos (`QuestionField`)

```json
{
  "id": "string (único dentro de la encuesta)",
  "type": "text | email | number | textarea | select | radio | checkbox",
  "label": "string",
  "placeholder": "string (opcional, para text/email/number/textarea)",
  "hint": "string (opcional, texto de ayuda)",
  "defaultValue": "string | string[] | number | boolean (opcional)",
  "validation": { /* ValidationRule */ },
  "options": [ /* FieldOption[], requerido para select/radio/checkbox */ ],
  "condition": { /* ConditionalLogic, opcional */ }
}
```

## Tipos de Campo (`FieldType`)

| Tipo | Descripción | Requiere `options` |
|------|-------------|-------------------|
| `text` | Entrada de texto de una línea | No |
| `email` | Campo de correo electrónico | No |
| `number` | Campo numérico | No |
| `textarea` | Área de texto multilínea | No |
| `select` | Lista desplegable (selección única) | Sí |
| `radio` | Botones de opción (selección única) | Sí |
| `checkbox` | Casillas de verificación (selección múltiple) | Sí |

## Validaciones (`ValidationRule`)

```json
{
  "required": true,
  "min": 2,
  "max": 100,
  "pattern": "^[A-Za-z ]+$",
  "message": "Solo se permiten letras y espacios"
}
```

| Propiedad | Tipo | Aplica a | Descripción |
|-----------|------|----------|-------------|
| `required` | boolean | Todos | El campo no puede estar vacío |
| `min` | number | text, email, textarea, number | Longitud mínima (texto) o valor mínimo (número) |
| `max` | number | text, email, textarea, number | Longitud máxima (texto) o valor máximo (número) |
| `pattern` | string (RegExp) | text, email, textarea | El valor debe coincidir con este patrón |
| `message` | string | Todos | Mensaje personalizado cuando la validación falla |

## Opciones para Campos de Selección (`FieldOption`)

```json
{
  "value": "string (valor enviado al servidor)",
  "label": "string (texto mostrado al usuario)",
  "disabled": false
}
```

## Lógica Condicional (`ConditionalLogic`)

Permite mostrar un campo solo cuando otro campo tiene un valor específico.

```json
{
  "dependsOn": "id-del-campo-origen",
  "equals": "valor | [array de valores] | true | false | número"
}
```

### Ejemplo de uso:

```json
{
  "id": "razon-insatisfaccion",
  "type": "textarea",
  "label": "¿Por qué no estás satisfecho?",
  "condition": {
    "dependsOn": "nivel-satisfaccion",
    "equals": "insatisfecho"
  }
}
```

## Ejemplo Completo de Encuesta

```json
{
  "id": "feedback-cliente-2024",
  "title": "Encuesta de Satisfacción del Cliente",
  "description": "Tu opinión nos ayuda a mejorar. Toma menos de 3 minutos.",
  "version": "1.0.0",
  "submitLabel": "Enviar mis respuestas",
  "sections": [
    {
      "id": "datos-personales",
      "title": "Datos Generales",
      "fields": [
        {
          "id": "nombre",
          "type": "text",
          "label": "Nombre completo",
          "placeholder": "Ej: Juan García",
          "validation": { "required": true, "min": 2, "max": 100 }
        },
        {
          "id": "email",
          "type": "email",
          "label": "Correo electrónico",
          "placeholder": "correo@ejemplo.com",
          "validation": { "required": true }
        }
      ]
    },
    {
      "id": "satisfaccion",
      "title": "Tu Experiencia",
      "fields": [
        {
          "id": "nivel-satisfaccion",
          "type": "radio",
          "label": "¿Qué tan satisfecho estás con nuestro servicio?",
          "validation": { "required": true },
          "options": [
            { "value": "muy-satisfecho", "label": "Muy satisfecho" },
            { "value": "satisfecho", "label": "Satisfecho" },
            { "value": "neutral", "label": "Neutral" },
            { "value": "insatisfecho", "label": "Insatisfecho" },
            { "value": "muy-insatisfecho", "label": "Muy insatisfecho" }
          ]
        },
        {
          "id": "razon-insatisfaccion",
          "type": "textarea",
          "label": "¿Por qué no estás satisfecho?",
          "placeholder": "Cuéntanos qué podríamos mejorar...",
          "validation": { "required": true, "min": 10 },
          "condition": {
            "dependsOn": "nivel-satisfaccion",
            "equals": ["insatisfecho", "muy-insatisfecho"]
          }
        },
        {
          "id": "aspectos-mejora",
          "type": "checkbox",
          "label": "¿Qué aspectos podríamos mejorar?",
          "options": [
            { "value": "velocidad", "label": "Velocidad del servicio" },
            { "value": "calidad", "label": "Calidad del producto" },
            { "value": "precio", "label": "Precio" },
            { "value": "atencion", "label": "Atención al cliente" },
            { "value": "interfaz", "label": "Interfaz / Experiencia digital" }
          ]
        }
      ]
    }
  ]
}
```

## Ubicación de Esquemas en el Proyecto

Los esquemas JSON de ejemplo se almacenan en:
```
survey-maker/public/schemas/
├── ejemplo-feedback.json
└── ejemplo-registro.json
```

El `SurveyLoaderService` usa la Resource API de Angular para cargar estos archivos.
