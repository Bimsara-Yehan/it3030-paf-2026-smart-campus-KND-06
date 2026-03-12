package com.smartcampus.enums;

import lombok.Getter;

/**
 * Defines the urgency levels for maintenance and incident tickets.
 *
 * <p>Priority levels are used by administrators to triage tickets and by
 * technicians to prioritise their daily tasks.
 *
 * @author Smart Campus Team — IT3030 PAF 2026, SLIIT
 */
@Getter
public enum TicketPriority {

    /** Issues with minimal impact on campus operations (e.g., minor aesthetic fixes). */
    LOW,

    /** Standard issues that require attention but are not urgent (e.g., non-critical equipment failure). */
    MEDIUM,

    /** Urgent issues affecting multiple users or a critical asset (e.g., classroom water leak). */
    HIGH,

    /** Life-safety issues or complete loss of critical services (e.g., campus-wide power failure). */
    CRITICAL
}
