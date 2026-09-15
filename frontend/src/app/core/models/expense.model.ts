import { Category } from './category.model';

/**
 * Refleja com.aura.finance.entity.MovementType (backend). EXPENSE resta al
 * balance, INCOME suma.
 */
export type MovementType = 'EXPENSE' | 'INCOME';

/**
 * Refleja com.aura.finance.dto.expense.ExpenseResponse (backend).
 *
 * `date` es un LocalDate en el backend, serializado por Jackson como cadena
 * ISO-8601 "YYYY-MM-DD" (comprobado empíricamente, p. ej. "2026-09-14").
 * `amount` ver la nota de precisión en budget.model.ts. Siempre positivo:
 * es `type` quien determina si resta o suma al balance, nunca el signo.
 * `description` es nullable: el DTO no tiene @NotBlank, solo @Size, así que
 * el backend puede devolver `null`.
 */
export interface Expense {
  id: number;
  type: MovementType;
  amount: number;
  date: string;
  description: string | null;
  category: Category;
}

/**
 * Refleja com.aura.finance.dto.expense.ExpenseRequest (backend).
 * `date` debe enviarse como "YYYY-MM-DD" para que Spring la parsee a LocalDate.
 */
export interface ExpenseRequest {
  type: MovementType;
  amount: number;
  date: string;
  description?: string | null;
  categoryId: number;
}

/**
 * Filtros opcionales para GET /api/expenses?month=&year=&categoryId=.
 * No es un DTO del backend: es solo la forma de los query params soportados
 * por ExpenseController.findAll().
 */
export interface ExpenseFilters {
  month?: number;
  year?: number;
  categoryId?: number;
}
