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

  /**
   * Computed validity — true when all required fields have valid answers.
   */
  readonly isValid = computed(() =>
    this.schema()?.sections.flatMap(s => s.fields).every(f => {
      if (!f.validation?.required) return true;
      const ans = this.answers()[f.id];
      return ans?.isValid ?? false;
    }) ?? false
  );

  constructor() {
    // Persist answers to localStorage whenever they change.
    // schema() is read with untracked() to avoid re-triggering when schema changes.
    effect(() => {
      const s = untracked(() => this.schema());
      const answers = this.answers();
      if (!s) return;
      try {
        localStorage.setItem(`survey-state-${s.id}`, JSON.stringify(answers));
      } catch {
        // localStorage may be unavailable (private mode, quota exceeded, etc.)
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
    const field = s.sections.flatMap(sec => sec.fields).find(f => f.id === fieldId);
    if (!field) return;

    this.answers.update(prev => ({
      ...prev,
      [fieldId]: {
        fieldId,
        value: value as FieldAnswer['value'],
        isValid: this.validate(field, value),
        isDirty: true,
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
    this.answers.update(prev => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = { ...next[id], isDirty: true };
      }
      return next;
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private validate(field: QuestionField, value: unknown): boolean {
    const rules = field.validation;
    if (!rules) return true;

    if (rules.required) {
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
    }

    if (typeof value === 'string') {
      if (rules.min !== undefined && value.length < rules.min) return false;
      if (rules.max !== undefined && value.length > rules.max) return false;
      if (rules.pattern) {
        try {
          if (!new RegExp(rules.pattern).test(value)) return false;
        } catch {
          // Invalid pattern — skip check
        }
      }
    }

    if (typeof value === 'number') {
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
