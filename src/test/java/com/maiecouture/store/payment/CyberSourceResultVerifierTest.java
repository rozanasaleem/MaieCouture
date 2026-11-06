package com.maiecouture.store.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.*;
import java.time.Instant;
import java.util.Date;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class CyberSourceResultVerifierTest {
    private RSAKey key;
    private MockRestServiceServer server;
    private CyberSourceResultVerifier verifier;

    @BeforeEach void setup() throws Exception {
        key = new RSAKeyGenerator(2048).keyID("test-key").generate();
        var builder = RestClient.builder().baseUrl("https://apitest.cybersource.com");
        server = MockRestServiceServer.bindTo(builder).build();
        verifier = new CyberSourceResultVerifier(builder.build(), new ObjectMapper());
    }

    private String token(RSAKey signingKey, Instant expiry) throws Exception {
        var claims = new JWTClaimsSet.Builder().issueTime(new Date()).expirationTime(Date.from(expiry)).claim("status", "COMPLETED").build();
        var jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID("test-key").build(), claims);
        jwt.sign(new RSASSASigner(signingKey));
        return jwt.serialize();
    }

    private void providerKey() {
        server.expect(requestTo("https://apitest.cybersource.com/flex/v2/public-keys/test-key"))
                .andRespond(withSuccess(key.toPublicJWK().toJSONString(), MediaType.APPLICATION_JSON));
    }

    @Test void acceptsValidProviderSignature() throws Exception {
        providerKey();
        assertEquals("COMPLETED", verifier.verify(token(key, Instant.now().plusSeconds(60))).path("status").asText());
        server.verify();
    }

    @Test void rejectsForgedSignature() throws Exception {
        providerKey();
        var attacker = new RSAKeyGenerator(2048).generate();
        assertThrows(IllegalArgumentException.class, () -> verifier.verify(token(attacker, Instant.now().plusSeconds(60))));
    }

    @Test void rejectsExpiredResult() throws Exception {
        providerKey();
        assertThrows(IllegalArgumentException.class, () -> verifier.verify(token(key, Instant.now().minusSeconds(60))));
    }

    @Test void rejectsUnsignedToken() {
        String unsigned = new PlainJWT(new JWTClaimsSet.Builder().claim("status", "COMPLETED").build()).serialize();
        assertThrows(IllegalArgumentException.class, () -> verifier.verify(unsigned));
        server.verify();
    }

    @Test void acceptsFreshSignedResultWithoutExpiry() throws Exception {
        providerKey();
        var jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID("test-key").build(),
                new JWTClaimsSet.Builder().issueTime(new Date()).build());
        jwt.sign(new RSASSASigner(key));
        assertNotNull(verifier.verify(jwt.serialize()));
    }

    @Test void rejectsStaleSignedResultWithoutExpiry() throws Exception {
        providerKey();
        var jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID("test-key").build(),
                new JWTClaimsSet.Builder().issueTime(Date.from(Instant.now().minusSeconds(1800))).build());
        jwt.sign(new RSASSASigner(key));
        assertThrows(IllegalArgumentException.class, () -> verifier.verify(jwt.serialize()));
    }

    @Test void acceptsSignedProcessorTimestampWithoutJwtTimes() throws Exception {
        providerKey();
        var claims = new JWTClaimsSet.Builder().claim("details", java.util.Map.of("submitTimeUtc", Instant.now().toString())).build();
        var jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID("test-key").build(), claims);
        jwt.sign(new RSASSASigner(key));
        assertNotNull(verifier.verify(jwt.serialize()));
    }
}
