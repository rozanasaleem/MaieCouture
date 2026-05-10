package com.maiecouture.store.customrequest;

import jakarta.validation.constraints.NotNull;

public record CustomRequestStatusUpdateRequest(@NotNull CustomRequestStatus status) {
}
