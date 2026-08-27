package com.neuroforge;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.neuroforge.repository.ProjectRepository;
import com.neuroforge.repository.UserRepository;
import com.neuroforge.service.ProjectService;
import com.neuroforge.entity.User;

@SpringBootTest
class NeuroforgeBackendApplicationTests {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private com.neuroforge.repository.OrganizationRepository organizationRepository;

	@Test
	void contextLoads() {
	}

    @Test
    void testGetProjects() {
        try {
            // Find or create an organization
            com.neuroforge.entity.Organization org = organizationRepository.findAll().stream().findFirst().orElseGet(() -> {
                com.neuroforge.entity.Organization newOrg = new com.neuroforge.entity.Organization();
                newOrg.setName("Test Org");
                return organizationRepository.save(newOrg);
            });
            Long orgId = org.getId();

            System.out.println("TESTING findByOrganizationIdOrderByCreatedAtDesc(" + orgId + ")...");
            var projects = projectRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
            System.out.println("Found " + projects.size() + " projects.");
            for (var p : projects) {
                System.out.println("Project: " + p.getName() + ", TechStack: " + p.getTechStack() + ", Members: " + p.getMembers().size());
            }

            // Find or create a user associated with the organization
            var users = userRepository.findAll();
            User user;
            if (users.isEmpty()) {
                user = new User();
                user.setEmail("test-org-user@neuroforge.com");
                user.setFullName("Test Org User");
                user.setPassword("password");
                user.setRole(com.neuroforge.enums.Role.DEVELOPER);
                user.setOrganization(org);
                user.setEnabled(true);
                user = userRepository.save(user);
            } else {
                user = users.get(0);
                if (user.getOrganization() == null) {
                    user.setOrganization(org);
                    user = userRepository.save(user);
                }
            }

            System.out.println("Testing projectService with user: " + user.getEmail());
            var dtos = projectService.getProjectsByOrganization(user.getOrganization().getId(), user.getEmail());
            System.out.println("DTOs returned: " + dtos.size());
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

}
