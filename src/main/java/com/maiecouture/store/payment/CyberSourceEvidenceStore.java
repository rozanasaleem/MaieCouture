package com.maiecouture.store.payment;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Opt-in, short-lived evidence for bank review; never records card data or signing headers. */
@Component
public class CyberSourceEvidenceStore {
    private static final Duration RETENTION = Duration.ofMinutes(20);
    private final boolean enabled;
    private final Clock clock;
    private Evidence latest;
    private String completionJwt;

    @org.springframework.beans.factory.annotation.Autowired
    public CyberSourceEvidenceStore(@Value("${CYBERSOURCE_EVIDENCE_ENABLED:false}") boolean enabled) {
        this(enabled, Clock.systemUTC());
    }

    CyberSourceEvidenceStore(boolean enabled, Clock clock) {
        this.enabled = enabled;
        this.clock = clock;
    }

    public synchronized void record(Long orderId, String reference, String endpoint,
                                    String request, int status, String response) {
        if (enabled) {
            latest = new Evidence(orderId, reference, endpoint, clock.instant(), request, status, response);
            completionJwt = null;
        }
    }

    public synchronized void recordCompletion(String reference, String verifiedJwt) {
        if (enabled && latest != null && latest.reference().equals(reference)
                && clock.instant().isBefore(latest.createdAt().plus(RETENTION))) completionJwt = verifiedJwt;
    }

    public synchronized String export(String reference) {
        if (latest != null && !clock.instant().isBefore(latest.createdAt().plus(RETENTION))) {
            latest = null;
            completionJwt = null;
        }
        if (!enabled || latest == null || !latest.reference().equals(reference)) {
            throw new com.maiecouture.store.common.ResourceNotFoundException("Capture Context evidence is unavailable or expired");
        }
        return "Maie Couture - Capture Context HTTP exchange\n"
                + "Captured at (UTC): " + latest.createdAt() + "\n"
                + "Order ID: " + latest.orderId() + "\n"
                + "Payment reference: " + latest.reference() + "\n"
                + "Endpoint: POST " + latest.endpoint() + "\n"
                + "Authentication headers and API credentials are excluded.\n"
                + "This exchange alone does not establish successful payment.\n\n"
                + "REQUEST BODY (as sent)\n" + latest.request() + "\n\n"
                + "RESPONSE HTTP STATUS: " + latest.status() + "\n"
                + "RESPONSE BODY (as received)\n" + latest.response() + "\n"
                + (completionJwt == null ? "" : "\nSIGNED CHECKOUT RESULT (signature and session binding verified)\n" + completionJwt + "\n");
    }

    private record Evidence(Long orderId, String reference, String endpoint, Instant createdAt,
                            String request, int status, String response) {}
}
