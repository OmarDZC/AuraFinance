import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpenseForm } from './expense-form';

describe('ExpenseForm', () => {
  let component: ExpenseForm;
  let fixture: ComponentFixture<ExpenseForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('categories', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
