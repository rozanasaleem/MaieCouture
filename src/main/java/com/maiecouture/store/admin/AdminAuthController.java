package com.maiecouture.store.admin;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/auth")
public class AdminAuthController {

    @GetMapping("/me")
    public AdminAuthResponse me(@AuthenticationPrincipal AdminPrincipal principal) {
        return AdminAuthResponse.from(principal.adminUser());
    }
}
