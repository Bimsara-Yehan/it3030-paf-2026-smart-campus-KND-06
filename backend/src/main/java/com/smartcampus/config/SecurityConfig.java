package com.smartcampus.config;

import com.smartcampus.security.JwtFilter;
import com.smartcampus.security.OAuth2FailureHandler;
import com.smartcampus.security.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 6 configuration for the Smart Campus Operations Hub.
 *
 * <p>This class replaces the deprecated {@code WebSecurityConfigurerAdapter}
 * pattern from Spring Security 5 with the modern component-based approach
 * using {@link SecurityFilterChain} beans.
 *
 * <p>Security model:
 * <ul>
 *   <li>Stateless JWT authentication — no HTTP sessions are created for API calls.
 *       Spring Security 6 does not auto-save the SecurityContext to the session,
 *       so JWT-authenticated requests remain session-free even though the session
 *       policy is {@link SessionCreationPolicy#IF_REQUIRED}.</li>
 *   <li>The session policy is {@code IF_REQUIRED} (not {@code STATELESS}) because
 *       the OAuth2 authorization code flow needs a short-lived session to carry
 *       the CSRF {@code state} parameter between the redirect to Google and the
 *       callback from Google. The session is discarded once the callback completes
 *       and the JWT tokens are issued.</li>
 *   <li>CSRF disabled — not needed for stateless REST APIs (tokens are the CSRF protection).</li>
 *   <li>{@link JwtFilter} runs before {@link UsernamePasswordAuthenticationFilter}
 *       to populate the {@code SecurityContext} from the Bearer token.</li>
 *   <li>Method-level security enabled via {@code @EnableMethodSecurity} —
 *       allows {@code @PreAuthorize("hasRole('ADMIN')")} on service/controller methods.</li>
 * </ul>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     JwtFilter
 * @see     OAuth2SuccessHandler
 * @see     OAuth2FailureHandler
 * @see     CorsConfig
 */
@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity   // Enables @PreAuthorize, @PostAuthorize, @Secured on methods
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter             jwtFilter;
    private final UserDetailsService    userDetailsService;
    private final OAuth2SuccessHandler  oAuth2SuccessHandler;
    private final OAuth2FailureHandler  oAuth2FailureHandler;

    // ── Public endpoint matchers ──────────────────────────────────────────────
    // Paths listed here are fully public — no JWT required.
    // Note: these are relative to the context-path (/api/v1) set in application.yml,
    // so "/auth/**" here matches actual requests to "/api/v1/auth/**".
    private static final String[] PUBLIC_POST_PATHS = {
            "/auth/**"                  // login, register, OAuth callback, token refresh
    };

    private static final String[] PUBLIC_GET_PATHS = {
            "/resources",              // browse available resources without logging in
            "/auth/oauth2/**",         // OAuth2 initiation endpoint (triggers Google redirect)
            "/login/oauth2/**",        // Spring Security's OAuth2 authorization-code callback
            "/oauth2/**"               // Spring Security's OAuth2 authorization redirect
    };

    private static final String[] SWAGGER_PATHS = {
        "/swagger-ui.html",         // Swagger UI entry point
        "/swagger-ui/**",           // Swagger UI static assets
        "/v3/api-docs/**"           // OpenAPI JSON spec endpoint
    };

    // ── Actuator endpoint matchers ────────────────────────────────────────────
    // Health check endpoint is public — needed for Docker, CI, and monitoring.
    // Other actuator endpoints remain protected by JWT.
    private static final String[] PUBLIC_ACTUATOR_PATHS = {
        "/actuator/health",         // Health check — public for monitoring tools
        "/actuator/info"            // App info — safe to expose publicly
    };

    // =========================================================================
    // Security filter chain
    // =========================================================================

    /**
     * Defines the HTTP security filter chain — the central security configuration.
     *
     * <p>Rules applied in order (Spring Security evaluates the first matching rule):
     * <ol>
     *   <li>CSRF protection is disabled — REST APIs use tokens, not cookies.</li>
     *   <li>CORS is delegated to {@link CorsConfig} (the {@code corsConfigurationSource} bean).</li>
     *   <li>Public paths (auth endpoints, Swagger, public resource listing) require no authentication.</li>
     *   <li>All other requests require a valid JWT.</li>
     *   <li>Session management is set to {@code IF_REQUIRED} — sessions are only created during
     *       the OAuth2 authorization-code dance; JWT API calls do not touch the session.</li>
     *   <li>OAuth2 login is configured with custom success and failure handlers that redirect
     *       to the React frontend with JWT tokens after Google authentication.</li>
     *   <li>{@link JwtFilter} is inserted before the default username/password filter
     *       so the security context is populated before Spring Security's own checks run.</li>
     * </ol>
     *
     * @param http the {@link HttpSecurity} builder provided by Spring
     * @return the configured {@link SecurityFilterChain} bean
     * @throws Exception if configuration fails (propagated from Spring Security internals)
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        log.debug("Configuring Spring Security filter chain");

        http
                // Disable CSRF — stateless REST APIs are not vulnerable to CSRF
                // because browsers cannot send the Authorization header cross-origin
                // without the server's explicit CORS permission.
                .csrf(AbstractHttpConfigurer::disable)

                // Delegate CORS handling to CorsConfig.corsConfigurationSource()
                .cors(cors -> cors.configure(http))

                // Define access rules
                .authorizeHttpRequests(auth -> auth

                        // Public: authentication endpoints (login, register, OAuth, refresh)
                        .requestMatchers(org.springframework.http.HttpMethod.POST, PUBLIC_POST_PATHS)
                        .permitAll()

                        // Public: browse resources without logging in, OAuth2 flow paths
                        .requestMatchers(org.springframework.http.HttpMethod.GET, PUBLIC_GET_PATHS)
                        .permitAll()

                        // Public: Swagger UI and OpenAPI spec — needed for API documentation access
                        .requestMatchers(SWAGGER_PATHS)
                        .permitAll()

                        // Public: health and info actuator endpoints — needed for monitoring
                        .requestMatchers(PUBLIC_ACTUATOR_PATHS)
                        .permitAll()

                        // Everything else requires a valid, non-expired JWT
                        .anyRequest().authenticated()
                )

                // Session management:
                // IF_REQUIRED (not STATELESS) because the OAuth2 authorization-code flow
                // requires a short-lived session to transport the CSRF state parameter between
                // the redirect to Google (request 1) and the callback from Google (request 2).
                // Spring Security 6 does NOT auto-save the SecurityContext to the session,
                // so ordinary JWT-authenticated API requests remain effectively stateless.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )

                // ── OAuth2 Login ──────────────────────────────────────────────
                // Wire up Google OAuth2 login with our custom handlers.
                // successHandler: issues JWT tokens and redirects to the React callback page.
                // failureHandler: redirects to the React login page with an error flag.
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                )

                // ── Exception handling ────────────────────────────────────────
                // Override the default authentication entry point.
                //
                // Root cause of the 302 redirect bug:
                // When oauth2Login() is present, Spring Security installs
                // LoginUrlAuthenticationEntryPoint as the default entry point.
                // That entry point redirects any unauthenticated request to the
                // OAuth2 authorization URL — which is why GET /auth/me was getting
                // a 302 to Google instead of a 401.
                //
                // Fix: replace the entry point with HttpStatusEntryPoint(UNAUTHORIZED).
                // This makes ALL unauthenticated API requests return 401 immediately.
                // The OAuth2 flow is still reachable via the explicit public paths
                // (/oauth2/authorization/google, /login/oauth2/code/google) that are
                // already marked .permitAll() above — those never hit this entry point.
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )

                // Register the DaoAuthenticationProvider so Spring Security knows
                // how to authenticate username/password login requests.
                .authenticationProvider(authenticationProvider())

                // Insert JwtFilter before the standard UsernamePasswordAuthenticationFilter.
                // This ensures the SecurityContext is populated from the JWT token
                // before Spring Security's own authentication processing runs.
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // =========================================================================
    // Authentication beans
    // =========================================================================

    /**
     * Configures the {@link DaoAuthenticationProvider} that handles
     * username/password authentication for the login endpoint.
     *
     * <p>Wires together:
     * <ul>
     *   <li>{@link UserDetailsService} — loads the user record from the database by email.</li>
     *   <li>{@link PasswordEncoder} — verifies the submitted password against the stored BCrypt hash.</li>
     * </ul>
     *
     * @return a configured {@link AuthenticationProvider} bean
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        // Tell Spring Security how to load users during login
        provider.setUserDetailsService(userDetailsService);
        // Tell Spring Security how to verify passwords (BCrypt)
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * Exposes the {@link AuthenticationManager} as a Spring bean.
     *
     * <p>The {@code AuthenticationManager} is required by the {@code AuthService}
     * login method to programmatically trigger authentication
     * (i.e. {@code authManager.authenticate(new UsernamePasswordAuthenticationToken(...))}).
     *
     * @param config Spring's {@link AuthenticationConfiguration} auto-configured bean
     * @return the application's {@link AuthenticationManager}
     * @throws Exception if the manager cannot be retrieved
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Defines the password encoding strategy used throughout the application.
     *
     * <p>BCrypt is used with its default cost factor (10 rounds), which provides
     * a good balance between security and performance for a university application.
     * All passwords are hashed with BCrypt before storage and verified here during login.
     *
     * @return a {@link BCryptPasswordEncoder} instance
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
