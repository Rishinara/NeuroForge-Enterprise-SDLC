package com.neuroforge.backend.service;

import com.neuroforge.backend.entity.Milestone;
import com.neuroforge.backend.entity.Project;
import com.neuroforge.backend.entity.ProjectHealthSnapshot;
import com.neuroforge.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class ProjectServiceTest {

    private ProjectRepository projectRepository;
    private MilestoneRepository milestoneRepository;
    private ProjectHealthSnapshotRepository snapshotRepository;
    private OrganizationRepository organizationRepository;
    private TeamRepository teamRepository;
    private UserRepository userRepository;

    private ProjectService projectService;

    @BeforeEach
    void setUp() {
        projectRepository = mock(ProjectRepository.class);
        milestoneRepository = mock(MilestoneRepository.class);
        snapshotRepository = mock(ProjectHealthSnapshotRepository.class);
        organizationRepository = mock(OrganizationRepository.class);
        teamRepository = mock(TeamRepository.class);
        userRepository = mock(UserRepository.class);

        projectService = new ProjectService(
                projectRepository,
                milestoneRepository,
                snapshotRepository,
                organizationRepository,
                teamRepository,
                userRepository
        );
    }

    @Test
    void testRecalculateProjectHealth_ZeroMilestones() {
        Project project = new Project();
        project.setStartDate(LocalDate.now().minusDays(5));
        project.setEndDate(LocalDate.now().plusDays(5));
        project.setMilestones(new ArrayList<>());

        projectService.recalculateProjectHealth(project);

        assertEquals("ON_TRACK", project.getHealthStatus());
        verify(projectRepository, times(1)).save(project);
        verify(snapshotRepository, times(1)).save(any(ProjectHealthSnapshot.class));
    }

    @Test
    void testRecalculateProjectHealth_OnTrack() {
        // Project duration: 20 days. Start: 10 days ago, End: 10 days from now. (50% elapsed)
        Project project = new Project();
        project.setStartDate(LocalDate.now().minusDays(10));
        project.setEndDate(LocalDate.now().plusDays(10));

        // Milestones: 2 total, 1 completed (50% completed)
        List<Milestone> milestones = new ArrayList<>();
        milestones.add(new Milestone("M1", LocalDate.now(), project));
        milestones.get(0).setCompleted(true);
        milestones.add(new Milestone("M2", LocalDate.now().plusDays(5), project));
        milestones.get(1).setCompleted(false);

        project.setMilestones(milestones);

        projectService.recalculateProjectHealth(project);

        // Progress (50%) >= Elapsed (50%) -> ON_TRACK
        assertEquals("ON_TRACK", project.getHealthStatus());
        verify(projectRepository, times(1)).save(project);

        ArgumentCaptor<ProjectHealthSnapshot> captor = ArgumentCaptor.forClass(ProjectHealthSnapshot.class);
        verify(snapshotRepository, times(1)).save(captor.capture());
        assertEquals(50.0, captor.getValue().getTasksDonePercentage());
        assertEquals(50.0, captor.getValue().getTimelineElapsedPercentage());
        assertEquals("ON_TRACK", captor.getValue().getHealthStatus());
    }

    @Test
    void testRecalculateProjectHealth_AtRisk() {
        // Project duration: 10 days. Start: 6 days ago, End: 4 days from now. (60% elapsed)
        Project project = new Project();
        project.setStartDate(LocalDate.now().minusDays(6));
        project.setEndDate(LocalDate.now().plusDays(4));

        // Milestones: 2 total, 1 completed (50% completed)
        // Progress (50%) is behind Elapsed (60%), but within 15% margin -> AT_RISK
        List<Milestone> milestones = new ArrayList<>();
        milestones.add(new Milestone("M1", LocalDate.now(), project));
        milestones.get(0).setCompleted(true);
        milestones.add(new Milestone("M2", LocalDate.now().plusDays(2), project));
        milestones.get(1).setCompleted(false);

        project.setMilestones(milestones);

        projectService.recalculateProjectHealth(project);

        assertEquals("AT_RISK", project.getHealthStatus());
        verify(projectRepository, times(1)).save(project);
    }

    @Test
    void testRecalculateProjectHealth_Delayed() {
        // Project duration: 10 days. Start: 8 days ago, End: 2 days from now. (80% elapsed)
        Project project = new Project();
        project.setStartDate(LocalDate.now().minusDays(8));
        project.setEndDate(LocalDate.now().plusDays(2));

        // Milestones: 2 total, 1 completed (50% completed)
        // Progress (50%) is behind Elapsed (80%) by 30% (> 15% margin) -> DELAYED
        List<Milestone> milestones = new ArrayList<>();
        milestones.add(new Milestone("M1", LocalDate.now(), project));
        milestones.get(0).setCompleted(true);
        milestones.add(new Milestone("M2", LocalDate.now().plusDays(1), project));
        milestones.get(1).setCompleted(false);

        project.setMilestones(milestones);

        projectService.recalculateProjectHealth(project);

        assertEquals("DELAYED", project.getHealthStatus());
        verify(projectRepository, times(1)).save(project);
    }
}
