package com.smarthostel.hostel.student;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class QrServiceTest {

    private QrService qrService;

    @BeforeEach
    void setUp() {
        qrService = new QrService();
    }

    @Test
    void testGenerateQrBase64_Success() {
        String payload = "STU-8823";
        String base64Qr = qrService.generateQrBase64(payload);
        assertNotNull(base64Qr);
        assertTrue(base64Qr.length() > 100);
    }

    @Test
    void testExtractTokenFromPayload_TrimsWhitespace() {
        assertEquals("STU-8823", qrService.extractTokenFromPayload("  STU-8823  "));
        assertNull(qrService.extractTokenFromPayload(null));
    }
}
