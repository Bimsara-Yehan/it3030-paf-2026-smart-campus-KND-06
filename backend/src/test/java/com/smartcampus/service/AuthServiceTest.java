package com.smartcampus.service;

import com.smartcampus.dto.request.LoginRequest;
import com.smartcampus.dto.request.RegisterRequest;
import com.smartcampus.dto.response.AuthResponse;
import com.smartcampus.entity.RefreshToken;
import com.smartcampus.entity.User;
import com.smartcampus.enums.UserRole;
import com.smartcampus.exception.ConflictException;
import com.smartcampus.repository.RefreshTokenRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AuthService}.
 *
 * <p>All external collaborators (repositories, encoder, JWT service,
 * Spring Security's {@code AuthenticationManager}) are replaced with Mockito
 * mocks so each test verifies only the logic inside {@code AuthService} itself
 * — no database, no Spring context, no real tokens.
 *
 * <p>Test coverage:
 * <ul>
 *   <li>{@link AuthService#register(RegisterRequest)} — success path and
 *       duplicate-email conflict path.</li>
 *   <li>{@link AuthService#login(LoginRequest)} — success path and bad
 *       credentials path.</li>
 *   <li>{@link AuthService#logout(String)} — token revocation path.</li>
 * </ul>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService unit tests")
class AuthServiceTest {

    // ── Mocked dependencies ───────────────────────────────────────────────────

    @Mock private UserRepository         userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder        passwordEncoder;
    @Mock private JwtService             jwtService;
    @Mock private AuthenticationManager  authenticationManager;

    // ── Subject under test ────────────────────────────────────────────────────

    @InjectMocks
    private AuthService authService;

    // ── Test fixtures ─────────────────────────────────────────────────────────

    /** A saved user entity returned by userRepository.save() stubs. */
    private User savedUser;

    // ── Setup ─────────────────────────────────────────────────────────────────

    @BeforeEach
    void setUp() {
        // Inject the @Value field that @InjectMocks cannot populate (no Spring context).
        ReflectionTestUtils.setField(authService, "refreshTokenExpirationMs", 604_800_000L);

        // Reusable saved user entity — simulates what the DB returns after INSERT.
        savedUser = User.builder()
                .id(UUID.randomUUID())
                .name("Jane Smith")
                .email("jane@example.com")
                .passwordHash("$2a$10$hashedpasswordvalue")
                .role(UserRole.USER)
                .isActive(Boolean.TRUE)
                .build();
    }

    // =========================================================================
    // register()
    // =========================================================================

    @Test
    @DisplayName("register — should create a new user and return JWT tokens")
    void shouldRegisterUserSuccessfully() {
        // ── Arrange ─────────────────────────────────────────────────────────
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Jane Smith");
        request.setEmail("jane@example.com");
        request.setPassword("secureP@ss1");

        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secureP@ss1")).thenReturn("$2a$10$hashedpasswordvalue");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateAccessToken(savedUser)).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(savedUser)).thenReturn("mock-refresh-token");
        // refreshTokenRepository.save() return value is unused — default null mock is fine

        // ── Act ─────────────────────────────────────────────────────────────
        AuthResponse response = authService.register(request);

        // ── Assert ──────────────────────────────────────────────────────────
        assertNotNull(response, "AuthResponse must not be null");
        assertEquals("mock-access-token",  response.getAccessToken(),  "Access token should match JwtService output");
        assertEquals("mock-refresh-token", response.getRefreshToken(), "Refresh token should match JwtService output");
        assertNotNull(response.getUser(), "User DTO must be present in the response");

        // Verify the entity passed to save() carries the expected values.
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User capturedUser = userCaptor.getValue();

        assertEquals("jane@example.com",           capturedUser.getEmail(),       "Email should be set from request");
        assertNotEquals("secureP@ss1",              capturedUser.getPasswordHash(), "Password must be encoded, not stored as plain text");
        assertEquals("$2a$10$hashedpasswordvalue",  capturedUser.getPasswordHash(), "Encoded password should match PasswordEncoder output");
        assertEquals(UserRole.USER,                 capturedUser.getRole(),         "New accounts must default to the USER role");
        assertEquals(Boolean.TRUE,                  capturedUser.getIsActive(),     "New accounts must be active by default");
    }

    @Test
    @DisplayName("register — should throw ConflictException when the email is already taken")
    void shouldThrowConflictExceptionWhenEmailAlreadyExists() {
        // ── Arrange ─────────────────────────────────────────────────────────
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Duplicate User");
        request.setEmail("taken@example.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        // ── Act + Assert ─────────────────────────────────────────────────────
        assertThrows(ConflictException.class, () -> authService.register(request),
                "Registering with an existing email should throw ConflictException");

        // Verify save() was never reached — the check must short-circuit early.
        verify(userRepository, never()).save(any());
    }

    // =========================================================================
    // login()
    // =========================================================================

    @Test
    @DisplayName("login — should authenticate and return JWT tokens for valid credentials")
    void shouldLoginSuccessfullyWithCorrectCredentials() {
        // ── Arrange ─────────────────────────────────────────────────────────
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@example.com");
        request.setPassword("secureP@ss1");

        // Spring Security's AuthenticationManager succeeds (returns non-null).
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("jane@example.com", null));
        when(userRepository.findByEmailAndDeletedAtIsNull("jane@example.com"))
                .thenReturn(Optional.of(savedUser));
        when(jwtService.generateAccessToken(savedUser)).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(savedUser)).thenReturn("mock-refresh-token");

        // ── Act ─────────────────────────────────────────────────────────────
        AuthResponse response = authService.login(request);

        // ── Assert ──────────────────────────────────────────────────────────
        assertNotNull(response);
        assertEquals("mock-access-token",  response.getAccessToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        assertNotNull(response.getUser());

        // Old tokens must be revoked before new ones are issued.
        verify(refreshTokenRepository).deleteAllByUser(savedUser);
    }

    @Test
    @DisplayName("login — should propagate BadCredentialsException when credentials are wrong")
    void shouldThrowBadCredentialsExceptionWhenCredentialsAreInvalid() {
        // ── Arrange ─────────────────────────────────────────────────────────
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@example.com");
        request.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // ── Act + Assert ─────────────────────────────────────────────────────
        assertThrows(BadCredentialsException.class, () -> authService.login(request),
                "Invalid credentials should surface as BadCredentialsException");

        // Verify we never attempted a DB user lookup after authentication failed.
        verify(userRepository, never()).findByEmailAndDeletedAtIsNull(anyString());
    }

    // =========================================================================
    // logout()
    // =========================================================================

    @Test
    @DisplayName("logout — should revoke all refresh tokens for the user")
    void shouldRevokeAllRefreshTokensOnLogout() {
        // ── Arrange ─────────────────────────────────────────────────────────
        String rawToken = "valid-refresh-token-string";

        RefreshToken storedToken = RefreshToken.builder()
                .token(rawToken)
                .user(savedUser)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByToken(rawToken)).thenReturn(Optional.of(storedToken));

        // ── Act ─────────────────────────────────────────────────────────────
        authService.logout(rawToken);

        // ── Assert ──────────────────────────────────────────────────────────
        // All tokens for the user should be wiped — logs out every active session.
        verify(refreshTokenRepository).deleteAllByUser(savedUser);
    }
}
