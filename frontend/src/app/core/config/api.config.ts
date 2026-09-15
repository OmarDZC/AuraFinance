import { InjectionToken } from '@angular/core';

/**
 * URL base de la API REST del backend (Spring Boot).
 * Los servicios HTTP de `core/services` (Fase 1) inyectarán este token
 * en lugar de hardcodear la URL, para poder cambiarla por entorno
 * (desarrollo, producción, etc.) sin tocar el código de los servicios.
 *
 * Todavía no se realiza ninguna llamada HTTP contra esta URL: solo se deja
 * preparada la configuración para cuando se conecten los endpoints reales.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export const DEFAULT_API_BASE_URL = 'http://localhost:8080';
