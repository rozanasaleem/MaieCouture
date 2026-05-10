package com.maiecouture.store.payment;

public record LahzaCallbackRequest(
        String reference,
        String status,
        String transactionId
) {
}
