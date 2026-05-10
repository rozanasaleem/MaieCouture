package com.maiecouture.store.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({
        AppProperties.class,
        AdminSeedProperties.class,
        ShippingProperties.class,
        LahzaProperties.class,
        NotificationsProperties.class
})
public class ApplicationConfig {
}
