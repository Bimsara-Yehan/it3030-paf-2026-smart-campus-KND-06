package com.smartcampus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Single-use, time-limited token for the password-reset flow.
 *
 * <p>Lifecycle:
 * <ol>
 *   <li>Created when the user calls {@code POST /auth/forgot-password}.</li>
 *   <li>Emailed to the user as a link: {@code /reset-password?token=<value>}.</li>
 *   <li>Consumed (and {@code usedAt} stamped) when {@code POST /auth/reset-password}
 *       is called with a valid, unexpired token.</li>
 *   <li>Expired tokens and used tokens are both rejected — they are not deleted
 *       so they can be reviewed in an audit if needed.</li>
 * </ol>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 */
@Entity
@Table(name = "password_reset_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    /** The user who requested the reset. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The opaque token value embedded in the reset link. Must be unique. */
    @Column(nullable = false, unique = true, length = 255)
    private String token;

    /** Absolute expiry — tokens older than this are rejected. */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Set to the current timestamp when the token is successfully consumed.
     * {@code null} means the token has not been used yet.
     */
    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Convenience — true if this token has already been used. */
    public boolean isUsed() {
        return usedAt != null;
    }

    /** Convenience — true if this token has passed its expiry time. */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
