package com.smartcampus.service;

import com.smartcampus.entity.Booking;
import com.smartcampus.entity.Resource;
import com.smartcampus.entity.User;
import com.smartcampus.enums.BookingStatus;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceAvailabilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ResourceAvailabilityRepository availabilityRepository;

    @InjectMocks
    private BookingService bookingService;

    private UUID userId;
    private UUID resourceId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        resourceId = UUID.randomUUID();
        startTime = LocalDateTime.now().plusHours(1);
        endTime = LocalDateTime.now().plusHours(2);
    }

    @Test
    void createBooking_ShouldSucceed_WhenNoConflicts() {
        // Arrange
        when(bookingRepository.findConflictingBookings(resourceId, startTime, endTime))
                .thenReturn(Collections.emptyList());
                
        Booking savedBooking = new Booking();
        savedBooking.setId(UUID.randomUUID());
        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);

        // Act
        Booking result = bookingService.createBooking(userId, resourceId, startTime, endTime, "Study session");

        // Assert
        assertNotNull(result);
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    void createBooking_ShouldThrowException_WhenConflictExists() {
        // Arrange
        Booking existingConflict = new Booking();
        existingConflict.setStatus(BookingStatus.APPROVED);
        
        when(bookingRepository.findConflictingBookings(resourceId, startTime, endTime))
                .thenReturn(List.of(existingConflict));

        // Act & Assert
        Exception exception = assertThrows(IllegalStateException.class, () -> {
            bookingService.createBooking(userId, resourceId, startTime, endTime, "Study session");
        });

        assertEquals("Resource is already booked during this time window.", exception.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }
    
    @Test
    void createBooking_ShouldThrowException_WhenTimeInvalid() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            // End time before start time
            bookingService.createBooking(userId, resourceId, endTime, startTime, "Invalid time");
        });
        
        assertThrows(IllegalArgumentException.class, () -> {
            // Start time in the past
            bookingService.createBooking(userId, resourceId, LocalDateTime.now().minusDays(1), endTime, "Past time");
        });
    }
}
