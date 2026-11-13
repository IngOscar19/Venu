import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';

class AuthRepository {
  final ApiClient _apiClient = ApiClient();

  // Datos del usuario en memoria para la sesión activa
  static Map<String, dynamic>? _sessionUserData;

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

      _sessionUserData = data;
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

      _sessionUserData = data;
      return data;
    } on DioException catch (e) {
      final message = e.response?.data?['message'] ??
          e.response?.data?['title'] ??
          'Error al registrarse';
      throw Exception(message);
    }
  }

  Future<Map<String, dynamic>?> getCurrentUser() async {
    if (_sessionUserData != null) {
      return _sessionUserData;
    }

    final token = await _apiClient.getToken();
    if (token == null || token.isEmpty) {
      return null;
    }

    // Consultar al backend /api/auth/me usando el token de sesión
    try {
      final res = await _apiClient.dio.get(ApiEndpoints.me);
      if (res.data != null && res.data is Map<String, dynamic>) {
        _sessionUserData = res.data as Map<String, dynamic>;
        return _sessionUserData;
      }
    } catch (_) {}

    return null;
  }

  Future<void> logout() async {
    _sessionUserData = null;
    await _apiClient.clearToken();
  }

  Future<bool> isAuthenticated() async {
    try {
      final token = await _apiClient.getToken();
      return token != null && token.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  // ── Verificación por Correo Electrónico (Magic Link) ──

  Future<Map<String, dynamic>> sendEmailVerification() async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.emailSendVerification,
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      final message = e.response?.data?['mensaje'] ??
          e.response?.data?['message'] ??
          'Error al enviar el correo de verificación';
      throw Exception(message);
    }
  }

  Future<bool> isEmailVerified() async {
    if (_sessionUserData != null && _sessionUserData!['emailVerified'] == true) {
      return true;
    }
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.emailVerificationStatus);
      if (response.data != null && response.data is Map<String, dynamic>) {
        final verified = response.data['emailVerified'] == true;
        if (_sessionUserData != null) {
          _sessionUserData!['emailVerified'] = verified;
        }
        return verified;
      }
    } catch (e) {
      debugPrint('[AuthRepository] Error consultando estado de correo: $e');
    }
    return false;
  }

  // ── Verificación Telefónica SMS (Anti-reventa e identidad) ──

  Future<Map<String, dynamic>> sendPhoneVerificationCode(String phoneNumber) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.phoneSendCode,
        data: {'phoneNumber': phoneNumber},
      );
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      final message = e.response?.data?['mensaje'] ??
          e.response?.data?['message'] ??
          'Error al enviar el código SMS';
      throw Exception(message);
    }
  }

  Future<Map<String, dynamic>> verifyPhoneCode(String phoneNumber, String code) async {
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.phoneVerifyCode,
        data: {
          'phoneNumber': phoneNumber,
          'code': code,
        },
      );
      final data = response.data as Map<String, dynamic>;
      if (_sessionUserData != null) {
        _sessionUserData!['phoneVerified'] = true;
        _sessionUserData!['phoneNumber'] = data['phoneNumber'] ?? phoneNumber;
      }
      return data;
    } on DioException catch (e) {
      final message = e.response?.data?['mensaje'] ??
          e.response?.data?['message'] ??
          'Error al verificar el código';
      throw Exception(message);
    }
  }

  Future<bool> isPhoneVerified() async {
    if (_sessionUserData != null && _sessionUserData!['phoneVerified'] == true) {
      return true;
    }
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.phoneStatus);
      if (response.data != null && response.data is Map<String, dynamic>) {
        final verified = response.data['phoneVerified'] == true;
        if (_sessionUserData != null) {
          _sessionUserData!['phoneVerified'] = verified;
          _sessionUserData!['phoneNumber'] = response.data['phoneNumber'];
        }
        return verified;
      }
    } catch (e) {
      debugPrint('[AuthRepository] Error consultando estado telefónico: $e');
    }
    return false;
  }
}
