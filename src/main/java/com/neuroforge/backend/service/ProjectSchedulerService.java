package com.neuroforge.backend.service;

import com.neuroforge.backend.entity.Project;
import com.neuroforge.backend.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@EnableScheduling
public class ProjectSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(ProjectSchedulerService.class);

    private final ProjectRepository projectRepository;
    private final ProjectService projectService;

    public ProjectSchedulerService(ProjectRepository projectRepository, ProjectService projectService) {
        this.projectRepository = projectRepository;
        this.projectService = projectService;
    }

    // Runs every night at midnight (Cron: second, minute, hour, day of month, month, day of week)
    @Scheduled(cron = "0 0 0 * * ?")
    public void runNightlyProjectHealthRecalculation() {
        logger.info("Starting nightly project health recalculation job...");
        try {
            List<Project> projects = projectRepository.findAll();
            for (Project project : projects) {
                logger.info("Recalculating health status for project: {} (ID: {})", project.getName(), project.getId());
                projectService.recalculateProjectHealth(project);
            }
            logger.info("Nightly project health recalculation completed successfully for {} projects.", projects.size());
        } catch (Exception e) {
            logger.error("Error occurred during nightly project health recalculation job: ", e);
        }
    }
}
