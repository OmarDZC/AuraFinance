import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL, DEFAULT_API_BASE_URL } from '../../core/config/api.config';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: DEFAULT_API_BASE_URL },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // El constructor dispara 2x GET /api/expenses (mes actual y anterior) +
    // GET /api/budgets/summary.
    fixture.detectChanges();
    httpMock.match(() => true).forEach((req) => {
      if (req.request.url.includes('/api/budgets/summary')) {
        req.flush({ error: 'No hay presupuesto configurado' }, { status: 404, statusText: 'Not Found' });
      } else {
        req.flush([]);
      }
    });
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
