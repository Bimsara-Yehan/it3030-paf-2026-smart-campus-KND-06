package com.smartcampus.enums;

import lombok.Getter;

/**
 * Categorises the type of incident or maintenance request being reported.
 *
 * <p>Used to route tickets to the correct department or specialised technician.
 *
 * @author Smart Campus Team — IT3030 PAF 2026, SLIIT
 */
@Getter
public enum TicketCategory {

    /** Software, hardware, or network connectivity issues. */
    IT_SUPPORT,

    /** General building repairs, plumbing, or electrical work. */
    MAINTENANCE,

    /** Janitorial, waste management, or sanitation requests. */
    CLEANING,

    /** Safety concerns, access control, or suspicious activity. */
    SECURITY,

    /** Any other issues that do not fit the predefined categories. */
    OTHER
}
