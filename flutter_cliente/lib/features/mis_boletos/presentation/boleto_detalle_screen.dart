import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/theme/broncos_theme.dart';
import '../../../models/boleto.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/custom_button.dart';

class BoletoDetalleScreen extends StatelessWidget {
  final Boleto boleto;

  const BoletoDetalleScreen({
    super.key,
    required this.boleto,
  });

  @override
  Widget build(BuildContext context) {
    final bool esValido = boleto.esValido;

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
                                    esValido ? 'Boleto válido y activo' : boleto.estado.toUpperCase(),
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
                              boleto.eventoNombre,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: BroncosColors.textPrimary,
                                letterSpacing: -0.4,
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Detail Grid (Fecha, Sección, Asistente)
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
                                      value: Formatters.formatDate(boleto.eventStartDate ?? boleto.fechaEmision),
                                    ),
                                  ),
                                  Container(height: 30, width: 1, color: const Color(0xFFE2E8F0)),
                                  Expanded(
                                    child: _buildPassMeta(
                                      label: 'TIPO',
                                      value: boleto.tipoBoletoNombre ?? 'General',
                                    ),
                                  ),
                                  if (boleto.venueName != null) ...[
                                    Container(height: 30, width: 1, color: const Color(0xFFE2E8F0)),
                                    Expanded(
                                      child: _buildPassMeta(
                                        label: 'RECINTO',
                                        value: boleto.venueName!,
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

                      // Lower Section: QR Code & Validation
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                        child: Column(
                          children: [
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
                              child: QrImageView(
                                data: boleto.codigoQr.isNotEmpty ? boleto.codigoQr : boleto.id,
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
                            ),
                            const SizedBox(height: 16),

                            Text(
                              'Presenta este código en el acceso del recinto',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: BroncosColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 10),

                            // Ticket ID with copy button
                            InkWell(
                              onTap: () {
                                Clipboard.setData(ClipboardData(text: boleto.id));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Código de boleto copiado al portapapeles.'),
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
                                      'ID: ${boleto.id.length > 16 ? '${boleto.id.substring(0, 16)}...' : boleto.id}',
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
                  text: 'Compartir entrada',
                  icon: Icons.share_outlined,
                  isOutlined: true,
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Pase digital listo para compartir.'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),
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
