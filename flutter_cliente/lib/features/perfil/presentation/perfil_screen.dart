import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/broncos_theme.dart';
import '../../auth/data/auth_repository.dart';

class PerfilScreen extends StatefulWidget {
  const PerfilScreen({super.key});

  @override
  State<PerfilScreen> createState() => _PerfilScreenState();
}

class _PerfilScreenState extends State<PerfilScreen> {
  final AuthRepository _authRepo = AuthRepository();

  bool _isLoading = true;
  Map<String, dynamic>? _user;

  // Formulario de cambio de contraseña
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isSavingPassword = false;

  @override
  void initState() {
    super.initState();
    _cargarPerfil();
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _cargarPerfil() async {
    setState(() => _isLoading = true);
    try {
      final user = await _authRepo.getCurrentUser();
      if (mounted) {
        setState(() {
          _user = user;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _actualizarPassword() async {
    if (!_formKey.currentState!.validate()) return;

    final currentPass = _currentPasswordController.text;
    final newPass = _newPasswordController.text;

    setState(() => _isSavingPassword = true);

    try {
      await _authRepo.changePassword(
        currentPassword: currentPass,
        newPassword: newPass,
      );

      if (mounted) {
        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
            content: Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '¡Contraseña actualizada con éxito!',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        final errorMsg = e.toString().replaceFirst('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: BroncosColors.error,
            behavior: SnackBarBehavior.floating,
            content: Row(
              children: [
                const Icon(Icons.error_outline_rounded, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    errorMsg,
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSavingPassword = false);
      }
    }
  }

  Future<void> _cerrarSesion() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Cerrar sesión?'),
        content: const Text('Tendrás que volver a ingresar tus credenciales para acceder a tus boletos.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: BroncosColors.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cerrar sesión'),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await _authRepo.logout();
      if (mounted) {
        Navigator.of(context).pushNamedAndRemoveUntil('/eventos', (route) => false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: BroncosColors.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Mi Perfil y Seguridad',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: BroncosColors.textPrimary,
          ),
        ),
        centerTitle: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: BroncosColors.sunsetOrange))
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 640),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Tarjeta de información personal
                      _buildHeaderCard(),
                      const SizedBox(height: 20),

                      // Tarjeta de datos de la cuenta
                      _buildInfoCard(),
                      const SizedBox(height: 20),

                      // Formulario de cambio de contraseña seguro
                      _buildPasswordCard(),
                      const SizedBox(height: 28),

                      // Botón para cerrar sesión
                      OutlinedButton.icon(
                        onPressed: _cerrarSesion,
                        icon: const Icon(Icons.logout_rounded, size: 18, color: BroncosColors.error),
                        label: Text(
                          'Cerrar sesión',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: BroncosColors.error,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFFCA5A5)),
                          backgroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildHeaderCard() {
    final firstName = _user?['firstName']?.toString() ?? 'Usuario';
    final lastName = _user?['lastName']?.toString() ?? '';
    final fullName = '$firstName $lastName'.trim();
    final email = _user?['email']?.toString() ?? '';
    final role = _user?['role']?.toString().toUpperCase() ?? 'USER';

    String initial = firstName.isNotEmpty ? firstName[0].toUpperCase() : 'U';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: BroncosColors.sunsetOrange.withValues(alpha: 0.15),
            child: Text(
              initial,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: BroncosColors.sunsetOrange,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fullName.isEmpty ? 'Usuario Venú' : fullName,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: BroncosColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  email,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    color: BroncosColors.textMuted,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: BroncosColors.legacyBlueSoft,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    role == 'ADMIN' ? '🛡️ Administrador' : (role == 'ORGANIZER' ? '🎟️ Organizador' : '👤 Cliente'),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: BroncosColors.legacyBlue,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    final emailVerified = _user?['emailVerified'] == true;
    final phoneVerified = _user?['phoneVerified'] == true;
    final phoneNumber = _user?['phoneNumber']?.toString();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.verified_user_outlined, size: 20, color: BroncosColors.legacyBlue),
              const SizedBox(width: 8),
              Text(
                'Seguridad e Identidad',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: BroncosColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildVerificationRow(
            title: 'Verificación por Correo',
            subtitle: _user?['email']?.toString() ?? 'Correo no disponible',
            isVerified: emailVerified,
            icon: Icons.alternate_email_rounded,
          ),
          const Divider(height: 24, color: Color(0xFFF1F5F9)),
          _buildVerificationRow(
            title: 'Verificación de Teléfono',
            subtitle: phoneNumber != null && phoneNumber.isNotEmpty ? phoneNumber : 'Sin teléfono registrado',
            isVerified: phoneVerified,
            icon: Icons.phone_android_rounded,
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationRow({
    required String title,
    required String subtitle,
    required bool isVerified,
    required IconData icon,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 20, color: BroncosColors.textSecondary),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                  color: BroncosColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  color: BroncosColors.textMuted,
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: isVerified ? const Color(0xFFECFDF5) : const Color(0xFFFEF3C7),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isVerified ? const Color(0xFFA7F3D0) : const Color(0xFFFDE68A),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isVerified ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                size: 14,
                color: isVerified ? const Color(0xFF059669) : const Color(0xFFD97706),
              ),
              const SizedBox(width: 4),
              Text(
                isVerified ? 'Verificado' : 'Pendiente',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: isVerified ? const Color(0xFF059669) : const Color(0xFFD97706),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.lock_reset_rounded, size: 20, color: BroncosColors.sunsetOrange),
                const SizedBox(width: 8),
                Text(
                  'Cambiar Contraseña',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: BroncosColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'Crea una contraseña segura de al menos 6 caracteres para proteger tu cuenta.',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12.5,
                color: BroncosColors.textMuted,
              ),
            ),
            const SizedBox(height: 20),

            // Contraseña Actual
            Text(
              'Contraseña actual',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: BroncosColors.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _currentPasswordController,
              obscureText: _obscureCurrent,
              decoration: InputDecoration(
                hintText: 'Ingresa tu contraseña actual',
                prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                suffixIcon: IconButton(
                  icon: Icon(_obscureCurrent ? Icons.visibility_off : Icons.visibility, size: 20),
                  onPressed: () => setState(() => _obscureCurrent = !_obscureCurrent),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Ingresa tu contraseña actual.';
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Nueva Contraseña
            Text(
              'Nueva contraseña',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: BroncosColors.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _newPasswordController,
              obscureText: _obscureNew,
              decoration: InputDecoration(
                hintText: 'Mínimo 6 caracteres',
                prefixIcon: const Icon(Icons.key_rounded, size: 20),
                suffixIcon: IconButton(
                  icon: Icon(_obscureNew ? Icons.visibility_off : Icons.visibility, size: 20),
                  onPressed: () => setState(() => _obscureNew = !_obscureNew),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Ingresa una nueva contraseña.';
                if (v.length < 6) return 'Debe tener al menos 6 caracteres.';
                if (v == _currentPasswordController.text) {
                  return 'La nueva contraseña no puede ser idéntica a la actual.';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Confirmar Nueva Contraseña
            Text(
              'Confirmar nueva contraseña',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: BroncosColors.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _confirmPasswordController,
              obscureText: _obscureConfirm,
              decoration: InputDecoration(
                hintText: 'Repite la nueva contraseña',
                prefixIcon: const Icon(Icons.check_circle_outline_rounded, size: 20),
                suffixIcon: IconButton(
                  icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility, size: 20),
                  onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Confirma tu nueva contraseña.';
                if (v != _newPasswordController.text) return 'Las contraseñas no coinciden.';
                return null;
              },
            ),
            const SizedBox(height: 24),

            // Botón de Guardar
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isSavingPassword ? null : _actualizarPassword,
                style: ElevatedButton.styleFrom(
                  backgroundColor: BroncosColors.sunsetOrange,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: _isSavingPassword
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.save_rounded, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            'Actualizar Contraseña',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
