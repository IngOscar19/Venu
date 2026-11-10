import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';

class PagosRepository {
  final ApiClient _apiClient = ApiClient();

  /// Solicita al backend la preferencia de Mercado Pago de una orden propia.
  /// El access token de Mercado Pago vive únicamente en el servidor; la app nunca lo usa.
  Future<Map<String, dynamic>> crearPreferenciaMercadoPago({
    required String ordenId,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.preferenciaPago,
        data: {'ordenId': ordenId},
      );
      final data = response.data;
      if (data is Map<String, dynamic>) {
        final checkoutUrl = data['checkoutUrl'] ?? data['initPoint'];
        if (checkoutUrl != null && checkoutUrl.toString().isNotEmpty) {
          return {
            'checkoutUrl': checkoutUrl.toString(),
            'preferenceId': data['preferenceId'] ?? data['id'],
          };
        }
      }
      throw Exception('Mercado Pago no devolvió la URL de pago.');
    } on DioException catch (e) {
      final data = e.response?.data;
      final msg = data is String && data.isNotEmpty && data.length < 200
          ? data
          : (data is Map ? (data['mensaje'] ?? data['message'])?.toString() : null);
      throw Exception(msg ?? 'No se pudo iniciar el pago. Intenta de nuevo.');
    }
  }
}
