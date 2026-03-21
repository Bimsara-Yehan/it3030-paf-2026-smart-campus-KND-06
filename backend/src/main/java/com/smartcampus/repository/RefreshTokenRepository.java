package com.smartcampus.repository;

import com.smartcampus.entity.RefreshToken;
import com.smartcampus.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link RefreshToken} entity.
 *
 * <p>Provides all CRUD operations inherited from {@link JpaRepository} plus
 * custom query methods for the token refresh lifecycle:
 * <ul>
 *   <li><b>Lookup</b>  — find a token by its string value for validation.</li>
 *   <li><b>Revoke</b>  — bulk-revoke all tokens for a user on logout.</li>
 *   <li><b>Cleanup</b> — delete expired tokens to prevent unbounded table growth.</li>
 * </ul>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     RefreshToken
 * @see     com.smartcampus.service.AuthService
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    // =========================================================================
    // Token lookup
    // =========================================================================

    /**
     * Finds a refresh token record by its raw JWT string value.
     *
     * <p>Called on every {@code POST /auth/refresh} and {@code POST /auth/logout}
     * request. The {@code UNIQUE} index on the {@code token} column and the
     * database index {@code idx_refresh_tokens_token} make this a fast O(1) lookup.
     *
     * @param token the raw JWT refresh token string received from the client
     * @return an {@link Optional} containing the token entity if found, or empty if
     *         the token does not exist in the database (never issued or already deleted)
     */
    Optional<RefreshToken> findByToken(String token);

    // =========================================================================
    // Bulk revocation
    // =========================================================================

    /**
     * Deletes all refresh token records belonging to the given user.
     *
     * <p>Used during logout to immediately invalidate all active sessions
     * across all devices. After this call, the user must log in again on
     * every device to obtain new tokens.
     *
     * <p>The {@code @Modifying} annotation is required by Spring Data JPA for
     * any query that mutates the database (INSERT, UPDATE, DELETE). The
     * {@code clearAutomatically = true} option clears the first-level cache
     * after execution so subsequent lookups reflect the deletion.
     *
     * @param user the user whose tokens should all be deleted
     */
    @Modifying(clearAutomatically = true)
    void deleteAllByUser(User user);

    // =========================================================================
    // Scheduled cleanup
    // =========================================================================

    /**
     * Deletes all refresh token records whose {@code expires_at} timestamp
     * is before the given cutoff time.
     *
     * <p>Intended to be called by a scheduled job (e.g. nightly) to remove
     * expired tokens and prevent the {@code refresh_tokens} table from growing
     * without bound. The database index {@code idx_refresh_tokens_expires}
     * ensures this bulk-delete is efficient even on large tables.
     *
     * <p>A native JPQL delete is used here (rather than a derived method name)
     * because Spring Data's derived delete does a {@code SELECT} followed by
     * per-entity deletes, which is significantly less efficient than a single
     * bulk {@code DELETE} statement for large cleanup operations.
     *
     * @param cutoff all tokens with {@code expiresAt} strictly before this
     *               timestamp will be deleted (pass {@link LocalDateTime#now()}
     *               to remove all currently expired tokens)
     * @return the number of token records deleted
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :cutoff")
    int deleteAllByExpiresAtBefore(@Param("cutoff") LocalDateTime cutoff);
}
