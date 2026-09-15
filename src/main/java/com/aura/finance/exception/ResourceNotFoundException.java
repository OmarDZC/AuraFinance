package com.aura.finance.exception;

/**
 * Se lanza cuando se solicita un recurso (categoría, presupuesto, gasto...) que no existe.
 * Se traduce a HTTP 404 en {@link GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
