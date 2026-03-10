package com.smartcampus.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Cross-Origin Resource Sharing (CORS) configuration for the Smart Campus REST API.
 *
 * <p>Allows the React frontend development server ({@code http://localhost:5173},
 * Vite's default port) to make cross-origin requests to this API during local
 * development. In production, replace the allowed origin with the deployed
 * frontend URL via an environment variable.
 *
 * <p>This bean is picked up automatically by {@link SecurityConfig} via
 * {@code cors(cors -> cors.configure(http))}, which instructs Spring Security
 * to use the {@link CorsConfigurationSource} bean registered here rather than
 * applying a permissive default.
 *
 * <p>Why CORS matters for this project:
 * The React app runs on port 5173 and the Spring Boot API runs on port 8080.
 * Browsers block cross-origin requests by default (same-origin policy), so
 * without this configuration every API call from the frontend would fail with
 * a CORS error before even reaching the controller.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     SecurityConfig
 */
@Configuration
public class CorsConfig {

    /**
     * Registers a {@link CorsConfigurationSource} bean that Spring Security
     * and Spring MVC both use to evaluate and respond to CORS preflight requests.
     *
     * <p>Configuration applied to all paths ({@code /**}):
     * <ul>
     *   <li><b>Allowed origins</b>     — React dev server only ({@code http://localhost:5173}).
     *       Use {@code setAllowedOriginPatterns} instead of {@code setAllowedOrigins}
     *       when {@code allowCredentials} is {@code true}, because {@code "*"} is not
     *       permitted alongside credentials by the CORS spec.</li>
     *   <li><b>Allowed methods</b>     — All standard REST verbs plus OPTIONS for preflight.</li>
     *   <li><b>Allowed headers</b>     — {@code Authorization} (JWT Bearer token) and
     *       {@code Content-Type} (JSON request bodies).</li>
     *   <li><b>Exposed headers</b>     — {@code Authorization} is exposed so the frontend
     *       can read a refreshed token from a response header if needed.</li>
     *   <li><b>Allow credentials</b>  — {@code true} so the browser sends cookies and
     *       the {@code Authorization} header on cross-origin requests.</li>
     *   <li><b>Max age</b>            — 3600 seconds (1 hour) preflight cache, reducing
     *       the number of OPTIONS requests the browser needs to make.</li>
     * </ul>
     *
     * @return a {@link CorsConfigurationSource} applied to all request paths
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // ── Allowed origins ───────────────────────────────────────────────────
        // Using allowedOriginPatterns (not allowedOrigins) because allowCredentials=true
        // is incompatible with a wildcard "*" origin per the CORS specification.
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:5173"     // Vite React dev server
        ));

        // ── Allowed HTTP methods ──────────────────────────────────────────────
        config.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"       // Required for CORS preflight requests
        ));

        // ── Allowed request headers ───────────────────────────────────────────
        config.setAllowedHeaders(List.of(
                "Authorization",    // JWT Bearer token sent on every authenticated request
                "Content-Type"      // application/json for request bodies
        ));

        // ── Exposed response headers ──────────────────────────────────────────
        // By default, browsers can only read a small set of "safe" response headers.
        // Explicitly exposing Authorization allows the frontend to read a refreshed
        // token returned in a response header.
        config.setExposedHeaders(List.of("Authorization"));

        // ── Credentials ───────────────────────────────────────────────────────
        // Must be true so the browser includes the Authorization header and any
        // cookies on cross-origin requests to this API.
        config.setAllowCredentials(true);

        // ── Preflight cache duration ──────────────────────────────────────────
        // Browsers cache the preflight OPTIONS response for this many seconds,
        // reducing unnecessary round-trips on repeat requests.
        config.setMaxAge(3600L);

        // ── Apply this configuration to all API paths ─────────────────────────
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
