package com.neuroforge.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSchemaMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            log.info("Updating PostgreSQL database schema check constraints for bugs table...");
            
            // Drop any old restrictive check constraints on bugs table status column
            jdbcTemplate.execute("ALTER TABLE bugs DROP CONSTRAINT IF EXISTS bugs_status_check;");
            jdbcTemplate.execute("ALTER TABLE bugs DROP CONSTRAINT IF EXISTS bug_status_check;");
            jdbcTemplate.execute("ALTER TABLE bugs DROP CONSTRAINT IF EXISTS bugs_status_check1;");
            jdbcTemplate.execute("ALTER TABLE bugs DROP CONSTRAINT IF EXISTS bugs_status_check2;");

            // Re-create constraint allowing all active workflow statuses
            jdbcTemplate.execute("ALTER TABLE bugs ADD CONSTRAINT bugs_status_check CHECK (status IN ('OPEN', 'IN_PROGRESS', 'READY_FOR_QA', 'RETESTING', 'RESOLVED', 'CLOSED', 'REOPENED'));");
            
            // Ensure org_specific_id column exists on organizations table
            jdbcTemplate.execute("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS org_specific_id VARCHAR(255);");
            jdbcTemplate.execute("UPDATE organizations SET org_specific_id = 'ORG-' || id WHERE org_specific_id IS NULL;");

            // Ensure project_id, project_name, and actor_role exist on activity_logs table
            jdbcTemplate.execute("ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS project_id BIGINT;");
            jdbcTemplate.execute("ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS actor_role VARCHAR(255);");

            // Ensure last_login_at column exists on users table
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;");

            // Milestones and Sprints automated completion migrations
            jdbcTemplate.execute("ALTER TABLE milestones DROP CONSTRAINT IF EXISTS milestones_status_check;");
            jdbcTemplate.execute("ALTER TABLE milestones DROP CONSTRAINT IF EXISTS milestone_status_check;");
            jdbcTemplate.execute("ALTER TABLE milestones ADD COLUMN IF NOT EXISTS total_sprints INT DEFAULT 1;");
            jdbcTemplate.execute("ALTER TABLE milestones ADD COLUMN IF NOT EXISTS completed_sprints INT DEFAULT 0;");
            jdbcTemplate.execute("UPDATE milestones SET total_sprints = 1 WHERE total_sprints IS NULL;");
            jdbcTemplate.execute("UPDATE milestones SET completed_sprints = 0 WHERE completed_sprints IS NULL;");

            jdbcTemplate.execute("ALTER TABLE sprints ADD COLUMN IF NOT EXISTS milestone_id BIGINT;");

            jdbcTemplate.execute("ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_health_check;");
            jdbcTemplate.execute("ALTER TABLE projects DROP CONSTRAINT IF EXISTS project_health_check;");

            log.info("PostgreSQL bugs, organizations, activity_logs, users, milestones, and sprints schema updated successfully.");
        } catch (Exception e) {
            log.warn("Database schema migration notice: {}", e.getMessage());
        }
    }
}
