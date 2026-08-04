package com.neuroforge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication(scanBasePackages = "com.neuroforge")
@EnableJpaRepositories(basePackages = "com.neuroforge")
@EntityScan(basePackages = "com.neuroforge")
public class NeuroforgeBackendApplication {

	public static void main(String[] args) {

		SpringApplication.run(NeuroforgeBackendApplication.class, args);
		BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
		System.out.println(encoder.encode("Admin@123"));

	}

}
