import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CircularGauge } from './circular-gauge';

describe('CircularGauge', () => {
  let component: CircularGauge;
  let fixture: ComponentFixture<CircularGauge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircularGauge],
    }).compileComponents();

    fixture = TestBed.createComponent(CircularGauge);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('percentage', 37.5);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
