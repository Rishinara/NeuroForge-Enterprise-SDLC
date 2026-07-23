package com.neuroforge.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage()));
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler({ResourceNotFoundException.class, TokenRefreshException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> handleCustomExceptions(RuntimeException ex, WebRequest request) {
        HttpStatus status = ex.getClass().isAnnotationPresent(org.springframework.web.bind.annotation.ResponseStatus.class)
                ? ex.getClass().getAnnotation(org.springframework.web.bind.annotation.ResponseStatus.class).value()
                : HttpStatus.BAD_REQUEST;

        ErrorResponse errorResponse = new ErrorResponse(LocalDateTime.now(), status.value(), status.getReasonPhrase(), ex.getMessage(), request.getDescription(false));
        return new ResponseEntity<>(errorResponse, status);
    }

    @Data
    @AllArgsConstructor
    private static class ErrorResponse {
        private LocalDateTime timestamp;
        private int status;
        private String error;
        private String message;
        private String path;
    }
}