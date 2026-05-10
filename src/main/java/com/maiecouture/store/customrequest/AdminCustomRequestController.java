package com.maiecouture.store.customrequest;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/custom-requests")
public class AdminCustomRequestController {

    private final CustomRequestService customRequestService;

    public AdminCustomRequestController(CustomRequestService customRequestService) {
        this.customRequestService = customRequestService;
    }

    @GetMapping
    public List<CustomRequestResponse> getRequests() {
        return customRequestService.getRequests();
    }

    @PatchMapping("/{id}/status")
    public CustomRequestResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody CustomRequestStatusUpdateRequest request
    ) {
        return customRequestService.updateStatus(id, request);
    }
}
