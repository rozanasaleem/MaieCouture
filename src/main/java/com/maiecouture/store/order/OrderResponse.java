package com.maiecouture.store.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        String orderNumber,
        String customerName,
        String email,
        String phone,
        String shippingAddress,
        String shippingCountryCode,
        PaymentStatus paymentStatus,
        OrderStatus orderStatus,
        BigDecimal subtotalAmount,
        BigDecimal shippingFee,
        BigDecimal totalAmount,
        String currency,
        String paymentReference,
        Instant createdAt,
        List<OrderItemResponse> items
) {
    public record OrderItemResponse(
            Long productId,
            Long variantId,
            String productName,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal
    ) {
    }

    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getCustomerName(),
                order.getEmail(),
                order.getPhone(),
                order.getShippingAddress(),
                order.getShippingCountryCode(),
                order.getPaymentStatus(),
                order.getOrderStatus(),
                order.getSubtotalAmount(),
                order.getShippingFee(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getPaymentReference(),
                order.getCreatedAt(),
                order.getItems().stream()
                        .map(item -> new OrderItemResponse(
                                item.getProduct().getId(),
                                item.getVariant() != null ? item.getVariant().getId() : null,
                                item.getProductName(),
                                item.getQuantity(),
                                item.getUnitPrice(),
                                item.getLineTotal()
                        ))
                        .toList()
        );
    }
}
