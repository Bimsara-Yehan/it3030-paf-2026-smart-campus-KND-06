package com.smartcampus.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Thin wrapper around {@link JavaMailSender} for sending application emails.
 *
 * <p>All send methods are {@link Async} so they never block the HTTP request thread.
 * If the SMTP server is unavailable the error is logged but NOT propagated — the
 * calling flow (e.g. password reset) still returns success to the user so the
 * email address is not enumerated.
 *
 * @author  Smart Campus Team — IT3030 PAF 2026, SLIIT
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    /** Base URL of the React frontend — used to build clickable links in emails. */
    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    // =========================================================================
    // Password reset
    // =========================================================================

    /**
     * Sends the password-reset email containing a one-time link.
     *
     * <p>The link points to the React {@code /reset-password} page with the token
     * as a query parameter. The token expires in 15 minutes.
     *
     * @param toEmail   the recipient's email address
     * @param resetToken the opaque reset token to embed in the link
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

        String html = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; background: #f4f4f5; padding: 32px;">
                  <div style="max-width: 480px; margin: 0 auto; background: #fff;
                              border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
                    <h2 style="color: #1d4ed8; margin-top: 0;">Smart Campus Hub</h2>
                    <h3 style="color: #111827;">Password Reset Request</h3>
                    <p style="color: #374151;">
                      We received a request to reset the password for your account.
                      Click the button below to set a new password. This link expires in
                      <strong>15 minutes</strong>.
                    </p>
                    <a href="%s"
                       style="display: inline-block; margin: 20px 0; padding: 12px 28px;
                              background: #2563eb; color: #fff; border-radius: 8px;
                              text-decoration: none; font-weight: 600;">
                      Reset My Password
                    </a>
                    <p style="color: #6b7280; font-size: 13px;">
                      If you did not request a password reset, you can safely ignore this email.
                      Your password will not be changed.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      Smart Campus Operations Hub &mdash; IT3030 PAF 2026, SLIIT
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(resetLink);

        sendHtml(toEmail, "Smart Campus — Password Reset Request", html);
    }

    // =========================================================================
    // Booking event emails
    // =========================================================================

    /** Sent to the user immediately after they submit a booking request. */
    @Async
    public void sendBookingConfirmationEmail(String toEmail, String userName,
                                             String resourceName, String startTime, String endTime) {
        String html = """
                <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:32px;">
                <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
                  <h2 style="color:#1d4ed8;margin-top:0;">Smart Campus Hub</h2>
                  <h3 style="color:#111827;">Booking Request Received</h3>
                  <p style="color:#374151;">Hi <strong>%s</strong>,</p>
                  <p style="color:#374151;">Your booking request has been submitted and is <strong>pending approval</strong>.</p>
                  <table style="width:100%%;border-collapse:collapse;margin:16px 0;">
                    <tr><td style="padding:8px;background:#f9fafb;border-radius:6px;color:#6b7280;font-size:13px;">Resource</td>
                        <td style="padding:8px;font-weight:600;color:#111827;">%s</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;font-size:13px;">From</td>
                        <td style="padding:8px;font-weight:600;color:#111827;">%s</td></tr>
                    <tr><td style="padding:8px;background:#f9fafb;border-radius:6px;color:#6b7280;font-size:13px;">To</td>
                        <td style="padding:8px;font-weight:600;color:#111827;">%s</td></tr>
                  </table>
                  <p style="color:#374151;">You will receive another email once an administrator reviews your request.</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">Smart Campus Operations Hub &mdash; IT3030 PAF 2026, SLIIT</p>
                </div></body></html>
                """.formatted(userName, resourceName, startTime, endTime);

        sendHtml(toEmail, "Smart Campus — Booking Request Received", html);
    }

    /** Sent when an admin approves a booking. */
    @Async
    public void sendBookingApprovedEmail(String toEmail, String userName,
                                         String resourceName, String startTime, String endTime) {
        String html = """
                <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:32px;">
                <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
                  <h2 style="color:#1d4ed8;margin-top:0;">Smart Campus Hub</h2>
                  <h3 style="color:#16a34a;">Booking Approved</h3>
                  <p style="color:#374151;">Hi <strong>%s</strong>,</p>
                  <p style="color:#374151;">Great news! Your booking request has been <strong style="color:#16a34a;">approved</strong>.</p>
                  <table style="width:100%%;border-collapse:collapse;margin:16px 0;">
                    <tr><td style="padding:8px;background:#f9fafb;border-radius:6px;color:#6b7280;font-size:13px;">Resource</td>
                        <td style="padding:8px;font-weight:600;color:#111827;">%s</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;font-size:13px;">From</td>
                        <td style="padding:8px;font-weight:600;color:#111827;">%s</td></tr>
                    <tr><td style="padding:8px;background:#f9fafb;border-radius:6px;color:#6b7280;font-size:13px;">To</td>
                        <td style="padding:8px;font-weight:600;color:#111827;">%s</td></tr>
                  </table>
                  <p style="color:#374151;">Please arrive on time. If you need to cancel, do so from the bookings page.</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">Smart Campus Operations Hub &mdash; IT3030 PAF 2026, SLIIT</p>
                </div></body></html>
                """.formatted(userName, resourceName, startTime, endTime);

        sendHtml(toEmail, "Smart Campus — Booking Approved", html);
    }

    /** Sent when an admin rejects a booking. */
    @Async
    public void sendBookingRejectedEmail(String toEmail, String userName,
                                          String resourceName, String reason) {
        String reasonHtml = (reason != null && !reason.isBlank())
                ? "<p style=\"color:#374151;\"><strong>Reason:</strong> " + reason + "</p>"
                : "";

        String html = """
                <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f5;padding:32px;">
                <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
                  <h2 style="color:#1d4ed8;margin-top:0;">Smart Campus Hub</h2>
                  <h3 style="color:#dc2626;">Booking Not Approved</h3>
                  <p style="color:#374151;">Hi <strong>%s</strong>,</p>
                  <p style="color:#374151;">Unfortunately your booking request for <strong>%s</strong> was <strong style="color:#dc2626;">not approved</strong>.</p>
                  %s
                  <p style="color:#374151;">You may submit a new request for a different time or resource.</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">Smart Campus Operations Hub &mdash; IT3030 PAF 2026, SLIIT</p>
                </div></body></html>
                """.formatted(userName, resourceName, reasonHtml);

        sendHtml(toEmail, "Smart Campus — Booking Not Approved", html);
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    private void sendHtml(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {} — subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {} — {}", to, e.getMessage());
        }
    }
}
