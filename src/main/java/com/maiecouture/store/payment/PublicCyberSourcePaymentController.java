package com.maiecouture.store.payment;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public/payments/cybersource")
public class PublicCyberSourcePaymentController {

    private final CyberSourcePaymentService cyberSourcePaymentService;

    public PublicCyberSourcePaymentController(CyberSourcePaymentService cyberSourcePaymentService) {
        this.cyberSourcePaymentService = cyberSourcePaymentService;
    }

    @PostMapping("/initialize")
    public CyberSourceInitializeResponse initialize(@Valid @RequestBody CyberSourceInitializeRequest request) {
        return cyberSourcePaymentService.initialize(request);
    }

    @PostMapping("/complete")
    public CyberSourceCompleteResponse complete(@Valid @RequestBody CyberSourceCompleteRequest request) {
        return cyberSourcePaymentService.complete(request);
    }

    @org.springframework.web.bind.annotation.GetMapping("/status")
    public CyberSourceCompleteResponse status(@org.springframework.web.bind.annotation.RequestParam String reference) {
        return cyberSourcePaymentService.status(reference);
    }
}
