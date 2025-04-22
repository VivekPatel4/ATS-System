import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ats_system/screens/splash_screen.dart';

void main() {
  testWidgets('SplashScreen displays CircularProgressIndicator', (WidgetTester tester) async {
    // Build the SplashScreen widget inside a MaterialApp.
    await tester.pumpWidget(const MaterialApp(
      home: SplashScreen(),
    ));

    // Pump for a short duration so that the timer (2 seconds) doesn't fire.
    await tester.pump(const Duration(milliseconds: 500));

    // Verify that a CircularProgressIndicator is found in the widget tree.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
