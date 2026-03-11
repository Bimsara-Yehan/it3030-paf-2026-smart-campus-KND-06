package com.smartcampus.security;

import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Implementation of Spring Security's UserDetailsService.
 *
 * This class is called by JwtFilter on every authenticated request.
 * It loads the User entity from the database using the email address
 * extracted from the JWT token, and returns it as a UserDetails object
 * for Spring Security to validate against.
 *
 * Member 4 — Module E (Authentication)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    /* Repository for querying the users table */
    private final UserRepository userRepository;

    /**
     * Loads a user by their email address.
     *
     * Called automatically by JwtFilter during JWT validation.
     * The "username" in Spring Security context is the user's email.
     *
     * @param email the email address extracted from the JWT token
     * @return UserDetails object (our User entity implements UserDetails)
     * @throws UsernameNotFoundException if no active user found with that email
     */
    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        log.debug("Loading user by email: {}", email);

        /* Query database for active (non-deleted) user with this email */
        return userRepository
                .findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> {
                    log.warn("User not found with email: {}", email);
                    return new UsernameNotFoundException(
                            "User not found with email: " + email
                    );
                });
    }
}