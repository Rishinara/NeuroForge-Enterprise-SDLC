package com.neuroforge.dto.organization;

import com.neuroforge.enums.InviteStatus;
import com.neuroforge.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InviteResponse {
    private Long id;
    private String email;
    private Role role;
    private InviteStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
