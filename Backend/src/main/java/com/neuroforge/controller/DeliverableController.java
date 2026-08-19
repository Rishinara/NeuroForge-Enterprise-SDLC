package com.neuroforge.controller;

import com.neuroforge.dto.deliverable.ClientActionRequest;
import com.neuroforge.dto.deliverable.DeliverableRequest;
import com.neuroforge.dto.deliverable.DeliverableResponse;
import com.neuroforge.service.DeliverableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/deliverables")
@RequiredArgsConstructor
public class DeliverableController {

    private final DeliverableService deliverableService;



    @PutMapping("/{deliverableId}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public DeliverableResponse updateDeliverable(
            @PathVariable Long projectId,
            @PathVariable Long deliverableId,
            @Valid @RequestBody DeliverableRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return deliverableService.updateDeliverable(deliverableId, request, userDetails.getUsername());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'CLIENT', 'SUPER_ADMIN', 'ORG_ADMIN', 'QA_TESTER', 'DEVELOPER')")
    public List<DeliverableResponse> getDeliverables(@PathVariable Long projectId) {
        return deliverableService.getDeliverablesByProject(projectId);
    }

    @PostMapping("/{deliverableId}/submit")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public DeliverableResponse submitDeliverable(
            @PathVariable Long projectId,
            @PathVariable Long deliverableId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return deliverableService.submitDeliverable(deliverableId, userDetails.getUsername());
    }

    @PostMapping("/{deliverableId}/client-action")
    @PreAuthorize("hasAnyRole('CLIENT', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public DeliverableResponse processClientAction(
            @PathVariable Long projectId,
            @PathVariable Long deliverableId,
            @Valid @RequestBody ClientActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return deliverableService.processClientAction(deliverableId, request, userDetails.getUsername());
    }
}
