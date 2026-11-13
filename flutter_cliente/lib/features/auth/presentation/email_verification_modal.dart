import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/broncos_theme.dart';
import '../../../shared/widgets/custom_button.dart';
import '../data/auth_repository.dart';

class EmailVerificationModal extends StatefulWidget {
  final AuthRepository authRepository;

  const EmailVerificationModal({
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
      builder: (ctx) => EmailVerificationModal(
        authRepository: authRepository ?? AuthRepository(),
      ),
    );
    return result ?? false;
  }

  @override
  State<EmailVerificationModal> createState() => _EmailVerificationModalState();
}

class _EmailVerificationModalState extends State<EmailVerificationModal> {
  bool _isLoading = false;
  bool _isVerified = false;
  String? _errorMessage;
  String? _userEmail;
  String? _simulatedUrl;

  Timer? _pollingTimer;
  Timer? _cooldownTimer;
  int _cooldownSeconds = 0;

  @override
  void initState() {
    super.initState();
    _cargarUsuarioYEnviar();
    _iniciarPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _cooldownTimer?.cancel();
    super.dispose();
  }

  Future<void> _cargarUsuarioYEnviar() async {
    final user = await widget.authRepository.getCurrentUser();
    setState(() {
      _userEmail = user?['email'] ?? 'tu correo registrado';
    });
    _enviarCorreo();
  }

  void _iniciarPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      final verified = await widget.authRepository.isEmailVerified();
      if (verified && mounted) {
        timer.cancel();
        setState(() {
          _isVerified = true;
        });
        await Future.delayed(const Duration(milliseconds: 700));
        if (mounted) {
          Navigator.of(context).pop(true);
        }
      }
    });
  }

  void _iniciarCooldown(int segundos) {
    setState(() {
      _cooldownSeconds = segundos;
    });
    _cooldownTimer?.cancel();
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldownSeconds > 1) {
        setState(() {
          _cooldownSeconds--;
        });
      } else {
        timer.cancel();
        setState(() {
          _cooldownSeconds = 0;
        });
      }
    });
  }

  Future<void> _enviarCorreo() async {
    if (_cooldownSeconds > 0) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await widget.authRepository.sendEmailVerification();
      setState(() {
        _isLoading = false;
        _userEmail = res['email'] ?? _userEmail;
        _simulatedUrl = res['urlSimulada']?.toString();
        if (res['errorProveedor'] != null) {
          _errorMessage = 'Aviso de Resend: ${res['errorProveedor']}';
        }
      });
      _iniciarCooldown(45);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _abrirEnlaceDirecto() async {
    if (_simulatedUrl == null) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final uri = Uri.parse(_simulatedUrl!);
      final apiClient = ApiClient();
      await apiClient.dio.get(uri.path + (uri.hasQuery ? '?${uri.query}' : ''));

      setState(() {
        _isVerified = true;
        _isLoading = false;
      });

      await Future.delayed(const Duration(milliseconds: 700));
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Error validando enlace: $e';
      });
    }
  }

  Future<void> _comprobarManualmente() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final verified = await widget.authRepository.isEmailVerified();
      if (verified) {
        setState(() {
          _isVerified = true;
          _isLoading = false;
        });
        await Future.delayed(const Duration(milliseconds: 700));
        if (mounted) {
          Navigator.of(context).pop(true);
        }
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage =
              'Aún no detectamos la confirmación. Por favor haz clic en el enlace que te enviamos por correo.';
        });
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
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 36),
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
            // Indicador de arrastre
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
            const SizedBox(height: 22),

            // Encabezado
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _isVerified
                        ? const Color(0xFF10B981).withOpacity(0.18)
                        : BroncosColors.sunsetOrange.withOpacity(0.18),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _isVerified
                        ? Icons.check_circle_rounded
                        : Icons.mark_email_read_outlined,
                    color: _isVerified
                        ? const Color(0xFF10B981)
                        : BroncosColors.sunsetOrange,
                    size: 30,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isVerified
                            ? '¡Correo Confirmado!'
                            : 'Verificación por Correo',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 19,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        _isVerified
                            ? 'Continuando con tu compra...'
                            : 'Protección oficial anti-reventa y anti-bots',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12.5,
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
                    const Icon(Icons.error_outline,
                        color: Colors.redAccent, size: 20),
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

            if (!_isVerified) ...[
              Text(
                'Enviamos un enlace de confirmación directo a tu correo electrónico:',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  color: Colors.white70,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 12),

              // Caja con el correo del usuario
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: BroncosColors.sunsetOrange.withOpacity(0.6),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.email_outlined,
                        color: BroncosColors.sunsetOrange, size: 22),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _userEmail ?? 'Cargando correo...',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 0.3,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Indicador en vivo de espera
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F253E),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: const Color(0xFF38BDF8).withOpacity(0.35),
                  ),
                ),
                child: Row(
                  children: [
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(Color(0xFF38BDF8)),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        'Esperando que abras tu correo y hagas clic en el enlace. Esta ventana se actualizará sola en automático.',
                        style: GoogleFonts.plusJakartaSans(
                          color: Colors.white70,
                          fontSize: 12.5,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              if (_simulatedUrl != null) ...[
                const SizedBox(height: 16),
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
                            'Enlace Directo de Verificación',
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
                        'Si tu proveedor de correo tarda en entregar el mensaje, confirma tu cuenta al instante con este botón:',
                        style: GoogleFonts.plusJakartaSans(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 10),
                      CustomButton(
                        text: 'Confirmar mi cuenta ahora',
                        isLoading: _isLoading,
                        icon: Icons.link_rounded,
                        onPressed: _abrirEnlaceDirecto,
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),

              CustomButton(
                text: 'Ya confirmé mi correo',
                isLoading: _isLoading,
                icon: Icons.check_circle_outline,
                onPressed: _comprobarManualmente,
              ),

              const SizedBox(height: 12),

              Center(
                child: TextButton(
                  onPressed: (_cooldownSeconds > 0 || _isLoading)
                      ? null
                      : _enviarCorreo,
                  child: Text(
                    _cooldownSeconds > 0
                        ? 'Reenviar enlace en ${_cooldownSeconds}s'
                        : '¿No recibiste el correo? Reenviar enlace',
                    style: GoogleFonts.plusJakartaSans(
                      color: _cooldownSeconds > 0
                          ? Colors.white30
                          : BroncosColors.sunsetOrange,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ] else ...[
              // Estado verificado
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F291E),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF10B981), width: 1.5),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.verified_rounded,
                        color: Color(0xFF10B981), size: 48),
                    const SizedBox(height: 12),
                    Text(
                      '¡Identidad verificada exitosamente!',
                      style: GoogleFonts.plusJakartaSans(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Redirigiendo a la pantalla de pago de tus boletos...',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.plusJakartaSans(
                        color: Colors.white70,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
