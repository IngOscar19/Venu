import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../core/theme/broncos_theme.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/ordenes_repository.dart';

class PagoWebviewScreen extends StatefulWidget {
  final String checkoutUrl;
  final String ordenId;

  const PagoWebviewScreen({
    super.key,
    required this.checkoutUrl,
    required this.ordenId,
  });

  @override
  State<PagoWebviewScreen> createState() => _PagoWebviewScreenState();
}

class _PagoWebviewScreenState extends State<PagoWebviewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _inicializarWebView();
  }

  void _inicializarWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      // User agent móvil: evita que Mercado Pago sirva el diseño de escritorio
      ..setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 '
        '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            _evaluarUrl(url);
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
            _evaluarUrl(url);
          },
          onNavigationRequest: (NavigationRequest request) {
            if (_esUrlDeRetorno(request.url)) {
              _evaluarUrl(request.url);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.checkoutUrl));
  }

  static const _hostsMercadoPago = [
    'mercadopago.com',
    'mercadopago.com.mx',
    'mercadolibre.com',
    'mercadolibre.com.mx',
  ];

  bool _esHostMercadoPago(Uri uri) => _hostsMercadoPago
      .any((h) => uri.host == h || uri.host.endsWith('.$h'));

  /// Solo se considera "retorno" el esquema propio de la app, o una redirección
  /// fuera de Mercado Pago que traiga los parámetros de resultado.
  bool _esUrlDeRetorno(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return false;
    if (uri.scheme == 'miapp' && uri.host == 'pago-resultado') return true;
    if (_esHostMercadoPago(uri)) return false;
    final q = uri.queryParameters;
    return uri.path.contains('pago-resultado') &&
        (q.containsKey('status') ||
            q.containsKey('collection_status') ||
            q.containsKey('estado'));
  }

  bool _navegado = false;

  void _evaluarUrl(String url) {
    if (_navegado || !_esUrlDeRetorno(url)) return;
    final uri = Uri.tryParse(url);
    final estadoParam = uri?.queryParameters['status'] ??
        uri?.queryParameters['collection_status'] ??
        uri?.queryParameters['estado'] ??
        'pending';
    final paymentId = uri?.queryParameters['payment_id'] ??
        uri?.queryParameters['collection_id'];
    _irAResultado(estadoParam, paymentId: paymentId);
  }

  /// El resultado real se confirma contra el backend (por payment_id devuelto por MP o por su webhook);
  /// el parámetro de la URL es solo informativo.
  void _irAResultado(String estado, {String? paymentId}) {
    if (_navegado || !mounted) return;
    _navegado = true;
    Navigator.of(context).pushReplacementNamed(
      '/pago-resultado',
      arguments: {
        'ordenId': widget.ordenId,
        'estadoInicial': estado,
        'paymentId': paymentId,
      },
    );
  }

  /// Regresa dentro de Mercado Pago mientras haya historial; si no, el usuario sale del pago:
  /// se confirma y se cancela la orden pendiente para liberar los boletos reservados.
  Future<void> _manejarRetroceso() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return;
    }
    if (!mounted || _navegado) return;

    final salir = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Cancelar la compra?'),
        content: const Text(
            'Si sales ahora, los boletos reservados se liberarán y tendrás que iniciar la compra de nuevo.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Seguir pagando'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Cancelar compra'),
          ),
        ],
      ),
    );
    if (salir != true) return;

    // Si la orden ya estaba pagada el backend responde error y se ignora.
    try {
      await OrdenesRepository().cancelarOrden(widget.ordenId);
    } catch (_) {}

    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _manejarRetroceso();
      },
      child: _construirPantalla(context),
    );
  }

  Widget _construirPantalla(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: _manejarRetroceso,
        ),
        title: Text(
          'Pasarela de pago',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: BroncosColors.textPrimary,
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Abrir en navegador externo',
            icon: const Icon(Icons.open_in_browser_rounded, size: 20),
            onPressed: () async {
              final uri = Uri.parse(widget.checkoutUrl);
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
          ),
          TextButton.icon(
            icon: const Icon(Icons.sync_rounded,
                size: 18, color: BroncosColors.success),
            label: Text(
              'Ya pagué',
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w700,
                color: BroncosColors.success,
              ),
            ),
            // Verifica el pago contra el servidor; no marca nada como aprobado por sí solo
            onPressed: () => _irAResultado('pending'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      // En pantallas anchas (escritorio/tablet) se limita el ancho a tamaño de teléfono
      // para que Mercado Pago sirva su diseño móvil; en teléfonos ocupa todo el ancho.
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Stack(
              children: [
                WebViewWidget(controller: _controller),
                if (_isLoading)
                  const Center(
                    child: LoadingIndicator(message: 'Cargando Mercado Pago...'),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
