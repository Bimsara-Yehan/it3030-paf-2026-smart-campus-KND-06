package com.smartcampus.enums;

public enum ResourceStatus {
    AVAILABLE,
    UNAVAILABLE,
    MAINTENANCE,
    RETIRED,
    // Database schema V1 values — required for cloud DB compatibility
    ACTIVE,
    OUT_OF_SERVICE
}
