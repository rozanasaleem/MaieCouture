package com.maiecouture.store.payment;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/payments/lahza")
public class PublicLahzaPaymentController {

    private final LahzaPaymentService lahzaPaymentService;

    public PublicLahzaPaymentController(LahzaPaymentService lahzaPaymentService) {
        this.lahzaPaymentService = lahzaPaymentService;
    }

    @PostMapping("/initialize")
    public LahzaInitializeResponse initialize(@Valid @RequestBody LahzaInitializeRequest request) {
        return lahzaPaymentService.initialize(request);
    }

    @PostMapping("/callback")
    public LahzaVerificationResponse callback(@RequestBody LahzaCallbackRequest request) {
        return lahzaPaymentService.handleCallback(request);
    }

    @GetMapping("/callback")
    public LahzaVerificationResponse callbackRedirect(
            @RequestParam String reference,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String transactionId
    ) {
        return lahzaPaymentService.handleCallback(new LahzaCallbackRequest(reference, status, transactionId));
    }

    @GetMapping("/verify")
    public LahzaVerificationResponse verify(@RequestParam String reference) {
        return lahzaPaymentService.verifyByReference(reference);
    }
}
