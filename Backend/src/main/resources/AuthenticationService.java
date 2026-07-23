package com.neuroforge.service;

import com.neuroforge.dto.request.ForgotPasswordRequest;
import com.neuroforge.dto.request.ResetPasswordRequest;
import com.neuroforge.dto.request.SignInRequest;
import com.neuroforge.dto.request.SignUpRequest;
import com.neuroforge.dto.response.JwtAuthenticationResponse;

public interface AuthenticationService {
    JwtAuthenticationResponse signup(SignUpRequest request);
    JwtAuthenticationResponse signin(SignInRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}