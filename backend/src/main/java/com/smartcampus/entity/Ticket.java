package com.smartcampus.entity;

import com.smartcampus.enums.TicketCategory;
import com.smartcampus.enums.TicketPriority;
import com.smartcampus.enums.TicketStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA entity representing a maintenance or incident ticket.
 * Mapped to the {@code tickets} table.
 *
 * <p>Key features:
 * <ul>
 *   <li><b>Optimistic Locking</b>: via {@code version} to prevent concurrent update conflicts.</li>
 *   <li><b>Soft Delete</b>: via {@code deletedAt} to preserve audit history.</li>
 *   <li><b>Loose Coupling</b>: {@code resourceId} is stored as a UUID to avoid direct
 *       dependency on the {@code Resource} entity while it's under development.</li>
 * </ul>
 *
 * @author Smart Campus Team — IT3030 PAF 2026, SLIIT
 */
@Entity
@Table(name = "tickets")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** The user who reported the incident. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User reporter;

    /**
     * ID of the affected campus resource (room, equipment, etc.).
     * Linked via ID only to maintain modularity.
     */
    @Column(name = "resource_id")
    private UUID resourceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private TicketCategory category;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    @Builder.Default
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @Column(name = "preferred_contact")
    private String preferredContact;

    /** The technician assigned to resolve the ticket. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_technician_id")
    private User assignedTechnician;

    /** The admin who assigned the ticket to a technician. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Version
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 0;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
