import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../models/orden.dart';

class OrdenesRepository {
  final ApiClient _apiClient = ApiClient();

  /// Crea una orden PENDIENTE de pago en el backend (reserva el inventario 15 minutos).
  /// Los boletos solo se emiten cuando Mercado Pago confirma el pago.
  Future<Orden> crearOrden({
    required String eventoId,
    required List<Map<String, dynamic>> items,
  }) async {
    final body = items.map((item) {
      final tipo = item['tipoBoleto'];
      final cantidad = item['cantidad'] is int
          ? item['cantidad'] as int
          : int.tryParse(item['cantidad'].toString()) ?? 1;
      return {'tipoBoletoId': tipo.id, 'cantidad': cantidad};
    }).toList();

    try {
      final response = await _apiClient.dio.post(ApiEndpoints.ordenes, data: body);
      final data = response.data;
      final ordenId = data is Map ? (data['ordenId'] ?? data['id'])?.toString() : null;
      if (ordenId == null || ordenId.isEmpty) {
        throw Exception('El servidor no devolvió el identificador de la orden.');
      }
      return await getOrden(ordenId);
    } on DioException catch (e) {
      debugPrint('[OrdenesRepository] Error crear orden: ${e.response?.statusCode}');
      throw Exception(_mensajeDeError(e, 'No se pudo crear la orden.'));
    }
  }

  /// Consulta el estado de una orden (solo si pertenece al usuario autenticado)
  Future<Orden> getOrden(String ordenId) async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.ordenDetalle(ordenId));
      return Orden.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(_mensajeDeError(e, 'Error al consultar la orden'));
    }
  }

  /// Cancela una orden pendiente y libera el inventario
  Future<void> cancelarOrden(String ordenId) async {
    try {
      await _apiClient.dio.post(ApiEndpoints.cancelarOrden(ordenId));
    } on DioException catch (e) {
      throw Exception(_mensajeDeError(e, 'Error al cancelar la orden'));
    }
  }

  String _mensajeDeError(DioException e, String porDefecto) {
    final status = e.response?.statusCode;
    final data = e.response?.data;
    if (status == 409) return 'Ya no hay disponibilidad suficiente para algunos boletos.';
    if (data is Map) {
      final msg = data['mensaje'] ?? data['message'] ?? data['title'];
      if (msg != null) return msg.toString();
    } else if (data is String && data.trim().isNotEmpty && data.length < 200) {
      return data.trim();
    }
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.connectionError) {
      return 'No pudimos conectar con el servidor. Verifica tu conexión.';
    }
    return porDefecto;
  }
}
