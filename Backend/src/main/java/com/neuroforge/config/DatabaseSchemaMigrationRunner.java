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
            
            log.info("PostgreSQL bugs status check constraint updated successfully.");
        } catch (Exception e) {
            log.warn("Database schema migration notice: {}", e.getMessage());
        }
    }
}
