package com.maiecouture.store.customrequest;

import java.time.Instant;

public record CustomRequestResponse(
        Long id,
        String customerName,
        String email,
        String phone,
        RequestType requestType,
        AppointmentType appointmentType,
        String notes,
        Instant preferredDate,
        CustomRequestStatus status,
        Long productId,
        String productName,
        Instant createdAt
) {
    public static CustomRequestResponse from(CustomRequest request) {
        return new CustomRequestResponse(
                request.getId(),
                request.getCustomerName(),
                request.getEmail(),
                request.getPhone(),
                request.getRequestType(),
                request.getAppointmentType(),
                request.getNotes(),
                request.getPreferredDate(),
                request.getStatus(),
                request.getProduct() != null ? request.getProduct().getId() : null,
                request.getProduct() != null ? request.getProduct().getName() : null,
                request.getCreatedAt()
        );
    }
}
