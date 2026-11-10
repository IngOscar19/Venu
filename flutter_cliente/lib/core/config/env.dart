class Env {
  static const int connectTimeout = 20000;
  static const int receiveTimeout = 20000;

  /// URL del backend en producción en Azure
  static const String _azureProductionUrl =
      'https://venu-api-eybrg6drhxdmhnf6.northcentralus-01.azurewebsites.net';

  static String get apiBaseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv;

    return _azureProductionUrl;
  }
}
