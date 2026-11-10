import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/broncos_theme.dart';

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final Color? color;
  final Color? textColor;
  final IconData? icon;
  final bool isOutlined;
  final double height;
  final double borderRadius;

  const CustomButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.color,
    this.textColor,
    this.icon,
    this.isOutlined = false,
    this.height = 50,
    this.borderRadius = 14,
  });

  @override
  Widget build(BuildContext context) {
    if (isOutlined) {
      final borderClr = color ?? BroncosColors.borderOutline;
      final textClr = textColor ?? BroncosColors.textPrimary;

      return SizedBox(
        width: double.infinity,
        height: height,
        child: OutlinedButton(
          style: OutlinedButton.styleFrom(
            foregroundColor: textClr,
            backgroundColor: Colors.white,
            side: BorderSide(color: borderClr, width: 1.2),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(borderRadius),
            ),
            elevation: 0,
            splashFactory: InkRipple.splashFactory,
          ),
          onPressed: isLoading ? null : onPressed,
          child: _buildContent(textClr),
        ),
      );
    }

    final effectiveBg = color ?? BroncosColors.sunsetOrange;
    final effectiveFg = textColor ?? Colors.white;
    final isEnabled = onPressed != null && !isLoading;

    return Container(
      width: double.infinity,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: isEnabled
            ? [
                BoxShadow(
                  color: effectiveBg.withValues(alpha: 0.22),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ]
            : [],
      ),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: effectiveBg,
          foregroundColor: effectiveFg,
          disabledBackgroundColor: effectiveBg.withValues(alpha: 0.5),
          disabledForegroundColor: Colors.white70,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(borderRadius),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20),
        ),
        onPressed: isLoading ? null : onPressed,
        child: _buildContent(effectiveFg),
      ),
    );
  }

  Widget _buildContent(Color foreground) {
    if (isLoading) {
      return SizedBox(
        height: 18,
        width: 18,
        child: CircularProgressIndicator(
          strokeWidth: 2.2,
          valueColor: AlwaysStoppedAnimation<Color>(foreground),
        ),
      );
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 18, color: foreground),
          const SizedBox(width: 8),
        ],
        Flexible(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14.5,
              fontWeight: FontWeight.w700,
              color: foreground,
              letterSpacing: 0.1,
            ),
          ),
        ),
      ],
    );
  }
}
