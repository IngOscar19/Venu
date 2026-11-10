import '../core/config/env.dart';

class Boleto {
  final String id;
  final String? ordenDetalleId;
  final String? eventoId;
  final String eventoNombre;
  final String? usuarioId;
  final String? tipoBoletoNombre;
  final String codigoQr;
  final String? qrImageUrl;
  final String estado; // Valido, Usado, Cancelado
  final DateTime fechaEmision;
  final String? asistenteNombre;
  final double precio;
  final String? venueName;
  final DateTime? eventStartDate;

  Boleto({
    required this.id,
    this.ordenDetalleId,
    this.eventoId,
    required this.eventoNombre,
    this.usuarioId,
    this.tipoBoletoNombre,
    required this.codigoQr,
    this.qrImageUrl,
    required this.estado,
    required this.fechaEmision,
    this.asistenteNombre,
    this.precio = 0.0,
    this.venueName,
    this.eventStartDate,
  });

  bool get esValido => estado.toLowerCase() == 'valido' || estado.toLowerCase() == 'valid';

  factory Boleto.fromJson(Map<String, dynamic> json) {
    String? parsedQrImage = json['qrImageUrl'] ?? json['qrImage'];
    if (parsedQrImage != null && parsedQrImage.startsWith('/')) {
      parsedQrImage = '${Env.apiBaseUrl}$parsedQrImage';
    }

    return Boleto(
      id: (json['id'] ?? '').toString(),
      ordenDetalleId: json['ordenDetalleId']?.toString() ?? json['orderId']?.toString(),
      eventoId: json['eventoId']?.toString(),
      eventoNombre: (json['eventoNombre'] ?? json['eventName'] ?? 'Evento').toString(),
      usuarioId: json['usuarioId']?.toString(),
      tipoBoletoNombre: json['tipoBoletoNombre'] ?? json['sectionName'] ?? 'General',
      codigoQr: (json['codigoQr'] ?? json['ticketCode'] ?? json['id'] ?? '').toString(),
      qrImageUrl: parsedQrImage,
      estado: (json['estado'] ?? json['status'] ?? 'Valido').toString(),
      fechaEmision: json['fechaEmision'] != null
          ? DateTime.tryParse(json['fechaEmision'].toString()) ?? DateTime.now()
          : (json['createdAt'] != null
              ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
              : DateTime.now()),
      asistenteNombre: json['asistenteNombre'] ?? json['attendeeName'],
      precio: (json['precio'] ?? json['price'] ?? 0).toDouble(),
      venueName: json['venueName'] ?? json['lugar'],
      eventStartDate: json['eventStartDate'] != null
          ? DateTime.tryParse(json['eventStartDate'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ordenDetalleId': ordenDetalleId,
      'eventoId': eventoId,
      'eventoNombre': eventoNombre,
      'usuarioId': usuarioId,
      'tipoBoletoNombre': tipoBoletoNombre,
      'codigoQr': codigoQr,
      'qrImageUrl': qrImageUrl,
      'estado': estado,
      'fechaEmision': fechaEmision.toIso8601String(),
      'asistenteNombre': asistenteNombre,
      'precio': precio,
      'venueName': venueName,
      'eventStartDate': eventStartDate?.toIso8601String(),
    };
  }
}
