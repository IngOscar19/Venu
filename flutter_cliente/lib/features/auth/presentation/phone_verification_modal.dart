import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/broncos_theme.dart';
import '../../../shared/widgets/custom_button.dart';
import '../data/auth_repository.dart';

class PhoneVerificationModal extends StatefulWidget {
  final AuthRepository authRepository;

  const PhoneVerificationModal({
    super.key,
    required this.authRepository,
  });

  static Future<bool> show(
    BuildContext context, {
    AuthRepository? authRepository,
  }) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PhoneVerificationModal(
        authRepository: authRepository ?? AuthRepository(),
      ),
    );
    return result ?? false;
  }

  @override
  State<PhoneVerificationModal> createState() => _PhoneVerificationModalState();
}

class _PhoneVerificationModalState extends State<PhoneVerificationModal> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _codeController = TextEditingController();

  bool _isCodeSent = false;
  bool _isLoading = false;
  String? _errorMessage;
  String? _normalizedPhone;
  String? _simulatedCode;

  int _resendCountdown = 0;
  Timer? _resendTimer;

  @override
  void dispose() {
    _resendTimer?.cancel();
    _phoneController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  void _startResendTimer(int seconds) {
    setState(() {
      _resendCountdown = seconds;
    });
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendCountdown > 1) {
        setState(() {
          _resendCountdown--;
        });
      } else {
        timer.cancel();
        setState(() {
          _resendCountdown = 0;
        });
      }
    });
  }

  Future<void> _enviarCodigo() async {
    final phone = _phoneController.text.trim();
    if (phone.length < 10) {
      setState(() {
        _errorMessage = 'Ingresa los 10 dígitos de tu número de celular.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final formattedPhone = phone.startsWith('+') ? phone : '+52$phone';
      final res = await widget.authRepository.sendPhoneVerificationCode(formattedPhone);

      setState(() {
        _isCodeSent = true;
        _normalizedPhone = res['telefono'] ?? formattedPhone;
        _simulatedCode = res['codigoSimulado']?.toString();
        _isLoading = false;
      });

      _startResendTimer(45);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _verificarCodigo() async {
    final code = _codeController.text.trim();
    if (code.length != 6) {
      setState(() {
        _errorMessage = 'Ingresa el código de 6 dígitos que te llegó por SMS.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final targetPhone = _normalizedPhone ?? '+52${_phoneController.text.trim()}';
      await widget.authRepository.verifyPhoneCode(targetPhone, code);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle_outline, color: Colors.white),
                SizedBox(width: 8),
                Text('¡Número celular verificado correctamente!'),
              ],
            ),
            backgroundColor: Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Container(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        decoration: const BoxDecoration(
          color: Color(0xFF1E293B),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [
            BoxShadow(
              color: Colors.black54,
              blurRadius: 20,
              offset: Offset(0, -5),
            ),
          ],
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Barra indicadora de arrastre
              Center(
                child: Container(
                  width: 48,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Cabecera e ícono
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: BroncosColors.sunsetOrange.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.shield_outlined,
                      color: BroncosColors.sunsetOrange,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Verificación Anti-Reventa',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Protegemos tus boletos contra bots y duplicidad',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            color: Colors.white60,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 18),
              const Divider(color: Colors.white12),
              const SizedBox(height: 16),

              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.redAccent.withOpacity(0.4)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: GoogleFonts.plusJakartaSans(
                            color: Colors.redAccent,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              if (!_isCodeSent) ...[
                // Paso 1: Ingresar teléfono
                Text(
                  'Ingresa tu número de celular para recibir un código de verificación vía SMS:',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    color: Colors.white70,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 16),

                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: BroncosColors.sunsetOrange.withOpacity(0.6),
                      width: 1.5,
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                  child: Row(
                    children: [
                      const Text(
                        '🇲🇽 +52',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 1,
                        height: 28,
                        color: Colors.white24,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          maxLength: 10,
                          cursorColor: BroncosColors.sunsetOrange,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            letterSpacing: 1.5,
                          ),
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                          ],
                          decoration: const InputDecoration(
                            isDense: true,
                            filled: true,
                            fillColor: Color(0xFF0F172A),
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            errorBorder: InputBorder.none,
                            disabledBorder: InputBorder.none,
                            hintText: '10 dígitos (ej. 4151234567)',
                            hintStyle: TextStyle(
                              color: Colors.white38,
                              fontSize: 14,
                              letterSpacing: 0,
                              fontWeight: FontWeight.normal,
                            ),
                            counterText: '',
                            contentPadding: EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),
                CustomButton(
                  text: 'Enviar código SMS',
                  isLoading: _isLoading,
                  icon: Icons.sms_outlined,
                  onPressed: _enviarCodigo,
                ),
              ] else ...[
                // Banner de Código Simulado cuando el backend no tiene Twilio configurado
                if (_simulatedCode != null) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F253E),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF38BDF8).withOpacity(0.5)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.info_outline, color: Color(0xFF38BDF8), size: 18),
                            const SizedBox(width: 8),
                            Text(
                              'Servidor en Modo de Pruebas (SMS)',
                              style: GoogleFonts.plusJakartaSans(
                                color: const Color(0xFF38BDF8),
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'El servidor no tiene credenciales de Twilio configuradas aún. Tu código generado es:',
                          style: GoogleFonts.plusJakartaSans(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 10),
                        InkWell(
                          onTap: () {
                            _codeController.text = _simulatedCode!;
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.white24),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  _simulatedCode!,
                                  style: GoogleFonts.spaceMono(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                    letterSpacing: 4,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Text(
                                  '(Toca para autocompletar)',
                                  style: TextStyle(
                                    color: Color(0xFF38BDF8),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Paso 2: Ingresar código de 6 dígitos
                Text(
                  'Código enviado a ${_normalizedPhone ?? "+52${_phoneController.text}"}',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: BroncosColors.sunsetOrange,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Ingresa el código numérico de 6 dígitos recibido por mensaje SMS:',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(height: 18),

                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: BroncosColors.sunsetOrange, width: 1.8),
                  ),
                  child: TextField(
                    controller: _codeController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    maxLength: 6,
                    cursorColor: BroncosColors.sunsetOrange,
                    style: GoogleFonts.spaceMono(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 12,
                      color: Colors.white,
                    ),
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                    ],
                    decoration: const InputDecoration(
                      isDense: true,
                      filled: true,
                      fillColor: Color(0xFF0F172A),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      errorBorder: InputBorder.none,
                      disabledBorder: InputBorder.none,
                      hintText: '000000',
                      hintStyle: TextStyle(
                        color: Colors.white24,
                        letterSpacing: 12,
                      ),
                      counterText: '',
                      contentPadding: EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),

                const SizedBox(height: 20),
                CustomButton(
                  text: 'Confirmar y Continuar',
                  isLoading: _isLoading,
                  icon: Icons.check_circle_outline,
                  onPressed: _verificarCodigo,
                ),

                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: _isLoading
                          ? null
                          : () {
                              setState(() {
                                _isCodeSent = false;
                                _codeController.clear();
                                _errorMessage = null;
                              });
                            },
                      child: Text(
                        'Cambiar número',
                        style: GoogleFonts.plusJakartaSans(
                          color: Colors.white60,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: (_resendCountdown > 0 || _isLoading)
                          ? null
                          : _enviarCodigo,
                      child: Text(
                        _resendCountdown > 0
                            ? 'Reenviar en ${_resendCountdown}s'
                            : 'Reenviar código',
                        style: GoogleFonts.plusJakartaSans(
                          color: _resendCountdown > 0
                              ? Colors.white30
                              : BroncosColors.sunsetOrange,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
