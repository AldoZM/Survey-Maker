# Survey Maker - Generador de Encuestas (Angular 19+)

## Introducción
Este proyecto tiene como objetivo desarrollar un generador de encuestas dinámico, escalable y de alto rendimiento utilizando las últimas capacidades de Angular 19+. La arquitectura se basa en la interpretación de esquemas JSON para la renderización de formularios de manera declarativa.

## Tecnologías y Características Principales
- **Angular 19+**: Uso exclusivo de Standalone Components y el nuevo flujo de control nativo (@if, @for, @switch).
- **Signals**: Gestión de estado reactivo mediante signal(), computed() y effect(). Esto reemplaza la dependencia pesada de RxJS en la UI y mejora la detección de cambios (Zoneless ready).
- **Formularios Dinámicos (JSON)**: Los formularios no se definen estáticamente en el HTML, sino que se generan a partir de una estructura JSON que describe:
  - Tipos de entrada (text, select, radio, checkbox, etc.).
  - Reglas de validación (required, pattern, min/max).
  - Lógica condicional (mostrar X si la respuesta a Y es Z).
- **Directivas Personalizadas**: Utilizadas para comportamientos transversales como máscaras de entrada, validaciones personalizadas y manipulación del DOM específica para la encuesta.
- **Decoradores**: Implementación de decoradores personalizados para simplificar la configuración de metadatos en los modelos de preguntas.

## Arquitectura Propuesta
1.  **SurveyCore (Engine)**: El motor principal que procesa el JSON y emite el estado global de la encuesta.
2.  **Field Renderer**: Un componente genérico que actúa como puente para renderizar el componente específico de cada pregunta.
3.  **State Service**: Un servicio basado en Signals que mantiene el valor actual de cada respuesta y su estado de validez.
4.  **Schema Parser**: Lógica encargada de validar y tipar el JSON de entrada antes de ser procesado por el motor.

## Plan de Trabajo Detallado
### Fase 1: Cimientos y Configuración
- Inicialización del proyecto con Angular 19.
- Configuración de estilos globales y temas.
- Definición de las interfaces de TypeScript para el esquema JSON.

### Fase 2: Motor de Renderizado
- Creación del SurveyComponent base.
- Implementación de la lógica de renderizado dinámico basada en el esquema JSON.
- Integración del nuevo flujo de control de Angular.

### Fase 3: Reactividad con Signals
- Migración de la lógica de estado a signal().
- Implementación de computed() para cálculos en tiempo real (progreso de la encuesta, puntuaciones).
- Uso de effect() para persistencia local o sincronización con APIs.

### Fase 4: Extensiones y Validaciones
- Desarrollo de directivas para validaciones avanzadas.
- Creación de decoradores para inyección de configuraciones.
- Soporte para lógica condicional entre preguntas.

### Fase 5: Finalización y Calidad
- Pruebas unitarias de los componentes de campo.
- Documentación técnica exhaustiva del esquema JSON.
- Optimización de performance.

---
**Repositorio Oficial:** https://github.com/AldoZM/Survey-Maker
**Ubicación de Documentación:** D:\Codigo Abierto\GenEncuesta
