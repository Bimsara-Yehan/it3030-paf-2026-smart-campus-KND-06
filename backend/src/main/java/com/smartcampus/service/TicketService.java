package com.smartcampus.service;

import com.smartcampus.dto.request.AddCommentRequest;
import com.smartcampus.dto.request.CreateTicketRequest;
import com.smartcampus.dto.request.UpdateTicketStatusRequest;
import com.smartcampus.dto.response.CommentResponse;
import com.smartcampus.dto.response.TicketResponse;
import com.smartcampus.entity.Comment;
import com.smartcampus.entity.Ticket;
import com.smartcampus.entity.TicketAttachment;
import com.smartcampus.entity.User;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.enums.UserRole;
import com.smartcampus.exception.BadRequestException;
import com.smartcampus.exception.ForbiddenException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.TicketAttachmentRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.io.IOException;

/**
 * Service class for managing maintenance tickets, comments, and attachments.
 *
 * <p>Implementation notes:
 * <ul>
 *   <li>Enforces role-based security via {@code @PreAuthorize}.</li>
 *   <li>Implements soft deletion of tickets and comments.</li>
 *   <li>Calculates SLA-related timestamps (e.g. {@code resolvedAt}, {@code closedAt}).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final CommentRepository commentRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // ── Ticket Operations ─────────────────────────────────────────────────────

    /**
     * Creates a new ticket. Available only to USER and TECHNICIAN roles.
     * ADMIN users cannot create tickets — they can only manage and assign tickets.
     */
    @Transactional
    @PreAuthorize("hasAnyRole('USER', 'TECHNICIAN')")
    public TicketResponse createTicket(CreateTicketRequest request) {
        User currentUser = getCurrentUser();
        
        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .reporter(currentUser)
                .resourceId(request.getResourceId())
                .category(request.getCategory())
                .description(request.getDescription())
                .priority(request.getPriority())
                .preferredContact(request.getPreferredContact())
                .status(TicketStatus.OPEN)
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);
        log.info("Ticket created: {} by user {}", savedTicket.getId(), currentUser.getEmail());

        try {
            notificationService.sendNotification(currentUser, "Your ticket has been submitted successfully.", NotificationType.TICKET_STATUS_CHANGED);
        } catch (Exception e) {
            log.warn("Failed to send ticket confirmation notification to user {}", currentUser.getEmail());
        }

        try {
            String adminMessage = currentUser.getName() + " submitted a new ticket: \"" + savedTicket.getTitle() + "\" [" + savedTicket.getCategory() + "]";
            userRepository.findAllByRoleAndDeletedAtIsNull(UserRole.ADMIN)
                    .forEach(admin -> notificationService.sendNotification(
                            admin,
                            adminMessage,
                            NotificationType.TICKET_STATUS_CHANGED,
                            "TICKET",
                            savedTicket.getId()
                    ));
        } catch (Exception e) {
            log.warn("Failed to send new ticket notification to admins for ticket {}", savedTicket.getId());
        }

        return TicketResponse.from(savedTicket);
    }

    /**
     * Retrieves all tickets. Restricted to ADMIN and TECHNICIAN roles.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAllByDeletedAtIsNull().stream()
                .map(TicketResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves tickets reported by the current user.
     */
    @Transactional(readOnly = true)
    public List<TicketResponse> getMyTickets() {
        User currentUser = getCurrentUser();
        return ticketRepository.findByReporterAndDeletedAtIsNull(currentUser).stream()
                .map(TicketResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves open/in-progress tickets matching the keyword for duplicate detection.
     */
    @Transactional(readOnly = true)
    public List<TicketResponse> getSimilarActiveTickets(String keyword) {
        if (keyword == null || keyword.trim().length() < 3) {
            return List.of();
        }
        return ticketRepository.findSimilarActiveTickets(keyword.trim()).stream()
                .map(TicketResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a single ticket by ID. Enforces ownership or elevated role.
     */
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(UUID id) {
        Ticket ticket = getTicketEntity(id);
        validateTicketAccess(ticket);
        return TicketResponse.from(ticket);
    }

    /**
     * Assigns a ticket to a technician. Restricted to ADMIN only.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public TicketResponse assignTicket(UUID id, UUID technicianId) {
        Ticket ticket = getTicketEntity(id);
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician not found"));

        if (!Boolean.TRUE.equals(technician.getIsActive())) {
            throw new BadRequestException("Cannot assign to an inactive user");
        }

        ticket.setAssignedTechnician(technician);
        ticket.setAssignedBy(getCurrentUser());
        ticket.setAssignedAt(LocalDateTime.now());
        
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        Ticket updatedTicket = ticketRepository.save(ticket);
        log.info("Ticket {} assigned to technician {}", id, technician.getEmail());
        
        notificationService.sendNotification(technician, "A new ticket has been assigned to you.", NotificationType.TICKET_ASSIGNED);
        
        return TicketResponse.from(updatedTicket);
    }

    /**
     * Updates the status of a ticket. Restricted to TECHNICIAN or ADMIN roles,
     * but REPORTERS can now transition a RESOLVED ticket to CLOSED.
     */
    @PreAuthorize("hasAnyRole('USER', 'TECHNICIAN', 'ADMIN')")
    @Transactional
    public TicketResponse updateTicketStatus(UUID id, UpdateTicketStatusRequest request) {
        Ticket ticket = getTicketEntity(id);
        User currentUser = getCurrentUser();
        
        // Use roles directly from entity to avoid proxy issues
        boolean isAdmin = currentUser.getRole() == com.smartcampus.enums.UserRole.ADMIN;
        boolean isReporter = ticket.getReporter().getId().equals(currentUser.getId());
        
        User tech = ticket.getAssignedTechnician();
        boolean isAssignedTech = tech != null && tech.getId().equals(currentUser.getId());

        TicketStatus newStatus = request.getStatus();

        // ── Permission Validation ──
        if (newStatus == TicketStatus.CLOSED) {
            if (!isAdmin && !isReporter) {
                throw new ForbiddenException("Only administrators or the reporter can close this ticket");
            }
            if (isReporter && !isAdmin && ticket.getStatus() != TicketStatus.RESOLVED) {
                throw new ForbiddenException("You can only close the ticket after it has been resolved by a technician");
            }
        } else if (newStatus == TicketStatus.REJECTED) {
            if (!isAdmin) throw new ForbiddenException("Only administrators can reject tickets");
        } else if (newStatus == TicketStatus.IN_PROGRESS || newStatus == TicketStatus.RESOLVED) {
            if (!isAdmin && !isAssignedTech) {
                throw new ForbiddenException("Only the assigned technician or an administrator can update this status");
            }
        }

        // ── Apply Status Change ──
        if (newStatus != null) {
            ticket.setStatus(newStatus);
            if (newStatus == TicketStatus.RESOLVED) {
                ticket.setResolvedAt(LocalDateTime.now());
                ticket.setResolutionNotes(request.getNotes());
                notificationService.sendNotification(ticket.getReporter(), "Your ticket has been resolved", NotificationType.TICKET_STATUS_CHANGED);
            } else if (newStatus == TicketStatus.REJECTED) {
                ticket.setRejectReason(request.getNotes());
            } else if (newStatus == TicketStatus.CLOSED) {
                ticket.setClosedAt(LocalDateTime.now());
            }
        }

        Ticket savedTicket = ticketRepository.save(ticket);
        
        log.info("Ticket {} status updated to {} by {}", id, newStatus, currentUser.getEmail());
        return TicketResponse.from(savedTicket);
    }

    /**
     * Closes a ticket. Accessible to ADMIN and the original REPORTER.
     */
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Transactional
    public TicketResponse closeTicket(UUID id) {
        Ticket ticket = getTicketEntity(id);
        User currentUser = getCurrentUser();

        boolean isAdmin = currentUser.getRole() == com.smartcampus.enums.UserRole.ADMIN;
        boolean isReporter = ticket.getReporter().getId().equals(currentUser.getId());

        if (!isAdmin && !isReporter) {
            throw new ForbiddenException("You do not have permission to close this ticket");
        }

        if (isReporter && !isAdmin && ticket.getStatus() != TicketStatus.RESOLVED) {
            throw new ForbiddenException("You can only close your ticket after it has been resolved");
        }

        ticket.setStatus(TicketStatus.CLOSED);
        ticket.setClosedAt(LocalDateTime.now());

        ticketRepository.save(ticket);
        
        log.info("Ticket {} closed by {}", id, currentUser.getEmail());
        return TicketResponse.from(ticket);
    }

    /**
     * Soft deletes a ticket. Restricted to ADMIN only.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteTicket(UUID id) {
        Ticket ticket = getTicketEntity(id);
        ticket.setDeletedAt(LocalDateTime.now());
        ticketRepository.save(ticket);
        log.info("Ticket {} soft deleted", id);
    }

    // ── Comment Operations ────────────────────────────────────────────────────

    /**
     * Adds a comment to a ticket.
     */
    @Transactional
    public CommentResponse addComment(UUID ticketId, AddCommentRequest request) {
        Ticket ticket = getTicketEntity(ticketId);
        validateTicketAccess(ticket);
        User currentUser = getCurrentUser();

        Comment comment = Comment.builder()
                .ticket(ticket)
                .author(currentUser)
                .message(request.getContent())
                .build();

        Comment savedComment = commentRepository.save(comment);
        log.info("Comment added to ticket {} by {}", ticketId, currentUser.getEmail());
        
        User reporter = ticket.getReporter();
        if (reporter != null && !reporter.getId().equals(currentUser.getId())) {
            notificationService.sendNotification(reporter, "New comment added to your ticket.", NotificationType.NEW_COMMENT);
        }
        
        return CommentResponse.from(savedComment);
    }

    /**
     * Updates an existing comment. Only the author can update it.
     */
    @Transactional
    public CommentResponse updateComment(UUID commentId, AddCommentRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        User currentUser = getCurrentUser();
        
        // Defensive check for author proxy
        if (comment.getAuthor() == null) {
            throw new ResourceNotFoundException("Comment author not found");
        }
        
        // Use robust string comparison for IDs
        if (!comment.getAuthor().getId().toString().equals(currentUser.getId().toString())) {
            throw new ForbiddenException("You can only edit your own comments");
        }

        comment.setMessage(request.getContent());
        comment.setUpdatedAt(LocalDateTime.now());
        Comment savedComment = commentRepository.save(comment);
        
        // Initialize lazy author for DTO mapping
        savedComment.getAuthor().getName();
        
        log.info("Comment {} updated by {}", commentId, currentUser.getEmail());
        return CommentResponse.from(savedComment);
    }

    /**
     * Soft deletes a comment. Only the author or an admin can delete it.
     */
    @Transactional
    public void deleteComment(UUID commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        User currentUser = getCurrentUser();
        
        // Defensive check for author
        if (comment.getAuthor() == null) {
            throw new ResourceNotFoundException("Comment author not found");
        }

        // Project-style role check
        boolean isAdmin = currentUser.getRole() == com.smartcampus.enums.UserRole.ADMIN;

        // Verify ownership or admin status
        String authorIdStr = comment.getAuthor().getId().toString();
        String currentUserIdStr = currentUser.getId().toString();

        if (!isAdmin && !authorIdStr.equals(currentUserIdStr)) {
            throw new ForbiddenException("You can only delete your own comments");
        }

        comment.setDeletedAt(LocalDateTime.now());
        commentRepository.save(comment);
        log.info("Comment {} soft deleted by {}", commentId, currentUser.getEmail());
    }

    /**
     * Lists all comments for a ticket.
     */
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(UUID ticketId) {
        Ticket ticket = getTicketEntity(ticketId);
        validateTicketAccess(ticket);

        return commentRepository.findByTicketIdAndDeletedAtIsNullOrderByCreatedAtAsc(ticketId).stream()
                .map(CommentResponse::from)
                .collect(Collectors.toList());
    }

    // ── Helper Methods ────────────────────────────────────────────────────────

    private Ticket getTicketEntity(UUID id) {
        return ticketRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
    }

    private User getCurrentUser() {
        org.springframework.security.core.Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new com.smartcampus.exception.UnauthorizedException("No authenticated user found");
        }

        String email;
        if (authentication instanceof org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken oauth2Token) {
            email = (String) oauth2Token.getPrincipal().getAttributes().get("email");
        } else {
            email = authentication.getName();
        }

        return userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found for email: " + email));
    }

    private void validateTicketAccess(Ticket ticket) {
        User currentUser = getCurrentUser();
        boolean isAdmin = "ADMIN".equals(currentUser.getRole().name());
        boolean isTechnician = "TECHNICIAN".equals(currentUser.getRole().name());
        boolean isReporter = ticket.getReporter().getId().equals(currentUser.getId());

        if (!isAdmin && !isTechnician && !isReporter) {
            throw new ForbiddenException("You do not have permission to access this ticket");
        }
    }

    /**
     * Uploads an attachment for a specific ticket.
     */
    @Transactional
    public TicketAttachment uploadAttachment(UUID ticketId, org.springframework.web.multipart.MultipartFile file) {
        Ticket ticket = ticketRepository.findByIdAndDeletedAtIsNull(ticketId)
                .orElseThrow(() -> new com.smartcampus.exception.ResourceNotFoundException("Ticket not found"));

        // Limit attachments to 3 per ticket as per Module C requirements
        long count = attachmentRepository.findByTicketIdAndDeletedAtIsNull(ticketId).size();
        if (count >= 3) {
            throw new com.smartcampus.exception.BadRequestException("Maximum 3 attachments per ticket exceeded");
        }

        try {
            // Local storage logic for MVP (should be replaced by S3/Cloudinary in production)
            String fileName = org.springframework.util.StringUtils.cleanPath(file.getOriginalFilename());
            String storageName = UUID.randomUUID().toString() + "_" + fileName;
            
            // Resolve path to backend/uploads (relative to project root usually)
            Path uploadPath = Paths.get("uploads").toAbsolutePath();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            Path filePath = uploadPath.resolve(storageName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // The URL the frontend will use to fetch the file
            String fileUrl = "/api/v1/tickets/attachments/raw/" + storageName;

            TicketAttachment attachment = TicketAttachment.builder()
                    .ticket(ticket)
                    .fileName(fileName)
                    .fileUrl(fileUrl)
                    .mimeType(file.getContentType())
                    .fileSize(file.getSize())
                    .build();

            return attachmentRepository.save(attachment);
        } catch (IOException e) {
            log.error("Failed to store file on disk", e);
            throw new com.smartcampus.exception.BadRequestException("Could not store file. Please try again!");
        }
    }

    /**
     * Retrieves an attachment by file name from disk for raw download.
     */
    public org.springframework.core.io.Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = Paths.get("uploads").toAbsolutePath().resolve(fileName).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            if(resource.exists()) {
                return resource;
            } else {
                throw new com.smartcampus.exception.ResourceNotFoundException("File not found " + fileName);
            }
        } catch (Exception ex) {
            throw new com.smartcampus.exception.ResourceNotFoundException("File not found " + fileName);
        }
    }

    /**
     * Retrieves all attachments for a ticket.
     */
    @Transactional(readOnly = true)
    public List<TicketAttachment> getAttachments(UUID ticketId) {
        return attachmentRepository.findByTicketIdAndDeletedAtIsNull(ticketId);
    }
}
