package com.smartcampus.controller;

import com.smartcampus.dto.request.AddCommentRequest;
import com.smartcampus.dto.request.CreateTicketRequest;
import com.smartcampus.dto.request.UpdateTicketStatusRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.AttachmentResponse;
import com.smartcampus.dto.response.CommentResponse;
import com.smartcampus.dto.response.TicketResponse;
import com.smartcampus.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing maintenance tickets and related operations.
 *
 * <p>All endpoints are prefixed with {@code /api/v1/tickets}.
 * Consistent {@link ApiResponse} wrapper is used for all responses.
 */
@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
@Slf4j
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

    @GetMapping("/similar")
    public ResponseEntity<ApiResponse<List<TicketResponse>>> getSimilarTickets(@RequestParam("query") String query) {
        List<TicketResponse> tickets = ticketService.getSimilarActiveTickets(query);
        return ResponseEntity.ok(ApiResponse.success("Similar active tickets retrieved", tickets));
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

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable UUID commentId,
            @Valid @RequestBody AddCommentRequest request) {
        CommentResponse comment = ticketService.updateComment(commentId, request);
        return ResponseEntity.ok(ApiResponse.success("Comment updated successfully", comment));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable UUID commentId) {
        ticketService.deleteComment(commentId);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully"));
    }

    // ── Attachment Endpoints (Stubs for current phase) ────────────────────────

    @PostMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<AttachmentResponse>> uploadAttachment(
            @PathVariable UUID id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        com.smartcampus.entity.TicketAttachment attachment = ticketService.uploadAttachment(id, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Attachment uploaded successfully", AttachmentResponse.from(attachment)));
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> getAttachments(@PathVariable UUID id) {
        List<AttachmentResponse> attachments = ticketService.getAttachments(id).stream()
                .map(AttachmentResponse::from)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Attachments retrieved", attachments));
    }

    @GetMapping("/attachments/raw/{fileName:.+}")
    public ResponseEntity<Resource> downloadRaw(@PathVariable String fileName, HttpServletRequest request) {
        Resource resource = ticketService.loadFileAsResource(fileName);
        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            log.info("Could not determine file type.");
        }
        if(contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @DeleteMapping("/attachments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(@PathVariable UUID id) {
        // Soft delete logic can be added here if needed
        return ResponseEntity.ok(ApiResponse.success("Attachment deleted successfully"));
    }
}
