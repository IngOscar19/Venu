class OrdenDetalle {
  final String id;
  final String ordenId;
  final String tipoBoletoId;
  final String? tipoBoletoNombre;
  final int cantidad;
  final double precioUnitario;

  OrdenDetalle({
    required this.id,
    required this.ordenId,
    required this.tipoBoletoId,
    this.tipoBoletoNombre,
    required this.cantidad,
    required this.precioUnitario,
  });

  double get subtotal => cantidad * precioUnitario;

  factory OrdenDetalle.fromJson(Map<String, dynamic> json) {
    return OrdenDetalle(
      id: (json['id'] ?? '').toString(),
      ordenId: (json['ordenId'] ?? json['orderId'] ?? '').toString(),
      tipoBoletoId: (json['tipoBoletoId'] ?? json['eventSectionId'] ?? '').toString(),
      tipoBoletoNombre: json['tipoBoletoNombre'] ?? json['sectionName'] ?? json['nombre'],
      cantidad: (json['cantidad'] ?? json['quantity'] ?? 1) is int
          ? (json['cantidad'] ?? json['quantity'] ?? 1)
          : int.tryParse((json['cantidad'] ?? json['quantity'] ?? 1).toString()) ?? 1,
      precioUnitario: (json['precioUnitario'] ?? json['price'] ?? json['unitPrice'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'ordenId': ordenId,
      'tipoBoletoId': tipoBoletoId,
      'tipoBoletoNombre': tipoBoletoNombre,
      'cantidad': cantidad,
      'precioUnitario': precioUnitario,
    };
  }
}

class Orden {
  final String id;
  final String usuarioId;
  final String? eventoId;
  final String? eventoNombre;
  final DateTime fecha;
  final String estado; // Pendiente, Pagada, Cancelada, Expirada
  final double total;
  final List<OrdenDetalle> detalles;
  final String? preferenceId;
  final String? checkoutUrl;
  final DateTime? expiraEn;

  Orden({
    required this.id,
    required this.usuarioId,
    this.eventoId,
    this.eventoNombre,
    required this.fecha,
    required this.estado,
    required this.total,
    this.detalles = const [],
    this.preferenceId,
    this.checkoutUrl,
    this.expiraEn,
  });

  bool get estaExpirada => estado.toLowerCase() == 'expirada' || estado.toLowerCase() == 'expired';

  bool get estaPagada => estado.toLowerCase() == 'pagada' || estado.toLowerCase() == 'completada' || estado.toLowerCase() == 'completed';
  bool get estaPendiente => estado.toLowerCase() == 'pendiente' || estado.toLowerCase() == 'pending';
  bool get estaCancelada => estado.toLowerCase() == 'cancelada' || estado.toLowerCase() == 'cancelled';

  factory Orden.fromJson(Map<String, dynamic> json) {
    List<OrdenDetalle> detallesList = [];
    if (json['detalles'] != null && json['detalles'] is List) {
      detallesList = (json['detalles'] as List)
          .map((item) => OrdenDetalle.fromJson(item as Map<String, dynamic>))
          .toList();
    } else if (json['items'] != null && json['items'] is List) {
      detallesList = (json['items'] as List)
          .map((item) => OrdenDetalle.fromJson(item as Map<String, dynamic>))
          .toList();
    } else if (json['tickets'] != null && json['tickets'] is List) {
      detallesList = (json['tickets'] as List)
          .map((item) => OrdenDetalle.fromJson(item as Map<String, dynamic>))
          .toList();
    }

    return Orden(
      id: (json['id'] ?? '').toString(),
      usuarioId: (json['usuarioId'] ?? json['userId'] ?? '').toString(),
      eventoId: json['eventoId']?.toString() ?? json['eventId']?.toString(),
      eventoNombre: json['eventoNombre'] ?? json['eventName'],
      fecha: json['fecha'] != null
          ? DateTime.tryParse(json['fecha'].toString()) ?? DateTime.now()
          : (json['createdAt'] != null
              ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
              : DateTime.now()),
      estado: (json['estado'] ?? json['status'] ?? 'Pendiente').toString(),
      total: (json['total'] ?? json['totalAmount'] ?? 0).toDouble(),
      detalles: detallesList,
      preferenceId: json['preferenceId']?.toString(),
      checkoutUrl: json['checkoutUrl']?.toString(),
      expiraEn: json['expiraEn'] != null ? DateTime.tryParse(json['expiraEn'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'usuarioId': usuarioId,
      'eventoId': eventoId,
      'eventoNombre': eventoNombre,
      'fecha': fecha.toIso8601String(),
      'estado': estado,
      'total': total,
      'detalles': detalles.map((d) => d.toJson()).toList(),
      'preferenceId': preferenceId,
      'checkoutUrl': checkoutUrl,
    };
  }
}
