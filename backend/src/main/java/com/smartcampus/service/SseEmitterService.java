package com.smartcampus.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages per-user Server-Sent Events (SSE) connections.
 *
 * <p>Each authenticated user can hold one active SSE stream at a time.
 * Opening a new stream (e.g. page refresh) automatically completes the
 * previous one to avoid leaked emitters.
 *
 * <p>Other services call {@link #sendToUser} to push a notification event
 * to a connected user. If the user has no active stream the call is a no-op.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 */
@Slf4j
@Service
public class SseEmitterService {

    /** Thread-safe registry: one emitter per online user. */
    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();

    // =========================================================================
    // Connection management
    // =========================================================================

    /**
     * Creates a new SSE emitter for the given user and registers it.
     *
     * <p>If the user already has an active emitter (e.g. from another tab),
     * it is completed first to avoid duplicate connections.
     *
     * @param userId the authenticated user's UUID
     * @return a configured {@link SseEmitter} ready to be returned from a controller
     */
    public SseEmitter createEmitter(UUID userId) {
        // Complete any previous connection for this user
        SseEmitter existing = emitters.remove(userId);
        if (existing != null) {
            try { existing.complete(); } catch (Exception ignored) {}
        }

        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.put(userId, emitter);

        // Clean up the registry when the connection ends for any reason
        emitter.onCompletion(() -> {
            emitters.remove(userId);
            log.debug("SSE completed for user {}", userId);
        });
        emitter.onTimeout(() -> {
            emitters.remove(userId);
            log.debug("SSE timed out for user {}", userId);
        });
        emitter.onError(e -> {
            emitters.remove(userId);
            log.debug("SSE error for user {}: {}", userId, e.getMessage());
        });

        // Send an initial "connected" handshake so the browser confirms the stream
        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
        } catch (IOException e) {
            emitters.remove(userId);
        }

        log.debug("SSE stream opened for user {}", userId);
        return emitter;
    }

    // =========================================================================
    // Event delivery
    // =========================================================================

    /**
     * Pushes a notification event to the user's active SSE stream.
     *
     * <p>If the user is not connected (no active emitter) the call is silently
     * ignored — the notification is already persisted in the DB and will be
     * visible when the user next polls or opens the notification page.
     *
     * @param userId the target user's UUID
     * @param data   the payload to serialize as JSON and send
     */
    public void sendToUser(UUID userId, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) {
            return; // User not connected — no-op, DB already has the notification
        }

        try {
            emitter.send(SseEmitter.event()
                    .name("notification")
                    .data(data, MediaType.APPLICATION_JSON));
            log.debug("SSE notification pushed to user {}", userId);
        } catch (IOException e) {
            // Connection was broken — remove the stale emitter
            emitters.remove(userId);
            log.debug("SSE push failed for user {}, emitter removed: {}", userId, e.getMessage());
        }
    }
}
