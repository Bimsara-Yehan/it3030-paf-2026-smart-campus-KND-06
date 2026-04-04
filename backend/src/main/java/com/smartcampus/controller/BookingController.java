package com.smartcampus.controller;

import com.smartcampus.dto.BookingRequestDto;
import com.smartcampus.dto.BookingStatusUpdateDto;
import com.smartcampus.entity.Booking;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Controller managing the Booking Engine (Module B).
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    @Autowired
    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // 1. POST Endpoint
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequestDto request) {
        try {
            Booking booking = bookingService.createBooking(
                    request.getUserId(),
                    request.getResourceId(),
                    request.getStartTime(),
                    request.getEndTime(),
                    request.getReason()
            );
            return new ResponseEntity<>(booking, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT); // 409 Conflict
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST); // 400 Bad Request
        }
    }

    // 2. GET Endpoints
    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.getBooking(id));
    }

    // 3. PUT/PATCH Endpoint (Admin Approval Workflow)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable UUID id, 
            @RequestBody BookingStatusUpdateDto updateRequest) {
        try {
            Booking updatedBooking = bookingService.updateBookingStatus(
                    id, 
                    updateRequest.getStatus(), 
                    updateRequest.getRejectionReason()
            );
            return ResponseEntity.ok(updatedBooking);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT); // 409 Conflict logic
        }
    }

    // 4. DELETE Endpoint (Cancellation)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelBooking(@PathVariable UUID id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build(); // 204 No Content
    }

    // 5. Innovation Feature Endpoint
    @GetMapping("/alternatives")
    public ResponseEntity<List<UUID>> findAlternatives(
            @RequestParam ResourceType type,
            @RequestParam int minCapacity,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(bookingService.findAlternatives(type, minCapacity, start, end));
    }
}
