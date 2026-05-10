package com.maiecouture.store.admin;

public record AdminAuthResponse(
        String email,
        String role
) {
    public static AdminAuthResponse from(AdminUser adminUser) {
        return new AdminAuthResponse(adminUser.getEmail(), adminUser.getRole().name());
    }
}
