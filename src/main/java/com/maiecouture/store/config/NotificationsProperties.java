package com.maiecouture.store.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.notifications")
public record NotificationsProperties(
        boolean enabled,
        String fromEmail,
        String fromName,
        String replyTo
) {
}
