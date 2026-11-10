import '../core/config/env.dart';
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
  });

  bool get estaReprogramado =>
      status?.toUpperCase() == 'RESCHEDULED' || status == '4';

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

    String? parsedImageUrl;
    if (json['imageUrl'] != null) {
      parsedImageUrl = json['imageUrl'].toString();
    } else if (json['images'] != null && json['images'] is List && (json['images'] as List).isNotEmpty) {
      final firstImage = (json['images'] as List).first;
      if (firstImage is Map<String, dynamic>) {
        parsedImageUrl = firstImage['url'] ?? firstImage['imageUrl'];
      }
    }

    // Si la imagen es una ruta relativa servida por el backend .NET (ej. /uploads/events/xxx.jpg)
    if (parsedImageUrl != null && parsedImageUrl.startsWith('/')) {
      parsedImageUrl = '${Env.apiBaseUrl}$parsedImageUrl';
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
    };
  }
}
