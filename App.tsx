import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { RootStackParamList } from './navigation/types';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DocenteScreen from './screens/Docente';
import EstudianteScreen from './screens/Estudiante';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Componente de navegación que evalúa los roles
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
          // Si el rol es Docente, lo manda a la pantalla CRUD
          <Stack.Screen name="DocenteHome" component={DocenteScreen} />
        ) : (
          // El estudiante puede consultar la lista sin modificar los recursos
          <Stack.Screen name="EstudianteHome" component={EstudianteScreen} />
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
