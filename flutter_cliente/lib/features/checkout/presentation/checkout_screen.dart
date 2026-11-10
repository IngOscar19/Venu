import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/broncos_theme.dart';
import '../../../models/evento.dart';
import '../../../models/tipo_boleto.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../auth/data/auth_repository.dart';
import '../data/ordenes_repository.dart';
import '../data/pagos_repository.dart';

class CheckoutScreen extends StatefulWidget {
  final Evento evento;
  final List<Map<String, dynamic>> items;
  final double total;

  const CheckoutScreen({
    super.key,
    required this.evento,
    required this.items,
    required this.total,
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final OrdenesRepository _ordenesRepo = OrdenesRepository();
  final PagosRepository _pagosRepo = PagosRepository();
  final AuthRepository _authRepo = AuthRepository();

  bool _isProcessing = false;
  String? _errorMessage;

  // Temporizador de reserva de 15 minutos (900 segundos)
  late int _remainingSeconds;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = 15 * 60;
    _iniciarTemporizador();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _iniciarTemporizador() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        timer.cancel();
      }
    });
  }

  String get _tiempoFormateado {
    final int min = _remainingSeconds ~/ 60;
    final int sec = _remainingSeconds % 60;
    return '${min.toString().padLeft(2, '0')}:${sec.toString().padLeft(2, '0')}';
  }

  Future<void> _procederAlPago() async {
    final isAuth = await _authRepo.isAuthenticated();
    if (!isAuth) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Inicia sesión para completar la compra.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        final loggedIn = await Navigator.of(context).pushNamed('/login');
        if (loggedIn == null && !(await _authRepo.isAuthenticated())) {
          return;
        }
      }
    }

    if (_remainingSeconds <= 0) {
      setState(() {
        _errorMessage =
            'El tiempo de reserva terminó. Vuelve a seleccionar tus boletos.';
      });
      return;
    }

    setState(() {
      _isProcessing = true;
      _errorMessage = null;
    });

    try {
      // 1. Crear la orden pendiente en el backend (reserva el inventario)
      final orden = await _ordenesRepo.crearOrden(
        eventoId: widget.evento.id,
        items: widget.items,
      );

      // 2. Pedir al backend la preferencia de Mercado Pago de esa orden
      final String checkoutUrl;
      try {
        final pagoInfo = await _pagosRepo.crearPreferenciaMercadoPago(
          ordenId: orden.id,
        );
        checkoutUrl = pagoInfo['checkoutUrl'] as String;
      } catch (_) {
        // Si no se pudo iniciar el pago, se libera la reserva
        try {
          await _ordenesRepo.cancelarOrden(orden.id);
        } catch (_) {}
        rethrow;
      }

      if (mounted) {
        Navigator.of(context).pushReplacementNamed(
          '/pago-webview',
          arguments: {
            'checkoutUrl': checkoutUrl,
            'ordenId': orden.id,
          },
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final int totalBoletos = widget.items.fold<int>(
      0,
      (sum, item) => sum + (item['cantidad'] as int),
    );

    return Scaffold(
      backgroundColor: BroncosColors.background,
      appBar: AppBar(
        title: Text(
          'Revisión de orden',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: BroncosColors.textPrimary,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 680),
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Minimalist Countdown Reservation Banner
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: BroncosColors.alertContainer,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: BroncosColors.alertBorder),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.timer_outlined,
                          size: 22,
                          color: BroncosColors.alert,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Boletos reservados',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w700,
                                    color: BroncosColors.alertText,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    _tiempoFormateado,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: BroncosColors.alertText,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'Completa tu pago antes de que expire la reserva.',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                color: const Color(0xFF78350F),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Event Summary Card
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
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.evento.name,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: BroncosColors.textPrimary,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 6),
                      if (widget.evento.startDate != null)
                        Row(
                          children: [
                            const Icon(Icons.calendar_today_rounded, size: 13, color: BroncosColors.textMuted),
                            const SizedBox(width: 5),
                            Text(
                              Formatters.formatDate(widget.evento.startDate),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w500,
                                color: BroncosColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      if (widget.evento.venueName != null) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 13, color: BroncosColors.textMuted),
                            const SizedBox(width: 4),
                            Text(
                              '${widget.evento.venueName!}${widget.evento.city != null ? ', ${widget.evento.city}' : ''}',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12.5,
                                color: BroncosColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Itemized Breakdown Card
                Container(
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
                  child: Padding(
                    padding: const EdgeInsets.all(18.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Desglose de compra',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: BroncosColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 14),

                        ...widget.items.map((item) {
                          final tipo = item['tipoBoleto'] as TipoBoleto;
                          final cant = item['cantidad'] as int;
                          final subtotal = cant * tipo.precio;

                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6.0),
                            child: Row(
                              children: [
                                Container(
                                  width: 28,
                                  height: 28,
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '${cant}x',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                      color: BroncosColors.textPrimary,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    tipo.nombre,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: BroncosColors.textPrimary,
                                    ),
                                  ),
                                ),
                                Text(
                                  Formatters.formatCurrency(subtotal),
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: BroncosColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),

                        const SizedBox(height: 14),
                        const Divider(color: BroncosColors.borderLight, height: 1),
                        const SizedBox(height: 14),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Boletos ($totalBoletos)',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                color: BroncosColors.textSecondary,
                              ),
                            ),
                            Text(
                              Formatters.formatCurrency(widget.total),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                color: BroncosColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Cargos por servicio',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                color: BroncosColors.textSecondary,
                              ),
                            ),
                            Text(
                              'Incluidos',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: BroncosColors.success,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(color: BroncosColors.borderLight, height: 1),
                        const SizedBox(height: 14),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Total a pagar',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: BroncosColors.textPrimary,
                              ),
                            ),
                            Text(
                              Formatters.formatCurrency(widget.total),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: BroncosColors.sunsetOrange,
                                letterSpacing: -0.4,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Security & Guarantee note
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.lock_outline_rounded,
                      size: 14,
                      color: BroncosColors.textSecondary,
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        'Pago seguro con Mercado Pago',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: BroncosColors.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: BroncosColors.errorContainer,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: BroncosColors.errorBorder),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline_rounded, size: 18, color: BroncosColors.error),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12.5,
                              color: BroncosColors.errorText,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                CustomButton(
                  text: 'Pagar ${Formatters.formatCurrency(widget.total)}',
                  icon: Icons.lock_rounded,
                  isLoading: _isProcessing,
                  onPressed: _procederAlPago,
                ),
                const SizedBox(height: 28),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
