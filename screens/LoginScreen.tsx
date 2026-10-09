import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useContext, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthContext, User } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';

const API_URL = 'https://6ac8213575a4ce3fe7227957.mockapi.io/usuarios';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [correo, setCorreo] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { login } = useContext(AuthContext);

  const handleLogin = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}?correo=${correo}`);
      const users: User[] = await response.json();

      if (users.length > 0) {
        const usuarioEncontrado = users[0];
        
        if (usuarioEncontrado.password === password) {
          Alert.alert("Bienvenido", `Iniciaste sesión como ${usuarioEncontrado.rol}`);
          login(usuarioEncontrado);
        } else {
          Alert.alert("Error", "Contraseña incorrecta.");
        }
      } else {
        Alert.alert("Error", "El usuario no existe.");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      
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