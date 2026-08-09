package com.neuroforge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication(scanBasePackages = "com.neuroforge")
@EnableJpaRepositories(basePackages = "com.neuroforge.repository")
@EnableMongoRepositories(basePackages = "com.neuroforge.repository.mongo")
@EntityScan(basePackages = "com.neuroforge.entity")
@EnableAsync
public class NeuroforgeBackendApplication {

	public static void main(String[] args) {

		SpringApplication.run(NeuroforgeBackendApplication.class, args);
		BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
		System.out.println(encoder.encode("Admin@123"));

	}

}
