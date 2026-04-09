package com.smartcampus.repository;

import com.smartcampus.entity.LoginHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link LoginHistory} entities.
 *
 * <p>Provides access to the {@code login_history} table for recording and
 * retrieving login attempts. All write operations (recording) are handled
 * by {@link com.smartcampus.service.LoginHistoryService} in a dedicated
 * {@code REQUIRES_NEW} transaction to ensure FAILED attempts are persisted
 * even when the outer login transaction rolls back.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     com.smartcampus.service.LoginHistoryService
 * @see     com.smartcampus.service.AuthService
 */
@Repository
public interface LoginHistoryRepository extends JpaRepository<LoginHistory, UUID> {

    /**
     * Returns all login history entries for the given user, ordered by most recent first.
     *
     * <p>Pass a {@link Pageable} with {@code PageRequest.of(0, 10)} to limit results
     * to the 10 most recent entries — the standard page size for the Login Activity view.
     *
     * @param userId   the UUID of the user whose history to retrieve
     * @param pageable pagination parameters (use {@code PageRequest.of(0, N)} for top-N)
     * @return a list of login history entries, newest first, limited by the pageable
     */
    List<LoginHistory> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
