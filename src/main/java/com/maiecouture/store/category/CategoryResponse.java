package com.maiecouture.store.category;

public record CategoryResponse(
        Long id,
        String name,
        String slug,
        String description,
        String coverImage,
        boolean published,
        int sortOrder
) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getCoverImage(),
                category.isPublished(),
                category.getSortOrder()
        );
    }
}
