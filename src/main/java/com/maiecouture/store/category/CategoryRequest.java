package com.maiecouture.store.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CategoryRequest(
        @NotBlank String name,
        @NotBlank String slug,
        String description,
        String coverImage,
        @NotNull Boolean published,
        @NotNull Integer sortOrder
) {
}
