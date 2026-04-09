package com.smartcampus.dto.response;

import com.smartcampus.entity.LoginHistory;
import com.smartcampus.enums.LoginStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Read-only DTO representing a single login history entry in API responses.
 *
 * <p>Exposes only the fields needed by the Login Activity page — the raw
 * {@link LoginHistory} entity is never returned directly to avoid serialising
 * the LAZY {@link com.smartcampus.entity.User} association.
 *
 * <p>The convenience methods {@link #getBrowser()} and {@link #getDevice()}
 * parse the raw User-Agent string into human-friendly labels so the frontend
 * can display "Chrome on Windows" rather than a 200-character UA string.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     LoginHistory
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginHistoryResponse {

    /** UUID of the login history record. */
    private UUID id;

    /** UUID of the user who made the attempt (may be {@code null} for unknown-email failures). */
    private UUID userId;

    /** The email address that was submitted in the login request. */
    private String email;

    /** The client IP address (IPv4 or IPv6). May be {@code null}. */
    private String ipAddress;

    /**
     * The raw User-Agent header string from the login request.
     * Use {@link #getBrowser()} and {@link #getDevice()} for parsed labels.
     */
    private String userAgent;

    /** Whether the login attempt succeeded or failed. */
    private LoginStatus status;

    /** UTC timestamp of the login attempt. */
    private LocalDateTime createdAt;

    // =========================================================================
    // Factory
    // =========================================================================

    /**
     * Converts a {@link LoginHistory} JPA entity to a {@link LoginHistoryResponse} DTO.
     *
     * <p>The {@link com.smartcampus.entity.User} association is accessed only via
     * {@code entity.getUser().getId()} which is safe even for a LAZY proxy because
     * Hibernate resolves the ID from the FK column without hitting the database.
     *
     * @param entity the entity to convert; must not be {@code null}
     * @return a populated {@link LoginHistoryResponse} DTO
     */
    public static LoginHistoryResponse from(LoginHistory entity) {
        return LoginHistoryResponse.builder()
                .id(entity.getId())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .email(entity.getEmail())
                .ipAddress(entity.getIpAddress())
                .userAgent(entity.getUserAgent())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    // =========================================================================
    // User-Agent helpers
    // =========================================================================

    /**
     * Returns a human-friendly browser name extracted from the User-Agent string.
     *
     * <p>Detection order matters — Edge and Opera both contain "Chrome" in their
     * UA strings, so they must be checked before Chrome.
     *
     * @return browser name (e.g. "Chrome", "Firefox", "Safari") or "Unknown Browser"
     */
    public String getBrowser() {
        if (userAgent == null || userAgent.isBlank()) {
            return "Unknown Browser";
        }
        String ua = userAgent.toLowerCase();
        if (ua.contains("edg/") || ua.contains("edge/")) return "Edge";
        if (ua.contains("opr/") || ua.contains("opera"))  return "Opera";
        if (ua.contains("chrome"))                         return "Chrome";
        if (ua.contains("firefox"))                        return "Firefox";
        if (ua.contains("safari"))                         return "Safari";
        if (ua.contains("msie") || ua.contains("trident")) return "Internet Explorer";
        return "Unknown Browser";
    }

    /**
     * Returns a human-friendly device / OS label extracted from the User-Agent string.
     *
     * @return OS/device name (e.g. "Windows", "macOS", "Android") or "Unknown Device"
     */
    public String getDevice() {
        if (userAgent == null || userAgent.isBlank()) {
            return "Unknown Device";
        }
        String ua = userAgent.toLowerCase();
        if (ua.contains("android"))       return "Android";
        if (ua.contains("iphone"))        return "iPhone";
        if (ua.contains("ipad"))          return "iPad";
        if (ua.contains("windows"))       return "Windows";
        if (ua.contains("macintosh") || ua.contains("mac os x")) return "macOS";
        if (ua.contains("linux"))         return "Linux";
        return "Unknown Device";
    }
}
