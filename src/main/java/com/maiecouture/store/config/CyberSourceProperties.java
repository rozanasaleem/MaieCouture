package com.maiecouture.store.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cybersource")
public record CyberSourceProperties(
        boolean enabled,
        String baseUrl,
        String merchantId,
        String keyId,
        String secretKey,
        List<String> targetOrigins,
        String clientVersion,
        List<String> allowedCardNetworks,
        List<String> allowedPaymentTypes,
        String country,
        String locale,
        String completeType,
        boolean decisionManagerEnabled,
        String consumerAuthentication
) {
}
