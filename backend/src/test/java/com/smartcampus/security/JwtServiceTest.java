package com.smartcampus.security;

import com.smartcampus.entity.User;
import com.smartcampus.enums.UserRole;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link JwtService}.
 *
 * <p>{@code JwtService} has no Spring-managed dependencies — it reads three
 * {@code @Value} fields and delegates entirely to the JJWT library. Tests
 * therefore instantiate it directly (no {@code @SpringBootTest} needed) and
 * inject the three config values with {@link ReflectionTestUtils#setField}.
 *
 * <p>The test secret is a 64-character ASCII string (512 bits).  JJWT 0.12.x
 * requires at least 256 bits (32 bytes) for HS256; using a larger key satisfies
 * that constraint without any real-world security implications for unit tests.
 *
 * <p>Test coverage:
 * <ul>
 *   <li>Access token generation — non-null, correct 3-part JWT format.</li>
 *   <li>Email extraction — round-trip: generate → extract → compare.</li>
 *   <li>Token validation — valid token returns {@code true}; token for a
 *       different user returns {@code false}.</li>
 *   <li>Expiry — generating a token with a negative lifetime produces a token
 *       that is already expired; JJWT throws {@link ExpiredJwtException} when
 *       parsing it, which is the expected rejection signal.</li>
 * </ul>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 */
@SuppressWarnings("null")
@DisplayName("JwtService unit tests")
class JwtServiceTest {

    // ── Subject under test ────────────────────────────────────────────────────

    private JwtService jwtService;

    /**
     * Test HMAC-SHA256 signing secret.
     *
     * <p>Must be ≥ 32 bytes (256 bits) to satisfy JJWT 0.12.x's minimum key
     * length for HS256.  This 64-character string gives 512 bits of key material.
     */
    private static final String TEST_SECRET =
            "SmartCampusUnitTestSecretKey_MustBe32BytesMinimumForHS256!!";

    /** Access token lifetime used for most tests (15 minutes in ms). */
    private static final long ACCESS_TTL_MS  = 900_000L;

    /** Refresh token lifetime (7 days in ms). */
    private static final long REFRESH_TTL_MS = 604_800_000L;

    // ── Setup ─────────────────────────────────────────────────────────────────

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret",                   TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "accessTokenExpirationMs",     ACCESS_TTL_MS);
        ReflectionTestUtils.setField(jwtService, "refreshTokenExpirationMs",    REFRESH_TTL_MS);
    }

    // ── Test user factory ─────────────────────────────────────────────────────

    /**
     * Builds a minimal {@link User} entity suitable for token generation tests.
     * The UUID {@code id} must be non-null because {@code buildToken()} calls
     * {@code user.getId().toString()} when embedding the {@code userId} claim.
     */
    private static User testUser(String email, UserRole role) {
        return User.builder()
                .id(UUID.randomUUID())
                .name("Test User")
                .email(email)
                .role(role)
                .isActive(Boolean.TRUE)
                .build();
    }

    // =========================================================================
    // generateAccessToken()
    // =========================================================================

    @Test
    @DisplayName("generateAccessToken — should return a non-empty, well-formed JWT string")
    void shouldGenerateNonNullAccessToken() {
        // ── Arrange ─────────────────────────────────────────────────────────
        User user = testUser("student@sliit.lk", UserRole.USER);

        // ── Act ─────────────────────────────────────────────────────────────
        String token = jwtService.generateAccessToken(user);

        // ── Assert ──────────────────────────────────────────────────────────
        assertNotNull(token,                    "Token must not be null");
        assertFalse(token.isBlank(),            "Token must not be blank");

        // A compact JWT is exactly three Base64url segments separated by dots:
        //   header.payload.signature
        String[] parts = token.split("\\.");
        assertEquals(3, parts.length,
                "JWT must have exactly 3 dot-separated parts (header.payload.signature)");
    }

    // =========================================================================
    // extractEmail()
    // =========================================================================

    @Test
    @DisplayName("extractEmail — should return the email encoded as the JWT subject claim")
    void shouldExtractCorrectEmailFromToken() {
        // ── Arrange ─────────────────────────────────────────────────────────
        User user = testUser("lecturer@sliit.lk", UserRole.USER);
        String token = jwtService.generateAccessToken(user);

        // ── Act ─────────────────────────────────────────────────────────────
        String extracted = jwtService.extractEmail(token);

        // ── Assert ──────────────────────────────────────────────────────────
        assertEquals("lecturer@sliit.lk", extracted,
                "Extracted email must match the address used to generate the token");
    }

    // =========================================================================
    // generateAccessToken() — role claim round-trip
    // =========================================================================

    @Test
    @DisplayName("generateAccessToken — token generated for an ADMIN user should be valid for that user")
    void shouldProduceValidTokenForAdminUser() {
        // ── Arrange ─────────────────────────────────────────────────────────
        User adminUser = testUser("admin@sliit.lk", UserRole.ADMIN);
        String token = jwtService.generateAccessToken(adminUser);

        // ── Act ─────────────────────────────────────────────────────────────
        String extractedEmail = jwtService.extractEmail(token);
        boolean valid = jwtService.isTokenValid(token, adminUser);

        // ── Assert ──────────────────────────────────────────────────────────
        assertEquals("admin@sliit.lk", extractedEmail,
                "Email claim must survive a round-trip for ADMIN tokens");
        assertTrue(valid, "Token generated for the ADMIN user must be valid for that same user");
    }

    // =========================================================================
    // isTokenValid()
    // =========================================================================

    @Test
    @DisplayName("isTokenValid — should return true when the token matches the user and is not expired")
    void shouldReturnTrueForValidToken() {
        // ── Arrange ─────────────────────────────────────────────────────────
        User user = testUser("valid@example.com", UserRole.USER);
        String token = jwtService.generateAccessToken(user);

        // ── Act ─────────────────────────────────────────────────────────────
        boolean valid = jwtService.isTokenValid(token, user);

        // ── Assert ──────────────────────────────────────────────────────────
        assertTrue(valid, "A freshly generated token must be valid for the user it was issued to");
    }

    @Test
    @DisplayName("isTokenValid — should return false when the token belongs to a different user")
    void shouldReturnFalseForTokenBelongingToDifferentUser() {
        // ── Arrange ─────────────────────────────────────────────────────────
        User userA = testUser("a@example.com", UserRole.USER);
        User userB = testUser("b@example.com", UserRole.USER);
        String tokenForA = jwtService.generateAccessToken(userA);

        // ── Act ─────────────────────────────────────────────────────────────
        boolean validForB = jwtService.isTokenValid(tokenForA, userB);

        // ── Assert ──────────────────────────────────────────────────────────
        assertFalse(validForB,
                "A token issued for user A must not be accepted as valid for user B");
    }

    // =========================================================================
    // isTokenExpired() / expired token behaviour
    // =========================================================================

    @Test
    @DisplayName("expired token — should throw ExpiredJwtException when parsed after its expiry time")
    void shouldThrowExpiredJwtExceptionForExpiredToken() {
        // ── Arrange ─────────────────────────────────────────────────────────
        // A negative expiration (−1 000 ms) means the token expired 1 second
        // before it was even created — JJWT rejects it immediately on parsing.
        ReflectionTestUtils.setField(jwtService, "accessTokenExpirationMs", -1_000L);
        User user = testUser("expired@example.com", UserRole.USER);
        String expiredToken = jwtService.generateAccessToken(user);

        // Reset so other tests are unaffected — @BeforeEach does NOT re-run between
        // the arrange and act steps, so we restore manually.
        ReflectionTestUtils.setField(jwtService, "accessTokenExpirationMs", ACCESS_TTL_MS);

        // ── Act + Assert ─────────────────────────────────────────────────────
        // JJWT 0.12.x throws ExpiredJwtException when parseSignedClaims() is
        // called on a token whose exp claim is in the past.  This is the expected
        // signal that the token has been rejected — it does not silently return false.
        assertThrows(ExpiredJwtException.class,
                () -> jwtService.isTokenExpired(expiredToken),
                "Parsing an expired token must throw ExpiredJwtException");
    }
}
