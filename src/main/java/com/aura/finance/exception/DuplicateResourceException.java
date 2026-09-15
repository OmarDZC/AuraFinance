package com.aura.finance.exception;

/**
 * Se lanza cuando una operación entra en conflicto con el estado existente:
 * un recurso duplicado (nombre de categoría, presupuesto de un mismo mes/año)
 * o un recurso que no se puede eliminar por tener datos asociados.
 * Se traduce a HTTP 409 en {@link GlobalExceptionHandler}.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
