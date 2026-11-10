import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/broncos_theme.dart';
import '../../../models/evento.dart';
import '../../../models/tipo_boleto.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../data/eventos_repository.dart';
import 'widgets/tipo_boleto_selector.dart';

class EventoDetalleScreen extends StatefulWidget {
  final String eventoId;
  final Evento? eventoInicial;

  const EventoDetalleScreen({
    super.key,
    required this.eventoId,
    this.eventoInicial,
  });

  @override
  State<EventoDetalleScreen> createState() => _EventoDetalleScreenState();
}

class _EventoDetalleScreenState extends State<EventoDetalleScreen> {
  final EventosRepository _repository = EventosRepository();
  Evento? _evento;
  List<TipoBoleto> _tiposBoleto = [];
  bool _isLoading = true;
  String? _errorMessage;

  final Map<String, int> _cantidades = {};

  @override
  void initState() {
    super.initState();
    _evento = widget.eventoInicial;
    _cargarDetalles();
  }

  Future<void> _cargarDetalles() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final evento = await _repository.getEventoById(widget.eventoId);
      final tipos = await _repository.getTiposBoleto(widget.eventoId);

      if (mounted) {
        setState(() {
          _evento = evento;
          _tiposBoleto = tipos.isNotEmpty ? tipos : evento.tiposBoleto;
          for (var t in _tiposBoleto) {
            _cantidades.putIfAbsent(t.id, () => 0);
          }
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

  int get _totalBoletosSeleccionados {
    return _cantidades.values.fold(0, (sum, val) => sum + val);
  }

  double get _totalMonto {
    double total = 0.0;
    for (var tipo in _tiposBoleto) {
      final cant = _cantidades[tipo.id] ?? 0;
      total += cant * tipo.precio;
    }
    return total;
  }

  void _irACheckout() {
    if (_totalBoletosSeleccionados <= 0 || _evento == null) return;

    final itemsSeleccionados = <Map<String, dynamic>>[];
    for (var tipo in _tiposBoleto) {
      final cant = _cantidades[tipo.id] ?? 0;
      if (cant > 0) {
        itemsSeleccionados.add({
          'tipoBoleto': tipo,
          'cantidad': cant,
        });
      }
    }

    Navigator.of(context).pushNamed(
      '/checkout',
      arguments: {
        'evento': _evento!,
        'items': itemsSeleccionados,
        'total': _totalMonto,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BroncosColors.background,
      appBar: AppBar(
        title: Text(
          'Detalle del evento',
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
        actions: [
          IconButton(
            tooltip: 'Compartir',
            icon: const Icon(Icons.share_outlined, size: 20),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Enlace copiado al portapapeles.'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: _isLoading
          ? const LoadingIndicator(message: 'Cargando información del evento...')
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(28.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline_rounded,
                            size: 42, color: BroncosColors.sunsetOrange),
                        const SizedBox(height: 12),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.plusJakartaSans(
                            color: BroncosColors.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 18),
                        SizedBox(
                          width: 160,
                          child: CustomButton(
                            text: 'Reintentar',
                            onPressed: _cargarDetalles,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : _evento == null
                  ? const Center(child: Text('Evento no encontrado'))
                  : Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 860),
                        child: Column(
                          children: [
                            Expanded(
                              child: ListView(
                                padding: const EdgeInsets.only(bottom: 24),
                                children: [
                                  // Hero Image with smooth aspect ratio
                                  if (_evento!.imageUrl != null && _evento!.imageUrl!.isNotEmpty)
                                    Stack(
                                      children: [
                                        Image.network(
                                          _evento!.imageUrl!,
                                          height: 250,
                                          width: double.infinity,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) =>
                                              _buildImageFallback(),
                                        ),
                                        Positioned.fill(
                                          child: Container(
                                            decoration: BoxDecoration(
                                              gradient: LinearGradient(
                                                begin: Alignment.topCenter,
                                                end: Alignment.bottomCenter,
                                                colors: [
                                                  Colors.transparent,
                                                  Colors.black.withValues(alpha: 0.35),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    )
                                  else
                                    _buildImageFallback(),

                                  // Content details
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        if (_evento!.estaReprogramado) ...[
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF3E8FF),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: const Color(0xFFD8B4FE)),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.schedule_rounded, size: 14, color: Color(0xFF7C3AED)),
                                                const SizedBox(width: 6),
                                                Text(
                                                  'EVENTO REPROGRAMADO',
                                                  style: GoogleFonts.plusJakartaSans(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w800,
                                                    color: const Color(0xFF6B21A8),
                                                    letterSpacing: 0.5,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          const SizedBox(height: 10),
                                        ],
                                        // Title
                                        Text(
                                          _evento!.name,
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 24,
                                            fontWeight: FontWeight.w800,
                                            color: BroncosColors.textPrimary,
                                            letterSpacing: -0.5,
                                            height: 1.25,
                                          ),
                                        ),
                                        const SizedBox(height: 16),

                                        // Modern Info Card
                                        Container(
                                          padding: const EdgeInsets.all(16),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(16),
                                            border: Border.all(color: BroncosColors.borderOutline),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.black.withValues(alpha: 0.02),
                                                blurRadius: 8,
                                                offset: const Offset(0, 2),
                                              ),
                                            ],
                                          ),
                                          child: Column(
                                            children: [
                                              _buildDetailRow(
                                                icon: Icons.calendar_today_rounded,
                                                iconColor: BroncosColors.sunsetOrange,
                                                title: 'Fecha del evento',
                                                subtitle: Formatters.formatDate(_evento!.startDate),
                                              ),
                                              const Divider(height: 20, color: BroncosColors.borderLight),
                                              _buildDetailRow(
                                                icon: Icons.location_on_outlined,
                                                iconColor: BroncosColors.legacyBlue,
                                                title: 'Recinto y ubicación',
                                                subtitle: _evento!.venueName ?? 'Por confirmar',
                                                trailingText: _evento!.city,
                                              ),
                                              const Divider(height: 20, color: BroncosColors.borderLight),
                                              _buildDetailRow(
                                                icon: Icons.verified_outlined,
                                                iconColor: BroncosColors.success,
                                                title: 'Garantía oficial',
                                                subtitle: 'Boletos 100% verificados y asegurados',
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(height: 22),

                                        // Description section
                                        if (_evento!.description != null &&
                                            _evento!.description!.isNotEmpty) ...[
                                          Text(
                                            'Acerca del evento',
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 17,
                                              fontWeight: FontWeight.w700,
                                              color: BroncosColors.textPrimary,
                                              letterSpacing: -0.2,
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Container(
                                            width: double.infinity,
                                            padding: const EdgeInsets.all(16),
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(16),
                                              border: Border.all(color: BroncosColors.borderOutline),
                                            ),
                                            child: Text(
                                              _evento!.description!,
                                              style: GoogleFonts.plusJakartaSans(
                                                color: BroncosColors.textPrimary,
                                                fontSize: 14,
                                                height: 1.55,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 24),
                                        ],

                                        // Tickets Selection
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              'Selecciona tus boletos',
                                              style: GoogleFonts.plusJakartaSans(
                                                fontSize: 17,
                                                fontWeight: FontWeight.w700,
                                                color: BroncosColors.textPrimary,
                                                letterSpacing: -0.2,
                                              ),
                                            ),
                                            if (_tiposBoleto.isNotEmpty)
                                              Text(
                                                '${_tiposBoleto.length} opciones',
                                                style: GoogleFonts.plusJakartaSans(
                                                  fontSize: 12.5,
                                                  fontWeight: FontWeight.w600,
                                                  color: BroncosColors.textSecondary,
                                                ),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 12),

                                        if (_tiposBoleto.isEmpty)
                                          Container(
                                            width: double.infinity,
                                            padding: const EdgeInsets.all(24),
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(16),
                                              border: Border.all(color: BroncosColors.borderOutline),
                                            ),
                                            child: Center(
                                              child: Text(
                                                'No hay boletos disponibles para este evento en este momento.',
                                                style: GoogleFonts.plusJakartaSans(
                                                  color: BroncosColors.textSecondary,
                                                  fontSize: 13.5,
                                                ),
                                              ),
                                            ),
                                          )
                                        else
                                          ..._tiposBoleto.map(
                                            (tipo) => TipoBoletoSelector(
                                              tipoBoleto: tipo,
                                              cantidad: _cantidades[tipo.id] ?? 0,
                                              onCantidadChanged: (newCant) {
                                                setState(() {
                                                  _cantidades[tipo.id] = newCant;
                                                });
                                              },
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Bottom Floating Dock Summary Bar
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                border: const Border(
                                  top: BorderSide(color: Color(0xFFE2E8F0)),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.04),
                                    blurRadius: 16,
                                    offset: const Offset(0, -4),
                                  ),
                                ],
                              ),
                              child: SafeArea(
                                child: Row(
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          _totalBoletosSeleccionados == 1
                                              ? '1 boleto seleccionado'
                                              : '$_totalBoletosSeleccionados boletos seleccionados',
                                          style: GoogleFonts.plusJakartaSans(
                                            color: BroncosColors.textSecondary,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          Formatters.formatCurrency(_totalMonto),
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 20,
                                            fontWeight: FontWeight.w800,
                                            color: BroncosColors.textPrimary,
                                            letterSpacing: -0.4,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(width: 20),
                                    Expanded(
                                      child: CustomButton(
                                        text: 'Continuar compra',
                                        icon: Icons.shopping_bag_outlined,
                                        onPressed: _totalBoletosSeleccionados > 0 ? _irACheckout : null,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    String? trailingText,
  }) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: iconColor),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w500,
                  color: BroncosColors.textSecondary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: BroncosColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
        if (trailingText != null) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              trailingText,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: BroncosColors.textSecondary,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildImageFallback() {
    return Container(
      height: 200,
      color: BroncosColors.legacyBlue,
      child: Center(
        child: Icon(
          Icons.festival_rounded,
          size: 64,
          color: Colors.white.withValues(alpha: 0.3),
        ),
      ),
    );
  }
}
