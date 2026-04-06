package com.smartcampus.service;

import com.smartcampus.dto.response.LoginHistoryResponse;
import com.smartcampus.entity.LoginHistory;
import com.smartcampus.entity.User;
import com.smartcampus.enums.LoginStatus;
import com.smartcampus.repository.LoginHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service responsible for recording and retrieving login history entries.
 *
 * <h3>Why a separate service?</h3>
 * <p>{@link AuthService#login} is annotated {@code @Transactional}.  When a
 * {@code BadCredentialsException} (or any other unchecked exception) propagates
 * out of that method, Spring rolls back the entire transaction — including any
 * {@code loginHistoryRepository.save()} call made inside it.  A FAILED login
 * attempt would therefore never reach the database.
 *
 * <p>By isolating the recording call in this service and marking it with
 * {@link Propagation#REQUIRES_NEW}, Spring suspends the caller's transaction,
 * opens a brand-new independent transaction, commits it immediately when
 * {@link #record} returns, and then resumes the caller's (now-rolling-back)
 * transaction.  The history row is safe regardless of what happens next in the
 * outer transaction.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     AuthService
 * @see     LoginHistoryRepository
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginHistoryService {

    /** Maximum number of history entries returned to the client. */
    private static final int MAX_HISTORY_ENTRIES = 10;

    private final LoginHistoryRepository loginHistoryRepository;

    // =========================================================================
    // Record a login attempt
    // =========================================================================

    /**
     * Persists a single login attempt in its own independent transaction.
     *
     * <p>The {@link Propagation#REQUIRES_NEW} propagation means this method
     * always runs in a fresh transaction that commits (or rolls back) independently
     * of whatever transaction the caller is in.  This guarantees that FAILED login
     * attempts are saved to the database even when the caller's transaction rolls back
     * due to an authentication exception.
     *
     * @param user      the authenticated user; {@code null} for FAILED attempts with
     *                  an unknown email address
     * @param email     the email address that was submitted in the login form
     * @param ipAddress the client IP address, or {@code null} if not available
     * @param userAgent the raw User-Agent header, or {@code null} if absent
     * @param status    {@link LoginStatus#SUCCESS} or {@link LoginStatus#FAILED}
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(User user, String email, String ipAddress, String userAgent, LoginStatus status) {
        LoginHistory entry = LoginHistory.builder()
                .user(user)
                .email(email)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .status(status)
                .build();

        loginHistoryRepository.save(entry);
        log.debug("Login history recorded — email: {}, status: {}, ip: {}", email, status, ipAddress);
    }

    // =========================================================================
    // Retrieve login history
    // =========================================================================

    /**
     * Returns the {@value #MAX_HISTORY_ENTRIES} most recent login entries for the given user.
     *
     * @param userId the UUID of the authenticated user
     * @return a list of up to 10 {@link LoginHistoryResponse} DTOs, newest first
     */
    @Transactional(readOnly = true)
    public List<LoginHistoryResponse> getLoginHistory(UUID userId) {
        return loginHistoryRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, MAX_HISTORY_ENTRIES))
                .stream()
                .map(LoginHistoryResponse::from)
                .collect(Collectors.toList());
    }
}
