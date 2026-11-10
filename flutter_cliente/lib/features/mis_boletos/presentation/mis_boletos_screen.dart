import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/broncos_theme.dart';
import '../../../models/boleto.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/boletos_repository.dart';

class MisBoletosScreen extends StatefulWidget {
  const MisBoletosScreen({super.key});

  @override
  State<MisBoletosScreen> createState() => _MisBoletosScreenState();
}

class _MisBoletosScreenState extends State<MisBoletosScreen> {
  final BoletosRepository _repository = BoletosRepository();
  List<Boleto> _boletos = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _cargarBoletos();
  }

  Future<void> _cargarBoletos() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final list = await _repository.getMisBoletos();
      if (mounted) {
        setState(() {
          _boletos = list;
        });
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
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BroncosColors.background,
      appBar: AppBar(
        title: Text(
          'Mis boletos',
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
          constraints: const BoxConstraints(maxWidth: 780),
          child: _isLoading
              ? const LoadingIndicator(message: 'Cargando tus boletos...')
              : _errorMessage != null
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(28.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(18),
                              decoration: BoxDecoration(
                                color: BroncosColors.errorContainer,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.error_outline_rounded,
                                size: 38,
                                color: BroncosColors.error,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No pudimos cargar tus boletos',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: BroncosColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _errorMessage!,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.plusJakartaSans(
                                color: BroncosColors.textSecondary,
                                fontSize: 13.5,
                              ),
                            ),
                            const SizedBox(height: 20),
                            SizedBox(
                              width: 170,
                              child: CustomButton(
                                text: 'Reintentar',
                                icon: Icons.refresh_rounded,
                                onPressed: _cargarBoletos,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : _boletos.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32.0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(22),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.confirmation_number_outlined,
                                    size: 44,
                                    color: BroncosColors.textMuted,
                                  ),
                                ),
                                const SizedBox(height: 20),
                                Text(
                                  'Aún no tienes boletos',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: BroncosColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Tus entradas compradas con código QR oficial aparecerán aquí.',
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13.5,
                                    color: BroncosColors.textSecondary,
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 24),
                                SizedBox(
                                  width: 190,
                                  child: CustomButton(
                                    text: 'Explorar eventos',
                                    icon: Icons.search_rounded,
                                    onPressed: () {
                                      Navigator.of(context).pushNamedAndRemoveUntil(
                                        '/eventos',
                                        (route) => false,
                                      );
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      : RefreshIndicator(
                          color: BroncosColors.sunsetOrange,
                          onRefresh: _cargarBoletos,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                            itemCount: _boletos.length,
                            itemBuilder: (context, index) {
                              final boleto = _boletos[index];
                              final bool valido = boleto.esValido;

                              return Container(
                                margin: const EdgeInsets.only(bottom: 14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(color: BroncosColors.borderOutline),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.02),
                                      blurRadius: 10,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                clipBehavior: Clip.antiAlias,
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    onTap: () {
                                      Navigator.of(context).pushNamed(
                                        '/boleto-detalle',
                                        arguments: boleto,
                                      );
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.all(16.0),
                                      child: Row(
                                        children: [
                                          // Date Badge
                                          _buildDateBadge(boleto.eventStartDate ?? boleto.fechaEmision),
                                          const SizedBox(width: 16),

                                          // Info
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                      decoration: BoxDecoration(
                                                        color: valido
                                                            ? BroncosColors.successContainer
                                                            : BroncosColors.errorContainer,
                                                        borderRadius: BorderRadius.circular(6),
                                                      ),
                                                      child: Text(
                                                        valido ? 'VÁLIDO' : boleto.estado.toUpperCase(),
                                                        style: GoogleFonts.plusJakartaSans(
                                                          fontSize: 10.5,
                                                          fontWeight: FontWeight.w800,
                                                          color: valido
                                                              ? BroncosColors.successText
                                                              : BroncosColors.errorText,
                                                          letterSpacing: 0.4,
                                                        ),
                                                      ),
                                                    ),
                                                    if (boleto.tipoBoletoNombre != null) ...[
                                                      const SizedBox(width: 8),
                                                      Text(
                                                        boleto.tipoBoletoNombre!,
                                                        style: GoogleFonts.plusJakartaSans(
                                                          fontSize: 12,
                                                          fontWeight: FontWeight.w600,
                                                          color: BroncosColors.textSecondary,
                                                        ),
                                                      ),
                                                    ],
                                                  ],
                                                ),
                                                const SizedBox(height: 6),
                                                Text(
                                                  boleto.eventoNombre,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: GoogleFonts.plusJakartaSans(
                                                    fontSize: 15.5,
                                                    fontWeight: FontWeight.w700,
                                                    color: BroncosColors.textPrimary,
                                                    letterSpacing: -0.2,
                                                  ),
                                                ),
                                                if (boleto.venueName != null) ...[
                                                  const SizedBox(height: 3),
                                                  Text(
                                                    boleto.venueName!,
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: GoogleFonts.plusJakartaSans(
                                                      fontSize: 12,
                                                      color: BroncosColors.textSecondary,
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ),

                                          const SizedBox(width: 12),
                                          Container(
                                            padding: const EdgeInsets.all(10),
                                            decoration: BoxDecoration(
                                              color: BroncosColors.legacyBlueSoft,
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: const Icon(
                                              Icons.qr_code_2_rounded,
                                              size: 24,
                                              color: BroncosColors.legacyBlue,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
        ),
      ),
    );
  }

  Widget _buildDateBadge(DateTime? date) {
    if (date == null) {
      return Container(
        width: 58,
        height: 62,
        decoration: BoxDecoration(
          color: BroncosColors.legacyBlueSoft,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: Icon(Icons.confirmation_number_outlined, color: BroncosColors.legacyBlue, size: 24),
        ),
      );
    }

    final months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    final monthStr = months[date.month - 1];

    return Container(
      width: 58,
      height: 62,
      decoration: BoxDecoration(
        color: BroncosColors.legacyBlueSoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: BroncosColors.legacyBlueBorder),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '${date.day}',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: BroncosColors.legacyBlue,
              height: 1.1,
            ),
          ),
          Text(
            monthStr.toUpperCase(),
            style: GoogleFonts.plusJakartaSans(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
              color: BroncosColors.sunsetOrange,
            ),
          ),
        ],
      ),
    );
  }
}
