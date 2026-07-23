package com.neuroforge.service;

public interface EmailService {
    void sendPasswordResetEmail(String to, String token);
}