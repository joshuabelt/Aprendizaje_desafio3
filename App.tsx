import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext, AuthProvider } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import { View, Text, Button, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

// 1. Pantalla provisional para el Docente (aquí harás el CRUD en el Paso 4)
function DocenteDashboard() {
  const { logout, user } = useContext(AuthContext);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Docente 👨‍🏫</Text>
      <Text>Bienvenido: {user?.correo}</Text>
      <Text style={styles.subtitle}>Aquí podrás gestionar recursos (CRUD).</Text>
      <Button title="Cerrar Sesión (Logout)" onPress={logout} color="red" />
    </View>
  );
}

// 2. Pantalla provisional para el Estudiante (aquí harás favoritos y rating en el Paso 5)
function EstudianteDashboard() {
  const { logout, user } = useContext(AuthContext);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Recursos 👨‍🎓</Text>
      <Text>Bienvenido: {user?.correo}</Text>
      <Text style={styles.subtitle}>Aquí podrás buscar, ver favoritos y calificar.</Text>
      <Button title="Cerrar Sesión (Logout)" onPress={logout} color="red" />
    </View>
  );
}

// 3. Componente de Navegación que evalúa los Roles
function AppNavigator() {
  const { user } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Si NO hay sesión iniciada, muestra Login y Register
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.rol === 'Docente' ? (
          // Si el rol es Docente, lo manda a su panel exclusivo
          <Stack.Screen name="DocenteHome" component={DocenteDashboard} />
        ) : (
          // Si el rol es Estudiante, lo manda a su vista restringida
          <Stack.Screen name="EstudianteHome" component={EstudianteDashboard} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// 4. Componente principal que provee el Contexto Global
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 14, color: 'gray', marginBottom: 20, textAlign: 'center' }
});
