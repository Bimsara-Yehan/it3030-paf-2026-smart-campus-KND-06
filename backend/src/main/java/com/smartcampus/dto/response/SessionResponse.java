package com.smartcampus.dto.response;

import com.smartcampus.entity.RefreshToken;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Read-only DTO representing one active refresh-token session on the
 * "Active Sessions" management page.
 */
@Getter
@Builder
public class SessionResponse {

    private UUID id;
    private String userAgent;
    private String ipAddress;
    private String browser;
    private String device;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    public static SessionResponse from(RefreshToken token) {
        String ua = token.getUserAgent();
        return SessionResponse.builder()
                .id(token.getId())
                .userAgent(ua)
                .ipAddress(token.getIpAddress())
                .browser(parseBrowser(ua))
                .device(parseDevice(ua))
                .createdAt(token.getCreatedAt())
                .expiresAt(token.getExpiresAt())
                .build();
    }

    private static String parseBrowser(String ua) {
        if (ua == null) return "Unknown";
        if (ua.contains("Edg/"))     return "Edge";
        if (ua.contains("Chrome"))   return "Chrome";
        if (ua.contains("Firefox"))  return "Firefox";
        if (ua.contains("Safari"))   return "Safari";
        if (ua.contains("curl"))     return "curl";
        return "Unknown";
    }

    private static String parseDevice(String ua) {
        if (ua == null) return "Unknown";
        if (ua.contains("iPhone"))   return "iPhone";
        if (ua.contains("iPad"))     return "iPad";
        if (ua.contains("Android"))  return "Android";
        if (ua.contains("Windows"))  return "Windows";
        if (ua.contains("Macintosh")) return "Mac";
        if (ua.contains("Linux"))    return "Linux";
        return "Unknown";
    }
}
