class ApiEndpoints {
  // Auth (AuthController.cs)
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String me = '/api/auth/me';

  // Eventos (EventsController.cs)
  static const String eventos = '/api/events';
  static String eventoDetalle(String id) => '/api/events/$id';
  static String tiposBoleto(String eventoId) => '/api/eventos/$eventoId/tipos-boleto';

  // Tickets y Órdenes en Backend .NET (TicketsController.cs)
  static const String purchaseTickets = '/api/tickets/purchase';
  static const String myTickets = '/api/tickets/my-tickets';
  static const String myOrders = '/api/tickets/my-orders';
  static String ticketDetalle(String id) => '/api/tickets/$id';
  static String orderDetalleNet(String id) => '/api/tickets/orders/$id';

  // Endpoints Entrega 2 (Órdenes y Pagos / Mercado Pago)
  static const String ordenes = '/api/ordenes';
  static String ordenDetalle(String id) => '/api/ordenes/$id';
  static String pagarOrden(String id) => '/api/ordenes/$id/pagar';
  static String cancelarOrden(String id) => '/api/ordenes/$id/cancelar';
  static const String preferenciaPago = '/api/pagos/preferencia';
  static const String confirmarPago = '/api/pagos/confirmar';
  static const String misBoletos = '/api/usuarios/me/boletos';
  static String boletoDetalle(String id) => '/api/boletos/$id';

  // Verificación por Correo Electrónico (Magic Link / Enlace directo)
  static const String emailSendVerification = '/api/email-verification/send';
  static const String emailVerificationStatus = '/api/email-verification/status';

  // Verificación Telefónica SMS (Anti-reventa / Identidad)
  static const String phoneSendCode = '/api/phone-verification/send-code';
  static const String phoneVerifyCode = '/api/phone-verification/verify-code';
  static const String phoneStatus = '/api/phone-verification/status';

  // Esquema de redirección para la pasarela de pagos
  static const String returnUrlScheme = 'miapp://pago-resultado';
}
