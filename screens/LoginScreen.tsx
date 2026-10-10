import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useContext, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthContext, User } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { fetchUsuarios } from '../services/usuarios';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [identificador, setIdentificador] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { login } = useContext(AuthContext);

  const handleLogin = async (): Promise<void> => {
    const identificadorLimpio = identificador.trim();
    if (!identificadorLimpio || !password) {
      Alert.alert("Datos incompletos", "Ingresa tu nombre de usuario o correo y contraseña.");
      return;
    }

    try {
      const usuarios = await fetchUsuarios();
      const identificadorNormalizado = identificadorLimpio.toLocaleLowerCase();
      const usuarioEncontrado = usuarios.find(
        (usuario) =>
          usuario.nombre_usuario?.trim().toLocaleLowerCase() === identificadorNormalizado ||
          usuario.correo.trim().toLocaleLowerCase() === identificadorNormalizado,
      );

      if (!usuarioEncontrado) {
        Alert.alert("Error", "No existe una cuenta con ese nombre de usuario o correo.");
        return;
      }

      if (usuarioEncontrado.password !== password) {
        Alert.alert("Error", "Contraseña incorrecta.");
        return;
      }

      const rolNormalizado = usuarioEncontrado.rol.trim().toLocaleLowerCase();
      if (rolNormalizado !== 'docente' && rolNormalizado !== 'estudiante') {
        Alert.alert("Error", "La cuenta no tiene un rol válido. Contacta al administrador.");
        return;
      }

      const usuarioAutenticado: User = {
        ...usuarioEncontrado,
        rol: rolNormalizado === 'docente' ? 'Docente' : 'Estudiante',
      };
      Alert.alert("Bienvenido", `Iniciaste sesión como ${usuarioAutenticado.rol}`);
      login(usuarioAutenticado);
    } catch {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Nombre de usuario o correo electrónico"
        value={identificador}
        onChangeText={setIdentificador}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Contraseña" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />

      <Button title="Ingresar" onPress={handleLogin} color="#0066cc" />
      <Button title="Ir a Registro" onPress={() => navigation.navigate('Register')} color="gray" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 }
});