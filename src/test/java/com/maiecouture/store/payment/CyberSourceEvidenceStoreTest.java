package com.maiecouture.store.payment;

import static org.junit.jupiter.api.Assertions.*;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import com.maiecouture.store.common.ResourceNotFoundException;

class CyberSourceEvidenceStoreTest {
    private final Instant now = Instant.parse("2026-11-06T10:00:00Z");

    @Test void disabledStoreDoesNotRetainEvidence() {
        var store = new CyberSourceEvidenceStore(false, Clock.fixed(now, ZoneOffset.UTC));
        store.record(1L, "one", "https://apitest.cybersource.com/uc/v1/sessions", "request", 200, "response");
        assertThrows(ResourceNotFoundException.class, () -> store.export("one"));
    }

    @Test void onlyLatestReferenceCanBeExportedAndBodiesAreExact() {
        var store = new CyberSourceEvidenceStore(true, Clock.fixed(now, ZoneOffset.UTC));
        store.record(1L, "old", "endpoint", "old request", 200, "old response");
        store.record(2L, "new", "endpoint", "{\"exact\":true}", 201, "\"signed.jwt\"");
        assertThrows(ResourceNotFoundException.class, () -> store.export("old"));
        assertThrows(ResourceNotFoundException.class, () -> store.export("unknown"));
        String export = store.export("new");
        assertTrue(export.contains("REQUEST BODY (as sent)\n{\"exact\":true}\n"));
        assertTrue(export.contains("RESPONSE HTTP STATUS: 201\n"));
        assertTrue(export.endsWith("RESPONSE BODY (as received)\n\"signed.jwt\"\n"));
    }

    @Test void evidenceExpiresAtRetentionBoundary() {
        var clock = new java.util.concurrent.atomic.AtomicReference<>(now);
        Clock advancing = new Clock() {
            public java.time.ZoneId getZone() { return ZoneOffset.UTC; }
            public Clock withZone(java.time.ZoneId zone) { return this; }
            public Instant instant() { return clock.get(); }
        };
        var store = new CyberSourceEvidenceStore(true, advancing);
        store.record(1L, "one", "endpoint", "request", 200, "response");
        clock.set(now.plusSeconds(1200));
        assertThrows(ResourceNotFoundException.class, () -> store.export("one"));
    }
}
