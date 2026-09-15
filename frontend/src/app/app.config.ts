import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { API_BASE_URL, DEFAULT_API_BASE_URL } from './core/config/api.config';
import { apiErrorInterceptor } from './core/http/api-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // core/services ya consume la API real del backend a través de este HttpClient.
    provideHttpClient(withFetch(), withInterceptors([apiErrorInterceptor])),
    { provide: API_BASE_URL, useValue: DEFAULT_API_BASE_URL },
  ],
};
