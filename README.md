# Survey Maker

Generador de encuestas dinámico y reactivo — **Angular 21**, **Signal-First**, **Zoneless**.

## ¿Qué es?

Survey Maker interpreta archivos JSON para generar formularios interactivos. Campos, validaciones y lógica condicional se definen completamente en JSON — sin HTML por campo.

## Tecnologías

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Angular | 21 | Framework principal |
| Angular Material | 21 | Componentes UI |
| Signals | (nativo Angular 21) | Estado reactivo sin Zone.js |
| Resource API | (nativo Angular 21) | Carga asíncrona de esquemas |
| Vitest | 4.x | Pruebas unitarias |

## Características

- Formularios 100% basados en JSON
- Signal-First: `signal()`, `computed()`, `effect()` sin Zone.js
- Resource API para carga asíncrona con estados loading/error/success
- Validación en tiempo real: required, min/max, pattern
- Lógica condicional entre campos
- Persistencia automática en localStorage

## Inicio Rápido

```bash
cd survey-maker
npm install
ng serve          # http://localhost:4200
ng test           # Ejecutar pruebas
ng build          # Build de producción
```

## Estructura

```
repo/
├── docs/           # Documentación técnica completa
└── survey-maker/
    └── public/schemas/   # Archivos JSON de encuestas
```

## Documentación

Toda la documentación técnica está en [`docs/`](./docs/):

- [Guía de uso](./docs/guia-uso.md)
- [Esquema JSON](./docs/esquema-json.md)
- [Arquitectura](./docs/arquitectura.md)
- [Signals y estado](./docs/signals.md)

**Repositorio:** https://github.com/AldoZM/Survey-Maker
