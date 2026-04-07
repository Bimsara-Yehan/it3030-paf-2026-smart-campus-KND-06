# Viva Preparation Guide: Module C (Incident Ticketing)

This document is compiled specifically to help you ace your Viva. It breaks down every feature you built, the design patterns you followed, and the technical decisions you made. Print this or keep it open during your presentation!

---

## 1. Core Module Responsibilities
As the developer of **Module C**, you were responsible for the complete lifecycle of Campus Maintenance and Incident Support Tickets. Your system allows students/staff to report issues (like broken ACs, wifi outages) and allows technicians and admins to track, update, and resolve them.

### Key Workflows Implemented
*   **Ticket Submission:** Users can create tickets with priorities, categories, and file attachments.
*   **Kanban Board Dashboard:** Technicians and Admins have a drag-and-drop or visual pipeline view to see tickets moving from `OPEN` → `IN_PROGRESS` → `RESOLVED`.
*   **Timeline & Activity History:** An audit trail UI is present in `TicketDetailPage.tsx` to visually display status transitions.
*   **Comment System:** Bi-directional communication between reporters and technicians.
*   **Cross-Module Integration:** Integrated with **Module 4 (Notifications)** by calling `NotificationService` hooks when tickets are assigned or resolved.

---

## 2. "Out of the Box" Innovations (To show off for the 10 Innovation Marks)

You should extensively highlight these two features during your viva, as they prove you went beyond standard CRUD operations:

### A. The AI-Powered Categorization Engine (`aiPredictor.ts`)
*   **What it is:** A natural language heuristics script taking user input from the description and intelligently parsing it on the fly.
*   **How it works:** As the user types, a React `useEffect` hook monitors the text natively. If it detects keywords (e.g., "water", "leak", "clean"), it automatically updates the React Hook Form to set the category to `MAINTENANCE` and priority to `HIGH`.
*   **Viva Talking Point:** *"I implemented this to reduce administrative overhead so technicians don't have to manually re-categorize poorly filed tickets."*

### B. Smart Duplicate Ticket Detector
*   **What it is:** A real-time database querying tool that prevents users from submitting multiple tickets for the exact same issue.
*   **How it works:** As a user enters a title, the React frontend *debounces* the input by 600ms. It sends a secure request to the backend `GET /tickets/search/similar` endpoint. The UI then elegantly displays matching active tickets in an orange warning box.
*   **Viva Talking Point:** *"To protect the database from spam, I added a debouncing timer in React so the server isn't hit on every single keystroke. I also restricted the backend JPA query to only search against `OPEN` and `IN_PROGRESS` tickets to protect user privacy from historical tickets."*

---

## 3. Crucial Technical Concepts to Memorize

During a viva, examiners love asking "Why did you do X?" Here are the answers based on your exact code:

### ❓ "How did you handle the N+1 Query Problem or LazyInitializationExceptions?"
**Your Answer:** "I encountered a `LazyInitializationException` where my Spring Boot API returned a 500 Server Error because the database connection closed before it could fetch the Ticket's 'Reporter' and 'Technician' user profiles. To fix this efficiently, I used the **`@EntityGraph`** annotation in my `TicketRepository.java`. This forces Hibernate to eagerly fetch the related user profiles in a single optimized SQL `LEFT OUTER JOIN`, solving the N+1 problem completely."

### ❓ "Why did you use DTOs (Data Transfer Objects) instead of returning Entities?"
**Your Answer:** "I used `TicketResponse` and `CreateTicketRequest` DTOs to separate the database layer from the API layer. Returning raw entities like `Ticket` directly to the frontend exposes sensitive server data. Also, since `Ticket` maps to `User` and `Comments`, returning the raw entity would cause infinite JSON recursion loops (Stack Overflow exceptions). DTOs map exactly what the React UI needs."

### ❓ "How did you avoid endpoint collision?"
**Your Answer:** "Initially, my duplicate search lived at `/tickets/similar`. However, it got hijacked by the `/tickets/{id}` endpoint causing a 400 Bad Request because Spring tried to convert the word 'similar' into a UUID. I fixed this architectural collision by moving the endpoint to two segments: `/tickets/search/similar`."

### ❓ "Why do you use `@Transactional` on your Service methods?"
**Your Answer:** "I used `@Transactional` in `TicketService.java` to enforce ACID properties (Atomicity, Consistency, Isolation, Durability). For example, when a ticket status changes to 'RESOLVED', it updates the ticket AND triggers a notification. If the notification system fails, the database automatically rolls back the ticket status to prevent data corruption."

---

## 4. Technology Stack Summary
*   **Backend:** Java 17, Spring Boot 3, Spring Security (Stateless JWT), Spring Data JPA/Hibernate 6.
*   **Frontend:** React 18, TypeScript, Tailwind CSS, React Query (for API caching), Axios.
*   **Storage Configuration:** Soft Deletes are implemented across the board. Instead of `DELETE FROM`, I use `t.setDeletedAt(LocalDateTime.now())` for audit compliance.
