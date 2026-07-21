package com.neuroforge.backend.controller;

import com.neuroforge.backend.dto.LoginRequest;
import com.neuroforge.backend.dto.RegisterRequest;
import com.neuroforge.backend.entity.User;
import com.neuroforge.backend.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final com.neuroforge.backend.service.InviteService inviteService;

    public AuthController(UserService userService, com.neuroforge.backend.service.InviteService inviteService) {
        this.userService = userService;
        this.inviteService = inviteService;
    }

    @PostMapping("/register")
    public User register(@RequestBody RegisterRequest request) {
        return userService.registerUser(request);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        return userService.loginUser(request);
    }

    @PostMapping("/accept-invite")
    public User acceptInvite(@RequestBody com.neuroforge.backend.dto.AcceptInviteRequest request) {
        return inviteService.acceptInvite(request.getToken(), request.getPassword(), request.getFullName());
    }
}