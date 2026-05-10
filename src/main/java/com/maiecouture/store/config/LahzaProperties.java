package com.maiecouture.store.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.lahza")
public record LahzaProperties(
        boolean enabled,
        String baseUrl,
        String secretKey,
        String callbackUrl
) {
}
