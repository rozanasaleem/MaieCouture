package com.maiecouture.store.customrequest;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/custom-requests")
public class PublicCustomRequestController {

    private final CustomRequestService customRequestService;

    public PublicCustomRequestController(CustomRequestService customRequestService) {
        this.customRequestService = customRequestService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomRequestResponse create(@Valid @RequestBody CustomRequestRequest request) {
        return customRequestService.createRequest(request);
    }
}
