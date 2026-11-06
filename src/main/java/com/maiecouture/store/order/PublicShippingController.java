package com.maiecouture.store.order;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/shipping")
public class PublicShippingController {

    private final ShippingService shippingService;
    private final CurrencyConversionService currencyConversionService;

    public PublicShippingController(
            ShippingService shippingService,
            CurrencyConversionService currencyConversionService
    ) {
        this.shippingService = shippingService;
        this.currencyConversionService = currencyConversionService;
    }

    @PostMapping("/quote")
    public ShippingQuoteResponse quote(@Valid @RequestBody ShippingQuoteRequest request) {
        String currency = currencyConversionService.normalizeCurrency(request.currency());
        List<ShippingService.ShippingLine> shippingLines = request.items() == null
                ? List.of()
                : request.items().stream()
                        .map(item -> new ShippingService.ShippingLine(item.productId(), item.quantity()))
                        .toList();
        BigDecimal shippingFee = shippingService.calculateFee(
                request.shippingCountryCode(),
                request.shippingAreaCode(),
                currency,
                shippingLines
        );
        BigDecimal subtotal = request.subtotalAmount().setScale(2, RoundingMode.HALF_UP);
        return new ShippingQuoteResponse(
                request.shippingCountryCode(),
                request.shippingAreaCode(),
                subtotal,
                shippingFee,
                subtotal.add(shippingFee).setScale(2, RoundingMode.HALF_UP),
                currency
        );
    }
}
