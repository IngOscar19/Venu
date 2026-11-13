import 'package:flutter/material.dart';
import 'app.dart';
import 'core/network/api_client.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Sesión volátil por ejecución: limpiar cualquier residuo guardado en disco
  await ApiClient.wipeDiskStorageOnAppStart();
  runApp(const EventTicketingApp());
}
