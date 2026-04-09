package com.smartcampus.service;

import com.smartcampus.dto.request.CreateBookingRequest;
import java.time.format.DateTimeFormatter;
import com.smartcampus.entity.Booking;
import com.smartcampus.entity.Resource;
import com.smartcampus.entity.User;
import com.smartcampus.enums.BookingStatus;
import com.smartcampus.enums.NotificationType;
import com.smartcampus.enums.UserRole;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.UserRepository;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service managing the Booking Engine (Module B).
 */
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;

    /**
     * Create a new PENDING booking.
     */
    @Transactional
    public Booking createBooking(UUID userId, CreateBookingRequest request) {
        // Enforce time logic
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }

        // Fetch real entities to ensure they are hydrated for notifications
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new IllegalArgumentException("Resource not found: " + request.getResourceId()));

        // Check for conflicts
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                request.getResourceId(), request.getStartTime(), request.getEndTime());
        if (!conflicts.isEmpty()) {
            throw new IllegalStateException("Resource is already booked during this time.");
        }

        Booking booking = Booking.builder()
                .user(user)
                .resource(resource)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .attendees(request.getAttendees())
                .status(BookingStatus.PENDING)
                .build();

        Booking saved = bookingRepository.saveAndFlush(booking);

        notificationService.sendNotification(
            user,
            "Your booking request for " + resource.getName() + " is pending approval.",
            NotificationType.SYSTEM_ANNOUNCEMENT,
            "BOOKING",
            saved.getId()
        );

        // Notify all admins so they know a new booking needs review
        String adminMessage = user.getName() + " requested " + resource.getName()
                + " from " + fmt(saved.getStartTime()) + " to " + fmt(saved.getEndTime()) + ".";
        userRepository.findAllByRoleAndDeletedAtIsNull(UserRole.ADMIN)
                .forEach(admin -> notificationService.sendNotification(
                        admin,
                        adminMessage,
                        NotificationType.SYSTEM_ANNOUNCEMENT,
                        "BOOKING",
                        saved.getId()
                ));

        emailService.sendBookingConfirmationEmail(
            user.getEmail(),
            user.getName(),
            resource.getName(),
            fmt(saved.getStartTime()),
            fmt(saved.getEndTime())
        );

        return saved;
    }

    /**
     * Admin: Get all active bookings.
     */
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public List<Booking> getAllBookings() {
        return bookingRepository.findAllByDeletedAtIsNull();
    }

    /**
     * User: Get my active bookings.
     */
    @Transactional(readOnly = true)
    public List<Booking> getMyBookings(UUID userId) {
        return bookingRepository.findByUserIdAndDeletedAtIsNull(userId);
    }

    /**
     * Get booking by ID.
     */
    @Transactional(readOnly = true)
    public Booking getBookingById(UUID id) {
        return bookingRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found."));
    }

    /**
     * Admin: Approve a booking.
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public Booking approveBooking(UUID id) {
        Booking booking = getBookingById(id);
        
        // Re-check conflicts before approving
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                booking.getResource().getId(), booking.getStartTime(), booking.getEndTime());
        if (!conflicts.isEmpty()) {
            throw new IllegalStateException("Conflicts found. Cannot approve.");
        }

        booking.setStatus(BookingStatus.APPROVED);
        
        try {
            Booking saved = bookingRepository.save(booking);
            notificationService.sendNotification(
                booking.getUser(),
                "Your booking request for " + booking.getResource().getName() + " has been approved!",
                NotificationType.BOOKING_APPROVED,
                "BOOKING",
                booking.getId()
            );

            emailService.sendBookingApprovedEmail(
                booking.getUser().getEmail(),
                booking.getUser().getName(),
                booking.getResource().getName(),
                fmt(booking.getStartTime()),
                fmt(booking.getEndTime())
            );

            return saved;
        } catch (OptimisticLockException e) {
            throw new IllegalStateException("Booking was modified by another user.");
        }
    }

    /**
     * Admin: Reject a booking.
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public Booking rejectBooking(UUID id, String reason) {
        Booking booking = getBookingById(id);
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        
        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(
                booking.getUser(),
                "Your booking has been rejected.",
                NotificationType.BOOKING_REJECTED
        );

        emailService.sendBookingRejectedEmail(
                booking.getUser().getEmail(),
                booking.getUser().getName(),
                booking.getResource().getName(),
                reason
        );

        return saved;
    }

    /**
     * User: Cancel own booking.
     */
    @Transactional
    public Booking cancelBooking(UUID id, UUID userId) {
        Booking booking = getBookingById(id);
        if (!booking.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You can only cancel your own bookings.");
        }
        
        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);
        
        notificationService.sendNotification(
                booking.getUser(),
                "Your booking has been cancelled.",
                NotificationType.BOOKING_CANCELLED
        );
        return saved;
    }

    /** Formats a LocalDateTime for display in emails (e.g. "Mon, Apr 09 at 10:00 AM"). */
    private String fmt(java.time.LocalDateTime dt) {
        return dt.format(DateTimeFormatter.ofPattern("EEE, MMM dd 'at' hh:mm a"));
    }

    /**
     * Admin: Soft delete a booking.
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteBooking(UUID id) {
        Booking booking = getBookingById(id);
        booking.setDeletedAt(LocalDateTime.now());
        bookingRepository.save(booking);
    }
}
