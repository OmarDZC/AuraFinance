import { ValidatorFn } from '@angular/forms';

/**
 * Espeja @Digits(integer = 10, fraction = 2), usado tanto en
 * ExpenseRequest.amount como en BudgetRequest.amount (backend).
 */
export function maxTwoDecimalsValidator(): ValidatorFn {
  return (control) => {
    if (control.value === null || control.value === undefined || control.value === '') {
      return null;
    }
    return /^\d{1,10}(\.\d{1,2})?$/.test(String(control.value)) ? null : { maxTwoDecimals: true };
  };
}
