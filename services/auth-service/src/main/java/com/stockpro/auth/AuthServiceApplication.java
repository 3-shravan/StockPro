package com.stockpro.auth;

import com.stockpro.auth.model.Role;
import com.stockpro.auth.model.User;
import com.stockpro.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedData(UserRepository repository, PasswordEncoder encoder) {
        return args -> {
            String adminEmail = "admin@stockpro.com";
            if (!repository.existsByEmail(adminEmail)) {
                User admin = User.builder()
                        .fullName("StockPro Admin")
                        .email(adminEmail)
                        .passwordHash(encoder.encode("admin123"))
                        .role(Role.ADMIN)
                        .isActive(true)
                        .build();
                repository.save(admin);
                System.out.println("✅ Default admin user created: admin@stockpro.com / admin123");
            }
        };
    }
}
