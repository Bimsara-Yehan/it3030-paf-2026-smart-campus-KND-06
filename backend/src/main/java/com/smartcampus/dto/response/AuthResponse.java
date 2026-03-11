package com.smartcampus.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Response payload returned by the login, register, and token-refresh endpoints.
 *
 * <p>Carries both JWT tokens and a full {@link UserResponse} so the frontend
 * can populate the user session in a single round-trip without an extra
 * {@code GET /auth/me} call immediately after authentication.
 *
 * <p>Token type is hardcoded to {@code "Bearer"} per RFC 6750 §6.1.1. All
 * API requests must include the access token in the {@code Authorization} header:
 * <pre>{@code
 * Authorization: Bearer <accessToken>
 * }</pre>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     UserResponse
 * @see     com.smartcampus.service.AuthService
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    /**
     * Short-lived JWT access token (15 minutes).
     * Must be sent as a Bearer token in the {@code Authorization} header
     * of every protected API request.
     */
    private String accessToken;

    /**
     * Long-lived JWT refresh token (7 days).
     * Stored securely by the client and sent only to {@code POST /auth/refresh}
     * to obtain a new access token when the current one expires.
     */
    private String refreshToken;

    /**
     * Token type per RFC 6750. Always {@code "Bearer"} — included so the
     * client can construct the {@code Authorization} header dynamically
     * without hard-coding the scheme.
     */
    @Builder.Default
    private String tokenType = "Bearer";

    /**
     * Full user profile of the authenticated user.
     * Allows the frontend to initialise the user session without an extra
     * {@code GET /auth/me} call immediately after login or registration.
     */
    private UserResponse user;
}
