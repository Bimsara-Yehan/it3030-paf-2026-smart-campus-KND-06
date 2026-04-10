package com.smartcampus.controller;

import com.smartcampus.dto.request.CreateBookingRequest;
import com.smartcampus.dto.request.UpdateBookingStatusRequest;
import com.smartcampus.dto.response.ApiResponse;
import com.smartcampus.dto.response.BookingResponse;
import com.smartcampus.entity.Booking;
import com.smartcampus.entity.User;
import com.smartcampus.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller managing the Booking Engine (Module B).
 */
@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * POST /bookings — Create a new booking (USER)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CreateBookingRequest request) {
        
        Booking booking = bookingService.createBooking(currentUser.getId(), request);
        return new ResponseEntity<>(
                ApiResponse.success("Booking created successfully.", BookingResponse.from(booking)),
                HttpStatus.CREATED
        );
    }

    /**
     * GET /bookings — List all bookings (ADMIN)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAllBookings() {
        List<BookingResponse> responses = bookingService.getAllBookings().stream()
                .map(BookingResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("All bookings retrieved.", responses));
    }

    /**
     * GET /bookings/my — List my bookings (USER)
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal User currentUser) {
        
        List<BookingResponse> responses = bookingService.getMyBookings(currentUser.getId()).stream()
                .map(BookingResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Your bookings retrieved.", responses));
    }

    /**
     * GET /bookings/{id} — Get booking details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable UUID id) {
        Booking booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(ApiResponse.success("Booking retrieved.", BookingResponse.from(booking)));
    }

    /**
     * PATCH /bookings/{id}/approve — Approve booking (ADMIN)
     */
    @PatchMapping("/{id}/approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingResponse>> approveBooking(@PathVariable UUID id) {
        Booking booking = bookingService.approveBooking(id);
        return ResponseEntity.ok(ApiResponse.success("Booking approved successfully.", BookingResponse.from(booking)));
    }

    /**
     * PATCH /bookings/{id}/reject — Reject booking (ADMIN)
     */
    @PatchMapping("/{id}/reject")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingResponse>> rejectBooking(
            @PathVariable UUID id,
            @RequestBody UpdateBookingStatusRequest request) {
        
        Booking booking = bookingService.rejectBooking(id, request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Booking rejected successfully.", BookingResponse.from(booking)));
    }

    /**
     * PATCH /bookings/{id}/cancel — Cancel booking (USER)
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @AuthenticationPrincipal User currentUser,
            @PathVariable UUID id) {
        
        Booking booking = bookingService.cancelBooking(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully.", BookingResponse.from(booking)));
    }

    /**
     * DELETE /bookings/{id} — Soft delete (ADMIN)
     */
    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBooking(@PathVariable UUID id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok(ApiResponse.success("Booking archived successfully."));
    }
}
