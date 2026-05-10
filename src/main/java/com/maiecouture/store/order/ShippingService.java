package com.maiecouture.store.order;

import com.maiecouture.store.config.ShippingProperties;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ShippingService {

    private final ShippingProperties shippingProperties;

    public ShippingService(ShippingProperties shippingProperties) {
        this.shippingProperties = shippingProperties;
    }

    public BigDecimal calculateFee(String shippingCountryCode) {
        if (shippingCountryCode == null || shippingCountryCode.isBlank()) {
            return scale(shippingProperties.fallbackFee());
        }

        String code = shippingCountryCode.trim().toUpperCase();

        Map<String, BigDecimal> countryFees = shippingProperties.countryFees();
        if (countryFees != null && countryFees.get(code) != null) {
            return scale(countryFees.get(code));
        }

        if (code.equalsIgnoreCase(shippingProperties.domesticCountryCode())) {
            return scale(shippingProperties.domesticFee());
        }

        return scale(shippingProperties.internationalFee());
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
