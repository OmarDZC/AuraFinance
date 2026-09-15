package com.aura.finance.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración CORS global para la API REST.
 *
 * El frontend Angular (http://localhost:4200) y el backend Spring Boot
 * (http://localhost:8080) corren en orígenes distintos durante el
 * desarrollo, así que el navegador bloquea las peticiones cross-origin
 * salvo que el servidor las autorice explícitamente.
 *
 * Se restringe deliberadamente a un único origen conocido, sin comodines
 * ("*") ni credenciales, ya que la API no usa cookies/sesión.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String ANGULAR_DEV_ORIGIN = "http://localhost:4200";

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(ANGULAR_DEV_ORIGIN)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type");
    }
}
