import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/broncos_theme.dart';
import '../../../../models/tipo_boleto.dart';
import '../../../../shared/utils/formatters.dart';

class TipoBoletoSelector extends StatelessWidget {
  final TipoBoleto tipoBoleto;
  final int cantidad;
  final ValueChanged<int> onCantidadChanged;
  final int maxSeleccionable;

  const TipoBoletoSelector({
    super.key,
    required this.tipoBoleto,
    required this.cantidad,
    required this.onCantidadChanged,
    this.maxSeleccionable = 10,
  });

  @override
  Widget build(BuildContext context) {
    final int restante = tipoBoleto.disponibilidadRestante;
    final bool agotado = restante <= 0;
    final int limite = agotado ? 0 : (restante < maxSeleccionable ? restante : maxSeleccionable);
    final bool isSelected = cantidad > 0;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected ? BroncosColors.sunsetOrange : BroncosColors.borderOutline,
          width: isSelected ? 1.6 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isSelected
                ? BroncosColors.sunsetOrange.withValues(alpha: 0.08)
                : Colors.black.withValues(alpha: 0.02),
            blurRadius: isSelected ? 12 : 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tipoBoleto.nombre,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: BroncosColors.textPrimary,
                          letterSpacing: -0.2,
                        ),
                      ),
                      if (tipoBoleto.descripcion != null &&
                          tipoBoleto.descripcion!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          tipoBoleto.descripcion!,
                          style: GoogleFonts.plusJakartaSans(
                            color: BroncosColors.textSecondary,
                            fontSize: 12.5,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      Formatters.formatCurrency(tipoBoleto.precio),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: BroncosColors.sunsetOrange,
                        letterSpacing: -0.4,
                      ),
                    ),
                    Text(
                      'c/u',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        color: BroncosColors.textMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Availability Badge and Stepper
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Availability chip with dot
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: agotado
                          ? BroncosColors.errorContainer
                          : (restante <= 10
                              ? BroncosColors.alertContainer
                              : BroncosColors.successContainer),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: agotado
                                ? BroncosColors.error
                                : (restante <= 10
                                    ? BroncosColors.alert
                                    : BroncosColors.success),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            agotado
                                ? 'Agotado'
                                : (restante <= 10
                                    ? 'Últimos $restante disponibles'
                                    : '$restante disponibles'),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: agotado
                                  ? BroncosColors.errorText
                                  : (restante <= 10
                                      ? BroncosColors.alertText
                                      : BroncosColors.successText),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Tactile Stepper
                if (agotado)
                  Text(
                    'No disponible',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: BroncosColors.textMuted,
                    ),
                  )
                else
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    padding: const EdgeInsets.all(2),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildStepperButton(
                          icon: Icons.remove_rounded,
                          onPressed: cantidad > 0
                              ? () => onCantidadChanged(cantidad - 1)
                              : null,
                        ),
                        Container(
                          constraints: const BoxConstraints(minWidth: 36),
                          alignment: Alignment.center,
                          child: Text(
                            '$cantidad',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: isSelected
                                  ? BroncosColors.sunsetOrange
                                  : BroncosColors.textPrimary,
                            ),
                          ),
                        ),
                        _buildStepperButton(
                          icon: Icons.add_rounded,
                          onPressed: cantidad < limite
                              ? () => onCantidadChanged(cantidad + 1)
                              : null,
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepperButton({
    required IconData icon,
    required VoidCallback? onPressed,
  }) {
    final isEnabled = onPressed != null;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 32,
          height: 32,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isEnabled ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: isEnabled
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ]
                : [],
          ),
          child: Icon(
            icon,
            size: 16,
            color: isEnabled ? BroncosColors.textPrimary : BroncosColors.textMuted,
          ),
        ),
      ),
    );
  }
}
