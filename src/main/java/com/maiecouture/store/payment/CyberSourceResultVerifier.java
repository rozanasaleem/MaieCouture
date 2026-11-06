package com.maiecouture.store.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maiecouture.store.config.CyberSourceProperties;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
import java.util.Date;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class CyberSourceResultVerifier {
    private final RestClient client;
    private final ObjectMapper mapper;

    @org.springframework.beans.factory.annotation.Autowired
    public CyberSourceResultVerifier(CyberSourceProperties properties, ObjectMapper mapper) {
        this(RestClient.builder().baseUrl(properties.baseUrl() == null || properties.baseUrl().isBlank()
                ? "https://apitest.cybersource.com" : properties.baseUrl()).build(), mapper);
    }

    CyberSourceResultVerifier(RestClient client, ObjectMapper mapper) {
        this.client = client;
        this.mapper = mapper;
    }

    public JsonNode verify(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            String kid = jwt.getHeader().getKeyID();
            if (!JWSAlgorithm.RS256.equals(jwt.getHeader().getAlgorithm())
                    || kid == null || !kid.matches("[A-Za-z0-9_-]{1,128}")) {
                throw new IllegalArgumentException("Invalid CyberSource token signing header");
            }
            // Keys come only from the configured provider, never a URL supplied in the token.
            String body = client.get().uri("/flex/v2/public-keys/{kid}", kid).retrieve().body(String.class);
            RSAKey key = RSAKey.parse(body);
            if (!jwt.verify(new RSASSAVerifier(key.toRSAPublicKey()))) {
                throw new IllegalArgumentException("Invalid CyberSource payment signature");
            }
            var claims = jwt.getJWTClaimsSet();
            Date expiry = claims.getExpirationTime();
            Date notBefore = claims.getNotBeforeTime();
            Date issuedAt = claims.getIssueTime();
            JsonNode payload = mapper.readTree(jwt.getPayload().toString());
            Instant now = Instant.now();
            Instant submittedAt = issuedAt == null
                    ? (expiry == null ? Instant.parse(payload.path("details").path("submitTimeUtc").asText()) : now)
                    : issuedAt.toInstant();
            if ((expiry != null && !expiry.toInstant().isAfter(now))
                    || (expiry == null && submittedAt.isBefore(now.minusSeconds(900)))
                    || submittedAt.isAfter(now.plusSeconds(30))
                    || (notBefore != null && notBefore.toInstant().isAfter(now.plusSeconds(30)))) {
                throw new IllegalArgumentException("Expired or inactive CyberSource payment result");
            }
            return payload;
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalArgumentException("Unable to verify CyberSource payment result", exception);
        }
    }
}
