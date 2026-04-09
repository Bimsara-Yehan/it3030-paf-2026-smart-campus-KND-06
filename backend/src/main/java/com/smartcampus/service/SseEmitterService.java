package com.smartcampus.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registry for active Server-Sent Event (SSE) connections.
 *
 * <p>Each authenticated user can have one active SSE connection at a time.
 * When the same user opens a second tab the old emitter is replaced — the
 * browser will re-connect the closed tab automatically.
 *
 * <p>The {@link ConcurrentHashMap} makes all operations thread-safe under
 * concurrent connects, disconnects, and push events from {@code @Async} threads.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 */
@Slf4j
@Service
public class SseEmitterService {

    /** SSE connection timeout — 30 minutes. The browser reconnects after timeout. */
    private static final long SSE_TIMEOUT_MS = 30 * 60 * 1_000L;

    /** Active emitter per user. Only one connection per user is kept alive. */
    private final ConcurrentHashMap<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * Creates and registers a new SSE emitter for the given user.
     *
     * <p>If the user already has an active emitter (e.g. second tab), the old
     * one is completed (which tells the browser to reconnect on the existing tab)
     * and replaced with the new connection.
     *
     * @param userId the UUID of the authenticated user
     * @return the newly created {@link SseEmitter} to be returned as the HTTP response body
     */
    public SseEmitter createEmitter(UUID userId) {
        // Remove and complete any existing emitter for this user
        SseEmitter existing = emitters.remove(userId);
        if (existing != null) {
            existing.complete();
        }

        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        emitter.onCompletion(() -> {
            emitters.remove(userId);
            log.debug("SSE connection completed for user {}", userId);
        });

        emitter.onTimeout(() -> {
            emitters.remove(userId);
            log.debug("SSE connection timed out for user {}", userId);
        });

        emitter.onError(ex -> {
            emitters.remove(userId);
            log.debug("SSE connection error for user {}: {}", userId, ex.getMessage());
        });

        emitters.put(userId, emitter);
        log.debug("SSE emitter registered for user {}", userId);

        // Send an initial "connected" event so the client knows the stream is live
        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
        } catch (IOException e) {
            log.warn("Failed to send SSE connected event to user {}: {}", userId, e.getMessage());
        }

        return emitter;
    }

    /**
     * Pushes a notification event to the user's active SSE connection (if any).
     *
     * <p>Called by {@link NotificationService} after every successful notification
     * insert. If the user is not currently connected the event is silently dropped —
     * they will see the notification the next time they fetch the full list.
     *
     * @param userId  the UUID of the recipient user
     * @param payload a string payload sent as the SSE event data (e.g. JSON or a plain count)
     */
    public void sendToUser(UUID userId, String payload) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) {
            return; // user is not connected — drop silently
        }

        try {
            emitter.send(SseEmitter.event().name("notification").data(payload));
            log.debug("SSE notification pushed to user {}", userId);
        } catch (IOException e) {
            // Client disconnected mid-send — remove the stale emitter
            emitters.remove(userId);
            log.debug("SSE send failed for user {} (client disconnected): {}", userId, e.getMessage());
        }
    }
}
