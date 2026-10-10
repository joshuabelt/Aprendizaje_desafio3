import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { API_USUARIOS, fetchUsuarios } from '../services/usuarios';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [correo, setCorreo] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rol, setRol] = useState<'Estudiante' | 'Docente'>('Estudiante');

  const validarPassword = (pass: string): boolean => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{12,}$/;
    return regex.test(pass);
  };

  const handleRegister = async (): Promise<void> => {
    const nombreUsuarioLimpio = nombreUsuario.trim();
    const correoLimpio = correo.trim();

    if (!nombreUsuarioLimpio || !correoLimpio || !password) {
      Alert.alert("Datos incompletos", "Ingresa tu nombre de usuario, correo y contraseña.");
      return;
    }

    if (!validarPassword(password)) {
      Alert.alert("Contraseña inválida", "Debe tener mínimo 12 caracteres, una mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*).");
      return;
    }

    try {
      const usuarios = await fetchUsuarios();
      const nombreExiste = usuarios.some(
        (usuario) =>
          usuario.nombre_usuario?.trim().toLocaleLowerCase() ===
          nombreUsuarioLimpio.toLocaleLowerCase(),
      );
      const correoExiste = usuarios.some(
        (usuario) => usuario.correo.trim().toLocaleLowerCase() === correoLimpio.toLocaleLowerCase(),
      );

      if (nombreExiste) {
        Alert.alert("Nombre de usuario ocupado", "Elige otro nombre de usuario.");
        return;
      }
      if (correoExiste) {
        Alert.alert("Correo registrado", "Ya existe una cuenta con ese correo.");
        return;
      }

      const response = await fetch(API_USUARIOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_usuario: nombreUsuarioLimpio,
          correo: correoLimpio,
          password,
          rol,
        })
      });

      if (response.ok) {
        Alert.alert("Éxito", "Usuario registrado correctamente.");
        navigation.navigate('Login');
      } else {
        Alert.alert("Error", `No se pudo registrar el usuario (estado ${response.status}).`);
      }
    } catch {
      Alert.alert("Error", "Revisa tu conexión a internet.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro de Usuario</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre de usuario"
        value={nombreUsuario}
        onChangeText={setNombreUsuario}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput 
        style={styles.input} 
        placeholder="Correo electrónico" 
        value={correo} 
        onChangeText={setCorreo} 
        autoCapitalize="none"
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Contraseña" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <Text style={styles.subtitle}>Selecciona tu rol:</Text>
      <View style={styles.roleContainer}>
        <TouchableOpacity 
          style={[styles.roleButton, rol === 'Estudiante' && styles.roleActive]} 
          onPress={() => setRol('Estudiante')}>
          <Text style={rol === 'Estudiante' ? styles.textActive : styles.textInactive}>Estudiante</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.roleButton, rol === 'Docente' && styles.roleActive]} 
          onPress={() => setRol('Docente')}>
          <Text style={rol === 'Docente' ? styles.textActive : styles.textInactive}>Docente</Text>
        </TouchableOpacity>
      </View>

      <Button title="Registrarse" onPress={handleRegister} color="#0066cc" />
      <Button title="Ya tengo cuenta (Login)" onPress={() => navigation.navigate('Login')} color="gray" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 16, marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  roleButton: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', marginHorizontal: 5, borderRadius: 5 },
  roleActive: { backgroundColor: '#0066cc', borderColor: '#0066cc' },
  textActive: { color: 'white', fontWeight: 'bold' },
  textInactive: { color: 'black' }
});