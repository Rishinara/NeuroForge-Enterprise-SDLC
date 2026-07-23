package com.neuroforge.backend.repository;

import com.neuroforge.backend.entity.Invite;
import com.neuroforge.backend.entity.InviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InviteRepository extends JpaRepository<Invite, Long> {
    Optional<Invite> findByToken(String token);
    Optional<Invite> findByEmailAndOrganizationIdAndStatus(
            String email,
            Long organizationId,
            InviteStatus status
    );
}
