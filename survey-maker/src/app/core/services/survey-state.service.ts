import { Injectable, signal, computed, effect, inject, untracked, Injector } from '@angular/core';
import {
  SurveySchema,
  QuestionField,
  FieldAnswer,
} from '../interfaces';

/**
 * Centralized reactive state manager for a survey in progress.
 *
 * Maintains all field answers as Signals, computes validation and progress
 * reactively, and persists state to localStorage via effect().
 *
 * ### Usage
 * ```typescript
 * const state = inject(SurveyStateService);
 * state.initSurvey(schema);
 * state.setAnswer('field-id', 'value');
 * console.log(state.progress()); // 0–100
 * console.log(state.isValid());  // true/false
 * ```
 */
@Injectable({ providedIn: 'root' })
export class SurveyStateService {
  private readonly injector = inject(Injector);

  /** All field answers keyed by fieldId. */
  readonly answers = signal<Record<string, FieldAnswer>>({});

  /** The schema currently loaded. */
  readonly schema = signal<SurveySchema | null>(null);

  /** Whether the survey has been submitted. */
  readonly isSubmitted = signal<boolean>(false);

  /** Index of the currently visible section (for multi-page surveys). */
  readonly currentSectionIndex = signal<number>(0);

  /**
   * Computed survey completion progress (0–100).
   * Based on the ratio of answered required fields to total required fields.
   */
  readonly progress = computed(() => {
    const s = this.schema();
    // Si no hay schema cargado aún, el progreso es 0%
    if (!s) return 0;

    // flatMap aplana el array de secciones a un array plano de todos los campos
    const allFields = s.sections.flatMap(sec => sec.fields);

    // Solo contamos los campos marcados como required — los opcionales no afectan el progreso
    const requiredFields = allFields.filter(f => f.validation?.required);

    // Si no hay campos requeridos, la encuesta está "completa" inmediatamente
    if (requiredFields.length === 0) return 100;

    // Un campo cuenta como "respondido" solo si: pasó la validación (isValid)
    // Y el usuario ya interactuó con él (isDirty). Sin isDirty, un campo con
    // valor default inválido inflaría el progreso artificialmente.
    const answeredRequired = requiredFields.filter(f => {
      const ans = this.answers()[f.id];
      return ans?.isValid && ans.isDirty;
    });

    // Ratio de campos respondidos sobre total requeridos, redondeado a entero
    return Math.round((answeredRequired.length / requiredFields.length) * 100);
  });

  /**
   * Computed validity — true when all required fields have valid answers.
   */
  readonly isValid = computed(() =>
    // every() retorna true solo si TODOS los campos pasan la condición.
    // Si un campo no es required, lo consideramos válido automáticamente.
    // Si un campo required no tiene respuesta aún (ans es undefined), retorna false.
    // El ?? false al final cubre el caso donde schema() es null (sin encuesta cargada).
    this.schema()?.sections.flatMap(s => s.fields).every(f => {
      if (!f.validation?.required) return true;
      const ans = this.answers()[f.id];
      return ans?.isValid ?? false;
    }) ?? false
  );

  constructor() {
    // effect() se ejecuta automáticamente cada vez que un Signal que lee cambia.
    // Aquí lo usamos para persistir las respuestas en localStorage cada vez que
    // el usuario responde algo — sin necesidad de llamar a ninguna función manualmente.
    effect(() => {
      // untracked() lee schema() SIN crear una dependencia reactiva.
      // Si no usáramos untracked, este effect se re-ejecutaría cada vez que cambia
      // el schema (al cargar una nueva encuesta), lo cual es innecesario.
      // Solo queremos re-ejecutar cuando ANSWERS cambia, no cuando SCHEMA cambia.
      const s = untracked(() => this.schema());

      // Esta línea SÍ crea la dependencia reactiva — el effect re-corre cuando answers cambia
      const answers = this.answers();

      if (!s) return;
      try {
        // Guardamos como JSON con clave única por ID de encuesta.
        // Así cada encuesta tiene su propio espacio en localStorage.
        localStorage.setItem(`survey-state-${s.id}`, JSON.stringify(answers));
      } catch {
        // localStorage puede no estar disponible en modo privado o si está lleno.
        // Fallamos silenciosamente — la encuesta funciona igual, solo sin persistencia.
      }
    }, { injector: this.injector });
  }

  /**
   * Initializes state for a new survey, restoring from localStorage if available.
   * Clears previous survey state.
   */
  initSurvey(schema: SurveySchema): void {
    this.schema.set(schema);
    this.isSubmitted.set(false);
    this.currentSectionIndex.set(0);

    const saved = this.loadFromStorage(schema.id);
    if (saved) {
      this.answers.set(saved);
    } else {
      // Initialize default values
      const initial: Record<string, FieldAnswer> = {};
      schema.sections.flatMap(s => s.fields).forEach(f => {
        initial[f.id] = {
          fieldId: f.id,
          value: (f.defaultValue as FieldAnswer['value']) ?? null,
          isValid: this.validate(f, f.defaultValue ?? null),
          isDirty: false,
        };
      });
      this.answers.set(initial);
    }
  }

  /**
   * Updates the answer for a field and runs validation.
   * Marks the field as dirty (user has interacted).
   */
  setAnswer(fieldId: string, value: unknown): void {
    const s = this.schema();
    if (!s) return;

    // Buscamos la definición del campo para poder ejecutar sus reglas de validación
    const field = s.sections.flatMap(sec => sec.fields).find(f => f.id === fieldId);
    if (!field) return;

    // answers.update() es inmutable: recibe el objeto anterior y retorna uno nuevo.
    // Usamos spread (...prev) para copiar todas las respuestas anteriores y solo
    // sobreescribir la que cambió. Nunca mutamos el objeto directamente.
    // Angular detecta el cambio de referencia del objeto y notifica a todos los
    // computed() y effect() que dependen de answers().
    this.answers.update(prev => ({
      ...prev,
      [fieldId]: {
        fieldId,
        value: value as FieldAnswer['value'],
        isValid: this.validate(field, value), // ejecuta todas las reglas de validación
        isDirty: true, // el usuario ya tocó este campo — ya se pueden mostrar errores
      },
    }));
  }

  /**
   * Returns the current value for a specific field.
   */
  getValue(fieldId: string): unknown {
    return this.answers()[fieldId]?.value ?? null;
  }

  /**
   * Returns the validation error message for a field, or null if valid.
   * Only returns errors when the field is dirty (user has interacted).
   */
  getError(fieldId: string): string | null {
    const ans = this.answers()[fieldId];
    if (!ans?.isDirty || ans.isValid) return null;
    const s = this.schema();
    const field = s?.sections.flatMap(sec => sec.fields).find(f => f.id === fieldId);
    return field?.validation?.message ?? this.getDefaultError(field);
  }

  /**
   * Marks all fields as dirty and triggers full validation.
   * Call before form submission to show all errors.
   */
  touchAll(): void {
    // Marca TODOS los campos como dirty en una sola actualización del signal.
    // Esto dispara que getError() ya no filtre errores por isDirty,
    // haciendo visibles los errores de validación en toda la encuesta.
    // Se llama desde onSubmit() antes de verificar isValid().
    this.answers.update(prev => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        // Copiamos cada FieldAnswer y solo cambiamos isDirty → true
        next[id] = { ...next[id], isDirty: true };
      }
      return next;
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private validate(field: QuestionField, value: unknown): boolean {
    const rules = field.validation;
    // Sin reglas de validación definidas en el JSON → siempre válido
    if (!rules) return true;

    // ── Validación de required ──────────────────────────────────────────────
    if (rules.required) {
      // null/undefined/string vacío = campo vacío → inválido
      if (value === null || value === undefined || value === '') return false;
      // Para checkboxes (array): sin ningún elemento seleccionado → inválido
      if (Array.isArray(value) && value.length === 0) return false;
    }

    // ── Validación de strings (text, textarea, email) ──────────────────────
    if (typeof value === 'string') {
      // min/max en texto = longitud de caracteres
      if (rules.min !== undefined && value.length < rules.min) return false;
      if (rules.max !== undefined && value.length > rules.max) return false;
      if (rules.pattern) {
        try {
          // El patrón se almacena como string en el JSON y lo convertimos a RegExp
          if (!new RegExp(rules.pattern).test(value)) return false;
        } catch {
          // Si el patrón es un RegExp inválido (ej. "[abc"), lo ignoramos
          // para no romper la validación completa del campo
        }
      }
    }

    // ── Validación de números ───────────────────────────────────────────────
    if (typeof value === 'number') {
      // min/max en número = rango de valor (no longitud)
      if (rules.min !== undefined && value < rules.min) return false;
      if (rules.max !== undefined && value > rules.max) return false;
    }

    return true;
  }

  private getDefaultError(field: QuestionField | undefined): string | null {
    if (!field?.validation) return null;
    const r = field.validation;
    if (r.required) return `${field.label} es requerido`;
    if (r.min !== undefined) return `Mínimo ${r.min} caracteres`;
    if (r.max !== undefined) return `Máximo ${r.max} caracteres`;
    if (r.pattern) return `Formato inválido`;
    return 'Valor inválido';
  }

  private loadFromStorage(surveyId: string): Record<string, FieldAnswer> | null {
    try {
      const raw = localStorage.getItem(`survey-state-${surveyId}`);
      return raw ? (JSON.parse(raw) as Record<string, FieldAnswer>) : null;
    } catch {
      return null;
    }
  }
}
