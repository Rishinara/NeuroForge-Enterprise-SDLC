package com.neuroforge.backend.exception;

//status code:400(BAD REQUEST)
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}