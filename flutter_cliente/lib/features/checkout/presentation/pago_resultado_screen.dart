import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/broncos_theme.dart';
import '../../../models/orden.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/ordenes_repository.dart';
import '../data/pagos_repository.dart';

class PagoResultadoScreen extends StatefulWidget {
  final String ordenId;
  final String? estadoInicial;
  final String? paymentId;

  const PagoResultadoScreen({
    super.key,
    required this.ordenId,
    this.estadoInicial,
    this.paymentId,
  });

  @override
  State<PagoResultadoScreen> createState() => _PagoResultadoScreenState();
}

class _PagoResultadoScreenState extends State<PagoResultadoScreen> {
  final OrdenesRepository _ordenesRepo = OrdenesRepository();
  final PagosRepository _pagosRepo = PagosRepository();
  Orden? _orden;
  bool _isLoading = true;
  String? _errorMessage;
  bool _isNavigating = false;

  void _irAEventos() {
    if (_isNavigating || !mounted) return;
    _isNavigating = true;
    Navigator.of(context).pushNamedAndRemoveUntil('/eventos', (route) => false);
  }

  void _irAMisBoletos() {
    if (_isNavigating || !mounted) return;
    _isNavigating = true;
    Navigator.of(context).pushNamedAndRemoveUntil('/mis-boletos', (route) => false);
  }

  Timer? _pollTimer;
  int _intentos = 0;
  static const int _maxIntentos = 40; // ~2.5 min esperando la confirmación del webhook

  @override
  void initState() {
    super.initState();
    _verificarEstadoOrden();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  /// Consulta el estado real de la orden. Si sigue pendiente, reintenta cada 4 s
  /// hasta que el webhook de Mercado Pago confirme (o rechace) el pago.
  Future<void> _verificarEstadoOrden({bool silencioso = false}) async {
    _pollTimer?.cancel();
    if (!silencioso) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      // Si la orden aún no está pagada, intentamos confirmarla activamente con Mercado Pago
      if (_orden == null || _orden!.estaPendiente) {
        await _pagosRepo.confirmarPago(
          ordenId: widget.ordenId,
          paymentId: widget.paymentId,
        );
      }

      final orden = await _ordenesRepo.getOrden(widget.ordenId);
      if (!mounted) return;
      setState(() {
        _orden = orden;
        _errorMessage = null;
      });

      if (orden.estaPendiente && _intentos < _maxIntentos) {
        _intentos++;
        _pollTimer = Timer(
          const Duration(seconds: 4),
          () => _verificarEstadoOrden(silencioso: true),
        );
      }
    } catch (e) {
      if (mounted && !silencioso) {
        setState(() {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
        });
      }
    } finally {
      if (mounted && !silencioso) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Solo el estado confirmado por el servidor cuenta como pago aprobado
    final bool esAprobado = _orden?.estaPagada == true;

    final bool esPendiente = _orden?.estaPendiente == true;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _irAEventos();
      },
      child: Scaffold(
        backgroundColor: BroncosColors.background,
        appBar: AppBar(
          title: Text(
            'Estado del pago',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: BroncosColors.textPrimary,
            ),
          ),
          automaticallyImplyLeading: false,
        ),
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
                child: _isLoading
                    ? const LoadingIndicator(message: 'Verificando con el servidor...')
                    : SingleChildScrollView(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (esAprobado) ...[
                              Center(
                                child: Container(
                                  width: 80,
                                  height: 80,
                                  decoration: BoxDecoration(
                                    color: BroncosColors.successContainer,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: BroncosColors.successBorder, width: 2),
                                  ),
                                  child: const Icon(
                                    Icons.check_circle_rounded,
                                    size: 48,
                                    color: BroncosColors.success,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 20),
                              Text(
                                '¡Pago completado con éxito!',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: BroncosColors.textPrimary,
                                  letterSpacing: -0.4,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Tu orden fue confirmada. Tus boletos oficiales con código QR ya se encuentran listos en tu cuenta.',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 13.5,
                                  color: BroncosColors.textSecondary,
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Receipt Card
                              Container(
                                padding: const EdgeInsets.all(18),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(color: BroncosColors.borderOutline),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.02),
                                      blurRadius: 10,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'ID de orden',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 12.5,
                                            color: BroncosColors.textSecondary,
                                          ),
                                        ),
                                        InkWell(
                                          onTap: () {
                                            Clipboard.setData(ClipboardData(text: widget.ordenId));
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(
                                                content: Text('ID de orden copiado al portapapeles.'),
                                                behavior: SnackBarBehavior.floating,
                                              ),
                                            );
                                          },
                                          borderRadius: BorderRadius.circular(6),
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            child: Row(
                                              children: [
                                                Text(
                                                  widget.ordenId.length > 12
                                                      ? '${widget.ordenId.substring(0, 12)}...'
                                                      : widget.ordenId,
                                                  style: GoogleFonts.plusJakartaSans(
                                                    fontSize: 12.5,
                                                    fontWeight: FontWeight.w700,
                                                    color: BroncosColors.textPrimary,
                                                  ),
                                                ),
                                                const SizedBox(width: 4),
                                                const Icon(Icons.copy_rounded, size: 14, color: BroncosColors.textMuted),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (_orden?.total != null) ...[
                                      const Divider(height: 20, color: BroncosColors.borderLight),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            'Monto pagado',
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 12.5,
                                              color: BroncosColors.textSecondary,
                                            ),
                                          ),
                                          Text(
                                            Formatters.formatCurrency(_orden!.total),
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w800,
                                              color: BroncosColors.textPrimary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              const SizedBox(height: 28),

                              CustomButton(
                                text: 'Ver mis boletos',
                                icon: Icons.qr_code_2_rounded,
                                onPressed: _irAMisBoletos,
                              ),
                              const SizedBox(height: 12),
                              CustomButton(
                                text: 'Volver a la cartelera',
                                isOutlined: true,
                                onPressed: _irAEventos,
                              ),
                            ] else if (esPendiente) ...[
                              Center(
                                child: Container(
                                  width: 80,
                                  height: 80,
                                  decoration: BoxDecoration(
                                    color: BroncosColors.alertContainer,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: BroncosColors.alertBorder, width: 2),
                                  ),
                                  child: const Icon(
                                    Icons.hourglass_top_rounded,
                                    size: 44,
                                    color: BroncosColors.alert,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 20),
                              Text(
                                'Pago en proceso de acreditación',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: BroncosColors.textPrimary,
                                  letterSpacing: -0.4,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Estamos esperando la confirmación de la pasarela de pago. Esto puede demorar unos minutos.',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 13.5,
                                  color: BroncosColors.textSecondary,
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 28),
                              CustomButton(
                                text: 'Actualizar estado',
                                icon: Icons.refresh_rounded,
                                onPressed: _verificarEstadoOrden,
                              ),
                              const SizedBox(height: 12),
                              CustomButton(
                                text: 'Volver al catálogo',
                                isOutlined: true,
                                onPressed: _irAEventos,
                              ),
                            ] else ...[
                              Center(
                                child: Container(
                                  width: 80,
                                  height: 80,
                                  decoration: BoxDecoration(
                                    color: BroncosColors.errorContainer,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: BroncosColors.errorBorder, width: 2),
                                  ),
                                  child: const Icon(
                                    Icons.cancel_rounded,
                                    size: 46,
                                    color: BroncosColors.error,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 20),
                              Text(
                                'No se pudo completar el pago',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: BroncosColors.textPrimary,
                                  letterSpacing: -0.4,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _errorMessage ??
                                    'La transacción no fue completada o fue cancelada. No se aplicó ningún cargo a tu método de pago.',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 13.5,
                                  color: BroncosColors.textSecondary,
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 28),
                              CustomButton(
                                text: 'Regresar a eventos',
                                icon: Icons.arrow_back_rounded,
                                onPressed: _irAEventos,
                              ),
                            ],
                          ],
                        ),
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
