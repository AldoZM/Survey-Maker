import { parseSchema } from './schema.parser';

describe('SchemaParser', () => {
  const validSchema = {
    id: 'test-survey',
    title: 'Test Survey',
    version: '1.0.0',
    sections: [
      {
        id: 'section-1',
        title: 'Section 1',
        fields: [
          {
            id: 'field-1',
            type: 'text',
            label: 'Name',
          },
        ],
      },
    ],
  };

  describe('parseSchema()', () => {
    it('should parse a valid schema', () => {
      const result = parseSchema(validSchema);
      expect(result.id).toBe('test-survey');
      expect(result.title).toBe('Test Survey');
      expect(result.sections.length).toBe(1);
      expect(result.sections[0].fields.length).toBe(1);
    });

    it('should throw when schema is null', () => {
      expect(() => parseSchema(null)).toThrow('Schema must be a non-null object');
    });

    it('should throw when id is missing', () => {
      expect(() => parseSchema({ title: 'T', version: '1', sections: [] }))
        .toThrow('Schema missing required string field: "id"');
    });

    it('should throw when title is missing', () => {
      expect(() => parseSchema({ id: '1', version: '1', sections: [] }))
        .toThrow('Schema missing required string field: "title"');
    });

    it('should throw when version is missing', () => {
      expect(() => parseSchema({ id: '1', title: 'T', sections: [] }))
        .toThrow('Schema missing required string field: "version"');
    });

    it('should throw when sections is not an array', () => {
      expect(() => parseSchema({ id: '1', title: 'T', version: '1', sections: 'bad' }))
        .toThrow('"sections" must be an array');
    });

    it('should throw when field has invalid type', () => {
      const bad = {
        ...validSchema,
        sections: [{ id: 's', title: 'S', fields: [{ id: 'f', type: 'invalid', label: 'L' }] }],
      };
      expect(() => parseSchema(bad)).toThrow('invalid type');
    });

    it('should throw when field options element missing value', () => {
      const bad = {
        ...validSchema,
        sections: [{
          id: 's', title: 'S', fields: [{
            id: 'f', type: 'select', label: 'L',
            options: [{ label: 'Option' }] // missing value
          }]
        }],
      };
      expect(() => parseSchema(bad)).toThrow('missing required string "value"');
    });

    it('should parse optional fields correctly', () => {
      const result = parseSchema({
        ...validSchema,
        description: 'A survey',
        submitLabel: 'Send',
      });
      expect(result.description).toBe('A survey');
      expect(result.submitLabel).toBe('Send');
    });
  });
});
