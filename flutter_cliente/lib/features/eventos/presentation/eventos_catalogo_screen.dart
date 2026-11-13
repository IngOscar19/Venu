import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/broncos_theme.dart';
import '../../../models/evento.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/custom_button.dart';
import '../../../shared/widgets/loading_indicator.dart';
import '../../auth/data/auth_repository.dart';
import '../data/eventos_repository.dart';

class EventosCatalogoScreen extends StatefulWidget {
  const EventosCatalogoScreen({super.key});

  @override
  State<EventosCatalogoScreen> createState() => _EventosCatalogoScreenState();
}

class _EventosCatalogoScreenState extends State<EventosCatalogoScreen> {
  final EventosRepository _repository = EventosRepository();
  final AuthRepository _authRepo = AuthRepository();
  final TextEditingController _searchController = TextEditingController();

  List<Evento> _eventos = [];
  List<Evento> _eventosFiltrados = [];
  bool _isLoading = true;
  bool _isAuthenticated = false;
  Map<String, dynamic>? _currentUser;
  String? _errorMessage;
  String _selectedCategory = 'todos';

  final List<Map<String, dynamic>> _categorias = [
    {'id': 'todos', 'label': 'Todos', 'icon': Icons.grid_view_rounded},
    {'id': 'concierto', 'label': 'Conciertos', 'icon': Icons.music_note_rounded},
    {'id': 'teatro', 'label': 'Teatro', 'icon': Icons.theater_comedy_rounded},
    {'id': 'festival', 'label': 'Festivales', 'icon': Icons.festival_rounded},
  ];

  @override
  void initState() {
    super.initState();
    // 1. Mostrar de inmediato la caché si ya existe para evitar parpadeos
    if (_repository.cachedEventos != null && _repository.cachedEventos!.isNotEmpty) {
      _eventos = List.from(_repository.cachedEventos!);
      _eventosFiltrados = List.from(_repository.cachedEventos!);
      _isLoading = false;
    }

    // 2. Ejecutar la llamada tras el primer cuadro para permitir que el sandbox de red esté listo
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _verificarAuth();
      _cargarEventos(mostrarCargando: _eventos.isEmpty);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _verificarAuth() async {
    final auth = await _authRepo.isAuthenticated();
    Map<String, dynamic>? user;
    if (auth) {
      user = await _authRepo.getCurrentUser();
    }
    if (mounted) {
      setState(() {
        _isAuthenticated = auth;
        _currentUser = user;
      });
    }
  }

  Future<void> _cargarEventos({bool mostrarCargando = true}) async {
    if (mostrarCargando) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final list = await _repository.getEventos();
      if (mounted) {
        setState(() {
          _eventos = list;
          _errorMessage = null;
          _aplicarFiltros();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          if (_eventos.isEmpty) {
            _errorMessage = e.toString().replaceFirst('Exception: ', '');
          }
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

  void _aplicarFiltros() {
    final query = _searchController.text.toLowerCase().trim();
    setState(() {
      _eventosFiltrados = _eventos.where((ev) {
        final matchSearch = query.isEmpty ||
            ev.name.toLowerCase().contains(query) ||
            (ev.venueName != null && ev.venueName!.toLowerCase().contains(query)) ||
            (ev.city != null && ev.city!.toLowerCase().contains(query)) ||
            (ev.description != null && ev.description!.toLowerCase().contains(query));

        final matchCategory = _selectedCategory == 'todos' ||
            ev.name.toLowerCase().contains(_selectedCategory) ||
            (ev.description != null && ev.description!.toLowerCase().contains(_selectedCategory));

        return matchSearch && matchCategory;
      }).toList();
    });
  }

  void _abrirMisBoletos() async {
    final loggedIn = await _authRepo.isAuthenticated();
    if (!loggedIn && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Inicia sesión para consultar tus boletos.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.of(context).pushNamed('/login').then((_) => _verificarAuth());
      return;
    }
    if (mounted) {
      Navigator.of(context).pushNamed('/mis-boletos');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BroncosColors.background,
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        titleSpacing: 0,
        title: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1040),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [BroncosColors.sunsetOrange, Color(0xFFFF7A45)],
                      ),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: BroncosColors.sunsetOrange.withValues(alpha: 0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.confirmation_number_outlined,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Venú',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: BroncosColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Mis boletos',
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: BroncosColors.legacyBlueSoft,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.qr_code_2_rounded,
                        size: 19,
                        color: BroncosColors.legacyBlue,
                      ),
                    ),
                    onPressed: _abrirMisBoletos,
                  ),
                  const SizedBox(width: 6),
                  if (_isAuthenticated)
                    PopupMenuButton<String>(
                      tooltip: 'Perfil',
                      offset: const Offset(0, 48),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      itemBuilder: (context) => [
                        PopupMenuItem<String>(
                          enabled: false,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${_currentUser?['firstName'] ?? 'Usuario'} ${_currentUser?['lastName'] ?? ''}'.trim(),
                                style: GoogleFonts.plusJakartaSans(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13.5,
                                  color: BroncosColors.textPrimary,
                                ),
                              ),
                              Text(
                                _currentUser?['email'] ?? '',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 11.5,
                                  color: BroncosColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const PopupMenuDivider(),
                        PopupMenuItem<String>(
                          value: 'perfil',
                          child: Row(
                            children: [
                              const Icon(Icons.person_outline_rounded, size: 18, color: BroncosColors.textSecondary),
                              const SizedBox(width: 10),
                              Text('Mi perfil y seguridad', style: GoogleFonts.plusJakartaSans(fontSize: 13.5)),
                            ],
                          ),
                        ),
                        PopupMenuItem<String>(
                          value: 'boletos',
                          child: Row(
                            children: [
                              const Icon(Icons.qr_code_2_rounded, size: 18, color: BroncosColors.textSecondary),
                              const SizedBox(width: 10),
                              Text('Mis boletos', style: GoogleFonts.plusJakartaSans(fontSize: 13.5)),
                            ],
                          ),
                        ),
                        PopupMenuItem<String>(
                          value: 'logout',
                          child: Row(
                            children: [
                              const Icon(Icons.logout_rounded, size: 18, color: BroncosColors.error),
                              const SizedBox(width: 10),
                              Text(
                                'Cerrar sesión',
                                style: GoogleFonts.plusJakartaSans(
                                   fontSize: 13.5,
                                   color: BroncosColors.error,
                                   fontWeight: FontWeight.w600,
                                 ),
                               ),
                             ],
                           ),
                         ),
                       ],
                       onSelected: (val) async {
                         if (val == 'perfil') {
                           Navigator.of(context).pushNamed('/perfil').then((_) => _verificarAuth());
                         } else if (val == 'boletos') {
                           _abrirMisBoletos();
                         } else if (val == 'logout') {
                          await _authRepo.logout();
                          await _verificarAuth();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Sesión cerrada correctamente.'),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          }
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const BorderSide(color: Color(0xFFE2E8F0)).color),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.person_rounded, size: 17, color: BroncosColors.textPrimary),
                            const SizedBox(width: 6),
                            Text(
                              _currentUser?['firstName'] ?? 'Cuenta',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: BroncosColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).pushNamed('/login').then((_) {
                          _verificarAuth();
                          if (_eventos.isEmpty) {
                            _cargarEventos();
                          }
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: BroncosColors.sunsetOrange,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: BroncosColors.sunsetOrange.withValues(alpha: 0.25),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Text(
                          'Iniciar sesión',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const LoadingIndicator(message: 'Cargando cartelera de eventos...')
          : _errorMessage != null
              ? _buildErrorState()
              : Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1040),
                    child: RefreshIndicator(
                      color: BroncosColors.sunsetOrange,
                      onRefresh: _cargarEventos,
                      child: ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                        children: [
                          // Modern Search Bar
                          Container(
                            height: 50,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: BroncosColors.borderOutline),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.02),
                                  blurRadius: 10,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: TextField(
                              controller: _searchController,
                              onChanged: (_) => _aplicarFiltros(),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w500,
                              ),
                              decoration: InputDecoration(
                                filled: false,
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                                hintText: 'Buscar eventos, recintos o ciudades...',
                                hintStyle: GoogleFonts.plusJakartaSans(
                                  color: BroncosColors.textMuted,
                                  fontSize: 14,
                                ),
                                prefixIcon: const Icon(
                                  Icons.search_rounded,
                                  color: BroncosColors.textSecondary,
                                  size: 21,
                                ),
                                suffixIcon: _searchController.text.isNotEmpty
                                    ? IconButton(
                                        icon: const Icon(Icons.close_rounded, size: 18),
                                        onPressed: () {
                                          _searchController.clear();
                                          _aplicarFiltros();
                                        },
                                      )
                                    : null,
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Category Filter Chips
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: _categorias.map((cat) {
                                final isSelected = _selectedCategory == cat['id'];
                                return Padding(
                                  padding: const EdgeInsets.only(right: 8.0),
                                  child: GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _selectedCategory = cat['id'] as String;
                                        _aplicarFiltros();
                                      });
                                    },
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 180),
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: isSelected ? BroncosColors.textPrimary : Colors.white,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: isSelected
                                              ? BroncosColors.textPrimary
                                              : BroncosColors.borderOutline,
                                        ),
                                        boxShadow: isSelected
                                            ? [
                                                BoxShadow(
                                                  color: Colors.black.withValues(alpha: 0.06),
                                                  blurRadius: 6,
                                                  offset: const Offset(0, 2),
                                                ),
                                              ]
                                            : null,
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            cat['icon'] as IconData,
                                            size: 15,
                                            color: isSelected ? Colors.white : BroncosColors.textSecondary,
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            cat['label'] as String,
                                            style: GoogleFonts.plusJakartaSans(
                                              fontSize: 13,
                                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                              color: isSelected ? Colors.white : BroncosColors.textSecondary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                          const SizedBox(height: 22),

                          // Featured Event / Hero Header
                          if (_eventosFiltrados.isNotEmpty) ...[
                            Row(
                              children: [
                                const Icon(Icons.star_rounded, size: 18, color: BroncosColors.sunsetOrange),
                                const SizedBox(width: 6),
                                Text(
                                  'Destacado',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.3,
                                    color: BroncosColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            _buildHeroEventCard(_eventosFiltrados.first),
                            const SizedBox(height: 26),
                          ],

                          // Section Title: Próximos eventos
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Cartelera de eventos',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.3,
                                  color: BroncosColors.textPrimary,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  '${_eventosFiltrados.length}',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: BroncosColors.textSecondary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          if (_eventosFiltrados.isEmpty)
                            _buildEmptyState()
                          else
                            // Event cards list
                            ..._eventosFiltrados.map((ev) => _buildEventCard(ev)),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
                ),
    );
  }

  Widget _buildHeroEventCard(Evento evento) {
    String minPrice = '';
    if (evento.tiposBoleto.isNotEmpty) {
      final prices = evento.tiposBoleto.map((t) => t.precio).toList();
      prices.sort();
      minPrice = 'Desde ${Formatters.formatCurrency(prices.first)}';
    }

    return GestureDetector(
      onTap: () {
        Navigator.of(context).pushNamed(
          '/evento-detalle',
          arguments: {'eventoId': evento.id, 'evento': evento},
        );
      },
      child: Container(
        height: 250,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Image
            if (evento.imageUrl != null && evento.imageUrl!.isNotEmpty)
              Image.network(
                evento.imageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => _buildImagePlaceholder(),
              )
            else
              _buildImagePlaceholder(),

            // Gradient Scrim
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.1),
                    Colors.black.withValues(alpha: 0.45),
                    Colors.black.withValues(alpha: 0.88),
                  ],
                  stops: const [0.0, 0.45, 1.0],
                ),
              ),
            ),

            // Top Badges
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Flexible(
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: BroncosColors.sunsetOrange,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'DESTACADO',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.6,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        if (evento.estaReprogramado)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFF7C3AED),
                              borderRadius: BorderRadius.circular(8),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF7C3AED).withValues(alpha: 0.4),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.schedule_rounded, size: 12, color: Colors.white),
                                const SizedBox(width: 4),
                                Text(
                                  'REPROGRAMADO',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.6,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (minPrice.isNotEmpty) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                      ),
                      child: Text(
                        minPrice,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Bottom Content
            Positioned(
              bottom: 18,
              left: 18,
              right: 18,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    evento.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: -0.4,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (evento.startDate != null) ...[
                        const Icon(Icons.calendar_today_rounded, size: 14, color: Colors.white70),
                        const SizedBox(width: 5),
                        Text(
                          Formatters.formatDate(evento.startDate),
                          style: GoogleFonts.plusJakartaSans(
                            color: Colors.white.withValues(alpha: 0.95),
                            fontSize: 12.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 14),
                      ],
                      if (evento.city != null) ...[
                        const Icon(Icons.location_on_rounded, size: 14, color: Colors.white70),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            evento.city!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              color: Colors.white.withValues(alpha: 0.95),
                              fontSize: 12.5,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEventCard(Evento evento) {
    String minPrice = '';
    if (evento.tiposBoleto.isNotEmpty) {
      final prices = evento.tiposBoleto.map((t) => t.precio).toList();
      prices.sort();
      minPrice = Formatters.formatCurrency(prices.first);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.of(context).pushNamed(
              '/evento-detalle',
              arguments: {'eventoId': evento.id, 'evento': evento},
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                // Thumbnail
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SizedBox(
                    width: 86,
                    height: 86,
                    child: evento.imageUrl != null && evento.imageUrl!.isNotEmpty
                        ? Image.network(
                            evento.imageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                _buildDateThumbnail(evento.startDate),
                          )
                        : _buildDateThumbnail(evento.startDate),
                  ),
                ),
                const SizedBox(width: 14),

                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (evento.estaReprogramado)
                        Container(
                          margin: const EdgeInsets.only(bottom: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3E8FF),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFD8B4FE)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.schedule_rounded, size: 11, color: Color(0xFF7C3AED)),
                              const SizedBox(width: 4),
                              Text(
                                'REPROGRAMADO',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF6B21A8),
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      Text(
                        evento.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15.5,
                          fontWeight: FontWeight.w700,
                          color: BroncosColors.textPrimary,
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 5),
                      if (evento.startDate != null)
                        Row(
                          children: [
                            const Icon(
                              Icons.calendar_today_rounded,
                              size: 13,
                              color: BroncosColors.textMuted,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              Formatters.formatDate(evento.startDate),
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: BroncosColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      const SizedBox(height: 3),
                      if (evento.venueName != null)
                        Row(
                          children: [
                            const Icon(
                              Icons.location_on_outlined,
                              size: 13,
                              color: BroncosColors.textMuted,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                '${evento.venueName!}${evento.city != null ? ' • ${evento.city}' : ''}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: BroncosColors.textSecondary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      const SizedBox(height: 6),
                      if (minPrice.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: BroncosColors.sunsetOrangeLight,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Desde $minPrice',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: BroncosColors.sunsetOrange,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),

                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 14,
                  color: BroncosColors.textMuted,
                ),
                const SizedBox(width: 4),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDateThumbnail(DateTime? date) {
    if (date == null) {
      return Container(
        color: BroncosColors.legacyBlueSoft,
        child: const Center(
          child: Icon(Icons.festival_rounded, color: BroncosColors.legacyBlue, size: 28),
        ),
      );
    }

    final months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    final monthStr = months[date.month - 1];

    return Container(
      color: BroncosColors.legacyBlueSoft,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '${date.day}',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 22,
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

  Widget _buildImagePlaceholder() {
    return Container(
      color: BroncosColors.legacyBlue,
      child: Center(
        child: Icon(
          Icons.festival_rounded,
          size: 54,
          color: Colors.white.withValues(alpha: 0.3),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(40),
      alignment: Alignment.center,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.search_off_rounded,
              size: 40,
              color: BroncosColors.textMuted,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'No encontramos eventos coincidentes',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: BroncosColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Prueba buscando con otro término o selecciona otra categoría.',
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              color: BroncosColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: BroncosColors.errorContainer,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.wifi_off_rounded,
                size: 38,
                color: BroncosColors.error,
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'No pudimos conectar con el servidor',
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: BroncosColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? 'Verifica tu conexión a internet e intenta nuevamente.',
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13.5,
                color: BroncosColors.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: 200,
              child: CustomButton(
                text: 'Reintentar',
                icon: Icons.refresh_rounded,
                isLoading: _isLoading,
                onPressed: () => _cargarEventos(mostrarCargando: true),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
