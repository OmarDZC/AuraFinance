import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, LOCALE_ID, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../core/models/api-error.model';
import {
  PreviousMonthComparison,
  SpendingPaceStatus,
  StatisticsResponse,
} from '../../core/models/statistics.model';
import { StatisticsService } from '../../core/services/statistics.service';
import { MONTH_NAMES, PeriodStore } from '../../core/state/period.store';
import { GlassCard } from '../../shared/ui/glass-card/glass-card';
import { StatTile } from '../../shared/ui/stat-tile/stat-tile';
import { CircularGauge } from '../../shared/ui/circular-gauge/circular-gauge';
import { DONUT_DOT_CLASSES, DonutChart, DonutSlice } from '../../shared/ui/donut-chart/donut-chart';
import { LineChart, LinePoint } from '../../shared/ui/line-chart/line-chart';

type ChartMode = 'daily' | 'cumulative';

interface PaceDisplay {
  icon: string;
  boxClass: string;
  headline: string;
}

const PACE_DISPLAY: Record<SpendingPaceStatus, PaceDisplay> = {
  AHEAD: {
    icon: 'trending_up',
    boxClass: 'bg-tertiary-container/10 text-tertiary-fixed-dim',
    headline: 'Vas por encima de tu ritmo habitual',
  },
  BEHIND: {
    icon: 'trending_down',
    boxClass: 'bg-secondary/10 text-secondary',
    headline: 'Vas por debajo del ritmo de gasto',
  },
  ON_TRACK: {
    icon: 'trending_flat',
    boxClass: 'bg-primary-container/10 text-primary',
    headline: 'Tu ritmo de gasto va en línea con lo esperado',
  },
};

/**
 * Estadísticas: pantalla de análisis del periodo seleccionado (PeriodStore,
 * compartido con Topbar/Dashboard/Presupuesto/Gastos). Todas las cifras
 * importantes (totales, desglose por categoría, evolución diaria, ritmo de
 * gasto, comparación con el mes anterior...) llegan ya calculadas desde
 * GET /api/statistics (StatisticsService en el backend, ver
 * com.aura.finance.service.StatisticsService): este componente solo se
 * ocupa de dar formato/presentación, nunca de recalcular gastos/ingresos.
 *
 * `chartMode` alterna qué serie dibuja el mismo <aura-line-chart> ("gasto
 * diario" vs. "gasto acumulado") sin duplicar el gráfico ni la petición.
 */
@Component({
  selector: 'aura-statistics',
  imports: [GlassCard, StatTile, CircularGauge, DonutChart, LineChart, DecimalPipe, RouterLink],
  templateUrl: './statistics.html',
  styleUrl: './statistics.css',
})
export class Statistics {
  private readonly statisticsService = inject(StatisticsService);
  protected readonly period = inject(PeriodStore);

  private readonly locale = inject(LOCALE_ID);
  private readonly currencyPipe = new CurrencyPipe(this.locale);
  private readonly datePipe = new DatePipe(this.locale);

  protected readonly loading = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly data = signal<StatisticsResponse | null>(null);

  protected readonly chartMode = signal<ChartMode>('daily');

  /** Solo tiene sentido resaltar "hoy" en el gráfico si el periodo mostrado es el mes real actual. */
  protected readonly highlightDay = computed(() =>
    this.period.isCurrentPeriod() ? new Date().getDate() : null,
  );

  protected readonly chartPoints = computed<LinePoint[]>(() => {
    const stats = this.data();
    if (!stats) {
      return [];
    }
    const mode = this.chartMode();
    return stats.dailySpending.map((point) => {
      const value = mode === 'daily' ? point.amount : point.cumulativeAmount;
      return {
        x: point.day,
        y: value,
        label: `Día ${point.day}: ${this.formatCurrency(value)}`,
      };
    });
  });

  protected readonly donutSlices = computed<DonutSlice[]>(() =>
    (this.data()?.categoryBreakdown ?? []).map((item) => ({
      name: item.category.name,
      percentage: item.percentage,
    })),
  );

  /** null si no hay presupuesto configurado (spendingPace solo existe cuando lo hay). */
  protected readonly paceInfo = computed<PaceDisplay | null>(() => {
    const pace = this.data()?.spendingPace;
    return pace ? PACE_DISPLAY[pace.status] : null;
  });

  constructor() {
    effect(() => {
      this.period.month();
      this.period.year();
      this.loadStatistics();
    });
  }

  protected loadStatistics(): void {
    const month = this.period.month();
    const year = this.period.year();

    this.loading.set(true);
    this.error.set(null);
    this.statisticsService.getStatistics(month, year).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  protected formatCurrency(value: number): string {
    return this.currencyPipe.transform(value, 'EUR') ?? `${value.toFixed(2)} €`;
  }

  /** "14 septiembre", a partir de una fecha ISO "YYYY-MM-DD". */
  protected formatDayLabel(isoDate: string): string {
    return this.datePipe.transform(isoDate, 'd MMMM') ?? isoDate;
  }

  protected previousMonthLabel(comparison: PreviousMonthComparison): string {
    return `${MONTH_NAMES[comparison.previousMonth - 1]} ${comparison.previousYear}`;
  }

  protected categoryDotClass(index: number): string {
    return DONUT_DOT_CLASSES[index % DONUT_DOT_CLASSES.length];
  }
}
