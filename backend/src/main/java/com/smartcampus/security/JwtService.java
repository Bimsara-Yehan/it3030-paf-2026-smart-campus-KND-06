package com.smartcampus.security;

import com.smartcampus.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

/**
 * Service responsible for all JWT operations in the Smart Campus system.
 *
 * <p>Implements the dual-token pattern:
 * <ul>
 *   <li><b>Access token</b>  — short-lived (15 min), sent in every API request header.</li>
 *   <li><b>Refresh token</b> — long-lived (7 days), used only to obtain a new access token.</li>
 * </ul>
 *
 * <p>All tokens are signed with HMAC-SHA256 (HS256) using a shared secret
 * configured in {@code application.yml}. The secret must be at least 256 bits
 * (32 bytes) for HS256; a Base64-encoded 64-byte random string is recommended.
 *
 * <p>Uses the JJWT 0.12.x fluent builder API — the older
 * {@code Jwts.parser().setSigningKey()} API from 0.11.x is NOT used here.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     JwtFilter
 */
@Slf4j
@Service
public class JwtService {

    // ── Custom claim key constants ─────────────────────────────────────────────
    // Using constants prevents typos when writing and reading claims.
    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_EMAIL   = "email";
    private static final String CLAIM_ROLE    = "role";

    // ── Configuration (injected from application.yml) ─────────────────────────

    /**
     * Raw JWT secret string from {@code app.jwt.secret}.
     * Converted to a {@link SecretKey} lazily via {@link #getSigningKey()}.
     */
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    /**
     * Access token lifetime in milliseconds from {@code app.jwt.access-token-expiration-ms}.
     * Default: 900 000 ms = 15 minutes.
     */
    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    /**
     * Refresh token lifetime in milliseconds from {@code app.jwt.refresh-token-expiration-ms}.
     * Default: 604 800 000 ms = 7 days.
     */
    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    // =========================================================================
    // Token generation
    // =========================================================================

    /**
     * Generates a short-lived JWT access token for the given user.
     *
     * <p>The token embeds three custom claims:
     * <ul>
     *   <li>{@code userId} — the user's UUID, used for fast DB lookups without
     *       an extra email → ID join in the security filter.</li>
     *   <li>{@code email}  — the user's email address (also the JWT subject).</li>
     *   <li>{@code role}   — the user's role string (e.g. {@code "ADMIN"}), so
     *       authorisation decisions can be made without a DB call.</li>
     * </ul>
     *
     * <p>The token subject ({@code sub}) is set to the user's email to align with
     * the JWT specification, which recommends the subject identify the principal.
     *
     * @param user the authenticated {@link User} entity
     * @return a compact, Base64url-encoded JWT string (header.payload.signature)
     */
    public String generateAccessToken(User user) {
        log.debug("Generating access token for user: {}", user.getEmail());
        return buildToken(user, accessTokenExpirationMs);
    }

    /**
     * Generates a long-lived JWT refresh token for the given user.
     *
     * <p>The refresh token carries the same claims as the access token so the
     * server can identify the user during the refresh flow without a DB round-trip.
     * However, the refresh token is validated against the {@code refresh_tokens}
     * table (which records revocation status) before a new access token is issued.
     *
     * @param user the authenticated {@link User} entity
     * @return a compact, Base64url-encoded JWT string valid for 7 days
     */
    public String generateRefreshToken(User user) {
        log.debug("Generating refresh token for user: {}", user.getEmail());
        return buildToken(user, refreshTokenExpirationMs);
    }

    /**
     * Internal helper that constructs and signs a JWT with the given expiry.
     *
     * <p>Both access and refresh tokens share the same claim structure —
     * only the expiration time differs. This avoids duplicated builder code.
     *
     * @param user          the principal whose claims are embedded in the token
     * @param expirationMs  token lifetime in milliseconds from the current time
     * @return signed, compact JWT string
     */
    private String buildToken(User user, long expirationMs) {
        long nowMs = System.currentTimeMillis();

        return Jwts.builder()
                // Standard claims
                .subject(user.getEmail())           // sub = email (JWT spec §4.1.2)
                .issuedAt(new Date(nowMs))           // iat = current time
                .expiration(new Date(nowMs + expirationMs)) // exp = now + lifetime

                // Custom application claims
                .claims(Map.of(
                        CLAIM_USER_ID, user.getId().toString(), // UUID → String for JSON compatibility
                        CLAIM_EMAIL,   user.getEmail(),
                        CLAIM_ROLE,    user.getRole().name()
                ))

                // Sign with HS256 and the configured secret key
                .signWith(getSigningKey())

                // Produce the final compact "header.payload.signature" string
                .compact();
    }

    // =========================================================================
    // Claim extraction
    // =========================================================================

    /**
     * Extracts the email address from a JWT token.
     *
     * <p>The email is stored both as the JWT subject ({@code sub}) and as a
     * custom {@code email} claim. We read the {@code sub} field here because
     * it is a standard claim and is always present.
     *
     * @param token the compact JWT string
     * @return the email address embedded in the token's subject claim
     * @throws io.jsonwebtoken.JwtException if the token is malformed, expired, or has an invalid signature
     */
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts the user's UUID from the {@code userId} custom claim.
     *
     * <p>The UUID was stored as a {@link String} when the token was built
     * (JSON does not have a native UUID type). It is parsed back to a
     * {@link UUID} here for type safety.
     *
     * @param token the compact JWT string
     * @return the user's UUID
     * @throws io.jsonwebtoken.JwtException if the token is malformed, expired, or has an invalid signature
     * @throws IllegalArgumentException if the {@code userId} claim is missing or not a valid UUID
     */
    public UUID extractUserId(String token) {
        // Claim is stored as String — parse back to UUID
        String userIdStr = extractClaim(token, claims -> claims.get(CLAIM_USER_ID, String.class));
        return UUID.fromString(userIdStr);
    }

    /**
     * Generic claim extractor using a functional resolver.
     *
     * <p>All specific {@code extract*()} methods delegate here to keep
     * JWT parsing logic in one place — only the resolver function differs.
     *
     * @param <T>      the expected return type of the claim
     * @param token    the compact JWT string
     * @param resolver a function that maps the full {@link Claims} object to the desired value
     * @return the extracted claim value
     * @throws io.jsonwebtoken.JwtException if parsing fails for any reason
     */
    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    /**
     * Parses and verifies the JWT signature, returning all claims.
     *
     * <p>Uses the JJWT 0.12.x {@code Jwts.parser()} fluent API.
     * If the signature is invalid, the token has expired, or the format
     * is wrong, JJWT throws a subclass of {@link io.jsonwebtoken.JwtException}
     * which propagates to the caller (typically {@link JwtFilter}).
     *
     * @param token the compact JWT string
     * @return the verified {@link Claims} payload
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())   // JJWT 0.12.x — replaces deprecated setSigningKey()
                .build()
                .parseSignedClaims(token)      // Throws JwtException on any verification failure
                .getPayload();
    }

    // =========================================================================
    // Token validation
    // =========================================================================

    /**
     * Validates the token against the supplied {@link UserDetails}.
     *
     * <p>A token is considered valid if and only if:
     * <ol>
     *   <li>The {@code sub} claim matches the {@link UserDetails#getUsername()} (email).</li>
     *   <li>The token has not expired (checked via {@link #isTokenExpired(String)}).</li>
     * </ol>
     *
     * <p>Signature verification is performed implicitly inside
     * {@link #extractAllClaims(String)} — an invalid signature throws before
     * this method can return {@code true}.
     *
     * @param token        the compact JWT string to validate
     * @param userDetails  the loaded user principal to match against
     * @return {@code true} if the token is valid for the given user; {@code false} otherwise
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String email = extractEmail(token);
        // Token is valid only if the subject matches the loaded user and the token is not expired
        boolean valid = email.equals(userDetails.getUsername()) && !isTokenExpired(token);
        if (!valid) {
            log.warn("JWT validation failed for user: {}", userDetails.getUsername());
        }
        return valid;
    }

    /**
     * Checks whether the token's expiration time ({@code exp} claim) is in the past.
     *
     * @param token the compact JWT string
     * @return {@code true} if the token has expired; {@code false} if it is still valid
     */
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Extracts the expiration {@link Date} from the token's {@code exp} claim.
     *
     * @param token the compact JWT string
     * @return the expiration date encoded in the token
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // =========================================================================
    // Key management
    // =========================================================================

    /**
     * Derives an HMAC-SHA256 {@link SecretKey} from the configured JWT secret string.
     *
     * <p>JJWT 0.12.x requires a {@link SecretKey} instance rather than a raw
     * byte array or string. {@link Keys#hmacShaKeyFor(byte[])} validates that
     * the key material meets the minimum length for the chosen algorithm (HS256
     * requires ≥ 256 bits / 32 bytes) and throws
     * {@link io.jsonwebtoken.security.WeakKeyException} if it does not.
     *
     * <p>The key is derived on every call — it is not cached as a field because
     * this method is called infrequently relative to the app lifecycle, and
     * avoiding a field keeps the class stateless (easier to test).
     *
     * @return a validated {@link SecretKey} suitable for HS256 signing/verification
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes); // Throws WeakKeyException if < 32 bytes
    }
}
