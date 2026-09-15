import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL, DEFAULT_API_BASE_URL } from '../../core/config/api.config';
import { Statistics } from './statistics';

describe('Statistics', () => {
  let component: Statistics;
  let fixture: ComponentFixture<Statistics>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Statistics],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: DEFAULT_API_BASE_URL },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Statistics);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // El constructor dispara GET /api/statistics.
    fixture.detectChanges();
    httpMock.match(() => true).forEach((req) =>
      req.flush({
        month: 9,
        year: 2026,
        hasBudget: false,
        budgetAmount: null,
        totalExpenses: 0,
        totalIncome: 0,
        remaining: null,
        percentageUsed: null,
        averageDailyExpense: 0,
        daysConsidered: 0,
        highestSpendingDay: null,
        highestSpendingCategory: null,
        categoryBreakdown: [],
        dailySpending: [],
        previousMonthComparison: null,
        spendingPace: null,
        expenseCount: 0,
        incomeCount: 0,
        daysWithExpense: 0,
        averageExpensePerMovement: 0,
      }),
    );
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
