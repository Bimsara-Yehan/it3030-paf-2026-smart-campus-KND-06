package com.smartcampus.enums;

/**
 * Represents the access-control roles available in the Smart Campus system.
 *
 * <p>Role hierarchy and permissions:
 * <ul>
 *   <li>{@link #USER}        — Default role for all registered students and staff.
 *       Can browse resources, create bookings, and submit maintenance tickets.</li>
 *   <li>{@link #ADMIN}       — Campus operations managers. Can approve/reject bookings,
 *       assign tickets to technicians, manage resources, and view all system data.</li>
 *   <li>{@link #TECHNICIAN}  — Maintenance workers assigned to tickets. Can update
 *       ticket status, add resolution notes, and view their assigned workload.</li>
 * </ul>
 *
 * <p>Role values are persisted to the {@code users.role} column as their string
 * names (e.g. {@code "ADMIN"}) via {@code @Enumerated(EnumType.STRING)} on the
 * {@code User} entity. The database enforces valid values through a CHECK constraint.
 *
 * <p>The {@link #getAuthority()} method follows the Spring Security convention of
 * prefixing role names with {@code "ROLE_"}, enabling use of
 * {@code hasRole("ADMIN")} in security expressions without the prefix.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @see     org.springframework.security.core.GrantedAuthority
 */
public enum UserRole {

    /** Default role: students and general campus staff. */
    USER,

    /** Elevated role: campus operations administrators. */
    ADMIN,

    /** Maintenance role: technicians assigned to repair tickets. */
    TECHNICIAN;

    /**
     * Returns the Spring Security authority string for this role.
     *
     * <p>Spring Security's {@code hasRole()} expressions automatically prepend
     * {@code "ROLE_"} when matching, so storing the full prefixed string in
     * {@link org.springframework.security.core.GrantedAuthority} is the
     * required convention. For example, {@code hasRole("ADMIN")} matches
     * an authority of {@code "ROLE_ADMIN"}.
     *
     * @return authority string in the format {@code "ROLE_<NAME>"},
     *         e.g. {@code "ROLE_USER"}, {@code "ROLE_ADMIN"}, {@code "ROLE_TECHNICIAN"}
     */
    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}
