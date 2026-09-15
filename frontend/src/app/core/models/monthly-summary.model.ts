/**
 * Refleja com.aura.finance.dto.budget.MonthlySummaryResponse (backend).
 * Todos los importes (BigDecimal en el backend) llegan como `number`
 * — ver la nota de precisión en budget.model.ts.
 */
export interface MonthlySummary {
  month: number;
  year: number;
  budgetAmount: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
}
