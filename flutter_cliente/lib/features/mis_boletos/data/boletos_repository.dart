import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../models/boleto.dart';

class BoletosRepository {
  final ApiClient _apiClient = ApiClient();

  static const String cacheKey = 'boletos_cache';
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    mOptions: MacOsOptions(usesDataProtectionKeychain: false),
  );

  /// Indica si la última lectura vino de la copia local (sin conexión)
  bool ultimaLecturaFueOffline = false;

  /// Obtiene los boletos del usuario actual. Guarda una copia local cifrada para
  /// poder mostrar los QR en la entrada del evento aunque no haya señal.
  Future<List<Boleto>> getMisBoletos() async {
    ultimaLecturaFueOffline = false;
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.myTickets);
      final dynamic data = response.data;
      final lista = data is List
          ? data.map((json) => Boleto.fromJson(json as Map<String, dynamic>)).toList()
          : <Boleto>[];
      await _guardarCache(lista);
      return lista;
    } on DioException catch (e) {
      final sinRed = e.response == null;
      if (sinRed) {
        final cache = await _leerCache();
        if (cache != null) {
          ultimaLecturaFueOffline = true;
          return cache;
        }
      }
      throw Exception(
        e.response?.data is Map
            ? (e.response?.data['message'] ?? 'Error al cargar los boletos del usuario')
            : (sinRed
                ? 'Sin conexión. Conéctate para ver tus boletos.'
                : 'Error al cargar los boletos del usuario'),
      );
    }
  }

  Future<void> _guardarCache(List<Boleto> boletos) async {
    try {
      await _storage.write(
        key: cacheKey,
        value: jsonEncode(boletos.map((b) => b.toJson()).toList()),
      );
    } catch (e) {
      debugPrint('[BoletosRepository] No se pudo guardar caché: $e');
    }
  }

  Future<List<Boleto>?> _leerCache() async {
    try {
      final raw = await _storage.read(key: cacheKey);
      if (raw == null || raw.isEmpty) return null;
      return (jsonDecode(raw) as List)
          .map((j) => Boleto.fromJson(j as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return null;
    }
  }

  /// Obtiene el detalle de un boleto por ID
  Future<Boleto> getBoletoDetalle(String id) async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.ticketDetalle(id));
      return Boleto.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (_) {
      try {
        final fallbackResponse = await _apiClient.dio.get(ApiEndpoints.boletoDetalle(id));
        return Boleto.fromJson(fallbackResponse.data as Map<String, dynamic>);
      } on DioException catch (e) {
        throw Exception(
          e.response?.data?['message'] ?? 'Error al obtener el detalle del boleto',
        );
      }
    }
  }
}
