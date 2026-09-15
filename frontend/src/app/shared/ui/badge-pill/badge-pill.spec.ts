import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgePill } from './badge-pill';

describe('BadgePill', () => {
  let component: BadgePill;
  let fixture: ComponentFixture<BadgePill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgePill],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgePill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
