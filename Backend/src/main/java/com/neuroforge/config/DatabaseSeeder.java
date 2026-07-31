package com.neuroforge.config;

import com.neuroforge.entity.Organization;
import com.neuroforge.entity.User;
import com.neuroforge.enums.Role;
import com.neuroforge.repository.OrganizationRepository;
import com.neuroforge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeeder.class);

    @Override
    public void run(String... args) throws Exception {
        if (organizationRepository.count() > 0) {
            logger.info("Database already seeded, skipping...");
            return;
        }
        logger.info("Seeding database with default users and organization...");

        // Create an Organization
        Organization org = new Organization();
        org.setName("NeuroForge Global");
        org.setDescription("Default organization for NeuroForge");
        org.setCreatedAt(LocalDateTime.now());
        org = organizationRepository.save(org);

        String defaultPassword = passwordEncoder.encode("password123");

        Role[] roles = {
                Role.SUPER_ADMIN,
                Role.ORG_ADMIN,
                Role.PROJECT_MANAGER,
                Role.DEVELOPER,
                Role.QA_TESTER,
                Role.CLIENT
        };

        for (Role role : roles) {
            for (int i = 1; i <= 5; i++) {
                String roleName = role.name().toLowerCase();
                String email = roleName + i + "@neuroforge.com";
                
                if (!userRepository.existsByEmail(email)) {
                    User user = new User();
                    user.setFirstName(role.name());
                    user.setLastName("User" + i);
                    user.setFullName(role.name() + " User" + i);
                    user.setEmail(email);
                    user.setPassword(defaultPassword);
                    user.setRole(role);
                    user.setOrganization(org);
                    user.setCreatedAt(LocalDateTime.now());
                    user.setEnabled(true);
                    
                    userRepository.save(user);

                    if (i == 1) {
                        logger.info("--------------------------------------------------");
                        logger.info("Role: " + role.name());
                        logger.info("Email: " + email);
                        logger.info("Password: password123");
                        logger.info("--------------------------------------------------");
                    }
                }
            }
        }

        logger.info("Database seeding completed successfully!");
    }
}
