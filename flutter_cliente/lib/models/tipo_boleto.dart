class TipoBoleto {
  final String id;
  final String eventoId;
  final String nombre;
  final String? descripcion;
  final double precio;
  final int cantidadDisponible;
  final int cantidadVendida;

  TipoBoleto({
    required this.id,
    required this.eventoId,
    required this.nombre,
    this.descripcion,
    required this.precio,
    required this.cantidadDisponible,
    this.cantidadVendida = 0,
  });

  int get disponibilidadRestante => cantidadDisponible - cantidadVendida;
  bool get tieneDisponibilidad => disponibilidadRestante > 0;

  factory TipoBoleto.fromJson(Map<String, dynamic> json) {
    return TipoBoleto(
      id: (json['id'] ?? json['eventSectionId'] ?? '').toString(),
      eventoId: (json['eventoId'] ?? json['eventId'] ?? '').toString(),
      nombre: (json['nombre'] ?? json['name'] ?? json['sectionName'] ?? '').toString(),
      descripcion: json['descripcion'] ?? json['description'],
      precio: (json['precio'] ?? json['basePrice'] ?? json['price'] ?? 0).toDouble(),
      cantidadDisponible: (json['cantidadDisponible'] ?? json['capacity'] ?? 0) is int
          ? (json['cantidadDisponible'] ?? json['capacity'] ?? 0)
          : int.tryParse((json['cantidadDisponible'] ?? json['capacity'] ?? 0).toString()) ?? 0,
      cantidadVendida: (json['cantidadVendida'] ?? 0) is int
          ? (json['cantidadVendida'] ?? 0)
          : int.tryParse((json['cantidadVendida'] ?? 0).toString()) ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'eventoId': eventoId,
      'nombre': nombre,
      'descripcion': descripcion,
      'precio': precio,
      'cantidadDisponible': cantidadDisponible,
      'cantidadVendida': cantidadVendida,
    };
  }
}
