package com.smartcampus.controller;

import com.smartcampus.dto.request.AddCommentRequest;
import com.smartcampus.dto.request.CreateTicketRequest;
import com.smartcampus.dto.request.UpdateTicketStatusRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.CommentResponse;
import com.smartcampus.dto.response.TicketResponse;
import com.smartcampus.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing maintenance tickets and related operations.
 *
 * <p>All endpoints are prefixed with {@code /api/v1/tickets}.
 * Consistent {@link ApiResponse} wrapper is used for all responses.
 */
@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    // ── Ticket Endpoints ──────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<TicketResponse>> createTicket(@Valid @RequestBody CreateTicketRequest request) {
        TicketResponse ticket = ticketService.createTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Ticket created successfully", ticket));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getAllTickets() {
        List<TicketResponse> tickets = ticketService.getAllTickets();
        return ResponseEntity.ok(ApiResponse.success("All tickets retrieved", tickets));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getMyTickets() {
        List<TicketResponse> tickets = ticketService.getMyTickets();
        return ResponseEntity.ok(ApiResponse.success("Your tickets retrieved", tickets));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TicketResponse>> getTicket(@PathVariable UUID id) {
        TicketResponse ticket = ticketService.getTicketById(id);
        return ResponseEntity.ok(ApiResponse.success("Ticket retrieved", ticket));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<TicketResponse>> assignTicket(
            @PathVariable UUID id, 
            @RequestParam UUID technicianId) {
        TicketResponse ticket = ticketService.assignTicket(id, technicianId);
        return ResponseEntity.ok(ApiResponse.success("Ticket assigned to technician", ticket));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TicketResponse>> updateStatus(
            @PathVariable UUID id, 
            @Valid @RequestBody UpdateTicketStatusRequest request) {
        TicketResponse ticket = ticketService.updateTicketStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Ticket status updated", ticket));
    }

    @PatchMapping("/{id}/close")
    public ResponseEntity<ApiResponse<TicketResponse>> closeTicket(@PathVariable UUID id) {
        TicketResponse ticket = ticketService.closeTicket(id);
        return ResponseEntity.ok(ApiResponse.success("Ticket closed successfully", ticket));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTicket(@PathVariable UUID id) {
        ticketService.deleteTicket(id);
        return ResponseEntity.ok(ApiResponse.success("Ticket soft deleted successfully"));
    }

    // ── Comment Endpoints ─────────────────────────────────────────────────────

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable UUID id, 
            @Valid @RequestBody AddCommentRequest request) {
        CommentResponse comment = ticketService.addComment(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added successfully", comment));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(@PathVariable UUID id) {
        List<CommentResponse> comments = ticketService.getComments(id);
        return ResponseEntity.ok(ApiResponse.success("Comments retrieved", comments));
    }

    // ── Attachment Endpoints (Stubs for current phase) ────────────────────────

    @PostMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<Void>> uploadAttachment(@PathVariable UUID id) {
        // Implementation for actual file upload will follow in next iteration
        return ResponseEntity.ok(ApiResponse.success("Attachment upload endpoint (stub)"));
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<String>>> getAttachments(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Attachments list endpoint (stub)", List.of()));
    }

    @GetMapping("/attachments/{id}")
    public ResponseEntity<ApiResponse<Void>> downloadAttachment(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Attachment download endpoint (stub)"));
    }

    @DeleteMapping("/attachments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Attachment delete endpoint (stub)"));
    }
}
