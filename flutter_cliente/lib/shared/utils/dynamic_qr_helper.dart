import 'dart:convert';
import 'package:crypto/crypto.dart';

class DynamicQrHelper {
  static const int ventanaSegundos = 20;

  /// Genera la carga útil dinámica que codifica el QR.
  /// Formato: DYN:{TicketCode}:{Ventana}:{Firma8}
  static String generarPayload({
    required String ticketCode,
    required String seedHex,
    int? customEpochSeconds,
  }) {
    if (seedHex.isEmpty) {
      return ticketCode;
    }

    try {
      final int nowSeconds = customEpochSeconds ?? (DateTime.now().millisecondsSinceEpoch ~/ 1000);
      final int window = nowSeconds ~/ ventanaSegundos;

      final List<int> keyBytes = _hexToBytes(seedHex);
      final hmac = Hmac(sha256, keyBytes);
      final payloadBytes = utf8.encode('$ticketCode:$window');
      final digest = hmac.convert(payloadBytes);
      final signature = digest.toString().substring(0, 8).toUpperCase();

      return 'DYN:$ticketCode:$window:$signature';
    } catch (_) {
      return ticketCode;
    }
  }

  /// Calcula el progreso de 0.0 a 1.0 restante en la ventana actual de 20s.
  static double calcularProgresoRestante() {
    final now = DateTime.now();
    final secondsInWindow = (now.millisecondsSinceEpoch ~/ 1000) % ventanaSegundos;
    final msRemainder = now.millisecondsSinceEpoch % 1000;
    final totalElapsedMs = (secondsInWindow * 1000) + msRemainder;
    final progress = 1.0 - (totalElapsedMs / (ventanaSegundos * 1000));
    return progress.clamp(0.0, 1.0);
  }

  /// Retorna los segundos restantes en la ventana actual.
  static int segundosRestantes() {
    final nowSeconds = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final elapsedInWindow = nowSeconds % ventanaSegundos;
    final remaining = ventanaSegundos - elapsedInWindow;
    return remaining == 0 ? ventanaSegundos : remaining;
  }

  static List<int> _hexToBytes(String hex) {
    final cleanHex = hex.trim().replaceAll(' ', '');
    final result = <int>[];
    for (int i = 0; i < cleanHex.length; i += 2) {
      result.add(int.parse(cleanHex.substring(i, i + 2), radix: 16));
    }
    return result;
  }
}
