package com.maiecouture.store.payment;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/payments/cybersource/evidence")
@ConditionalOnProperty(name = "CYBERSOURCE_EVIDENCE_ENABLED", havingValue = "true")
public class AdminCyberSourceEvidenceController {
    private final CyberSourceEvidenceStore store;

    public AdminCyberSourceEvidenceController(CyberSourceEvidenceStore store) {
        this.store = store;
    }

    @GetMapping(value = "/{reference}", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> export(@PathVariable String reference) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(store.export(reference));
    }
}
