package com.neuroforge.exception;

//status code:409(CONFLICT-already existing)
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}