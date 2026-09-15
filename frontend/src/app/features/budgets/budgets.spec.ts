import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL, DEFAULT_API_BASE_URL } from '../../core/config/api.config';
import { Budgets } from './budgets';

describe('Budgets', () => {
  let component: Budgets;
  let fixture: ComponentFixture<Budgets>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Budgets],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: DEFAULT_API_BASE_URL },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Budgets);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // El constructor dispara GET /api/budgets.
    fixture.detectChanges();
    httpMock.match(() => true).forEach((req) => req.flush([]));
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
