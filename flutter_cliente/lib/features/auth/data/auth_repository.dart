import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';

class AuthRepository {
  final ApiClient _apiClient = ApiClient();
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    mOptions: MacOsOptions(usesDataProtectionKeychain: false),
  );

  static const String _userKey = 'user_data';
  static Map<String, dynamic>? _cachedUserData;

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      final data = response.data as Map<String, dynamic>;
      final token = data['token'] ?? data['accessToken'];
      if (token != null) {
        await _apiClient.saveToken(token.toString());
      }

      _cachedUserData = data;
      try {
        await _storage.write(key: _userKey, value: jsonEncode(data));
      } catch (e) {
        debugPrint('[AuthRepository] Advertencia al persistir usuario: $e');
      }

      return data;
    } on DioException catch (e) {
      final message = e.response?.data?['message'] ??
          e.response?.data?['title'] ??
          'Error al iniciar sesión';
      throw Exception(message);
    }
  }

  Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.register,
        data: {
          'firstName': firstName,
          'lastName': lastName,
          'email': email,
          'password': password,
          'role': 'USER',
        },
      );

      final data = response.data as Map<String, dynamic>;
      final token = data['token'] ?? data['accessToken'];
      if (token != null) {
        await _apiClient.saveToken(token.toString());
      }

      _cachedUserData = data;
      try {
        await _storage.write(key: _userKey, value: jsonEncode(data));
      } catch (e) {
        debugPrint('[AuthRepository] Advertencia al persistir usuario: $e');
      }

      return data;
    } on DioException catch (e) {
      final message = e.response?.data?['message'] ??
          e.response?.data?['title'] ??
          'Error al registrarse';
      throw Exception(message);
    }
  }

  Future<Map<String, dynamic>?> getCurrentUser() async {
    if (_cachedUserData != null) {
      return _cachedUserData;
    }

    try {
      final raw = await _storage.read(key: _userKey);
      if (raw != null && raw.isNotEmpty) {
        _cachedUserData = jsonDecode(raw) as Map<String, dynamic>;
        return _cachedUserData;
      }
    } catch (e) {
      debugPrint('[AuthRepository] Advertencia leyendo storage: $e');
    }

    // Intentar consultar al backend /api/auth/me
    try {
      final res = await _apiClient.dio.get(ApiEndpoints.me);
      if (res.data != null && res.data is Map<String, dynamic>) {
        _cachedUserData = res.data as Map<String, dynamic>;
        try {
          await _storage.write(key: _userKey, value: jsonEncode(res.data));
        } catch (_) {}
        return _cachedUserData;
      }
    } catch (_) {}

    return null;
  }

  Future<void> logout() async {
    _cachedUserData = null;
    await _apiClient.clearToken();
    try {
      await _storage.delete(key: _userKey);
    } catch (e) {
      debugPrint('[AuthRepository] Advertencia al borrar storage: $e');
    }
  }

  Future<bool> isAuthenticated() async {
    try {
      final token = await _apiClient.getToken();
      return token != null && token.isNotEmpty;
    } catch (_) {
      return false;
    }
  }
}
