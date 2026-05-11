# Arquitectura del Proyecto — Survey Maker

## Visión General

Survey Maker es un generador de encuestas dinámico basado en Angular 21, arquitectura Signal-First y Zoneless por defecto.

## Estructura de Carpetas

```
repo/
├── docs/                    # Documentación técnica del proyecto
│   ├── arquitectura.md      # Este archivo
│   ├── esquema-json.md      # Contrato del JSON de encuestas
│   ├── resource-api.md      # Resource API y carga de datos
│   ├── motor-renderizado.md # Dynamic Form Engine
│   ├── signals.md           # Gestión de estado con Signals
│   └── guia-uso.md          # Guía de uso y ejemplos
└── survey-maker/            # Aplicación Angular 21
    └── src/
        └── app/
            ├── core/        # Interfaces, servicios y parsers
            ├── features/    # Componentes de encuesta
            │   ├── survey/  # SurveyComponent + FieldRenderer
            │   └── fields/  # Componentes por tipo de campo
            └── shared/      # Directivas y utilidades
```

## Pilares Técnicos

| Tecnología | Uso |
|-----------|-----|
| **Angular 21** | Standalone components, Zoneless, Signal-First |
| **Signals** | `signal()`, `computed()`, `effect()` para estado reactivo |
| **Resource API** | `resource()` para carga asíncrona de esquemas JSON |
| **Angular Material** | Componentes UI |
| **SCSS** | Estilos con soporte para temas Material |

## Arquitectura de Capas

```
JSON Schema → SchemaParser → SurveyStateService → SurveyComponent
                                                         ↓
                                              FieldRendererComponent
                                                         ↓
                               [TextFieldComponent | SelectFieldComponent | ...]
```

## Configuración Zoneless

La aplicación usa `provideZonelessChangeDetection()` en `app.config.ts`, eliminando Zone.js del bundle. Los cambios de estado se propagan exclusivamente mediante Angular Signals.
