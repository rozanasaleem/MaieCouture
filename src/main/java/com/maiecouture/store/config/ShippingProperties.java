package com.maiecouture.store.config;

import java.math.BigDecimal;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.shipping")
public record ShippingProperties(
        String domesticCountryCode,
        BigDecimal domesticFee,
        BigDecimal westBankFee,
        BigDecimal jerusalemFee,
        BigDecimal areas48Fee,
        BigDecimal internationalFee,
        BigDecimal fallbackFee,
        Map<String, BigDecimal> countryFees
) {
}
