import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldRendererComponent } from './field-renderer.component';
import { QuestionField } from '../../core/interfaces';
import { provideZonelessChangeDetection } from '@angular/core';

describe('FieldRendererComponent', () => {
  let component: FieldRendererComponent;
  let fixture: ComponentFixture<FieldRendererComponent>;

  const textField: QuestionField = {
    id: 'name',
    type: 'text',
    label: 'Full Name',
  };

  const conditionalField: QuestionField = {
    id: 'reason',
    type: 'textarea',
    label: 'Reason',
    condition: { dependsOn: 'status', equals: 'bad' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldRendererComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should create', async () => {
    fixture = TestBed.createComponent(FieldRendererComponent);
    fixture.componentRef.setInput('field', textField);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('isVisible()', () => {
    it('should be visible when no condition', async () => {
      fixture = TestBed.createComponent(FieldRendererComponent);
      fixture.componentRef.setInput('field', textField);
      await fixture.whenStable();
      expect(fixture.componentInstance.isVisible()).toBeTruthy();
    });

    it('should be hidden when condition not met', async () => {
      fixture = TestBed.createComponent(FieldRendererComponent);
      fixture.componentRef.setInput('field', conditionalField);
      fixture.componentRef.setInput('answers', { status: 'good' });
      await fixture.whenStable();
      expect(fixture.componentInstance.isVisible()).toBeFalsy();
    });

    it('should be visible when condition is met', async () => {
      fixture = TestBed.createComponent(FieldRendererComponent);
      fixture.componentRef.setInput('field', conditionalField);
      fixture.componentRef.setInput('answers', { status: 'bad' });
      await fixture.whenStable();
      expect(fixture.componentInstance.isVisible()).toBeTruthy();
    });

    it('should handle array condition equals', async () => {
      const arrCondField: QuestionField = {
        id: 'details',
        type: 'textarea',
        label: 'Details',
        condition: { dependsOn: 'rating', equals: ['bad', 'terrible'] },
      };
      fixture = TestBed.createComponent(FieldRendererComponent);
      fixture.componentRef.setInput('field', arrCondField);
      fixture.componentRef.setInput('answers', { rating: 'bad' });
      await fixture.whenStable();
      expect(fixture.componentInstance.isVisible()).toBeTruthy();
    });
  });
});
