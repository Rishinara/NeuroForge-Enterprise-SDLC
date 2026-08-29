package com.neuroforge.service;

import com.neuroforge.dto.auth.CreateUserRequest;
import com.neuroforge.dto.auth.UpdateRoleRequest;
import com.neuroforge.dto.auth.UpdateStatusRequest;
import com.neuroforge.dto.auth.UserResponse;
import com.neuroforge.enums.Role;
import com.neuroforge.entity.User;
import com.neuroforge.exception.DuplicateResourceException;
import com.neuroforge.exception.InvalidRequestException;
import com.neuroforge.exception.ResourceNotFoundException;
import com.neuroforge.entity.Organization;
import com.neuroforge.entity.*;
import com.neuroforge.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrganizationRepository organizationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final NotificationRepository notificationRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TeamRepository teamRepository;
    private final TaskRepository taskRepository;
    private final BugRepository bugRepository;
    private final TestCaseRepository testCaseRepository;
    private final ApprovalRepository approvalRepository;
    private final InviteRepository inviteRepository;

    public AdminService(UserRepository userRepository, PasswordEncoder passwordEncoder, OrganizationRepository organizationRepository,
                        RefreshTokenRepository refreshTokenRepository, PasswordResetTokenRepository passwordResetTokenRepository,
                        OtpTokenRepository otpTokenRepository, NotificationRepository notificationRepository,
                        ProjectMemberRepository projectMemberRepository, TeamRepository teamRepository,
                        TaskRepository taskRepository, BugRepository bugRepository, TestCaseRepository testCaseRepository,
                        ApprovalRepository approvalRepository, InviteRepository inviteRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.organizationRepository = organizationRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.otpTokenRepository = otpTokenRepository;
        this.notificationRepository = notificationRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.teamRepository = teamRepository;
        this.taskRepository = taskRepository;
        this.bugRepository = bugRepository;
        this.testCaseRepository = testCaseRepository;
        this.approvalRepository = approvalRepository;
        this.inviteRepository = inviteRepository;
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new DuplicateResourceException("Phone number already exists");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setCreatedAt(LocalDateTime.now());
        user.setPhoneNumber(request.getPhoneNumber());

        if (request.getOrganizationId() != null) {
            Organization org = organizationRepository.findById(request.getOrganizationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
            user.setOrganization(org);
            user.setOrgApproved(false); // Assigned by Super Admin, needs Org Admin approval
        } else {
            user.setOrgApproved(true);
        }

        return toUserResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return toUserResponse(findUserOrThrow(id));
    }

    @Transactional
    public UserResponse updateUserRole(Long id, UpdateRoleRequest request) {
        User user = findUserOrThrow(id);
        user.setRole(request.getRole());
        return toUserResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUserStatus(Long id, UpdateStatusRequest request) {
        User user = findUserOrThrow(id);
        if (user.getRole() == Role.SUPER_ADMIN && !request.isEnabled()) {
            throw new InvalidRequestException("SUPER_ADMIN user cannot be disabled.");
        }
        user.setEnabled(request.isEnabled());
        return toUserResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = findUserOrThrow(id);
        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new InvalidRequestException("Super Admin cannot be deleted.");
        }

        // Clean up tokens
        refreshTokenRepository.deleteByUserId(id);
        passwordResetTokenRepository.deleteByUserId(id);
        otpTokenRepository.deleteByEmail(user.getEmail());

        // Clean up notifications
        notificationRepository.deleteByUserId(id);

        // Remove from projects
        projectMemberRepository.deleteByUserId(id);

        // Clear team memberships & team lead
        user.getTeams().clear();
        List<Team> ledTeams = teamRepository.findByLeadId(id);
        for (Team team : ledTeams) {
            team.setLead(null);
            teamRepository.save(team);
        }

        // Unassign tasks & remove as reporter
        List<Task> assignedTasks = taskRepository.findByAssigneeId(id);
        for (Task task : assignedTasks) {
            task.setAssignee(null);
            taskRepository.save(task);
        }
        List<Task> reportedTasks = taskRepository.findByReporterId(id);
        for (Task task : reportedTasks) {
            task.setReporter(null);
            taskRepository.save(task);
        }

        // Unassign bugs & remove as reporter
        List<Bug> assignedBugs = bugRepository.findByAssigneeId(id);
        for (Bug bug : assignedBugs) {
            bug.setAssignee(null);
            bugRepository.save(bug);
        }
        List<Bug> reportedBugs = bugRepository.findByReporterId(id);
        for (Bug bug : reportedBugs) {
            bug.setReporter(null);
            bugRepository.save(bug);
        }

        // Unassign test cases
        List<TestCase> assignedTestCases = testCaseRepository.findByAssignedTesterId(id);
        for (TestCase testCase : assignedTestCases) {
            testCase.setAssignedTester(null);
            testCaseRepository.save(testCase);
        }

        // Unassign approvals
        List<Approval> approvals = approvalRepository.findByClientIdOrRequestedById(id, id);
        for (Approval approval : approvals) {
            if (approval.getClient() != null && approval.getClient().getId().equals(id)) {
                approval.setClient(null);
            }
            if (approval.getRequestedBy() != null && approval.getRequestedBy().getId().equals(id)) {
                approval.setRequestedBy(null);
            }
            approvalRepository.save(approval);
        }

        // Clear invites for email
        List<com.neuroforge.entity.Invite> invites = inviteRepository.findByEmailIgnoreCaseAndOrganizationId(user.getEmail(), 
                user.getOrganization() != null ? user.getOrganization().getId() : null);
        if (invites != null && !invites.isEmpty()) {
            inviteRepository.deleteAll(invites);
        }

        user.setOrganization(null);
        user.setRequestedOrganization(null);

        userRepository.delete(user);
    }

    // ---- helpers ----

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserResponse toUserResponse(User user) {
        Long orgId = user.getOrganization() != null ? user.getOrganization().getId() : null;
        String orgName = user.getOrganization() != null ? user.getOrganization().getName() : null;
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt(),
                user.isEnabled(),
                user.getPhoneNumber(),
                orgId,
                orgName,
                user.getOrgApproved()
        );
    }
}
