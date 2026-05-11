# Survey Maker - Generador de Encuestas (Angular 21)

## Introducción
Este proyecto tiene como objetivo desarrollar un generador de encuestas dinámico, escalable y de alto rendimiento utilizando **Angular 21**. La arquitectura se basa en la interpretación de esquemas JSON para la renderización de formularios de manera declarativa, aprovechando la madurez de las APIs reactivas modernas.

## Tecnologías y Características Principales
- **Angular 21**: Uso de la arquitectura **Signal-First** y componentes Standalone. Optimizada para aplicaciones **Zoneless** por defecto.
- **Signals (Madurez Total)**: Gestión de estado reactivo mediante signal(), computed() y effect(). Integración profunda con inputs, outputs y models basados en signals.
- **Resource API (Estable)**: Uso de esource() y xResource() para la carga asíncrona de los esquemas JSON de las encuestas. Esto simplifica el manejo de estados de carga (loading), error y datos sin necesidad de lógica compleja de RxJS.
- **Formularios Dinámicos (JSON)**: Los formularios se generan a partir de una estructura JSON que describe campos, validaciones y lógica condicional.
- **Directivas y Decoradores**: Implementación de directivas para comportamientos del DOM y decoradores para metadatos de configuración en modelos.

## Arquitectura Propuesta
1.  **SurveyCore (Engine)**: El motor principal que procesa el JSON.
2.  **Field Renderer**: Componente genérico para renderizar campos específicos.
3.  **State Service**: Servicio basado en Signals para el estado global de respuestas.
4.  **Resource Loader**: Implementación basada en la **Resource API** para obtener y validar los esquemas JSON desde el servidor o activos locales.

## Plan de Trabajo Detallado
### Fase 1: Cimientos y Configuración
- Inicialización del proyecto con Angular 21.
- Configuración de arquitectura Zoneless.
- Definición de interfaces para el esquema JSON.

### Fase 2: Carga de Datos y Resource API
- Implementación del servicio de carga utilizando esource().
- Validación estructural de los JSON recibidos.

### Fase 3: Motor de Renderizado Signal-First
- Construcción del renderizador dinámico utilizando el flujo de control nativo (@if, @for).
- Integración de @let para limpieza de lógica en plantillas.

### Fase 4: Reactividad Avanzada y Validaciones
- Uso de computed() para validaciones cruzadas y progreso.
- Creación de directivas personalizadas para interacción avanzada.

### Fase 5: Finalización y Calidad
- Pruebas unitarias de componentes de campo.
- Documentación del esquema JSON final.

---
**Repositorio Oficial:** https://github.com/AldoZM/Survey-Maker
**Ubicación de Documentación:** D:\Codigo Abierto\GenEncuesta
