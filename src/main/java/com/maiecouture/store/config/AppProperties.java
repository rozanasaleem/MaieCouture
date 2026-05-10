package com.maiecouture.store.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cors")
public record AppProperties(List<String> allowedOrigins) {
}
