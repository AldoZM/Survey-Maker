/**
 * Survey Maker — Core Interfaces
 * Defines the TypeScript contract for the JSON survey schema.
 * All survey configurations must conform to these interfaces.
 */

/**
 * Supported field types for survey questions.
 */
export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox';

/**
 * Defines a validation rule applied to a field.
 * Rules are evaluated against the field's current value.
 */
export interface ValidationRule {
  /** Marks the field as required. */
  required?: boolean;
  /** Minimum character length (text/textarea) or minimum value (number). */
  min?: number;
  /** Maximum character length (text/textarea) or maximum value (number). */
  max?: number;
  /** Regular expression pattern the value must match. */
  pattern?: string;
  /** Custom error message to display when validation fails. */
  message?: string;
}

/**
 * Defines an option for select, radio, or checkbox field types.
 */
export interface FieldOption {
  /** The value submitted when this option is selected. */
  value: string;
  /** The label displayed to the user. */
  label: string;
  /** Whether this option is disabled. */
  disabled?: boolean;
}

/**
 * Defines conditional display logic for a field.
 * The field is shown only when the referenced condition is met.
 */
export interface ConditionalLogic {
  /** The `id` of the field whose value triggers this condition. */
  dependsOn: string;
  /** The value the referenced field must equal for this field to show. */
  equals: string | string[] | boolean | number;
}

/**
 * Defines a single question/field in the survey.
 */
export interface QuestionField {
  /** Unique identifier for this field within the survey. */
  id: string;
  /** The input type that determines how the field is rendered. */
  type: FieldType;
  /** Label shown above the field. */
  label: string;
  /** Placeholder text for text-based fields. */
  placeholder?: string;
  /** Helper text shown below the field. */
  hint?: string;
  /** Validation rules applied to this field. */
  validation?: ValidationRule;
  /** Options for select, radio, or checkbox fields. */
  options?: FieldOption[];
  /** Conditional logic — field only renders when condition is met. */
  condition?: ConditionalLogic;
  /** Default value for the field. */
  defaultValue?: string | string[] | number | boolean;
}

/**
 * Defines a section (page/group) of questions in the survey.
 */
export interface SurveySection {
  /** Unique identifier for this section. */
  id: string;
  /** Title displayed at the top of the section. */
  title: string;
  /** Optional subtitle or description. */
  description?: string;
  /** The fields contained in this section. */
  fields: QuestionField[];
}

/**
 * Root schema for a survey definition.
 * This is the JSON structure loaded and parsed by the Survey Engine.
 *
 * @example
 * ```json
 * {
 *   "id": "customer-feedback",
 *   "title": "Customer Feedback",
 *   "version": "1.0.0",
 *   "sections": [
 *     {
 *       "id": "personal",
 *       "title": "Personal Information",
 *       "fields": [
 *         {
 *           "id": "name",
 *           "type": "text",
 *           "label": "Full Name",
 *           "validation": { "required": true, "min": 2 }
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 */
export interface SurveySchema {
  /** Unique identifier for this survey. */
  id: string;
  /** Display title of the survey. */
  title: string;
  /** Optional description shown at the start of the survey. */
  description?: string;
  /** Schema version for compatibility tracking. */
  version: string;
  /** The sections (pages/groups) of questions. */
  sections: SurveySection[];
  /** Optional submit button label. Default: "Submit". */
  submitLabel?: string;
}

/**
 * Represents the answer state for a single field.
 */
export interface FieldAnswer {
  fieldId: string;
  value: string | string[] | number | boolean | null;
  isValid: boolean;
  isDirty: boolean;
}

/**
 * Represents the complete state of a survey in progress.
 */
export interface SurveyState {
  surveyId: string;
  answers: Record<string, FieldAnswer>;
  currentSectionIndex: number;
  isSubmitted: boolean;
  progress: number; // 0–100
}
