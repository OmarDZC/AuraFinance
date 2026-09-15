/**
 * Refleja com.aura.finance.dto.budget.MonthlySummaryResponse (backend).
 * Todos los importes (BigDecimal en el backend) llegan como `number`
 * — ver la nota de precisión en budget.model.ts.
 *
 * `remaining` y `percentageUsed` solo dependen de `budgetAmount`/`totalSpent`
 * (gastos); `totalIncome` es una cifra informativa aparte que no afecta al
 * consumo del presupuesto.
 */
export interface MonthlySummary {
  month: number;
  year: number;
  budgetAmount: number;
  totalSpent: number;
  totalIncome: number;
  remaining: number;
  percentageUsed: number;
}
