package com.neuroforge.controller;

import com.neuroforge.dto.auth.*;
import com.neuroforge.service.UserService;
import com.neuroforge.service.RefreshTokenService;
import com.neuroforge.security.JwtService;
import com.neuroforge.entity.RefreshToken;
import com.neuroforge.service.AuthenticationService;
import com.neuroforge.exception.TokenRefreshException;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
public class AuthController {

    private final UserService userService;
    private final AuthenticationService authenticationService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    public AuthController(UserService userService, 
                          AuthenticationService authenticationService,
                          RefreshTokenService refreshTokenService, 
                          JwtService jwtService) {
        this.userService = userService;
        this.authenticationService = authenticationService;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
    }

    // ---- V2 API Endpoints ----

    @PostMapping("/api/auth/signup")
    public AuthResponse signupV2(@Valid @RequestBody SignupRequest request) {
        return userService.signup(request);
    }

    @PostMapping("/api/auth/login")
    public AuthResponse loginV2(@Valid @RequestBody LoginRequest request) {
        return userService.login(request);
    }

    @GetMapping("/api/auth/me")
    public AuthResponse.UserPayload me(@AuthenticationPrincipal UserDetails userDetails) {
        return userService.getMe(userDetails.getUsername());
    }

    @PostMapping("/api/auth/forgot-password")
    public void forgotPasswordV2(@Valid @RequestBody ForgotPasswordRequest request) {
        userService.forgotPassword(request);
    }

    @PostMapping("/api/auth/reset-password")
    public void resetPasswordV2(@Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request);
    }

    @PostMapping("/api/auth/refresh")
    public AuthResponse refreshTokenV2(@RequestBody java.util.Map<String, String> body) {
        return userService.refreshTokenV2(body);
    }


    // ── V1 API Endpoints (DEPRECATED – use V2 /api/auth/* instead) ──

    /**
     * @deprecated Use {@link #signupV2(SignupRequest)} at {@code POST /api/auth/signup} instead.
     * Scheduled for removal in the next major release.
     */
    @Deprecated(since = "2.0", forRemoval = true)
    @PostMapping("/api/v1/auth/signup")
    public JwtAuthenticationResponse signupV1(@Valid @RequestBody SignupRequest request) {
        return authenticationService.signup(request);
    }

    /**
     * @deprecated Use {@link #loginV2(LoginRequest)} at {@code POST /api/auth/login} instead.
     * Scheduled for removal in the next major release.
     */
    @Deprecated(since = "2.0", forRemoval = true)
    @PostMapping("/api/v1/auth/signin")
    public JwtAuthenticationResponse signinV1(@Valid @RequestBody SignInRequest request) {
        return authenticationService.signin(request);
    }

    /**
     * @deprecated Use {@code POST /api/auth/forgot-password} instead.
     * Scheduled for removal in the next major release.
     */
    @Deprecated(since = "2.0", forRemoval = true)
    @PostMapping("/api/v1/auth/forgot-password")
    public void forgotPasswordV1(@Valid @RequestBody ForgotPasswordRequest request) {
        authenticationService.forgotPassword(request);
    }

    /**
     * @deprecated Use {@code POST /api/auth/reset-password} instead.
     * Scheduled for removal in the next major release.
     */
    @Deprecated(since = "2.0", forRemoval = true)
    @PostMapping("/api/v1/auth/reset-password")
    public void resetPasswordV1(@Valid @RequestBody ResetPasswordRequest request) {
        authenticationService.resetPassword(request);
    }

    /**
     * @deprecated Token refresh via V1 is deprecated. The V2 auth flow uses
     * long-lived tokens with re-authentication on expiry.
     * Scheduled for removal in the next major release.
     */
    @Deprecated(since = "2.0", forRemoval = true)
    @PostMapping("/api/v1/auth/refresh")
    public ResponseEntity<JwtAuthenticationResponse> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        return refreshTokenService.findByToken(request.getRefreshToken())
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String accessToken = jwtService.generateToken(user);
                    return ResponseEntity.ok(new JwtAuthenticationResponse(accessToken, request.getRefreshToken()));
                })
                .orElseThrow(() -> new TokenRefreshException(request.getRefreshToken(), "Refresh token not in database!"));
    }
}