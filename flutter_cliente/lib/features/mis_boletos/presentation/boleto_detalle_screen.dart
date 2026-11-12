import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:screen_brightness/screen_brightness.dart';
import '../../../core/theme/broncos_theme.dart';
import '../../../models/boleto.dart';
import '../../../shared/utils/dynamic_qr_helper.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/custom_button.dart';

class BoletoDetalleScreen extends StatefulWidget {
  final Boleto boleto;

  const BoletoDetalleScreen({
    super.key,
    required this.boleto,
  });

  @override
  State<BoletoDetalleScreen> createState() => _BoletoDetalleScreenState();
}

class _BoletoDetalleScreenState extends State<BoletoDetalleScreen> with SingleTickerProviderStateMixin {
  Timer? _timer;
  late String _dynamicPayload;
  double _progreso = 1.0;
  int _segundosRestantes = DynamicQrHelper.ventanaSegundos;
  double? _brilloOriginal;

  @override
  void initState() {
    super.initState();
    _actualizarPayload();
    _iniciarTemporizador();
    _maximizarBrillo();
  }

  void _actualizarPayload() {
    final payload = DynamicQrHelper.generarPayload(
      ticketCode: widget.boleto.codigoQr,
      seedHex: widget.boleto.qrSeed ?? '',
    );
    if (mounted) {
      setState(() {
        _dynamicPayload = payload;
        _progreso = DynamicQrHelper.calcularProgresoRestante();
        _segundosRestantes = DynamicQrHelper.segundosRestantes();
      });
    } else {
      _dynamicPayload = payload;
    }
  }

  void _iniciarTemporizador() {
    _timer?.cancel();
    // Actualizar cada 250ms para un progreso fluido y rotación exacta en el segundo 0
    _timer = Timer.periodic(const Duration(milliseconds: 250), (_) {
      final nuevoSegundos = DynamicQrHelper.segundosRestantes();
      final nuevoProgreso = DynamicQrHelper.calcularProgresoRestante();

      // Si cambió la ventana de tiempo, regeneramos la firma
      if (nuevoSegundos > _segundosRestantes || _segundosRestantes == DynamicQrHelper.ventanaSegundos) {
        _actualizarPayload();
      } else {
        if (mounted) {
          setState(() {
            _progreso = nuevoProgreso;
            _segundosRestantes = nuevoSegundos;
          });
        }
      }
    });
  }

  Future<void> _maximizarBrillo() async {
    try {
      _brilloOriginal = await ScreenBrightness().application;
      await ScreenBrightness().setApplicationScreenBrightness(1.0);
    } catch (_) {
      // Ignorar en plataformas no compatibles (ej. macOS/desktop)
    }
  }

  Future<void> _restaurarBrillo() async {
    try {
      if (_brilloOriginal != null) {
        await ScreenBrightness().setApplicationScreenBrightness(_brilloOriginal!);
      } else {
        await ScreenBrightness().resetApplicationScreenBrightness();
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _timer?.cancel();
    _restaurarBrillo();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool esValido = widget.boleto.esValido;

    return Scaffold(
      backgroundColor: BroncosColors.background,
      appBar: AppBar(
        title: Text(
          'Pase digital',
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
          constraints: const BoxConstraints(maxWidth: 480),
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
            child: Column(
              children: [
                // Digital Ticket Pass Container
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: BroncosColors.borderOutline),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Upper Section: Event Info
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 24, 24, 18),
                        child: Column(
                          children: [
                            // Status Pill
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: esValido
                                    ? BroncosColors.successContainer
                                    : BroncosColors.errorContainer,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    esValido ? Icons.check_circle_rounded : Icons.cancel_rounded,
                                    size: 14,
                                    color: esValido ? BroncosColors.success : BroncosColors.error,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    esValido ? 'Boleto válido y activo' : widget.boleto.estado.toUpperCase(),
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: esValido ? BroncosColors.successText : BroncosColors.errorText,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),

                            Text(
                              widget.boleto.eventoNombre,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: BroncosColors.textPrimary,
                                letterSpacing: -0.4,
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Detail Grid (Fecha, Sección, Recinto)
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: _buildPassMeta(
                                      label: 'FECHA',
                                      value: Formatters.formatDate(widget.boleto.eventStartDate ?? widget.boleto.fechaEmision),
                                    ),
                                  ),
                                  Container(height: 30, width: 1, color: const Color(0xFFE2E8F0)),
                                  Expanded(
                                    child: _buildPassMeta(
                                      label: 'TIPO',
                                      value: widget.boleto.tipoBoletoNombre ?? 'General',
                                    ),
                                  ),
                                  if (widget.boleto.venueName != null) ...[
                                    Container(height: 30, width: 1, color: const Color(0xFFE2E8F0)),
                                    Expanded(
                                      child: _buildPassMeta(
                                        label: 'RECINTO',
                                        value: widget.boleto.venueName!,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Ticket Tear Line with side notches
                      _buildTicketTearLine(),

                      // Lower Section: Dynamic QR Code & Anti-Scalping
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                        child: Column(
                          children: [
                            // Security Badge (SafeTix Venu)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(30),
                                border: Border.all(color: const Color(0xFFBFDBFE)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.verified_user_rounded, size: 14, color: Color(0xFF2563EB)),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Código dinámico anticaptura',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF1D4ED8),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),

                            // QR Container
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.03),
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                              child: Column(
                                children: [
                                  QrImageView(
                                    data: _dynamicPayload.isNotEmpty ? _dynamicPayload : widget.boleto.id,
                                    version: QrVersions.auto,
                                    size: 190,
                                    eyeStyle: const QrEyeStyle(
                                      eyeShape: QrEyeShape.square,
                                      color: BroncosColors.navyDark,
                                    ),
                                    dataModuleStyle: const QrDataModuleStyle(
                                      dataModuleShape: QrDataModuleShape.square,
                                      color: BroncosColors.navyDark,
                                    ),
                                  ),
                                  const SizedBox(height: 12),

                                  // Rolling Progress Bar (SafeTix dynamic countdown)
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(6),
                                    child: SizedBox(
                                      height: 6,
                                      width: 190,
                                      child: LinearProgressIndicator(
                                        value: _progreso,
                                        backgroundColor: const Color(0xFFE2E8F0),
                                        valueColor: const AlwaysStoppedAnimation<Color>(BroncosColors.sunsetOrange),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.sync_rounded, size: 12, color: BroncosColors.textMuted),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Se actualiza en ${_segundosRestantes}s',
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: BroncosColors.textMuted,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 14),

                            Text(
                              'Presenta este código en vivo desde la app al ingresar.',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w600,
                                color: BroncosColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'No se admiten capturas de pantalla ni fotos impresas.',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: BroncosColors.textMuted,
                              ),
                            ),
                            const SizedBox(height: 12),

                            // Ticket ID with copy button
                            InkWell(
                              onTap: () {
                                Clipboard.setData(ClipboardData(text: widget.boleto.id));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('ID de boleto copiado al portapapeles.'),
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                              },
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'ID: ${widget.boleto.id.length > 16 ? '${widget.boleto.id.substring(0, 16)}...' : widget.boleto.id}',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w600,
                                        color: BroncosColors.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Icon(Icons.copy_rounded, size: 13, color: BroncosColors.textMuted),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Action Buttons
                CustomButton(
                  text: 'Volver a mis boletos',
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPassMeta({required String label, required String value}) {
    return Column(
      children: [
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 10.5,
            fontWeight: FontWeight.w700,
            color: BroncosColors.textMuted,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          value,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12.5,
            fontWeight: FontWeight.w700,
            color: BroncosColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildTicketTearLine() {
    return SizedBox(
      height: 24,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Dashed line
          LayoutBuilder(
            builder: (context, constraints) {
              const dashWidth = 5.0;
              const dashSpace = 4.0;
              final dashCount = (constraints.maxWidth / (dashWidth + dashSpace)).floor();
              return Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(dashCount, (_) {
                  return Container(
                    width: dashWidth,
                    height: 1.2,
                    margin: const EdgeInsets.symmetric(horizontal: dashSpace / 2),
                    color: const Color(0xFFCBD5E1),
                  );
                }),
              );
            },
          ),
          // Left Notch Cutout
          Positioned(
            left: -12,
            child: Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: BroncosColors.background,
                shape: BoxShape.circle,
                border: Border.all(color: BroncosColors.borderOutline),
              ),
            ),
          ),
          // Right Notch Cutout
          Positioned(
            right: -12,
            child: Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: BroncosColors.background,
                shape: BoxShape.circle,
                border: Border.all(color: BroncosColors.borderOutline),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
