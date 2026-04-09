package com.smartcampus.dto;

import com.smartcampus.enums.BookingStatus;
import lombok.Data;

@Data
public class BookingStatusUpdateDto {
    private BookingStatus status;
    private String rejectionReason;
}
