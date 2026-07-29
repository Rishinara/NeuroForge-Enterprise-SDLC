package com.neuroforge.dto.auth;

import com.neuroforge.enums.Role;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class ProfileResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private com.neuroforge.enums.Role role;
    private String organizationName;
    private LocalDateTime createdAt;

}
