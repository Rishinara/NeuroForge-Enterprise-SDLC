package com.neuroforge.service.impl;

import com.neuroforge.dto.testcase.TestCaseRequest;
import com.neuroforge.dto.testcase.TestCaseResponse;
import com.neuroforge.entity.Project;
import com.neuroforge.entity.Sprint;
import com.neuroforge.entity.TestCase;
import com.neuroforge.entity.User;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.repository.ProjectRepository;
import com.neuroforge.repository.SprintRepository;
import com.neuroforge.repository.TestCaseRepository;
import com.neuroforge.repository.UserRepository;
import com.neuroforge.service.TestCaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TestCaseServiceImpl implements TestCaseService {

    private final TestCaseRepository testCaseRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;

    @Override
    @Transactional
    public TestCaseResponse createTestCase(TestCaseRequest request, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {
             throw new org.springframework.security.access.AccessDeniedException("User does not have access to this project");
        }
        
        if (user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
             throw new org.springframework.security.access.AccessDeniedException("QA Testers cannot create test cases, they can only execute them.");
        }

        Sprint sprint = null;
        if (request.getSprintId() != null) {
            sprint = sprintRepository.findSprintById(request.getSprintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));
        }

        User assignedTester = null;
        if (request.getAssignedTesterId() != null) {
            assignedTester = userRepository.findById(request.getAssignedTesterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned Tester not found"));
        }

        TestCase testCase = new TestCase();
        testCase.setTitle(request.getTitle());
        testCase.setDescription(request.getDescription());
        testCase.setExpectedResult(request.getExpectedResult());
        testCase.setStatus(request.getStatus());
        testCase.setNotes(request.getNotes());
        testCase.setProject(project);
        testCase.setSprint(sprint);
        testCase.setAssignedTester(assignedTester);

        TestCase savedTestCase = testCaseRepository.save(testCase);
        return mapToResponse(savedTestCase);
    }

    @Override
    @Transactional
    public TestCaseResponse updateTestCase(Long testCaseId, TestCaseRequest request, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase not found"));

        if (user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
            if (testCase.getAssignedTester() == null || !testCase.getAssignedTester().getId().equals(user.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("QA Testers can only update test cases assigned to them.");
            }
        }

        Sprint sprint = null;
        if (request.getSprintId() != null) {
            sprint = sprintRepository.findSprintById(request.getSprintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint not found"));
        }

        User assignedTester = null;
        if (request.getAssignedTesterId() != null) {
            assignedTester = userRepository.findById(request.getAssignedTesterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned Tester not found"));
        }

        // QA Tester can only update status and notes. PMs can update everything.
        if (user.getRole() != com.neuroforge.enums.Role.QA_TESTER) {
            testCase.setTitle(request.getTitle());
            testCase.setDescription(request.getDescription());
            testCase.setExpectedResult(request.getExpectedResult());
            testCase.setSprint(sprint);
            testCase.setAssignedTester(assignedTester);
        }
        
        testCase.setStatus(request.getStatus());
        testCase.setNotes(request.getNotes());

        TestCase savedTestCase = testCaseRepository.save(testCase);
        return mapToResponse(savedTestCase);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TestCaseResponse> getTestCasesByProject(Long projectId, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (user.getRole() != com.neuroforge.enums.Role.SUPER_ADMIN && (user.getOrganization() == null || !project.getOrganization().getId().equals(user.getOrganization().getId()))) {
             throw new org.springframework.security.access.AccessDeniedException("User does not have access to this project");
        }
        
        List<TestCase> testCases = testCaseRepository.findByProjectId(projectId);
        
        if (user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
            testCases = testCases.stream()
                .filter(t -> t.getAssignedTester() != null && t.getAssignedTester().getId().equals(user.getId()))
                .collect(Collectors.toList());
        }

        return testCases.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteTestCase(Long testCaseId, String loggedInEmail) {
        User user = userRepository.findByEmail(loggedInEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase not found"));

        if (user.getRole() == com.neuroforge.enums.Role.QA_TESTER) {
             throw new org.springframework.security.access.AccessDeniedException("QA Testers cannot delete test cases.");
        }

        testCaseRepository.delete(testCase);
    }

    private TestCaseResponse mapToResponse(TestCase testCase) {
        TestCaseResponse response = new TestCaseResponse();
        response.setId(testCase.getId());
        response.setTitle(testCase.getTitle());
        response.setDescription(testCase.getDescription());
        response.setExpectedResult(testCase.getExpectedResult());
        response.setStatus(testCase.getStatus());
        response.setNotes(testCase.getNotes());
        
        if (testCase.getProject() != null) {
            response.setProjectId(testCase.getProject().getId());
            response.setProjectName(testCase.getProject().getName());
        }
        
        if (testCase.getSprint() != null) {
            response.setSprintId(testCase.getSprint().getId());
            response.setSprintName(testCase.getSprint().getName());
        }
        
        if (testCase.getAssignedTester() != null) {
            response.setAssignedTesterId(testCase.getAssignedTester().getId());
            response.setAssignedTesterName(testCase.getAssignedTester().getFullName());
        }
        
        response.setCreatedAt(testCase.getCreatedAt());
        response.setUpdatedAt(testCase.getUpdatedAt());
        return response;
    }
}
