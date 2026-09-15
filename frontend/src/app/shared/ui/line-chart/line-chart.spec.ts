import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineChart } from './line-chart';

describe('LineChart', () => {
  let component: LineChart;
  let fixture: ComponentFixture<LineChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChart],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChart);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('points', [
      { x: 1, y: 10 },
      { x: 2, y: 25 },
      { x: 3, y: 5 },
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
