import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/env.dart';
import '../navigation/app_navigator.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    mOptions: MacOsOptions(usesDataProtectionKeychain: false),
  );
  static const String _tokenKey = 'auth_token';

  // Almacenamiento de sesión en memoria (volátil por ejecución de la app)
  String? _sessionToken;
  bool _manejandoSesionExpirada = false;

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: Env.apiBaseUrl,
        connectTimeout: const Duration(milliseconds: Env.connectTimeout),
        receiveTimeout: const Duration(milliseconds: Env.receiveTimeout),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            final token = await getToken();
            if (token != null && token.isNotEmpty) {
              options.headers['Authorization'] = 'Bearer $token';
            }
          } catch (e) {
            debugPrint('[ApiClient] Error resolviendo token en onRequest: $e');
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          debugPrint(
            '[ApiClient] Error ${error.response?.statusCode} en ${error.requestOptions.method} ${error.requestOptions.path}: ${error.response?.data}',
          );
          final requestOptions = error.requestOptions;

          // Sesión expirada o token inválido: se limpia y se manda al login
          final esAuthEndpoint = requestOptions.path.contains('/auth/login') ||
              requestOptions.path.contains('/auth/register');
          if (error.response?.statusCode == 401 &&
              requestOptions.headers.containsKey('Authorization') &&
              !esAuthEndpoint) {
            await _manejarSesionExpirada();
          }

          final isGet = requestOptions.method.toUpperCase() == 'GET';
          final retryCount = (requestOptions.extra['retry_count'] as int?) ?? 0;

          // Auto-reintento inteligente para peticiones GET que fallan por inicio frío de macOS o Azure
          final isTransient = error.type == DioExceptionType.connectionTimeout ||
              error.type == DioExceptionType.sendTimeout ||
              error.type == DioExceptionType.receiveTimeout ||
              error.type == DioExceptionType.connectionError ||
              (error.message != null &&
                  (error.message!.contains('SocketException') ||
                      error.message!.contains('HandshakeException')));

          if (isGet && isTransient && retryCount < 2) {
            requestOptions.extra['retry_count'] = retryCount + 1;
            final waitMs = (retryCount + 1) * 700;
            debugPrint(
              '[ApiClient] Reintentando petición GET (${requestOptions.path}) intento ${retryCount + 1} tras ${waitMs}ms...',
            );
            await Future.delayed(Duration(milliseconds: waitMs));

            try {
              final response = await dio.fetch(requestOptions);
              return handler.resolve(response);
            } on DioException catch (retryError) {
              return handler.next(retryError);
            } catch (e) {
              return handler.next(error);
            }
          }

          return handler.next(error);
        },
      ),
    );
  }

  Future<void> _manejarSesionExpirada() async {
    if (_manejandoSesionExpirada) return;
    _manejandoSesionExpirada = true;
    try {
      await clearToken();
      final navigator = appNavigatorKey.currentState;
      final context = appNavigatorKey.currentContext;
      if (navigator != null) {
        if (context != null && context.mounted) {
          ScaffoldMessenger.maybeOf(context)?.showSnackBar(
            const SnackBar(
              content: Text('Tu sesión expiró. Inicia sesión nuevamente.'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
        navigator.pushNamedAndRemoveUntil('/login', (route) => route.settings.name == '/' || route.isFirst);
      }
    } finally {
      Future.delayed(const Duration(seconds: 3), () => _manejandoSesionExpirada = false);
    }
  }

  /// Limpia cualquier residuo de sesiones pasadas en disco
  static Future<void> wipeDiskStorageOnAppStart() async {
    try {
      const storage = FlutterSecureStorage(
        mOptions: MacOsOptions(usesDataProtectionKeychain: false),
      );
      await storage.deleteAll();
    } catch (e) {
      debugPrint('[ApiClient] Limpieza de storage inicial: $e');
    }
  }

  Future<void> saveToken(String token) async {
    _sessionToken = token;
  }

  Future<String?> getToken() async {
    return _sessionToken;
  }

  Future<void> clearToken() async {
    _sessionToken = null;
    try {
      await _storage.deleteAll();
    } catch (e) {
      debugPrint('[ApiClient] Error limpiando storage: $e');
    }
  }
}
