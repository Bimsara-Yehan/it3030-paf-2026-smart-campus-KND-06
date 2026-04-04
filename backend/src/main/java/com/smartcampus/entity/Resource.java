package com.smartcampus.entity;

import com.smartcampus.enums.ResourceType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

/**
 * Minimal Resource stub for Module B (Booking Engine) to compile.
 * Member 1 will expand this entity later.
 */
@Entity
@Table(name = "resources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String name;
    
    @Enumerated(EnumType.STRING)
    private ResourceType type;
    
    private Integer capacity;
}
