import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../models/evento.dart';
import '../../../models/tipo_boleto.dart';

class EventosRepository {
  final ApiClient _apiClient = ApiClient();

  // Memoria caché para evitar pantallas vacías o errores transitorios en frío
  static List<Evento>? _cachedEventos;

  List<Evento>? get cachedEventos => _cachedEventos;

  Future<List<Evento>> getEventos({
    String? search,
    String? city,
    bool forceRefresh = false,
  }) async {
    try {
      final response = await _apiClient.dio.get(
        ApiEndpoints.eventos,
        queryParameters: {
          if (search != null && search.isNotEmpty) 'search': search,
          if (city != null && city.isNotEmpty) 'city': city,
        },
      );

      final dynamic data = response.data;
      if (data is List) {
        // El backend ya excluye eventos finalizados; aquí se descarta cualquier
        // evento vencido que llegue por caché o por desfase de reloj.
        final ahora = DateTime.now();
        final list = data
            .map((json) => Evento.fromJson(json as Map<String, dynamic>))
            .where((e) => e.status?.toUpperCase() != 'FINISHED')
            .where((e) {
              final fin = e.endDate ?? e.startDate;
              return fin == null || fin.add(const Duration(days: 1)).isAfter(ahora);
            })
            .toList();

        if (search == null && city == null) {
          _cachedEventos = list;
        }
        return list;
      }
      return [];
    } on DioException catch (e) {
      debugPrint('[EventosRepository] DioException al obtener eventos: ${e.message}');
      // Si tenemos eventos en caché y falla la red en caliente, devolvemos la caché
      if (_cachedEventos != null && _cachedEventos!.isNotEmpty && search == null && city == null) {
        return _cachedEventos!;
      }

      final message = e.response?.data?['message'] ??
          (e.type == DioExceptionType.connectionTimeout
              ? 'Tiempo de espera agotado al conectar con el servidor.'
              : 'No pudimos conectar con el servidor. Por favor verifica tu conexión.');
      throw Exception(message);
    } catch (e) {
      debugPrint('[EventosRepository] Excepción genérica al obtener eventos: $e');
      if (_cachedEventos != null && _cachedEventos!.isNotEmpty && search == null && city == null) {
        return _cachedEventos!;
      }
      rethrow;
    }
  }

  Future<Evento> getEventoById(String id) async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.eventoDetalle(id));
      return Evento.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(
        e.response?.data?['message'] ?? 'Error al obtener el detalle del evento',
      );
    }
  }

  Future<List<TipoBoleto>> getTiposBoleto(String eventoId) async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.tiposBoleto(eventoId));
      final dynamic data = response.data;
      if (data is List) {
        return data
            .map((json) => TipoBoleto.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (_) {
      // Fallback: Si el endpoint específico de tipos-boleto aún no está expuesto en backend,
      // lo intentamos obtener desde el detalle del evento
      final evento = await getEventoById(eventoId);
      return evento.tiposBoleto;
    }
  }
}
