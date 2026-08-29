package com.neuroforge.repository;

import com.neuroforge.entity.Invite;
import com.neuroforge.enums.InviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InviteRepository extends JpaRepository<Invite, Long> {
    Optional<Invite> findByToken(String token);
    Optional<Invite> findByEmailAndOrganizationIdAndStatus(
            String email,
            Long organizationId,
            InviteStatus status
    );
    Optional<Invite> findByEmailIgnoreCaseAndOrganizationIdAndStatus(
            String email,
            Long organizationId,
            InviteStatus status
    );
    List<Invite> findByEmailIgnoreCaseAndOrganizationId(
            String email,
            Long organizationId
    );
    List<Invite> findByOrganizationId(Long organizationId);
}

