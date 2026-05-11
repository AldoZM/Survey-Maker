# Survey Maker — Documentación Técnica del Código

**Proyecto:** Generador de encuestas dinámico  
**Framework:** Angular 21  
**Repositorio:** https://github.com/AldoZM/Survey-Maker  
**Live:** https://aldozm.github.io/Survey-Maker/

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Configuración de la aplicación (app.config.ts)](#2-configuración-de-la-aplicación)
3. [Interfaces TypeScript (contrato JSON)](#3-interfaces-typescript)
4. [Parser del esquema (schema.parser.ts)](#4-parser-del-esquema)
5. [Resource API — SurveyLoaderService](#5-resource-api--surveyloaderservice)
6. [Estado reactivo — SurveyStateService](#6-estado-reactivo--surveystatservice)
7. [Signals: signal, computed, effect, untracked](#7-signals-signal-computed-effect-untracked)
8. [Motor de renderizado — FieldRendererComponent](#8-motor-de-renderizado--fieldrenderercomponent)
9. [SurveyComponent — orquestador principal](#9-surveycomponent--orquestador-principal)
10. [Componentes de campo](#10-componentes-de-campo)
11. [Directivas personalizadas](#11-directivas-personalizadas)
12. [Nuevo control flow de Angular (@if, @for, @switch, @let)](#12-nuevo-control-flow-de-angular)
13. [Standalone Components (sin NgModules)](#13-standalone-components-sin-ngmodules)
14. [Signal Inputs y Outputs (input() / output())](#14-signal-inputs-y-outputs)
15. [Esquema JSON de encuesta](#15-esquema-json-de-encuesta)
16. [Angular Material](#16-angular-material)
17. [Routing y lazy loading](#17-routing-y-lazy-loading)
18. [Despliegue en GitHub Pages](#18-despliegue-en-github-pages)

---

## 1. Arquitectura general

```
survey-maker/src/app/
├── app.config.ts            ← Providers globales (Zoneless, Router, HttpClient)
├── app.routes.ts            ← Rutas con lazy loading
├── app.ts                   ← Componente raíz
│
├── core/
│   ├── interfaces/          ← Contratos TypeScript del JSON
│   ├── parsers/             ← Validación y casteo del JSON crudo
│   └── services/            ← Lógica de negocio reactiva
│
├── features/
│   ├── fields/              ← Componentes atómicos de campo
│   └── survey/              ← Página, componente orquestador, renderizador
│
└── shared/directives/       ← Directivas reutilizables
```

El proyecto sigue un patrón de **capas**:

| Capa | Responsabilidad |
|------|----------------|
| `core/interfaces` | Contratos TypeScript — define la forma de los datos |
| `core/parsers` | Valida JSON desconocido y lo convierte a tipos seguros |
| `core/services` | Estado reactivo global (Signals) + carga de datos (Resource API) |
| `features` | Componentes UI: renderizado, campos, página |
| `shared/directives` | Comportamientos reutilizables del DOM |

---

## 2. Configuración de la aplicación

**Archivo:** `src/app/app.config.ts`

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), // Captura errores globales del browser
    provideZonelessChangeDetection(),      // ← ANGULAR 18+ Zoneless
    provideRouter(routes),                 // Router con lazy loading
    provideHttpClient(),                   // HttpClient para cargar JSONs
  ]
};
```

### `provideZonelessChangeDetection()` — Angular 18+

Esta es una de las características más importantes de Angular moderno. Normalmente Angular usa **Zone.js** para detectar cambios: intercepta todos los eventos del navegador (clicks, timers, fetch, etc.) y dispara la detección de cambios automáticamente.

Con **Zoneless**, Angular elimina Zone.js completamente. La detección de cambios **solo ocurre cuando un Signal cambia**. Ventajas:

- Bundle más pequeño (sin Zone.js)
- Mejor rendimiento (sin monkey-patching de APIs del browser)
- Más predecible (sabes exactamente cuándo cambia la UI)

**Consecuencia:** Si usas `setTimeout` o `setInterval` directamente sin involucrar un Signal, la UI no se actualiza. Todo estado debe vivir en Signals.

---

## 3. Interfaces TypeScript

**Archivo:** `src/app/core/interfaces/survey.interfaces.ts`

Las interfaces definen el **contrato** de los datos. Son puramente TypeScript — no generan código JavaScript en runtime.

### `FieldType` — Union Type

```typescript
export type FieldType =
  | 'text' | 'email' | 'number' | 'textarea'
  | 'select' | 'radio' | 'checkbox';
```

Un **union type** permite que una variable sea exactamente uno de los valores listados. Si en el JSON aparece `"type": "date"`, TypeScript lo marcará como error.

### `ValidationRule`

```typescript
export interface ValidationRule {
  required?: boolean;  // ? = opcional
  min?: number;        // longitud mínima (texto) o valor mínimo (número)
  max?: number;
  pattern?: string;    // RegEx como string
  message?: string;    // mensaje de error personalizado
}
```

### `ConditionalLogic`

```typescript
export interface ConditionalLogic {
  dependsOn: string;                          // ID del campo que controla visibilidad
  equals: string | string[] | boolean | number; // valor(es) que activan el campo
}
```

Este interface permite lógica condicional en el formulario: un campo se muestra solo cuando otro campo tiene un valor específico.

### `QuestionField`

```typescript
export interface QuestionField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  hint?: string;
  validation?: ValidationRule;
  options?: FieldOption[];      // requerido para select/radio/checkbox
  condition?: ConditionalLogic;
  defaultValue?: string | string[] | number | boolean;
}
```

### `FieldAnswer`

```typescript
export interface FieldAnswer {
  fieldId: string;
  value: string | string[] | number | boolean | null;
  isValid: boolean;  // ¿pasa todas las validaciones?
  isDirty: boolean;  // ¿el usuario ya tocó este campo?
}
```

`isDirty` es clave para la UX: los errores de validación solo se muestran después de que el usuario interactúa con el campo. Sin esto, verías errores en campos que nunca tocaste.

---

## 4. Parser del esquema

**Archivo:** `src/app/core/parsers/schema.parser.ts`

El parser convierte `unknown` (JSON crudo de HTTP) en un `SurveySchema` tipado. Es una **función pura** — sin efectos secundarios, sin `this`, sin estado.

```typescript
export function parseSchema(raw: unknown): SurveySchema {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Schema must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;
  // Verifica campos requeridos...
  return {
    id: obj['id'] as string,
    sections: (obj['sections'] as unknown[]).map((s, i) => parseSection(s, i)),
    // ...
  };
}
```

### Por qué recibir `unknown` en lugar de `any`

Con `any` TypeScript no verifica nada — puedes hacer `raw.sections[0].id` sin error aunque `raw` sea un string. Con `unknown`, TypeScript te obliga a verificar el tipo antes de usarlo, lo que fuerza al parser a ser explícito en cada acceso.

### Funciones helper privadas

El parser tiene 4 funciones privadas en cascada:

```
parseSchema()
  └── parseSection()
        └── parseField()
              ├── parseValidation()
              ├── parseOptions()
              └── parseCondition()
```

Cada función lanza un `Error` descriptivo si la estructura es inválida. Cuando el `rxResource` en el servicio captura este error, lo expone en `survey.error()` para mostrarlo en la UI.

---

## 5. Resource API — SurveyLoaderService

**Archivo:** `src/app/core/services/survey-loader.service.ts`

### `rxResource` — Angular 19+

`rxResource` es parte de la **Resource API**, una característica nueva de Angular que combina Signals con RxJS para cargar datos asincrónicos de forma reactiva.

```typescript
@Injectable({ providedIn: 'root' })
export class SurveyLoaderService {
  private readonly http = inject(HttpClient);

  // Signal que controla qué encuesta se carga
  readonly surveyId = signal<string | null>(null);

  // Recurso reactivo: se actualiza automáticamente cuando surveyId cambia
  readonly survey = rxResource({
    params: () => this.surveyId(),           // ← reactivo al signal
    stream: ({ params: id }) => {            // ← función de carga
      if (!id) return of(undefined);
      return this.http
        .get<unknown>(`schemas/${id}.json`)  // path RELATIVO (importante)
        .pipe(map((raw) => parseSchema(raw)));
    },
  });

  loadSurvey(id: string): void {
    this.surveyId.set(id);  // cambia el signal → dispara la carga
  }
}
```

### Cómo funciona `rxResource`

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `survey.isLoading()` | `boolean` | `true` mientras el HTTP request está en vuelo |
| `survey.error()` | `unknown` | Error de HTTP o del parser, o `undefined` si ok |
| `survey.value()` | `SurveySchema \| undefined` | Esquema validado, o `undefined` si cargando/error |
| `survey.status()` | `ResourceStatus` | `Idle`, `Loading`, `Resolved`, `Error` |

Cuando `surveyId` cambia, `rxResource` automáticamente:
1. Cancela la petición anterior (si había una en vuelo)
2. Pone `isLoading()` en `true`
3. Ejecuta el `stream`
4. Actualiza `value()` o `error()` con el resultado

### `inject()` — Inyección de dependencias funcional (Angular 14+)

```typescript
private readonly http = inject(HttpClient);
```

`inject()` reemplaza el constructor para inyección de dependencias. Solo funciona durante la construcción del componente/servicio (contexto de inyección). Es más flexible que el constructor clásico y funciona dentro de funciones helper.

### Path relativo para GitHub Pages

```typescript
// ✅ CORRECTO — relativo, respeta base href
`schemas/${id}.json`

// ❌ INCORRECTO — absoluto, ignora base href
`/schemas/${id}.json`
```

Con `<base href="/Survey-Maker/">`, el path relativo se resuelve a
`https://aldozm.github.io/Survey-Maker/schemas/id.json`. El path absoluto
ignoraría el base href y buscaría en `https://aldozm.github.io/schemas/id.json` (404).

---

## 6. Estado reactivo — SurveyStateService

**Archivo:** `src/app/core/services/survey-state.service.ts`

Servicio centralizado que mantiene todas las respuestas del formulario como Signals.

```typescript
@Injectable({ providedIn: 'root' })
export class SurveyStateService {
  // ── Signals de estado ──────────────────────────────────────────────
  readonly answers  = signal<Record<string, FieldAnswer>>({});
  readonly schema   = signal<SurveySchema | null>(null);
  readonly isSubmitted = signal<boolean>(false);
  readonly currentSectionIndex = signal<number>(0);

  // ── Computed: se recalculan automáticamente ────────────────────────
  readonly progress = computed(() => { /* ratio campos requeridos respondidos */ });
  readonly isValid  = computed(() => { /* todos los campos requeridos son válidos */ });
```

### `progress` computed

```typescript
readonly progress = computed(() => {
  const s = this.schema();
  if (!s) return 0;
  const allFields = s.sections.flatMap(sec => sec.fields);
  const requiredFields = allFields.filter(f => f.validation?.required);
  if (requiredFields.length === 0) return 100;
  const answeredRequired = requiredFields.filter(f => {
    const ans = this.answers()[f.id];
    return ans?.isValid && ans.isDirty;
  });
  return Math.round((answeredRequired.length / requiredFields.length) * 100);
});
```

Este `computed` lee dos signals: `schema()` y `answers()`. Angular sabe que depende de ambos y lo recalcula automáticamente cuando cualquiera cambia.

### `effect()` para persistencia en localStorage

```typescript
constructor() {
  effect(() => {
    const s = untracked(() => this.schema()); // ← lee schema sin crear dependencia
    const answers = this.answers();           // ← crea dependencia en answers
    if (!s) return;
    localStorage.setItem(`survey-state-${s.id}`, JSON.stringify(answers));
  }, { injector: this.injector });
}
```

El `effect` se ejecuta cada vez que `answers` cambia. Pero leer `schema()` también crearía una dependencia — lo que causaría que el efecto se ejecute cuando carga un nuevo schema (innecesario). `untracked()` lee el valor de `schema` sin registrar la dependencia.

### `answers.update()` — mutación inmutable

```typescript
this.answers.update(prev => ({
  ...prev,
  [fieldId]: { fieldId, value, isValid: this.validate(field, value), isDirty: true },
}));
```

`update()` recibe el valor anterior y retorna el nuevo. Angular detecta que el Signal cambió y notifica a todos los `computed` y `effect` que dependen de él.

### Validación

```typescript
private validate(field: QuestionField, value: unknown): boolean {
  const rules = field.validation;
  if (!rules) return true;

  if (rules.required) {
    if (value === null || value === '' ) return false;
    if (Array.isArray(value) && value.length === 0) return false;
  }
  if (typeof value === 'string') {
    if (rules.min !== undefined && value.length < rules.min) return false;
    if (rules.max !== undefined && value.length > rules.max) return false;
    if (rules.pattern) {
      try { if (!new RegExp(rules.pattern).test(value)) return false; }
      catch { /* patrón inválido — ignorar */ }
    }
  }
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) return false;
    if (rules.max !== undefined && value > rules.max) return false;
  }
  return true;
}
```

Para texto, `min`/`max` es longitud de caracteres. Para número, es el valor numérico.

---

## 7. Signals: signal, computed, effect, untracked

Los **Signals** son el sistema de reactividad de Angular moderno (estable desde Angular 17).

### `signal<T>(valorInicial)` — estado mutable

```typescript
const count = signal(0);
count();          // leer valor → 0
count.set(5);     // reemplazar → 5
count.update(v => v + 1); // actualizar basado en valor anterior → 6
```

Un Signal es un contenedor de valor que notifica a sus lectores cuando cambia.

### `computed(() => expresión)` — estado derivado (solo lectura)

```typescript
const double = computed(() => count() * 2);
double(); // 12 (si count es 6)
```

`computed` recalcula automáticamente cuando cualquier Signal que lee dentro cambia. No puede modificarse directamente — es puramente derivado.

### `effect(() => código)` — efectos secundarios reactivos

```typescript
effect(() => {
  console.log('Count changed:', count());
  // Guarda en localStorage, actualiza el DOM, hace HTTP, etc.
});
```

`effect` se ejecuta cuando cualquier Signal que lee cambia. Es el equivalente reactivo a `ngOnChanges` pero más granular.

### `untracked(() => expresión)` — lectura sin dependencia

```typescript
effect(() => {
  const answers = this.answers();           // ← crea dependencia
  const schema = untracked(() => this.schema()); // ← NO crea dependencia
  // El effect se ejecuta cuando answers cambia, pero no cuando schema cambia
});
```

Útil cuando necesitas un valor para una operación pero no quieres que ese valor dispare el efecto.

### ¿Por qué Signals en lugar de RxJS Observables?

| Aspecto | Observables (RxJS) | Signals |
|---------|-------------------|---------|
| Lectura del valor | `.subscribe()` o `async` pipe | `signal()` — sincrono |
| Composición | `combineLatest`, `map`, `switchMap` | `computed()` |
| Efectos secundarios | `tap()`, `subscribe()` | `effect()` |
| Manejo de errores | `catchError`, `error` callback | `try/catch` normal |
| Integración con templates | `async` pipe | Llamada directa `signal()` |
| Suscripciones | Manual con `takeUntilDestroyed` | Automáticas |

Signals son más simples para estado sincrónico. RxJS sigue siendo ideal para flujos asincrónicos complejos (por eso `rxResource` combina ambos).

---

## 8. Motor de renderizado — FieldRendererComponent

**Archivo:** `src/app/features/survey/field-renderer.component.ts`

Este componente es el **despachador**: recibe un campo del schema y decide qué componente de campo renderizar.

### Dispatch por tipo con `@switch`

```typescript
@switch (f.type) {
  @case ('text')     { <app-text-field ... /> }
  @case ('email')    { <app-text-field ... /> }  // email reusa text-field
  @case ('number')   { <app-number-field ... /> }
  @case ('textarea') { <app-textarea-field ... /> }
  @case ('select')   { <app-select-field ... /> }
  @case ('radio')    { <app-radio-field ... /> }
  @case ('checkbox') { <app-checkbox-field ... /> }
}
```

### `@let` — variable local en template (Angular 17+)

```typescript
@let f = field();
```

`@let` crea una variable local dentro del template para no repetir `field()` en cada binding. Es lectura única — si `field()` cambia, `f` no se actualiza automáticamente dentro del mismo bloque.

### Lógica condicional con `computed`

```typescript
readonly isVisible = computed(() => {
  const condition = this.field().condition;
  if (!condition) return true;
  const answer = this.answers()[condition.dependsOn];
  const expected = condition.equals;
  // Soporta equals como array: [valor1, valor2]
  if (Array.isArray(expected)) {
    return expected.includes(answer as string);
  }
  return answer === expected;
});
```

Cuando `isVisible()` es `false`, el `@if` saca el campo del DOM completamente — no solo lo oculta con CSS. Esto mejora el rendimiento y evita que campos ocultos pasen validaciones.

### Signals de tipo

Para pasar el valor correcto a cada componente hijo sin casteos en el template:

```typescript
readonly stringValue = computed(() => {
  const v = this.value();
  return typeof v === 'string' ? v : '';
});

readonly numberValue = computed(() => {
  const v = this.value();
  return typeof v === 'number' ? v : null;
});

readonly arrayValue = computed(() => {
  const v = this.value();
  return Array.isArray(v) ? (v as string[]) : [];
});
```

---

## 9. SurveyComponent — orquestador principal

**Archivo:** `src/app/features/survey/survey.component.ts`

```typescript
export class SurveyComponent {
  readonly schema = input.required<SurveySchema>();
  readonly state = inject(SurveyStateService);

  // Extrae valores crudos del mapa de FieldAnswer para lógica condicional
  readonly answersAsValues = computed(() => {
    const entries = Object.entries(this.state.answers());
    return Object.fromEntries(entries.map(([id, ans]) => [id, ans.value]));
  });

  constructor() {
    // Inicializa el estado cuando el schema cambia
    effect(() => {
      const s = this.schema();
      if (s) this.state.initSurvey(s);
    });
  }

  onSubmit(): void {
    this.state.touchAll();          // marca todos los campos como dirty
    if (this.state.isValid()) {     // solo envía si todo es válido
      this.state.isSubmitted.set(true);
    }
  }
}
```

### Template: iteración reactiva con `@for`

```html
@for (section of schema().sections; track section.id) {
  <section class="survey-section">
    @for (field of section.fields; track field.id) {
      <app-field-renderer
        [field]="field"
        [answers]="answersAsValues()"
        [value]="state.answers()[field.id]?.value"
        [errorMessage]="state.getError(field.id)"
        (valueChange)="state.setAnswer(field.id, $event)"
      />
    }
  </section>
}
```

`track field.id` es obligatorio en `@for` — le dice a Angular cómo identificar cada elemento para hacer diff eficiente del DOM (equivalente a `key` en React).

---

## 10. Componentes de campo

**Directorio:** `src/app/features/fields/`

Cada componente de campo es puramente presentacional — recibe datos via inputs y emite cambios via outputs. No tienen estado propio.

### Ejemplo: `RadioFieldComponent`

```typescript
@Component({
  selector: 'app-radio-field',
  standalone: true,
  imports: [MatRadioModule, RequiredMarkDirective],
  template: `
    <div class="field-label"
         [appRequiredMark]="field().validation?.required ?? false">
      {{ field().label }}
    </div>
    <mat-radio-group [value]="value()" (change)="valueChange.emit($event.value)">
      @for (option of field().options ?? []; track option.value) {
        <mat-radio-button [value]="option.value" [disabled]="option.disabled ?? false">
          {{ option.label }}
        </mat-radio-button>
      }
    </mat-radio-group>
  `,
})
export class RadioFieldComponent {
  readonly field = input.required<QuestionField>();
  readonly value = input<string>('');
  readonly valueChange = output<string>();
}
```

### Los 6 tipos de campo

| Componente | Tipo | Descripción |
|-----------|------|-------------|
| `TextFieldComponent` | `text`, `email` | `<input>` con mat-form-field |
| `NumberFieldComponent` | `number` | `<input type="number">` |
| `TextareaFieldComponent` | `textarea` | `<textarea>` con auto-resize |
| `SelectFieldComponent` | `select` | `<mat-select>` dropdown |
| `RadioFieldComponent` | `radio` | `<mat-radio-group>` |
| `CheckboxFieldComponent` | `checkbox` | `<mat-checkbox>` múltiple |

---

## 11. Directivas personalizadas

### `RequiredMarkDirective`

**Archivo:** `src/app/shared/directives/required-mark.directive.ts`

Agrega un asterisco `*` rojo al host element cuando el campo es requerido.

```typescript
@Directive({
  selector: '[appRequiredMark]',
  standalone: true,
})
export class RequiredMarkDirective implements OnInit {
  readonly appRequiredMark = input<boolean>(false);

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,  // ← NO document.createElement
  ) {}

  ngOnInit(): void {
    if (this.appRequiredMark()) {
      const span = this.renderer.createElement('span');
      this.renderer.setProperty(span, 'textContent', ' *');
      this.renderer.setStyle(span, 'color', '#f44336');
      this.renderer.setAttribute(span, 'aria-hidden', 'true');
      this.renderer.appendChild(this.el.nativeElement, span);
    }
  }
}
```

**Por qué `Renderer2` en lugar de `document.createElement`:**  
`Renderer2` es el servicio de Angular para manipular el DOM. Funciona en SSR (Server-Side Rendering) donde `document` no existe. Es la práctica recomendada para cualquier acceso directo al DOM en Angular.

**Uso en template:**
```html
<div class="field-label" [appRequiredMark]="field().validation?.required ?? false">
  {{ field().label }}
</div>
```

El selector `[appRequiredMark]` significa que la directiva se aplica a cualquier elemento con ese atributo. `??` es el operador nullish coalescing — si `validation?.required` es `null` o `undefined`, usa `false`.

### `FieldErrorDirective`

**Archivo:** `src/app/shared/directives/field-error.directive.ts`

Aplica la clase CSS `field--error` y `aria-invalid` cuando hay un error de validación.

```typescript
@Directive({
  selector: '[appFieldError]',
  standalone: true,
})
export class FieldErrorDirective {
  private readonly injector = inject(Injector);
  readonly appFieldError = input<boolean>(false);

  constructor(private readonly el: ElementRef<HTMLElement>) {
    effect(() => {
      const hasError = this.appFieldError();
      this.el.nativeElement.classList.toggle('field--error', hasError);
      this.el.nativeElement.setAttribute('aria-invalid', String(hasError));
    }, { injector: this.injector });
  }
}
```

Usa `effect()` dentro del constructor para reaccionar automáticamente cada vez que `appFieldError` cambia. `{ injector: this.injector }` es necesario para registrar el effect en el contexto correcto cuando se llama desde el constructor.

---

## 12. Nuevo control flow de Angular

Angular 17+ introdujo una nueva sintaxis de control flow que reemplaza a `*ngIf`, `*ngFor` y `*ngSwitch`. Es más legible y tiene mejor rendimiento.

### `@if` — condicional

```html
<!-- Antes (Angular ≤16) -->
<div *ngIf="condicion">...</div>

<!-- Ahora (Angular 17+) -->
@if (loader.survey.isLoading()) {
  <mat-progress-bar mode="indeterminate" />
}

@if (loader.survey.error(); as err) {   <!-- captura el valor en variable -->
  <p>Error: {{ err }}</p>
}

@if (condicion) {
  ...
} @else {
  ...
}
```

### `@for` — iteración

```html
<!-- Antes -->
<div *ngFor="let field of fields; trackBy: trackField">...</div>

<!-- Ahora — track es obligatorio (mejor rendimiento) -->
@for (field of section.fields; track field.id) {
  <app-field-renderer [field]="field" />
}
```

`track` es el equivalente de `trackBy` pero más corto. Angular lo usa para hacer diff eficiente — si el array cambia, solo re-renderiza los elementos nuevos/cambiados.

### `@switch` / `@case`

```html
@switch (field.type) {
  @case ('text') { <app-text-field /> }
  @case ('number') { <app-number-field /> }
  @default { <p>Tipo no soportado</p> }
}
```

### `@let` — variables locales en template

```html
@let f = field();   <!-- evita llamar field() múltiples veces -->
@let error = state.getError(f.id);

<div [class.error]="!!error">
  {{ f.label }}
</div>
```

---

## 13. Standalone Components (sin NgModules)

Desde Angular 14, los componentes pueden ser **standalone** — se registran a sí mismos sin necesitar un `NgModule`.

```typescript
@Component({
  selector: 'app-radio-field',
  standalone: true,           // ← sin NgModule
  imports: [
    MatRadioModule,           // importa directamente lo que necesita
    RequiredMarkDirective,
  ],
  template: `...`,
})
export class RadioFieldComponent { }
```

**Antes (con NgModules):**
```typescript
// En un módulo separado:
@NgModule({
  declarations: [RadioFieldComponent],
  imports: [MatRadioModule, SharedModule],
  exports: [RadioFieldComponent],
})
export class FieldsModule { }
```

Los standalone components hacen el código más directo: cada componente declara exactamente sus dependencias. No hay NgModules intermediarios.

---

## 14. Signal Inputs y Outputs

Angular 17+ introdujo `input()` y `output()` como alternativa funcional a los decoradores `@Input()` y `@Output()`.

### `input()` — antes: `@Input()`

```typescript
// Antes (decorador)
@Input() value: string = '';
@Input({ required: true }) field!: QuestionField;

// Ahora (signal input)
readonly value = input<string>('');                  // con valor default
readonly field = input.required<QuestionField>();    // sin valor default (requerido)
```

La diferencia clave: `input()` retorna un **Signal de solo lectura**. Puedes leerlo con `this.field()` y usarlo en `computed()`. Con `@Input()` tenías que usar `ngOnChanges` o `setters` para reaccionar a cambios.

### `output()` — antes: `@Output()` con `EventEmitter`

```typescript
// Antes
@Output() valueChange = new EventEmitter<string>();
this.valueChange.emit('nuevo valor');

// Ahora
readonly valueChange = output<string>();
this.valueChange.emit('nuevo valor');
```

`output()` es más simple — no es un Observable, solo emite eventos al componente padre.

### Uso en template del padre (sin diferencia)

```html
<!-- Igual en ambos casos -->
<app-radio-field
  [field]="myField"
  [value]="currentValue()"
  (valueChange)="onValueChange($event)"
/>
```

---

## 15. Esquema JSON de encuesta

Las encuestas se definen como archivos JSON en `public/schemas/`. Angular los sirve como assets estáticos.

### Estructura completa

```json
{
  "id": "mi-encuesta",
  "title": "Título de la Encuesta",
  "description": "Descripción opcional",
  "version": "1.0.0",
  "submitLabel": "Enviar Respuestas",
  "sections": [
    {
      "id": "seccion-1",
      "title": "Información General",
      "description": "Descripción de la sección",
      "fields": [
        {
          "id": "nombre",
          "type": "text",
          "label": "Nombre completo",
          "placeholder": "Ej. Juan García",
          "validation": {
            "required": true,
            "min": 2,
            "max": 100
          }
        },
        {
          "id": "edad",
          "type": "number",
          "label": "Edad",
          "validation": { "required": true, "min": 18, "max": 120 }
        },
        {
          "id": "calificacion",
          "type": "radio",
          "label": "¿Cómo calificarías el servicio?",
          "validation": { "required": true },
          "options": [
            { "value": "excelente", "label": "Excelente" },
            { "value": "bueno",     "label": "Bueno" },
            { "value": "malo",      "label": "Malo" }
          ]
        },
        {
          "id": "detalle-malo",
          "type": "textarea",
          "label": "¿Qué mejorarías?",
          "condition": {
            "dependsOn": "calificacion",
            "equals": "malo"           // solo aparece si eligió "malo"
          }
        },
        {
          "id": "intereses",
          "type": "checkbox",
          "label": "¿Qué temas te interesan?",
          "options": [
            { "value": "tech",    "label": "Tecnología" },
            { "value": "design",  "label": "Diseño" },
            { "value": "business","label": "Negocios" }
          ],
          "condition": {
            "dependsOn": "calificacion",
            "equals": ["excelente", "bueno"]  // aparece para excelente O bueno
          }
        }
      ]
    }
  ]
}
```

### Para agregar una nueva encuesta

1. Crear `public/schemas/mi-encuesta.json`
2. En `survey-page.component.ts`: `this.loader.loadSurvey('mi-encuesta')`

---

## 16. Angular Material

Angular Material es la librería de componentes UI basada en Material Design 3.

### Tema configurado

El proyecto usa el tema **azure-blue** de Material 3, configurado en `angular.json`:

```json
"styles": [
  "@angular/material/prebuilt-themes/azure-blue.css",
  "src/styles.scss"
]
```

### Componentes utilizados

| Componente | Módulo | Uso |
|-----------|--------|-----|
| `mat-card` | `MatCardModule` | Contenedor principal de la encuesta |
| `mat-progress-bar` | `MatProgressBarModule` | Progreso de la encuesta |
| `mat-form-field` | `MatFormFieldModule` | Wrapper para inputs con label/hint/error |
| `mat-input` | `MatInputModule` | Inputs de texto y número |
| `mat-select` | `MatSelectModule` | Dropdown de selección |
| `mat-radio-group` | `MatRadioModule` | Grupo de radio buttons |
| `mat-checkbox` | `MatCheckboxModule` | Checkboxes individuales |
| `mat-button` | `MatButtonModule` | Botón de submit |
| `mat-divider` | `MatDividerModule` | Separador entre secciones |
| `mat-error` | `MatFormFieldModule` | Mensaje de error bajo el campo |

---

## 17. Routing y lazy loading

**Archivo:** `src/app/app.routes.ts`

```typescript
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/survey/survey-page.component')
        .then(m => m.SurveyPageComponent),
  },
];
```

**Lazy loading** significa que `SurveyPageComponent` y todo su árbol de dependencias no se incluyen en el bundle inicial (`main.js`). Solo se descargan cuando el usuario navega a esa ruta.

En el build se ve como chunk separado:

```
chunk-S757C5C4.js  | survey-page-component | 348.12 kB
```

El bundle inicial (`main.js`) es solo 68 KB. El chunk de la página se carga on-demand.

---

## 18. Despliegue en GitHub Pages

### Proceso

```powershell
# 1. Build con base-href (SIEMPRE desde PowerShell en Windows, no Git Bash)
Set-Location "D:\...\survey-maker"
npx ng build --base-href "/Survey-Maker/"

# 2. Deploy a rama gh-pages
npx angular-cli-ghpages --dir=dist/survey-maker/browser
```

### Por qué `--base-href "/Survey-Maker/"`

GitHub Pages sirve el proyecto en `https://aldozm.github.io/Survey-Maker/`, no en la raíz `/`. Sin `base-href`, el `index.html` generado busca los bundles JS/CSS en `https://aldozm.github.io/main.js` (404).

Con `<base href="/Survey-Maker/">`, el navegador resuelve todos los paths relativos contra ese prefijo:
- `main.js` → `https://aldozm.github.io/Survey-Maker/main.js` ✅
- `schemas/mi-encuesta.json` → `https://aldozm.github.io/Survey-Maker/schemas/mi-encuesta.json` ✅

### Por qué NO usar Git Bash para el build

Git Bash en Windows usa MSYS2, que convierte paths POSIX a Windows:
```
"/Survey-Maker/" → "C:/Program Files/Git/Survey-Maker/"
```
Esto genera `<base href="C:/Program Files/Git/Survey-Maker/">` en el `index.html` — los bundles quedan como `file://` URLs que el navegador bloquea por seguridad.

### `404.html`

`angular-cli-ghpages` genera automáticamente un `404.html` idéntico al `index.html`. Esto permite que la SPA maneje rutas directas en GitHub Pages: cuando el usuario va a `/Survey-Maker/detalle`, GitHub Pages sirve `404.html` que carga Angular, y Angular maneja la ruta.

---

*Documentación generada en sesión 2026-05-11*  
*Proyecto: https://github.com/AldoZM/Survey-Maker*
