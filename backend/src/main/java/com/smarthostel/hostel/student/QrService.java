package com.smarthostel.hostel.student;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

@Service
public class QrService {

	private static final int SIZE = 200;

	public String generateQrBase64(String payload) {
		try {
			QRCodeWriter writer = new QRCodeWriter();
			BitMatrix matrix = writer.encode(payload, BarcodeFormat.QR_CODE, SIZE, SIZE);
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
