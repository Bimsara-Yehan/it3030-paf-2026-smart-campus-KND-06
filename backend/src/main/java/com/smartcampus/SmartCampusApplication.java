package com.smartcampus;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

/**
 * Entry point for the Smart Campus Operations Hub REST API.
 *
 * <p>Bootstraps the Spring application context, triggers Flyway migrations,
 * and starts the embedded Tomcat server on the port configured in
 * {@code application.yml} (default: 8080).
 *
 * <p>Architecture overview:
 * <ul>
 *   <li>Security  — JWT-based stateless authentication + Google OAuth2</li>
 *   <li>Data      — Spring Data JPA with PostgreSQL 15, managed by Flyway</li>
 *   <li>API docs  — SpringDoc OpenAPI 3 at {@code /api/swagger-ui.html}</li>
 *   <li>Modules   — Resources, Bookings, Tickets, Notifications, Auth</li>
 * </ul>
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 * @version 0.0.1-SNAPSHOT
 */
@Slf4j
@SpringBootApplication
public class SmartCampusApplication {

    /**
     * Main method — delegates to {@link SpringApplication#run} which:
     * <ol>
     *   <li>Creates the Spring application context.</li>
     *   <li>Runs Flyway migrations against the configured datasource.</li>
     *   <li>Starts embedded Tomcat and binds to the configured port.</li>
     * </ol>
     *
     * @param args command-line arguments passed through to Spring
     */
    public static void main(String[] args) {
        SpringApplication.run(SmartCampusApplication.class, args);
    }

    /**
     * Logs a confirmation message once the application context is fully
     * initialised and the server is ready to accept requests.
     *
     * <p>Using {@link ApplicationReadyEvent} rather than
     * {@link org.springframework.context.event.ContextRefreshedEvent} ensures
     * the message appears only after Tomcat has finished binding to the port.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("=========================================================");
        log.info("  Smart Campus Operations Hub started successfully");
        log.info("  API base  : http://localhost:8080/api/v1");
        log.info("  Swagger   : http://localhost:8080/api/swagger-ui.html");
        log.info("  Actuator  : http://localhost:8080/api/actuator/health");
        log.info("=========================================================");
    }
}
