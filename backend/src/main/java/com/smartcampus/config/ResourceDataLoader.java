package com.smartcampus.config;

import com.smartcampus.entity.Resource;
import com.smartcampus.enums.ResourceType;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.enums.UserRole;
import com.smartcampus.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Data loader to populate initial campus resources for Module B testing.
 * This ensures the Booking dropdown isn't empty.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class ResourceDataLoader implements CommandLineRunner {

    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        if (resourceRepository.count() == 0) {
            List<Resource> resources = List.of(
                Resource.builder()
                    .name("Computing Lab 01")
                    .type(ResourceType.LAB)
                    .capacity(50)
                    .location("Block A, Floor 2")
                    .build(),
                Resource.builder()
                    .name("Main Lecture Hall")
                    .type(ResourceType.LECTURE_HALL)
                    .capacity(200)
                    .location("Building C, Ground Floor")
                    .build(),
                Resource.builder()
                    .name("Study Pod A")
                    .type(ResourceType.MEETING_ROOM)
                    .capacity(4)
                    .location("Library, Floor 1")
                    .build(),
                Resource.builder()
                    .name("Conference Room 102")
                    .type(ResourceType.MEETING_ROOM)
                    .capacity(12)
                    .location("Admin Block, Floor 1")
                    .build()
            );
            resourceRepository.saveAll(resources);
            log.info("Bootstrapped {} resources.", resources.size());
        }

        // ── Ensure Admin Role ──
        // Fail-safe: promote admin@smartcampus.com to ADMIN role to resolve potential Access Denied conflicts.
        userRepository.findByEmail("admin@smartcampus.com").ifPresent(admin -> {
            if (admin.getRole() != UserRole.ADMIN) {
                log.info("Promoting {} to ADMIN role...", admin.getEmail());
                admin.setRole(UserRole.ADMIN);
                userRepository.save(admin);
            }
        });
    }
}
