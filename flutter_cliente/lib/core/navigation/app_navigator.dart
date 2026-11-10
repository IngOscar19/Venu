import 'package:flutter/material.dart';

/// Llave global del Navigator para poder navegar desde capas sin BuildContext
/// (por ejemplo, cuando el interceptor de red detecta que la sesión expiró).
final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();
