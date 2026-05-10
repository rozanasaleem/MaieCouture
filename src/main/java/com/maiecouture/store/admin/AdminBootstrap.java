package com.maiecouture.store.admin;

import com.maiecouture.store.config.AdminSeedProperties;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements CommandLineRunner {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminSeedProperties adminSeedProperties;

    public AdminBootstrap(
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder,
            AdminSeedProperties adminSeedProperties
    ) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminSeedProperties = adminSeedProperties;
    }

    @Override
    public void run(String... args) {
        adminUserRepository.findByEmailIgnoreCase(adminSeedProperties.email())
                .ifPresentOrElse(
                        this::refreshSeedAdminIfNeeded,
                        this::createSeedAdmin
                );
    }

    private void refreshSeedAdminIfNeeded(AdminUser adminUser) {
        if (adminUser.getPasswordHash() != null && adminUser.getPasswordHash().contains("placeholderhashvalue")) {
            adminUser.setPasswordHash(passwordEncoder.encode(adminSeedProperties.password()));
            adminUser.setRole(AdminRole.SUPER_ADMIN);
            adminUserRepository.save(adminUser);
        }
    }

    private void createSeedAdmin() {
        AdminUser adminUser = new AdminUser();
        adminUser.setEmail(adminSeedProperties.email());
        adminUser.setPasswordHash(passwordEncoder.encode(adminSeedProperties.password()));
        adminUser.setRole(AdminRole.SUPER_ADMIN);
        adminUserRepository.save(adminUser);
    }
}
