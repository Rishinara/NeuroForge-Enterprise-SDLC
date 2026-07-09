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

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public User register(@RequestBody RegisterRequest request) {
        return userService.registerUser(request);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        return userService.loginUser(request);
    }
}