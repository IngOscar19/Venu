import '../core/config/env.dart';
import 'evento_imagen.dart';
import 'tipo_boleto.dart';

class Evento {
  final String id;
  final String name;
  final String? description;
  final String? venueName;
  final String? address;
  final String? city;
  final String? state;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? imageUrl;
  final String? status;
  final List<TipoBoleto> tiposBoleto;
  final List<EventoImagen> images;

  Evento({
    required this.id,
    required this.name,
    this.description,
    this.venueName,
    this.address,
    this.city,
    this.state,
    this.startDate,
    this.endDate,
    this.imageUrl,
    this.status,
    this.tiposBoleto = const [],
    this.images = const [],
  });

  bool get estaReprogramado =>
      status?.toUpperCase() == 'RESCHEDULED' || status == '4';

  /// Imagen de portada priorizando type == 'POSTER'
  EventoImagen? get posterImage {
    if (images.isEmpty) return null;
    return images.firstWhere(
      (img) => img.isPoster,
      orElse: () => images.first,
    );
  }

  /// Fotos de galería (excluyendo el póster principal)
  List<EventoImagen> get galleryImages {
    final poster = posterImage;
    return images.where((img) => img.id != poster?.id && !img.isPoster).toList();
  }

  /// Lista ordenada completa de imágenes para el visualizador Lightbox (portada primero, luego galería)
  List<EventoImagen> get allDisplayImages {
    final list = <EventoImagen>[];
    final poster = posterImage;
    if (poster != null) {
      list.add(poster);
    }
    for (final img in galleryImages) {
      list.add(img);
    }
    // Fallback: Si no había en la lista de imágenes pero existe imageUrl suelta
    if (list.isEmpty && imageUrl != null && imageUrl!.isNotEmpty) {
      list.add(EventoImagen(
        id: 'poster-fallback',
        url: imageUrl!,
        type: 'POSTER',
        order: 0,
      ));
    }
    return list;
  }

  factory Evento.fromJson(Map<String, dynamic> json) {
    // Parsear tipos de boleto si vienen como 'tiposBoleto' o 'sections'
    List<TipoBoleto> parsedTipos = [];
    if (json['tiposBoleto'] != null && json['tiposBoleto'] is List) {
      parsedTipos = (json['tiposBoleto'] as List)
          .map((item) => TipoBoleto.fromJson(item as Map<String, dynamic>))
          .toList();
    } else if (json['sections'] != null && json['sections'] is List) {
      parsedTipos = (json['sections'] as List)
          .map((item) => TipoBoleto.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    // Parsear lista de imágenes del evento
    List<EventoImagen> parsedImages = [];
    if (json['images'] != null && json['images'] is List) {
      parsedImages = (json['images'] as List)
          .whereType<Map<String, dynamic>>()
          .map((item) => EventoImagen.fromJson(item))
          .toList();
      parsedImages.sort((a, b) => a.order.compareTo(b.order));
    }

    // Determinar la mejor URL de portada
    String? parsedImageUrl;
    if (json['imageUrl'] != null && json['imageUrl'].toString().isNotEmpty) {
      parsedImageUrl = json['imageUrl'].toString();
    } else if (parsedImages.isNotEmpty) {
      final poster = parsedImages.firstWhere(
        (img) => img.isPoster,
        orElse: () => parsedImages.first,
      );
      parsedImageUrl = poster.url;
    }

    if (parsedImageUrl != null && parsedImageUrl.startsWith('/')) {
      parsedImageUrl = '${Env.apiBaseUrl}$parsedImageUrl';
    }

    // Si había imageUrl pero no venía en la colección images, la incorporamos
    if (parsedImages.isEmpty && parsedImageUrl != null && parsedImageUrl.isNotEmpty) {
      parsedImages.add(EventoImagen(
        id: 'poster-auto',
        url: parsedImageUrl,
        type: 'POSTER',
        order: 0,
      ));
    }

    return Evento(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? json['nombre'] ?? '').toString(),
      description: json['description'] ?? json['descripcion'],
      venueName: json['venueName'] ?? json['lugar'],
      address: json['address'] ?? json['direccion'],
      city: json['city'] ?? json['ciudad'],
      state: json['state'] ?? json['estado'],
      startDate: json['startDate'] != null ? DateTime.tryParse(json['startDate'].toString()) : null,
      endDate: json['endDate'] != null ? DateTime.tryParse(json['endDate'].toString()) : null,
      imageUrl: parsedImageUrl,
      status: (json['status'] ?? json['estado'])?.toString(),
      tiposBoleto: parsedTipos,
      images: parsedImages,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'venueName': venueName,
      'address': address,
      'city': city,
      'state': state,
      'startDate': startDate?.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'imageUrl': imageUrl,
      'status': status,
      'tiposBoleto': tiposBoleto.map((t) => t.toJson()).toList(),
      'images': images.map((i) => i.toJson()).toList(),
    };
  }
}
