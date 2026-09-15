/**
 * Refleja el cuerpo JSON que construye
 * com.aura.finance.exception.GlobalExceptionHandler para 404/409/400.
 * `fields` solo aparece en errores de validación (400).
 */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  fields?: Record<string, string>;
}
