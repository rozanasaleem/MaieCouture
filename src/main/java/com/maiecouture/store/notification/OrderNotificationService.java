package com.maiecouture.store.notification;

import com.maiecouture.store.config.NotificationsProperties;
import com.maiecouture.store.order.Order;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class OrderNotificationService {

    private static final Logger log = LoggerFactory.getLogger(OrderNotificationService.class);

    private final NotificationsProperties notificationsProperties;
    private final Optional<JavaMailSender> mailSender;

    public OrderNotificationService(
            NotificationsProperties notificationsProperties,
            Optional<JavaMailSender> mailSender
    ) {
        this.notificationsProperties = notificationsProperties;
        this.mailSender = mailSender;
    }

    public void sendOrderReceived(Order order) {
        send(
                order.getEmail(),
                "Maie Couture order received • " + order.getOrderNumber(),
                """
                        Thank you for your order with Maie Couture.

                        Order number: %s
                        Payment status: %s
                        Order status: %s
                        Subtotal: %s %s
                        Shipping: %s %s
                        Total: %s %s

                        We will send another update once payment is confirmed.
                        """.formatted(
                        order.getOrderNumber(),
                        order.getPaymentStatus(),
                        order.getOrderStatus(),
                        order.getSubtotalAmount(), order.getCurrency(),
                        order.getShippingFee(), order.getCurrency(),
                        order.getTotalAmount(), order.getCurrency()
                )
        );
    }

    public void sendPaymentConfirmed(Order order) {
        send(
                order.getEmail(),
                "Payment confirmed • " + order.getOrderNumber(),
                """
                        Your payment has been confirmed.

                        Order number: %s
                        Payment reference: %s
                        Total paid: %s %s

                        We are now preparing your pieces.
                        """.formatted(
                        order.getOrderNumber(),
                        order.getPaymentReference(),
                        order.getTotalAmount(),
                        order.getCurrency()
                )
        );
    }

    public void sendShipped(Order order) {
        send(
                order.getEmail(),
                "Your order is on the way • " + order.getOrderNumber(),
                """
                        Your Maie Couture order has been shipped.

                        Order number: %s
                        Shipping destination: %s

                        Thank you for shopping with us.
                        """.formatted(
                        order.getOrderNumber(),
                        order.getShippingAddress()
                )
        );
    }

    private void send(String to, String subject, String body) {
        if (to == null || to.isBlank()) {
            return;
        }

        if (!notificationsProperties.enabled() || mailSender.isEmpty()) {
            log.info("Email notification skipped (disabled or mail sender missing). to={}, subject={}, body={}", to, subject, body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom(resolveFrom());
            if (notificationsProperties.replyTo() != null && !notificationsProperties.replyTo().isBlank()) {
                message.setReplyTo(notificationsProperties.replyTo());
            }
            mailSender.get().send(message);
        } catch (Exception ex) {
            log.error("Failed sending order email to {} with subject {}", to, subject, ex);
        }
    }

    private String resolveFrom() {
        String fromEmail = notificationsProperties.fromEmail();
        if (fromEmail == null || fromEmail.isBlank()) {
            return "no-reply@maiecouture.com";
        }
        String fromName = notificationsProperties.fromName();
        if (fromName == null || fromName.isBlank()) {
            return fromEmail;
        }
        return fromName + " <" + fromEmail + ">";
    }
}
