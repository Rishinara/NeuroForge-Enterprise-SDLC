package com.neuroforge.controller;

import com.neuroforge.dto.request.ForgotPasswordRequest;
import com.neuroforge.dto.request.ResetPasswordRequest;
import com.neuroforge.dto.request.SignInRequest;
import com.neuroforge.dto.request.SignUpRequest;
import com.neuroforge.dto.request.TokenRefreshRequest;
import com.neuroforge.dto.response.ApiResponse;
import com.neuroforge.dto.response.JwtAuthenticationResponse;
import com.neuroforge.model.RefreshToken;
import com.neuroforge.service.AuthenticationService;
import com.neuroforge.service.JwtService;
import com.neuroforge.service.RefreshTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    @PostMapping("/signup")
    public ResponseEntity<JwtAuthenticationResponse> signup(@Valid @RequestBody SignUpRequest request) {
        return ResponseEntity.ok(authenticationService.signup(request));
    }

    @PostMapping("/signin")
    public ResponseEntity<JwtAuthenticationResponse> signin(@Valid @RequestBody SignInRequest request) {
        return ResponseEntity.ok(authenticationService.signin(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<JwtAuthenticationResponse> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        return refreshTokenService.findByToken(request.getRefreshToken())
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String accessToken = jwtService.generateToken(user);
                    return ResponseEntity.ok(new JwtAuthenticationResponse(accessToken, request.getRefreshToken()));
                })
                .orElseThrow(() -> new com.neuroforge.exception.TokenRefreshException(request.getRefreshToken(), "Refresh token not in database!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authenticationService.forgotPassword(request);
        return ResponseEntity.ok(new ApiResponse(true, "If an account with that email exists, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authenticationService.resetPassword(request);
        return ResponseEntity.ok(new ApiResponse(true, "Password has been reset successfully."));
    }
}