package com.maiecouture.store.order;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/shipping")
public class PublicShippingController {

    private final ShippingService shippingService;

    public PublicShippingController(ShippingService shippingService) {
        this.shippingService = shippingService;
    }

    @PostMapping("/quote")
    public ShippingQuoteResponse quote(@Valid @RequestBody ShippingQuoteRequest request) {
        BigDecimal shippingFee = shippingService.calculateFee(request.shippingCountryCode());
        BigDecimal subtotal = request.subtotalAmount().setScale(2, RoundingMode.HALF_UP);
        String currency = normalizeCurrency(request.currency());
        return new ShippingQuoteResponse(
                request.shippingCountryCode(),
                subtotal,
                shippingFee,
                subtotal.add(shippingFee).setScale(2, RoundingMode.HALF_UP),
                currency
        );
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "NIS";
        }
        String code = currency.trim().toUpperCase();
        if (code.equals("ILS") || code.equals("NIS")) {
            return "NIS";
        }
        return code;
    }
}
