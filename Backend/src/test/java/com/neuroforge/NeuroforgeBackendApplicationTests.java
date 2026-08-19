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

	@Test
	void contextLoads() {
	}

    @Test
    void testGetProjects() {
        try {
            System.out.println("TESTING findByOrganizationIdOrderByCreatedAtDesc(1L)...");
            var projects = projectRepository.findByOrganizationIdOrderByCreatedAtDesc(1L);
            System.out.println("Found " + projects.size() + " projects.");
            for (var p : projects) {
                System.out.println("Project: " + p.getName() + ", TechStack: " + p.getTechStack() + ", Members: " + p.getMembers().size());
            }

            var users = userRepository.findAll();
            if (!users.isEmpty()) {
                User user = users.get(0);
                System.out.println("Testing projectService with user: " + user.getEmail());
                var dtos = projectService.getProjectsByOrganization(1L, user.getEmail());
                System.out.println("DTOs returned: " + dtos.size());
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

}
