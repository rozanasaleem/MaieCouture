package com.maiecouture.store.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.admin.seed")
public record AdminSeedProperties(String email, String password) {
}
