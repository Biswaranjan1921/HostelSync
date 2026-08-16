package com.smarthostel.hostel.student;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

import com.google.zxing.EncodeHintType;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import java.util.HashMap;
import java.util.Map;

@Service
public class QrService {

	private static final int SIZE = 500;

	public String generateQrBase64(String payload) {
		try {
			QRCodeWriter writer = new QRCodeWriter();
			Map<EncodeHintType, Object> hints = new HashMap<>();
			hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
			hints.put(EncodeHintType.MARGIN, 2);
			hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");

			BitMatrix matrix = writer.encode(payload, BarcodeFormat.QR_CODE, SIZE, SIZE, hints);
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			MatrixToImageWriter.writeToStream(matrix, "PNG", out);
			return Base64.getEncoder().encodeToString(out.toByteArray());
		} catch (Exception e) {
			throw new RuntimeException("Failed to generate QR code", e);
		}
	}

	public String extractTokenFromPayload(String qrPayload) {
		if (qrPayload == null) return null;
		return qrPayload.trim();
	}
}
