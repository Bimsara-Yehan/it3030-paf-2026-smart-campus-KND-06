package com.smartcampus.repository;

import com.smartcampus.entity.User;
import com.smartcampus.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link User} entity.
 *
 * <p>Provides CRUD operations inherited from {@link JpaRepository} plus
 * custom queries for soft-delete-aware lookups and role-based filtering.
 *
 * <p>All query methods that retrieve active users include an explicit
 * {@code deletedAt IS NULL} filter to exclude soft-deleted accounts.
 * Methods without this filter are provided for admin use cases where
 * deleted accounts must also be visible (e.g. audit logs).
 *
 * <p>Spring Data JPA generates the SQL implementations for derived query
 * methods (those starting with {@code findBy}, {@code existsBy}, etc.)
 * at application startup. {@code @Query} is used only where derived method
 * names would become unwieldy or for aggregate queries.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     User
 * @see     UserRole
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    // =========================================================================
    // Email-based lookups
    // =========================================================================

    /**
     * Finds a user by their email address regardless of soft-delete status.
     *
     * <p>Used by {@link org.springframework.security.core.userdetails.UserDetailsService}
     * during authentication — Spring Security must be able to load a user even if
     * their account has been soft-deleted, so the service layer can return an
     * appropriate error rather than a misleading "user not found".
     *
     * @param email the email address to search for (case-sensitive, must be unique)
     * @return an {@link Optional} containing the user if found, or empty if not
     */
    Optional<User> findByEmail(String email);

    /**
     * Finds an active (non-deleted) user by their email address.
     *
     * <p>Used for ownership checks and profile lookups where soft-deleted users
     * should be treated as non-existent. Prefer this over {@link #findByEmail(String)}
     * in all contexts except authentication loading.
     *
     * @param email the email address to search for
     * @return an {@link Optional} containing the active user if found, or empty if
     *         the email does not exist or the account has been soft-deleted
     */
    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    /**
     * Checks whether any user (including soft-deleted) is registered with the given email.
     *
     * <p>Used during registration to enforce the unique email constraint at the
     * application layer before hitting the database unique index, providing a
     * cleaner error message than catching a {@code DataIntegrityViolationException}.
     *
     * @param email the email address to check
     * @return {@code true} if at least one user (active or deleted) has this email
     */
    boolean existsByEmail(String email);

    // =========================================================================
    // Paginated and filtered queries
    // =========================================================================

    /**
     * Returns a paginated list of all active (non-deleted) users.
     *
     * <p>Used by admin endpoints to browse the user list with pagination support.
     * The {@link Pageable} parameter controls page number, page size, and sort order.
     *
     * @param pageable pagination and sorting parameters
     * @return a {@link Page} of active users, never {@code null}
     */
    Page<User> findAllByDeletedAtIsNull(Pageable pageable);

    /**
     * Returns all active users with a specific role.
     *
     * <p>Use cases:
     * <ul>
     *   <li>Admin assigns a ticket — needs the list of available technicians.</li>
     *   <li>Admin views all users with a specific role for management purposes.</li>
     * </ul>
     *
     * @param role the role to filter by (USER, ADMIN, or TECHNICIAN)
     * @return a list of active users with the given role; empty list if none found
     */
    List<User> findAllByRoleAndDeletedAtIsNull(UserRole role);

    // =========================================================================
    // Aggregate queries
    // =========================================================================

    /**
     * Counts the number of active (non-deleted) users with a specific role.
     *
     * <p>Used by admin dashboard statistics endpoints (e.g. "Total Technicians: 5").
     * The {@code @Query} annotation is necessary here because Spring Data's derived
     * method naming does not support combining {@code countBy} with both a role
     * filter and a soft-delete null check in a single readable method name.
     *
     * @param role the role to count (USER, ADMIN, or TECHNICIAN)
     * @return the number of active users with the given role
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.deletedAt IS NULL")
    long countByRoleAndDeletedAtIsNull(@Param("role") UserRole role);
}
