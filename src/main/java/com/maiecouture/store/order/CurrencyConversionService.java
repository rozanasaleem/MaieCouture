package com.maiecouture.store.order;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class CurrencyConversionService {

    private final BigDecimal ilsPerUsd;
    private final BigDecimal ilsPerEur;
    private final BigDecimal ilsPerJod;

    public CurrencyConversionService(
            @Value("${app.currency.ils-per-usd:3.05}") BigDecimal ilsPerUsd,
            @Value("${app.currency.ils-per-eur:3.45}") BigDecimal ilsPerEur,
            @Value("${app.currency.ils-per-jod:4.25}") BigDecimal ilsPerJod
    ) {
        this.ilsPerUsd = ilsPerUsd;
        this.ilsPerEur = ilsPerEur;
        this.ilsPerJod = ilsPerJod;
    }

    public BigDecimal convert(BigDecimal amount, String fromCurrency, String toCurrency) {
        if (amount == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        String normalizedFrom = normalizeCurrency(fromCurrency);
        String normalizedTo = normalizeCurrency(toCurrency);

        if (normalizedFrom.equals(normalizedTo)) {
            return scale(amount);
        }

        BigDecimal ilsAmount = toIls(amount, normalizedFrom);
        return fromIls(ilsAmount, normalizedTo);
    }

    public String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "ILS";
        }
        String code = currency.trim().toUpperCase();
        if (code.equals("NIS") || code.equals("ILS")) {
            return "ILS";
        }
        if (code.equals("USD") || code.equals("EUR") || code.equals("JOD")) {
            return code;
        }
        return "USD";
    }

    private BigDecimal toIls(BigDecimal amount, String currency) {
        return switch (currency) {
            case "ILS" -> scale(amount);
            case "USD" -> scale(amount.multiply(ilsPerUsd));
            case "EUR" -> scale(amount.multiply(ilsPerEur));
            case "JOD" -> scale(amount.multiply(ilsPerJod));
            default -> scale(amount.multiply(ilsPerUsd));
        };
    }

    private BigDecimal fromIls(BigDecimal ilsAmount, String currency) {
        return switch (currency) {
            case "ILS" -> scale(ilsAmount);
            case "USD" -> scale(ilsAmount.divide(ilsPerUsd, 2, RoundingMode.HALF_UP));
            case "EUR" -> scale(ilsAmount.divide(ilsPerEur, 2, RoundingMode.HALF_UP));
            case "JOD" -> scale(ilsAmount.divide(ilsPerJod, 2, RoundingMode.HALF_UP));
            default -> scale(ilsAmount.divide(ilsPerUsd, 2, RoundingMode.HALF_UP));
        };
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
