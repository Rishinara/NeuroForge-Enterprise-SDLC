package com.neuroforge.service;

import com.neuroforge.dto.testcase.TestCaseRequest;
import com.neuroforge.dto.testcase.TestCaseResponse;

import java.util.List;

public interface TestCaseService {
    TestCaseResponse createTestCase(TestCaseRequest request, String loggedInEmail);
    TestCaseResponse updateTestCase(Long testCaseId, TestCaseRequest request, String loggedInEmail);
    List<TestCaseResponse> getTestCasesByProject(Long projectId, String loggedInEmail);
    void deleteTestCase(Long testCaseId, String loggedInEmail);
}
