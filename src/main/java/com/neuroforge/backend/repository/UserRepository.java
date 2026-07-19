package com.neuroforge.backend.repository;

import com.neuroforge.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u JOIN u.teams t WHERE t.id = :teamId")
    java.util.List<User> findByTeamId(@org.springframework.data.repository.query.Param("teamId") Long teamId);
}