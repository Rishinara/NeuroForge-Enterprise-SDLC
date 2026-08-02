package com.neuroforge.repository;

import com.neuroforge.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
    @EntityGraph(attributePaths = {"teams"})
    List<User> findByOrganizationId(Long orgId);

    List<User> findByTeamsId(Long teamId);

    @EntityGraph(attributePaths = "organization")
    User findUserById(Long id);
}