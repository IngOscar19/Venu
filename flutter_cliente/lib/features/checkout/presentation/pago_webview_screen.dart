import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../core/theme/broncos_theme.dart';
import '../../../shared/widgets/loading_indicator.dart';

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
    _irAResultado(estadoParam);
  }

  /// El resultado real SIEMPRE se confirma contra el backend (webhook de Mercado Pago);
  /// el parámetro de la URL es solo informativo.
  void _irAResultado(String estado) {
    if (_navegado || !mounted) return;
    _navegado = true;
    Navigator.of(context).pushReplacementNamed(
      '/pago-resultado',
      arguments: {
        'ordenId': widget.ordenId,
        'estadoInicial': estado,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
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
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: LoadingIndicator(message: 'Cargando Mercado Pago...'),
            ),
        ],
      ),
    );
  }
}
