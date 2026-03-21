package com.smartcampus.enums;

/**
 * Outcome of a login attempt recorded in the {@code login_history} table.
 *
 * <ul>
 *   <li>{@link #SUCCESS} — credentials were valid and the user was authenticated.</li>
 *   <li>{@link #FAILED}  — credentials were wrong, the account was disabled, or
 *       the email was not found in the system.</li>
 * </ul>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 */
public enum LoginStatus {

    /** The login attempt succeeded — a JWT pair was issued. */
    SUCCESS,

    /** The login attempt failed — bad credentials, disabled account, or unknown email. */
    FAILED
}
