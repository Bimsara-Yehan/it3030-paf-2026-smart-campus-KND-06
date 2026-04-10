package com.smartcampus.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT authentication filter that intercepts every HTTP request and establishes
 * the security context when a valid Bearer token is present.
 *
 * <p>Extends {@link OncePerRequestFilter} to guarantee exactly one execution
 * per request, even in forward/include dispatch scenarios.
 *
 * <p>Filter flow:
 * <ol>
 *   <li>Check if the request targets a public auth path — skip filter entirely if so.</li>
 *   <li>Read the {@code Authorization} header and confirm it begins with {@code "Bearer "}.</li>
 *   <li>Extract and validate the JWT token using {@link JwtService}.</li>
 *   <li>Load the user record from the database via {@link UserDetailsService}.</li>
 *   <li>If valid and no authentication is already set, populate the
 *       {@link SecurityContextHolder} so downstream filters and controllers
 *       can access the authenticated principal.</li>
 *   <li>Always call {@code filterChain.doFilter()} to pass the request along.</li>
 * </ol>
 *
 * <p>If any step fails (missing header, expired token, unknown user), the filter
 * simply passes the request through without setting an authentication object.
 * Spring Security's {@code ExceptionTranslationFilter} will then return a 401
 * for any endpoint that requires authentication.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     JwtService
 * @see     SecurityConfig
 */
@Slf4j
@Component
@RequiredArgsConstructor // Constructor injection — no @Autowired field injection
public class JwtFilter extends OncePerRequestFilter {

    /** Prefix that every Bearer token Authorization header must start with. */
    private static final String BEARER_PREFIX = "Bearer ";

    /** HTTP header name that carries the JWT token on each request. */
    private static final String AUTH_HEADER = "Authorization";

    /**
     * Public auth paths that never carry a JWT and should bypass this filter.
     * Note: paths are relative to the context-path (/api/v1) because
     * {@link OncePerRequestFilter#shouldNotFilter} receives the raw servlet path.
     *
     * /auth/me and /auth/login-history are intentionally excluded — they are
     * protected endpoints that require a valid JWT even though they start with /auth/.
     */
    private static final java.util.List<String> PUBLIC_AUTH_PATHS = java.util.List.of(
            "/auth/login",
            "/auth/register",
            "/auth/refresh",
            "/auth/logout",
            "/auth/oauth2"
    );

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    // =========================================================================
    // Filter bypass
    // =========================================================================

    /**
     * Determines whether this filter should be skipped for the given request.
     *
     * <p>Only truly public auth endpoints (login, register, refresh, logout,
     * OAuth2 initiation) bypass JWT validation. Protected endpoints such as
     * {@code /auth/me} and {@code /auth/login-history} still require JWT
     * processing even though they start with {@code /auth/}.
     *
     * @param request the incoming HTTP request
     * @return {@code true} if the filter should be skipped; {@code false} to apply it
     * @throws ServletException never thrown by this implementation
     */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        boolean skip = PUBLIC_AUTH_PATHS.stream().anyMatch(path::startsWith);
        if (skip) {
            log.trace("JWT filter skipped for public path: {}", path);
        }
        return skip;
    }

    // =========================================================================
    // Core filter logic
    // =========================================================================

    /**
     * Main filter method — extracts, validates, and applies the JWT authentication.
     *
     * <p>This method ALWAYS calls {@code filterChain.doFilter(request, response)}
     * at the end, regardless of whether authentication succeeded. Rejecting the
     * request (401) is the responsibility of Spring Security's access control
     * layer, not this filter.
     *
     * @param request     the incoming HTTP request
     * @param response    the outgoing HTTP response
     * @param filterChain the remaining filter chain to invoke after this filter
     * @throws ServletException if a servlet-related error occurs downstream
     * @throws IOException      if an I/O error occurs downstream
     */
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // ── Step 1: Read the Authorization header ──────────────────────────────
        final String authHeader = request.getHeader(AUTH_HEADER);

        // ── Step 2 & 3: Extract the raw JWT string ─────────────────────────────
        // Primary path:  Authorization: Bearer <token>  (all normal API calls).
        // Fallback path: ?token= query param — required for SSE EventSource because
        //                the browser EventSource API cannot set custom request headers.
        final String jwt;
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            jwt = authHeader.substring(BEARER_PREFIX.length());
        } else {
            String tokenParam = request.getParameter("token");
            if (tokenParam != null && !tokenParam.isEmpty()) {
                jwt = tokenParam;
            } else {
                log.trace("No Bearer token found in request to: {}", request.getServletPath());
                filterChain.doFilter(request, response);
                return;
            }
        }

        try {
            // ── Step 4: Extract the user email from the token ─────────────────
            // extractEmail() also verifies the signature — a tampered token throws here.
            final String email = jwtService.extractEmail(jwt);

            // ── Step 5: Always prioritize JWT ─────────────────────────────────
            // Overwrite any existing authentication (e.g. from an OAuth session)
            // with the DB user record linked to this JWT. This ensures that
            // @AuthenticationPrincipal User casts in controllers never fail.
            if (email != null) {

                // ── Step 6: Load the user from the database ───────────────────
                // UserDetailsService hits the DB to get the live user record,
                // ensuring that disabled or soft-deleted accounts are rejected
                // even if their token has not yet expired.
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // ── Step 7: Validate the token against the loaded user ─────────
                // Checks: (a) subject matches email, (b) token is not expired.
                // Signature validity was already confirmed in step 4.
                if (jwtService.isTokenValid(jwt, userDetails)) {

                    // ── Step 8: Build the authentication token ─────────────────
                    // UsernamePasswordAuthenticationToken with credentials=null
                    // signals a fully authenticated principal (not just an attempt).
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,                          // credentials not needed post-authentication
                                    userDetails.getAuthorities()   // roles/permissions for authorisation checks
                            );

                    // Attach request metadata (IP, session ID) to the authentication object
                    // so it is available to audit listeners and security events.
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // ── Step 9: Set authentication in the SecurityContext ──────
                    // From this point forward, any call to SecurityContextHolder
                    // .getContext().getAuthentication() will return this token,
                    // allowing @PreAuthorize, hasRole(), and principal injection to work.
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    log.debug("JWT authentication set for user: {} on path: {}",
                            email, request.getServletPath());
                }
            }

        } catch (Exception ex) {
            // Any JwtException (expired, malformed, invalid signature) or
            // UsernameNotFoundException lands here. Log the issue and continue
            // without setting authentication — Spring Security will return 401.
            log.warn("JWT authentication failed for request to {}: {}",
                    request.getServletPath(), ex.getMessage());
        }

        // ── Step 10: Always continue the filter chain ──────────────────────────
        // This filter never short-circuits the response directly. Spring Security's
        // ExceptionTranslationFilter handles 401/403 responses for unauthenticated
        // or unauthorised requests after the chain completes.
        filterChain.doFilter(request, response);
    }
}
