package com.neuroforge.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    private final com.neuroforge.backend.repository.UserRepository userRepository;

    public TestController(com.neuroforge.backend.repository.UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/api/test")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public String test(@org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        if (userDetails == null) {
            return "No authenticated user session found.";
        }

        com.neuroforge.backend.entity.User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long orgId = user.getOrganization() != null ? user.getOrganization().getId() : null;
        String orgName = user.getOrganization() != null ? user.getOrganization().getName() : "None";

        String teamsStr = user.getTeams().stream()
                .map(com.neuroforge.backend.entity.Team::getName)
                .collect(java.util.stream.Collectors.joining(", "));

        return String.format(
            "JWT Authentication Successful!\n" +
            "User: %s (ID: %d)\n" +
            "Email: %s\n" +
            "Role: %s\n" +
            "Organization: %s (ID: %s)\n" +
            "Teams: [%s]",
            user.getFullName(), user.getId(), user.getEmail(), user.getRole(), orgName, orgId, teamsStr
        );
    }
}
