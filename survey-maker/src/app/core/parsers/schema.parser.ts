/**
 * Survey Maker — Schema Parser
 *
 * Pure-function utilities that validate and type-cast raw JSON into the
 * strongly-typed `SurveySchema` contract.  Every function throws a
 * descriptive `Error` when the input does not conform to the spec, so
 * callers can surface meaningful error messages without inspecting internals.
 */

import { SurveySchema, SurveySection, QuestionField, FieldType } from '../interfaces';

/** All field types accepted by the survey engine. */
const VALID_FIELD_TYPES: FieldType[] = [
  'text',
  'email',
  'number',
  'textarea',
  'select',
  'radio',
  'checkbox',
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates that a raw JSON object conforms to the {@link SurveySchema} contract
 * and returns a fully-typed schema.
 *
 * Performs structural validation only — it does not cross-validate field
 * references used in `condition.dependsOn`.
 *
 * @param raw - The unknown value parsed from JSON (e.g. the response body of an
 *   HTTP request).  Can be `null`, a primitive, or any object.
 * @returns A validated {@link SurveySchema} instance.
 * @throws {Error} When any required field is missing, has the wrong type, or an
 *   element of `sections` / `fields` is invalid.
 *
 * @example
 * ```typescript
 * const raw = await fetch('/schemas/my-survey.json').then(r => r.json());
 * const schema = parseSchema(raw); // throws if invalid
 * ```
 */
export function parseSchema(raw: unknown): SurveySchema {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Schema must be a non-null object');
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj['id'] !== 'string' || !obj['id']) {
    throw new Error('Schema missing required string field: "id"');
  }
  if (typeof obj['title'] !== 'string' || !obj['title']) {
    throw new Error('Schema missing required string field: "title"');
  }
  if (typeof obj['version'] !== 'string' || !obj['version']) {
    throw new Error('Schema missing required string field: "version"');
  }
  if (!Array.isArray(obj['sections'])) {
    throw new Error('Schema "sections" must be an array');
  }

  return {
    id: obj['id'] as string,
    title: obj['title'] as string,
    description: typeof obj['description'] === 'string' ? obj['description'] : undefined,
    version: obj['version'] as string,
    submitLabel: typeof obj['submitLabel'] === 'string' ? obj['submitLabel'] : undefined,
    sections: (obj['sections'] as unknown[]).map((s, i) => parseSection(s, i)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates and type-casts a single survey section.
 *
 * @param raw   - Raw section value from the parsed JSON array.
 * @param index - Zero-based position within `sections`, used in error messages.
 * @returns A validated {@link SurveySection}.
 * @throws {Error} When required fields are absent or `fields` is not an array.
 */
function parseSection(raw: unknown, index: number): SurveySection {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Section at index ${index} must be a non-null object`);
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj['id'] !== 'string' || !obj['id']) {
    throw new Error(`Section at index ${index} missing required string field: "id"`);
  }
  if (typeof obj['title'] !== 'string' || !obj['title']) {
    throw new Error(`Section "${obj['id']}" missing required string field: "title"`);
  }
  if (!Array.isArray(obj['fields'])) {
    throw new Error(`Section "${obj['id']}" "fields" must be an array`);
  }

  return {
    id: obj['id'] as string,
    title: obj['title'] as string,
    description: typeof obj['description'] === 'string' ? obj['description'] : undefined,
    fields: (obj['fields'] as unknown[]).map((f, i) =>
      parseField(f, obj['id'] as string, i),
    ),
  };
}

/**
 * Validates and type-casts a single question field.
 *
 * @param raw       - Raw field value from the parsed JSON array.
 * @param sectionId - ID of the parent section, used in error messages.
 * @param index     - Zero-based position within `fields`, used in error messages.
 * @returns A validated {@link QuestionField}.
 * @throws {Error} When `id`, `type`, or `label` are missing or invalid.
 */
function parseField(raw: unknown, sectionId: string, index: number): QuestionField {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Field at index ${index} in section "${sectionId}" must be an object`);
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj['id'] !== 'string' || !obj['id']) {
    throw new Error(`Field at index ${index} in section "${sectionId}" missing "id"`);
  }
  if (!VALID_FIELD_TYPES.includes(obj['type'] as FieldType)) {
    throw new Error(
      `Field "${obj['id']}" has invalid type "${obj['type']}". ` +
        `Valid types: ${VALID_FIELD_TYPES.join(', ')}`,
    );
  }
  if (typeof obj['label'] !== 'string' || !obj['label']) {
    throw new Error(`Field "${obj['id']}" missing required "label"`);
  }

  return {
    id: obj['id'] as string,
    type: obj['type'] as FieldType,
    label: obj['label'] as string,
    placeholder: typeof obj['placeholder'] === 'string' ? obj['placeholder'] : undefined,
    hint: typeof obj['hint'] === 'string' ? obj['hint'] : undefined,
    validation:
      obj['validation'] && typeof obj['validation'] === 'object'
        ? (obj['validation'] as QuestionField['validation'])
        : undefined,
    options: Array.isArray(obj['options'])
      ? (obj['options'] as QuestionField['options'])
      : undefined,
    condition:
      obj['condition'] && typeof obj['condition'] === 'object'
        ? (obj['condition'] as QuestionField['condition'])
        : undefined,
    defaultValue: obj['defaultValue'] as QuestionField['defaultValue'],
  };
}
