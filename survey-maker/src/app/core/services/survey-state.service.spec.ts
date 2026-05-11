import { TestBed } from '@angular/core/testing';
import { SurveyStateService } from './survey-state.service';
import { SurveySchema } from '../interfaces';

describe('SurveyStateService', () => {
  let service: SurveyStateService;

  const mockSchema: SurveySchema = {
    id: 'test-survey',
    title: 'Test Survey',
    version: '1.0.0',
    sections: [
      {
        id: 'section-1',
        title: 'Section 1',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Name',
            validation: { required: true, min: 2, max: 50 },
          },
          {
            id: 'age',
            type: 'number',
            label: 'Age',
            validation: { required: false, min: 0, max: 120 },
          },
          {
            id: 'email',
            type: 'email',
            label: 'Email',
            validation: { required: true, pattern: '^[^@]+@[^@]+$' },
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SurveyStateService);
    // Clear localStorage before each test
    localStorage.clear();
    service.initSurvey(mockSchema);
  });

  describe('initSurvey()', () => {
    it('should set schema', () => {
      expect(service.schema()).toBeTruthy();
      expect(service.schema()?.id).toBe('test-survey');
    });

    it('should initialize answers for all fields', () => {
      const answers = service.answers();
      expect(Object.keys(answers).length).toBe(3);
      expect(answers['name']).toBeDefined();
      expect(answers['age']).toBeDefined();
    });

    it('should initialize fields as not dirty', () => {
      expect(service.answers()['name'].isDirty).toBeFalsy();
    });

    it('should reset isSubmitted to false', () => {
      service.isSubmitted.set(true);
      service.initSurvey(mockSchema);
      expect(service.isSubmitted()).toBeFalsy();
    });
  });

  describe('setAnswer()', () => {
    it('should update answer value', () => {
      service.setAnswer('name', 'John');
      expect(service.answers()['name'].value).toBe('John');
    });

    it('should mark field as dirty', () => {
      service.setAnswer('name', 'John');
      expect(service.answers()['name'].isDirty).toBeTruthy();
    });

    it('should validate required field — empty string is invalid', () => {
      service.setAnswer('name', '');
      expect(service.answers()['name'].isValid).toBeFalsy();
    });

    it('should validate min length', () => {
      service.setAnswer('name', 'A'); // length 1 < min 2
      expect(service.answers()['name'].isValid).toBeFalsy();
    });

    it('should validate max length', () => {
      service.setAnswer('name', 'A'.repeat(51)); // > max 50
      expect(service.answers()['name'].isValid).toBeFalsy();
    });

    it('should pass validation with valid text', () => {
      service.setAnswer('name', 'John');
      expect(service.answers()['name'].isValid).toBeTruthy();
    });

    it('should validate numeric min', () => {
      service.setAnswer('age', -1); // < min 0
      expect(service.answers()['age'].isValid).toBeFalsy();
    });

    it('should validate pattern', () => {
      service.setAnswer('email', 'not-an-email');
      expect(service.answers()['email'].isValid).toBeFalsy();
    });

    it('should pass pattern validation', () => {
      service.setAnswer('email', 'user@example.com');
      expect(service.answers()['email'].isValid).toBeTruthy();
    });
  });

  describe('getError()', () => {
    it('should return null for clean field', () => {
      expect(service.getError('name')).toBeNull();
    });

    it('should return null for dirty but valid field', () => {
      service.setAnswer('name', 'John');
      expect(service.getError('name')).toBeNull();
    });

    it('should return error message for dirty invalid field', () => {
      service.setAnswer('name', '');
      expect(service.getError('name')).not.toBeNull();
    });
  });

  describe('progress()', () => {
    it('should be 0 initially with no answered required fields', () => {
      expect(service.progress()).toBe(0);
    });

    it('should increase as required fields are answered', () => {
      service.setAnswer('name', 'John');
      service.setAnswer('email', 'john@example.com');
      expect(service.progress()).toBe(100);
    });
  });

  describe('touchAll()', () => {
    it('should mark all fields as dirty', () => {
      service.touchAll();
      const answers = service.answers();
      expect(Object.values(answers).every(a => a.isDirty)).toBeTruthy();
    });
  });
});
