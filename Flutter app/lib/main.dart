import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: "AIzaSyCYo7pTETW1dKl7EyHoaUWrvcIIRy-7CDY",
      authDomain: "ats-system-78727.firebaseapp.com",
      projectId: "ats-system-78727",
      storageBucket: "ats-system-78727.firebasestorage.app",
      messagingSenderId: "941863569009",
      appId: "1:941863569009:web:2ffe40c1264ab191ec3dd0",
      measurementId: "G-Z9LKY5WF23"
    ),
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ATS System',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: const Color(0xFF027DFF),
      ),
      home: const SplashScreen(),
    );
  }
}
