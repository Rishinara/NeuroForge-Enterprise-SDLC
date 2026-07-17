package com.neuroforge.backend.exception;

//status code:404 (NOT FOUND)
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}