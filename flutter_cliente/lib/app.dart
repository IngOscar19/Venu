import 'package:flutter/material.dart';
import 'core/navigation/app_navigator.dart';
import 'core/theme/broncos_theme.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/presentation/register_screen.dart';
import 'features/eventos/presentation/eventos_catalogo_screen.dart';
import 'features/eventos/presentation/evento_detalle_screen.dart';
import 'features/checkout/presentation/checkout_screen.dart';
import 'features/checkout/presentation/pago_webview_screen.dart';
import 'features/checkout/presentation/pago_resultado_screen.dart';
import 'features/mis_boletos/presentation/mis_boletos_screen.dart';
import 'features/mis_boletos/presentation/boleto_detalle_screen.dart';
import 'models/boleto.dart';
import 'models/evento.dart';

class EventTicketingApp extends StatelessWidget {
  const EventTicketingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: appNavigatorKey,
      title: 'Venú | Event Ticketing',
      debugShowCheckedModeBanner: false,
      theme: BroncosTheme.theme,
      initialRoute: '/',
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case '/':
          case '/eventos':
            return MaterialPageRoute(
              settings: settings,
              builder: (_) => const EventosCatalogoScreen(),
            );

          case '/login':
            return MaterialPageRoute(
              builder: (_) => const LoginScreen(),
            );

          case '/register':
            return MaterialPageRoute(
              builder: (_) => const RegisterScreen(),
            );

          case '/evento-detalle':
            final args = settings.arguments as Map<String, dynamic>?;
            final eventoId = args?['eventoId'] as String? ?? '';
            final evento = args?['evento'] as Evento?;
            return MaterialPageRoute(
              builder: (_) => EventoDetalleScreen(
                eventoId: eventoId,
                eventoInicial: evento,
              ),
            );

          case '/checkout':
            final args = settings.arguments as Map<String, dynamic>;
            return MaterialPageRoute(
              builder: (_) => CheckoutScreen(
                evento: args['evento'] as Evento,
                items: args['items'] as List<Map<String, dynamic>>,
                total: args['total'] as double,
              ),
            );

          case '/pago-webview':
            final args = settings.arguments as Map<String, dynamic>;
            return MaterialPageRoute(
              builder: (_) => PagoWebviewScreen(
                checkoutUrl: args['checkoutUrl'] as String,
                ordenId: args['ordenId'] as String,
              ),
            );

          case '/pago-resultado':
            final args = settings.arguments as Map<String, dynamic>?;
            return MaterialPageRoute(
              builder: (_) => PagoResultadoScreen(
                ordenId: args?['ordenId'] as String? ?? '',
                estadoInicial: args?['estadoInicial'] as String?,
                paymentId: args?['paymentId'] as String?,
              ),
            );

          case '/mis-boletos':
            return MaterialPageRoute(
              builder: (_) => const MisBoletosScreen(),
            );

          case '/boleto-detalle':
            final boleto = settings.arguments as Boleto;
            return MaterialPageRoute(
              builder: (_) => BoletoDetalleScreen(boleto: boleto),
            );

          default:
            return MaterialPageRoute(
              builder: (_) => const EventosCatalogoScreen(),
            );
        }
      },
    );
  }
}
