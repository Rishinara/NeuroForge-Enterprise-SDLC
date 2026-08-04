package com.neuroforge.controller;

import com.neuroforge.dto.testcase.TestCaseRequest;
import com.neuroforge.dto.testcase.TestCaseResponse;
import com.neuroforge.service.TestCaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/test-cases")
@RequiredArgsConstructor
public class TestCaseController {

    private final TestCaseService testCaseService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public TestCaseResponse createTestCase(
            @PathVariable Long projectId,
            @Valid @RequestBody TestCaseRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
            
        request.setProjectId(projectId);
        return testCaseService.createTestCase(request, userDetails.getUsername());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'QA_TESTER', 'SUPER_ADMIN', 'CLIENT', 'ORG_ADMIN')")
    public List<TestCaseResponse> getTestCases(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return testCaseService.getTestCasesByProject(projectId, userDetails.getUsername());
    }

    @PutMapping("/{testCaseId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'QA_TESTER', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public TestCaseResponse updateTestCase(
            @PathVariable Long projectId,
            @PathVariable Long testCaseId,
            @Valid @RequestBody TestCaseRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        request.setProjectId(projectId);
        return testCaseService.updateTestCase(testCaseId, request, userDetails.getUsername());
    }

    @DeleteMapping("/{testCaseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public void deleteTestCase(
            @PathVariable Long projectId,
            @PathVariable Long testCaseId,
            @AuthenticationPrincipal UserDetails userDetails) {

        testCaseService.deleteTestCase(testCaseId, userDetails.getUsername());
    }
}
