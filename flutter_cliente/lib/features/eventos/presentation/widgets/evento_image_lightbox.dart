import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/broncos_theme.dart';
import '../../../../models/evento_imagen.dart';

class EventoImageLightbox extends StatefulWidget {
  final List<EventoImagen> images;
  final int initialIndex;
  final String eventName;

  const EventoImageLightbox({
    super.key,
    required this.images,
    this.initialIndex = 0,
    required this.eventName,
  });

  static Future<void> show({
    required BuildContext context,
    required List<EventoImagen> images,
    int initialIndex = 0,
    required String eventName,
  }) {
    if (images.isEmpty) return Future.value();
    return showDialog(
      context: context,
      barrierColor: Colors.transparent,
      useSafeArea: false,
      builder: (_) => EventoImageLightbox(
        images: images,
        initialIndex: initialIndex,
        eventName: eventName,
      ),
    );
  }

  @override
  State<EventoImageLightbox> createState() => _EventoImageLightboxState();
}

class _EventoImageLightboxState extends State<EventoImageLightbox> {
  late PageController _pageController;
  late int _currentIndex;
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex.clamp(0, widget.images.length - 1);
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _irAImagen(int index) {
    if (index < 0 || index >= widget.images.length) return;
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeInOut,
    );
  }

  void _handleKeyEvent(KeyEvent event) {
    if (event is KeyDownEvent) {
      if (event.logicalKey == LogicalKeyboardKey.escape) {
        Navigator.of(context).pop();
      } else if (event.logicalKey == LogicalKeyboardKey.arrowLeft) {
        if (_currentIndex > 0) {
          _irAImagen(_currentIndex - 1);
        }
      } else if (event.logicalKey == LogicalKeyboardKey.arrowRight) {
        if (_currentIndex < widget.images.length - 1) {
          _irAImagen(_currentIndex + 1);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) return const SizedBox.shrink();

    final currentImg = widget.images[_currentIndex];
    final isPoster = currentImg.isPoster || _currentIndex == 0;

    return KeyboardListener(
      focusNode: _focusNode,
      autofocus: true,
      onKeyEvent: _handleKeyEvent,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Stack(
          fit: StackFit.expand,
          children: [
            // Fondo oscuro con desenfoque de cristal (BackdropFilter)
            BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(
                color: Colors.black.withValues(alpha: 0.94),
              ),
            ),

            // Contenido principal
            SafeArea(
              child: Column(
                children: [
                  // Top Bar con información de la imagen y botón de cierre
                  _buildTopBar(isPoster),

                  // Área central: PageView interactivo con soporte de zoom
                  Expanded(
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        PageView.builder(
                          controller: _pageController,
                          itemCount: widget.images.length,
                          onPageChanged: (idx) {
                            setState(() => _currentIndex = idx);
                          },
                          itemBuilder: (context, index) {
                            final img = widget.images[index];
                            return InteractiveViewer(
                              minScale: 1.0,
                              maxScale: 4.5,
                              clipBehavior: Clip.none,
                              child: Center(
                                child: Image.network(
                                  img.url,
                                  fit: BoxFit.contain,
                                  loadingBuilder: (context, child, loadingProgress) {
                                    if (loadingProgress == null) return child;
                                    return const Center(
                                      child: CircularProgressIndicator(
                                        color: BroncosColors.sunsetOrange,
                                        strokeWidth: 2.5,
                                      ),
                                    );
                                  },
                                  errorBuilder: (context, error, stackTrace) {
                                    return Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(
                                          Icons.broken_image_outlined,
                                          size: 48,
                                          color: Colors.white54,
                                        ),
                                        const SizedBox(height: 12),
                                        Text(
                                          'No se pudo cargar la imagen en tamaño completo.',
                                          style: GoogleFonts.plusJakartaSans(
                                            color: Colors.white70,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ],
                                    );
                                  },
                                ),
                              ),
                            );
                          },
                        ),

                        // Flecha anterior (si no es la primera)
                        if (_currentIndex > 0)
                          Positioned(
                            left: 16,
                            child: _buildNavButton(
                              icon: Icons.chevron_left_rounded,
                              tooltip: 'Imagen anterior',
                              onPressed: () => _irAImagen(_currentIndex - 1),
                            ),
                          ),

                        // Flecha siguiente (si no es la última)
                        if (_currentIndex < widget.images.length - 1)
                          Positioned(
                            right: 16,
                            child: _buildNavButton(
                              icon: Icons.chevron_right_rounded,
                              tooltip: 'Siguiente imagen',
                              onPressed: () => _irAImagen(_currentIndex + 1),
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Tira de miniaturas inferior (si hay más de 1 imagen)
                  if (widget.images.length > 1) _buildThumbnailStrip(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar(bool isPoster) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.4),
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: BroncosColors.sunsetOrange.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: BroncosColors.sunsetOrange.withValues(alpha: 0.35),
              ),
            ),
            child: const Icon(
              Icons.image_outlined,
              size: 20,
              color: BroncosColors.sunsetOrange,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  widget.eventName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.plusJakartaSans(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: BroncosColors.sunsetOrange.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: BroncosColors.sunsetOrange.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Text(
                        isPoster ? 'Foto de Portada' : 'Galería del Evento',
                        style: GoogleFonts.plusJakartaSans(
                          color: const Color(0xFFFF8A65),
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      '${_currentIndex + 1} de ${widget.images.length}',
                      style: GoogleFonts.plusJakartaSans(
                        color: Colors.white60,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Cerrar (Esc)',
            icon: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close_rounded, size: 20, color: Colors.white),
            ),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  Widget _buildNavButton({
    required IconData icon,
    required String tooltip,
    required VoidCallback onPressed,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(30),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.65),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 12,
              ),
            ],
          ),
          child: Icon(icon, color: Colors.white, size: 26),
        ),
      ),
    );
  }

  Widget _buildThumbnailStrip() {
    return Container(
      height: 82,
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.4),
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
      child: Center(
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          shrinkWrap: true,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: widget.images.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (context, index) {
            final isSelected = index == _currentIndex;
            final img = widget.images[index];

            return GestureDetector(
              onTap: () => _irAImagen(index),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isSelected ? BroncosColors.sunsetOrange : Colors.transparent,
                    width: isSelected ? 2.5 : 1,
                  ),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: BroncosColors.sunsetOrange.withValues(alpha: 0.45),
                            blurRadius: 8,
                            spreadRadius: 1,
                          ),
                        ]
                      : null,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    img.url,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: const Color(0xFF21262D),
                      child: const Icon(Icons.image, size: 20, color: Colors.white54),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
