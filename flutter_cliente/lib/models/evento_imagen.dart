import '../core/config/env.dart';

class EventoImagen {
  final String id;
  final String url;
  final String type; // 'POSTER', 'GALLERY', 'VENUE', 'ARTIST'
  final int order;

  EventoImagen({
    required this.id,
    required this.url,
    required this.type,
    this.order = 0,
  });

  bool get isPoster {
    final t = type.toUpperCase();
    return t == 'POSTER' || t == '0';
  }

  factory EventoImagen.fromJson(Map<String, dynamic> json) {
    String rawUrl = (json['url'] ?? json['imageUrl'] ?? '').toString();
    if (rawUrl.startsWith('/')) {
      rawUrl = '${Env.apiBaseUrl}$rawUrl';
    }

    String typeStr = (json['type'] ?? json['imageType'] ?? 'GALLERY').toString();

    return EventoImagen(
      id: (json['id'] ?? '').toString(),
      url: rawUrl,
      type: typeStr,
      order: json['order'] is int
          ? json['order'] as int
          : int.tryParse(json['order']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'url': url,
      'type': type,
      'order': order,
    };
  }
}
