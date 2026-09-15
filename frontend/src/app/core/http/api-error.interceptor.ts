import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiError } from '../models/api-error.model';

/**
 * Normaliza cualquier error HTTP a la forma `ApiError` que ya produce
 * GlobalExceptionHandler en el backend (ver api-error.model.ts), para que
 * los componentes que consuman los services no tengan que inspeccionar
 * HttpErrorResponse manualmente cada vez.
 *
 * No muestra notificaciones ni toasts: solo re-lanza el error tipado por el
 * canal de error del Observable, para que cada componente decida cómo
 * mostrarlo cuando se construya esa UI.
 */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((response: HttpErrorResponse) => {
      const apiError: ApiError = isApiErrorBody(response.error)
        ? response.error
        : {
            timestamp: new Date().toISOString(),
            status: response.status,
            // status 0 = no ha habido respuesta HTTP real (red caída, CORS
            // bloqueado por el navegador, servidor inalcanzable...), tanto
            // con el adaptador XHR como con el de fetch.
            error:
              response.status === 0
                ? 'No se ha podido contactar con el servidor.'
                : response.message,
          };
      return throwError(() => apiError);
    }),
  );

function isApiErrorBody(body: unknown): body is ApiError {
  return (
    !!body &&
    typeof body === 'object' &&
    'status' in body &&
    'error' in body &&
    typeof (body as ApiError).error === 'string'
  );
}
