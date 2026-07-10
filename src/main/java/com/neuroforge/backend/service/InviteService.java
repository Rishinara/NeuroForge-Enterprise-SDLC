package com.neuroforge.backend.service;

import com.neuroforge.backend.entity.Invite;
import com.neuroforge.backend.entity.Organization;
import com.neuroforge.backend.entity.Role;
import com.neuroforge.backend.entity.Team;
import com.neuroforge.backend.entity.User;
import com.neuroforge.backend.repository.InviteRepository;
import com.neuroforge.backend.repository.OrganizationRepository;
import com.neuroforge.backend.repository.TeamRepository;
import com.neuroforge.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class InviteService {

    private final InviteRepository inviteRepository;
    private final OrganizationRepository organizationRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public InviteService(InviteRepository inviteRepository,
                         OrganizationRepository organizationRepository,
                         TeamRepository teamRepository,
                         UserRepository userRepository,
                         PasswordEncoder passwordEncoder) {
        this.inviteRepository = inviteRepository;
        this.organizationRepository = organizationRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public String createInvite(Long orgId, String email, Long teamId, Role role) {
        Organization organization = organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        Team team = null;
        if (teamId != null) {
            team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));
        }

        String token = UUID.randomUUID().toString();
        Invite invite = new Invite(email, token, organization, team, role);
        inviteRepository.save(invite);

        // Simple mock mail log to console
        String inviteLink = "http://localhost:8082/api/auth/accept-invite?token=" + token;
        System.out.println("=================================================");
        System.out.println("SENDING MOCK EMAIL TO: " + email);
        System.out.println("INVITATION LINK: " + inviteLink);
        System.out.println("=================================================");

        return inviteLink;
    }

    @Transactional
    public User acceptInvite(String token, String password, String fullName) {
        if (token != null && token.contains("token=")) {
            token = token.substring(token.indexOf("token=") + 6);
        }

        Invite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

        if (!"PENDING".equals(invite.getStatus())) {
            throw new RuntimeException("Invitation has already been accepted or expired");
        }

        if (userRepository.existsByEmail(invite.getEmail())) {
            throw new RuntimeException("User with this email already exists");
        }

        User user = new User();
        user.setEmail(invite.getEmail());
        user.setPassword(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setRole(invite.getRole());
        user.setOrganization(invite.getOrganization());
        user.setCreatedAt(LocalDateTime.now());

        if (invite.getTeam() != null) {
            user.getTeams().add(invite.getTeam());
        }

        User savedUser = userRepository.save(user);

        invite.setStatus("ACCEPTED");
        inviteRepository.save(invite);

        return savedUser;
    }
}
