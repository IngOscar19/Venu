import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class BroncosColors {
  // Identidad de marca (Denver Broncos 1977 Throwback: Sunset Orange + Legacy Blue)
  static const Color sunsetOrange = Color(0xFFF05A28); // Primario dinámico / CTAs
  static const Color sunsetOrangeHover = Color(0xFFD94817);
  static const Color sunsetOrangeLight = Color(0xFFFFF2ED); // Fondo suave para badges
  static const Color sunsetOrangeSubtle = Color(0xFFFFECE5);
  
  static const Color legacyBlue = Color(0xFF1E3A8A);   // Azul profundo / contraste
  static const Color legacyBlueHover = Color(0xFF172D6D);
  static const Color legacyBlueSoft = Color(0xFFF1F5FD); // Fondo suave azul
  static const Color legacyBlueBorder = Color(0xFFD6E2FB);

  static const Color navyDark = Color(0xFF0F172A);     // Slate 900
  static const Color white = Color(0xFFFFFFFF);
  
  // Superficies y Neutros modernos (Clean Minimal / Apple & Linear aesthetics)
  static const Color background = Color(0xFFF8FAFC);   // Slate 50 ultra limpio
  static const Color surfaceCard = Color(0xFFFFFFFF);  // Blanco puro
  static const Color surfaceMuted = Color(0xFFF1F5F9); // Slate 100
  static const Color borderOutline = Color(0xFFE2E8F0);// Slate 200 sutil
  static const Color borderLight = Color(0xFFEDF2F7);  // Slate 150
  static const Color textPrimary = Color(0xFF0F172A);  // Slate 900
  static const Color textSecondary = Color(0xFF64748B);// Slate 500
  static const Color textMuted = Color(0xFF94A3B8);    // Slate 400

  // Semánticos modernos
  static const Color success = Color(0xFF059669);      // Emerald 600
  static const Color successContainer = Color(0xFFECFDF5); // Emerald 50
  static const Color successText = Color(0xFF065F46);  // Emerald 800
  static const Color successBorder = Color(0xFFA7F3D0);// Emerald 200

  static const Color alert = Color(0xFFD97706);        // Amber 600
  static const Color alertContainer = Color(0xFFFFFBEB); // Amber 50
  static const Color alertText = Color(0xFF92400E);    // Amber 800
  static const Color alertBorder = Color(0xFFFDE68A);  // Amber 200

  static const Color error = Color(0xFFDC2626);        // Red 600
  static const Color errorContainer = Color(0xFFFEF2F2); // Red 50
  static const Color errorText = Color(0xFF991B1B);    // Red 800
  static const Color errorBorder = Color(0xFFFECACA);  // Red 200
}

class BroncosTheme {
  static ThemeData get theme {
    // Tipografía moderna, agradable y legible: Plus Jakarta Sans
    final baseTextTheme = GoogleFonts.plusJakartaSansTextTheme();

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: BroncosColors.background,
      colorScheme: const ColorScheme.light(
        primary: BroncosColors.sunsetOrange,
        onPrimary: BroncosColors.white,
        primaryContainer: BroncosColors.sunsetOrangeLight,
        onPrimaryContainer: Color(0xFF7C2D12),
        secondary: BroncosColors.legacyBlue,
        onSecondary: BroncosColors.white,
        secondaryContainer: BroncosColors.legacyBlueSoft,
        onSecondaryContainer: BroncosColors.legacyBlue,
        surface: BroncosColors.surfaceCard,
        onSurface: BroncosColors.textPrimary,
        outline: BroncosColors.borderOutline,
        error: BroncosColors.error,
        onError: BroncosColors.white,
      ),
      textTheme: baseTextTheme.copyWith(
        displayLarge: GoogleFonts.plusJakartaSans(
          fontSize: 34,
          fontWeight: FontWeight.w800,
          color: BroncosColors.textPrimary,
          letterSpacing: -0.8,
        ),
        headlineLarge: GoogleFonts.plusJakartaSans(
          fontSize: 26,
          fontWeight: FontWeight.w800,
          color: BroncosColors.textPrimary,
          letterSpacing: -0.6,
        ),
        headlineMedium: GoogleFonts.plusJakartaSans(
          fontSize: 22,
          fontWeight: FontWeight.w700,
          color: BroncosColors.textPrimary,
          letterSpacing: -0.4,
        ),
        headlineSmall: GoogleFonts.plusJakartaSans(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: BroncosColors.textPrimary,
          letterSpacing: -0.3,
        ),
        titleLarge: GoogleFonts.plusJakartaSans(
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: BroncosColors.textPrimary,
          letterSpacing: -0.2,
        ),
        titleMedium: GoogleFonts.plusJakartaSans(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: BroncosColors.textPrimary,
        ),
        titleSmall: GoogleFonts.plusJakartaSans(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: BroncosColors.textSecondary,
        ),
        bodyLarge: GoogleFonts.plusJakartaSans(
          fontSize: 15,
          fontWeight: FontWeight.w400,
          color: BroncosColors.textPrimary,
          height: 1.55,
        ),
        bodyMedium: GoogleFonts.plusJakartaSans(
          fontSize: 13.5,
          fontWeight: FontWeight.w400,
          color: BroncosColors.textSecondary,
          height: 1.5,
        ),
        bodySmall: GoogleFonts.plusJakartaSans(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: BroncosColors.textMuted,
        ),
        labelLarge: GoogleFonts.plusJakartaSans(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.1,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: BroncosColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.plusJakartaSans(
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: BroncosColors.textPrimary,
          letterSpacing: -0.3,
        ),
        iconTheme: const IconThemeData(color: BroncosColors.textPrimary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: BroncosColors.sunsetOrange,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(50),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            letterSpacing: 0.1,
          ),
        ),
      ),
      cardTheme: CardThemeData(
        color: BroncosColors.surfaceCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: BroncosColors.borderOutline, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: BroncosColors.borderOutline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: BroncosColors.borderOutline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: BroncosColors.sunsetOrange, width: 1.8),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: BroncosColors.error, width: 1.5),
        ),
        hintStyle: GoogleFonts.plusJakartaSans(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: BroncosColors.textMuted,
        ),
        labelStyle: GoogleFonts.plusJakartaSans(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: BroncosColors.textSecondary,
        ),
      ),
    );
  }
}
