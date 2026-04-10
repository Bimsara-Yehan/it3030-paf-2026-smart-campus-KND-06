package com.smartcampus.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Enables Spring's @Async support so that EmailService.sendPasswordResetEmail()
 * runs on a separate thread and does not block the HTTP request.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}
