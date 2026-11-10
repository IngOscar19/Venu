import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_cliente/shared/widgets/custom_button.dart';
import 'package:flutter_cliente/models/tipo_boleto.dart';
import 'package:flutter_cliente/models/evento.dart';

void main() {
  testWidgets('CustomButton renders text and triggers callback', (WidgetTester tester) async {
    bool pressed = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: CustomButton(
            text: 'Comprar',
            onPressed: () {
              pressed = true;
            },
          ),
        ),
      ),
    );

    expect(find.text('Comprar'), findsOneWidget);
    await tester.tap(find.text('Comprar'));
    expect(pressed, isTrue);
  });

  test('Modelo Evento y TipoBoleto parsean JSON correctamente', () {
    final tipoJson = {
      'id': 'b1',
      'name': 'VIP',
      'basePrice': 150.0,
      'capacity': 100,
    };
    final tipo = TipoBoleto.fromJson(tipoJson);
    expect(tipo.id, 'b1');
    expect(tipo.nombre, 'VIP');
    expect(tipo.precio, 150.0);
    expect(tipo.cantidadDisponible, 100);

    final eventoJson = {
      'id': 'e1',
      'name': 'Concierto Rock',
      'venueName': 'Estadio Nacional',
      'sections': [tipoJson],
    };
    final evento = Evento.fromJson(eventoJson);
    expect(evento.id, 'e1');
    expect(evento.name, 'Concierto Rock');
    expect(evento.tiposBoleto.length, 1);
    expect(evento.tiposBoleto.first.nombre, 'VIP');
  });
}
