package com.smartcampus.enums;

import lombok.Getter;

/**
 * Represents the lifecycle stages of a maintenance or incident ticket.
 *
 * <p>Workflow:
 * {@code OPEN} -> {@code IN_PROGRESS} -> {@code RESOLVED} -> {@code CLOSED}
 *
 * <p>A ticket can also be moved to {@code REJECTED} from {@code OPEN} if an admin
 * determines the request is invalid or a duplicate.
 *
 * @author Smart Campus Team — IT3030 PAF 2026, SLIIT
 */
@Getter
public enum TicketStatus {

    /** Ticket has been submitted and is awaiting review or assignment. */
    OPEN,

    /** A technician has been assigned and is actively working on the issue. */
    IN_PROGRESS,

    /** The issue has been fixed, and the technician is awaiting user/admin confirmation. */
    RESOLVED,

    /** The ticket is finalized and no further action is required. */
    CLOSED,

    /** The ticket was determined to be invalid, a duplicate, or out of scope. */
    REJECTED
}
