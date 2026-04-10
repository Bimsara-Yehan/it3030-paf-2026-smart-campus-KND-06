package com.smartcampus.service;

import com.smartcampus.dto.request.CreateTicketRequest;
import com.smartcampus.dto.request.UpdateTicketStatusRequest;
import com.smartcampus.dto.response.TicketResponse;
import com.smartcampus.entity.Ticket;
import com.smartcampus.entity.User;
import com.smartcampus.enums.TicketCategory;
import com.smartcampus.enums.TicketPriority;
import com.smartcampus.enums.TicketStatus;
import com.smartcampus.enums.UserRole;
import com.smartcampus.exception.ForbiddenException;
import com.smartcampus.exception.ResourceNotFoundException;
import com.smartcampus.repository.CommentRepository;
import com.smartcampus.repository.TicketAttachmentRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private TicketAttachmentRepository attachmentRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TicketService ticketService;

    private User testUser;
    private User testTechnician;
    private Ticket mockTicket;
    private final UUID TICKET_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .name("Student User")
                .email("student@u.edu")
                .role(UserRole.USER)
                .build();

        testTechnician = User.builder()
                .id(UUID.randomUUID())
                .name("Tech Worker")
                .email("tech@u.edu")
                .role(UserRole.TECHNICIAN)
                .build();

        mockTicket = Ticket.builder()
                .id(TICKET_ID)
                .title("Broken Projector")
                .description("It will not turn on")
                .category(TicketCategory.IT_SUPPORT)
                .priority(TicketPriority.HIGH)
                .status(TicketStatus.OPEN)
                .reporter(testUser)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .version(1)
                .build();

        // Default mock security context to the testUser
        setCurrentUser(testUser);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setCurrentUser(User user) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void createTicket_ReturnsTicketResponse() {
        // Arrange
        CreateTicketRequest request = new CreateTicketRequest();
        request.setTitle("New Ticket");
        request.setDescription("Details");
        request.setCategory(TicketCategory.MAINTENANCE);
        request.setPriority(TicketPriority.MEDIUM);

        when(ticketRepository.save(any(Ticket.class))).thenReturn(mockTicket);

        // Act
        TicketResponse response = ticketService.createTicket(request);

        // Assert
        assertNotNull(response);
        assertEquals(mockTicket.getId(), response.getId());
        verify(ticketRepository, times(1)).save(any(Ticket.class));
    }

    @Test
    void getTicketById_UserCanAccessOwnTicket() {
        // Arrange
        when(ticketRepository.findByIdAndDeletedAtIsNull(TICKET_ID)).thenReturn(Optional.of(mockTicket));
        setCurrentUser(testUser); // Same user who reported the ticket

        // Act
        TicketResponse response = ticketService.getTicketById(TICKET_ID);

        // Assert
        assertNotNull(response);
        assertEquals(TICKET_ID, response.getId());
    }

    @Test
    void getTicketById_ThrowsForbidden_WhenAnotherUserTriesToAccess() {
        // Arrange
        when(ticketRepository.findByIdAndDeletedAtIsNull(TICKET_ID)).thenReturn(Optional.of(mockTicket));
        
        User anotherUser = User.builder().id(UUID.randomUUID()).role(UserRole.USER).build();
        setCurrentUser(anotherUser); // Random user trying to access the ticket

        // Act & Assert
        assertThrows(ForbiddenException.class, () -> ticketService.getTicketById(TICKET_ID));
    }

    @Test
    void getTicketById_ThrowsResourceNotFound() {
        // Arrange
        when(ticketRepository.findByIdAndDeletedAtIsNull(TICKET_ID)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> ticketService.getTicketById(TICKET_ID));
    }

    @Test
    void updateTicketStatus_Success_WhenAssignedTechnicianUpdates() {
        // Arrange
        mockTicket.setAssignedTechnician(testTechnician);
        when(ticketRepository.findByIdAndDeletedAtIsNull(TICKET_ID)).thenReturn(Optional.of(mockTicket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(i -> i.getArguments()[0]);

        setCurrentUser(testTechnician); // Technician logs in

        UpdateTicketStatusRequest req = new UpdateTicketStatusRequest();
        req.setStatus(TicketStatus.IN_PROGRESS);

        // Act
        TicketResponse response = ticketService.updateTicketStatus(TICKET_ID, req);

        // Assert
        assertNotNull(response);
        assertEquals(TicketStatus.IN_PROGRESS, response.getStatus());
        verify(ticketRepository, times(1)).save(any(Ticket.class));
    }

    @Test
    void updateTicketStatus_ThrowsForbidden_WhenUnassignedTechnicianUpdates() {
        // Arrange
        // Another technician is assigned
        User anotherTech = User.builder().id(UUID.randomUUID()).role(UserRole.TECHNICIAN).build();
        mockTicket.setAssignedTechnician(anotherTech);
        
        when(ticketRepository.findByIdAndDeletedAtIsNull(TICKET_ID)).thenReturn(Optional.of(mockTicket));

        setCurrentUser(testTechnician); // Currently logged in tech is NOT the one assigned

        UpdateTicketStatusRequest req = new UpdateTicketStatusRequest();
        req.setStatus(TicketStatus.IN_PROGRESS);

        // Act & Assert
        assertThrows(ForbiddenException.class, () -> ticketService.updateTicketStatus(TICKET_ID, req));
    }

    @Test
    void assignTicket_Success_WhenAdminAssigns() {
        // Arrange
        User testAdmin = User.builder().id(UUID.randomUUID()).role(UserRole.ADMIN).email("admin").build();
        setCurrentUser(testAdmin); // Must be an ADMIN acting on the ticket

        when(ticketRepository.findByIdAndDeletedAtIsNull(TICKET_ID)).thenReturn(Optional.of(mockTicket));
        testTechnician.setIsActive(true);
        when(userRepository.findById(testTechnician.getId())).thenReturn(Optional.of(testTechnician));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        TicketResponse response = ticketService.assignTicket(TICKET_ID, testTechnician.getId());

        // Assert
        assertNotNull(response);
        assertEquals(TicketStatus.IN_PROGRESS, response.getStatus());
        assertEquals(testTechnician.getId(), response.getAssignedTechnicianId());
        assertEquals(testAdmin.getId(), response.getAssignedById());
        assertNotNull(response.getAssignedAt());
        verify(ticketRepository).save(any(Ticket.class));
    }
}
