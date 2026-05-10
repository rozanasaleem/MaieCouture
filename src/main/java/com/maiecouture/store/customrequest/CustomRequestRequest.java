package com.maiecouture.store.customrequest;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CustomRequestRequest(
        @NotBlank String customerName,
        @NotBlank @Email String email,
        String phone,
        @NotNull RequestType requestType,
        AppointmentType appointmentType,
        String notes,
        Instant preferredDate,
        Long productId
) {
}
