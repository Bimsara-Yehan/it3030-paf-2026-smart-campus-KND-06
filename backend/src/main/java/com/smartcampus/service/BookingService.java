package com.smartcampus.service;

import com.smartcampus.entity.Booking;
import com.smartcampus.entity.Resource;
import com.smartcampus.entity.User;
import com.smartcampus.enums.BookingStatus;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceAvailabilityRepository;
import jakarta.persistence.OptimisticLockException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceAvailabilityRepository availabilityRepository;

    @Autowired
    public BookingService(BookingRepository bookingRepository, 
                          ResourceAvailabilityRepository availabilityRepository) {
        this.bookingRepository = bookingRepository;
        this.availabilityRepository = availabilityRepository;
    }

    /**
     * Attempts to create a new PENDING booking reservation.
     */
    @Transactional
    public Booking createBooking(UUID userId, UUID resourceId, LocalDateTime startTime, LocalDateTime endTime, String reason) {
        // Enforce time logic
        if (startTime.isAfter(endTime) || startTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid booking time range.");
        }

        // Check for conflicting *approved* bookings on this resource
        List<Booking> conflicts = bookingRepository.findConflictingBookings(resourceId, startTime, endTime);
        if (!conflicts.isEmpty()) {
            throw new IllegalStateException("Resource is already booked during this time window.");
        }

        Booking newBooking = Booking.builder()
                .user(new User(userId, null, null)) // Using stub definition, normally fetch from DB
                .resource(new Resource(resourceId, null, null, null)) // Using stub definition
                .startTime(startTime)
                .endTime(endTime)
                .reason(reason)
                .status(BookingStatus.PENDING)
                .build();

        return bookingRepository.save(newBooking);
    }

    /**
     * Admin functionality to Update Booking Status. Uses @Version for optimistic locking.
     */
    @Transactional
    public Booking updateBookingStatus(UUID bookingId, BookingStatus newStatus, String rejectionReason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found."));

        // If approving, we must double check conflicts again in case two admins try to approve
        if (newStatus == BookingStatus.APPROVED) {
            List<Booking> conflicts = bookingRepository.findConflictingBookings(
                    booking.getResource().getId(), 
                    booking.getStartTime(), 
                    booking.getEndTime());
            if (!conflicts.isEmpty()) {
                throw new IllegalStateException("CONFLICT: Resource was booked since this request was made.");
            }
        }

        booking.setStatus(newStatus);
        if (newStatus == BookingStatus.REJECTED) {
            booking.setRejectionReason(rejectionReason);
        }
        
        booking.setActionedAt(LocalDateTime.now());

        try {
            return bookingRepository.save(booking);
        } catch (OptimisticLockException e) {
            // This is the core specific project requirement handling concurrent admin clicks
            throw new IllegalStateException("CONCURRENCY_ERROR: Another user has already modified this booking.");
        }
    }

    /**
     * Innovation: Smart Alternative suggestion.
     */
    @Transactional(readOnly = true)
    public List<UUID> findAlternatives(com.smartcampus.enums.ResourceType type, int minCapacity, LocalDateTime start, LocalDateTime end) {
        return bookingRepository.findAvailableAlternativeResources(type, minCapacity, start, end);
    }
    
    // Simplistic CRUD methods for the Controller
    
    public Booking getBooking(UUID id) {
        return bookingRepository.findById(id).orElseThrow();
    }
    
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
    
    public void deleteBooking(UUID id) {
        bookingRepository.deleteById(id);
    }
}
