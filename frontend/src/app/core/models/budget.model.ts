/**
 * Refleja com.aura.finance.dto.budget.BudgetResponse (backend).
 *
 * `amount` es un BigDecimal en el backend, pero Jackson lo serializa como
 * número JSON literal (comprobado empíricamente: p. ej. `"amount":1300.00`),
 * así que en el cliente HTTP llega como `number` de JavaScript (IEEE-754).
 * Esto significa que se pierde la precisión decimal exacta de BigDecimal al
 * deserializar (p. ej. "1300.00" y "1300" son indistinguibles como number).
 * Para el MVP no supone un problema práctico de visualización, pero cualquier
 * cálculo aritmético en el frontend debe tenerlo en cuenta: la fuente de
 * verdad para sumas/porcentajes sigue siendo el backend (MonthlySummary).
 */
export interface Budget {
  id: number;
  month: number;
  year: number;
  amount: number;
}

/**
 * Refleja com.aura.finance.dto.budget.BudgetRequest (backend).
 */
export interface BudgetRequest {
  month: number;
  year: number;
  amount: number;
}
