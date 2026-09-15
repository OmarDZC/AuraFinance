import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DonutChart } from './donut-chart';

describe('DonutChart', () => {
  let component: DonutChart;
  let fixture: ComponentFixture<DonutChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonutChart],
    }).compileComponents();

    fixture = TestBed.createComponent(DonutChart);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('slices', [
      { name: 'Alimentación', percentage: 60 },
      { name: 'Transporte', percentage: 40 },
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
