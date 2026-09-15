package com.aura.finance.entity;

/**
 * Distingue si un movimiento de {@link Expense} resta (gasto) o suma
 * (ingreso) al balance del periodo. Se añade como discriminador dentro de la
 * entidad Expense existente en vez de crear una entidad/tabla nueva, para no
 * migrar el modelo ni el endpoint /api/expenses.
 */
public enum MovementType {
    EXPENSE,
    INCOME
}
