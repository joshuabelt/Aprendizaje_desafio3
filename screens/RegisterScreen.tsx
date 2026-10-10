import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { API_USUARIOS, fetchUsuarios } from '../services/usuarios';
import FeedbackDialog, { FeedbackNotice } from '../components/FeedbackDialog';
import colors from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [correo, setCorreo] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rol, setRol] = useState<'Estudiante' | 'Docente'>('Estudiante');
  const [feedback, setFeedback] = useState<{
    notice: FeedbackNotice;
    afterClose?: () => void;
  } | null>(null);

  const showFeedback = (notice: FeedbackNotice, afterClose?: () => void) => {
    setFeedback({ notice, afterClose });
  };

  const closeFeedback = () => {
    const afterClose = feedback?.afterClose;
    setFeedback(null);
    afterClose?.();
  };

  const validarPassword = (pass: string): boolean => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{12,}$/;
    return regex.test(pass);
  };

  const handleRegister = async (): Promise<void> => {
    const nombreUsuarioLimpio = nombreUsuario.trim();
    const correoLimpio = correo.trim();

    if (!nombreUsuarioLimpio || !correoLimpio || !password) {
      showFeedback({
        kind: 'error',
        title: 'Completa tus datos',
        message: 'Necesitamos tu nombre de usuario, correo y contraseña para crear la cuenta.',
      });
      return;
    }

    if (!validarPassword(password)) {
      showFeedback({
        kind: 'error',
        title: 'Ajusta tu contraseña',
        message: 'Debe tener al menos 12 caracteres, una mayúscula, una minúscula, un número y un símbolo como ! @ # $ % ^ & *.',
      });
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
        showFeedback({
          kind: 'error',
          title: 'Nombre no disponible',
          message: 'Ese nombre de usuario ya está en uso. Prueba con uno diferente.',
        });
        return;
      }
      if (correoExiste) {
        showFeedback({
          kind: 'error',
          title: 'Correo ya registrado',
          message: 'Ya existe una cuenta asociada a ese correo. Puedes iniciar sesión o usar otro.',
        });
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
        showFeedback(
          {
            kind: 'success',
            title: '¡Cuenta creada!',
            message: `Tu cuenta de ${rol.toLocaleLowerCase()} en la Escuela de Tecnología Avanzada ya está lista. Inicia sesión para comenzar.`,
            actionLabel: 'Ir a iniciar sesión',
          },
          () => navigation.navigate('Login'),
        );
      } else {
        showFeedback({
          kind: 'error',
          title: 'No se pudo crear la cuenta',
          message: `El servidor rechazó el registro (código ${response.status}). Revisa tus datos e inténtalo de nuevo.`,
        });
      }
    } catch {
      showFeedback({
        kind: 'error',
        title: 'Problema de conexión',
        message: 'No pudimos comunicarnos con el servidor. Comprueba tu conexión a internet e inténtalo nuevamente.',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>{'{ }'}</Text>
          </View>
          <Text style={styles.schoolName}>ESCUELA DE TECNOLOGÍA AVANZADA</Text>
          <Text style={styles.brandCaption}>TU SIGUIENTE IDEA EMPIEZA AQUÍ</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>ÚNETE A LA COMUNIDAD</Text>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Forma parte de una comunidad que aprende tecnología creando.</Text>

          <Text style={styles.label}>Nombre de usuario</Text>
          <TextInput
            style={styles.input}
            placeholder="Elige un nombre de usuario"
            placeholderTextColor={colors.muted}
            value={nombreUsuario}
            onChangeText={setNombreUsuario}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.muted}
            value={correo}
            onChangeText={setCorreo}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 12 caracteres"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Selecciona tu perfil</Text>
          <View style={styles.roleContainer}>
            {(['Estudiante', 'Docente'] as const).map((opcion) => {
              const seleccionado = rol === opcion;
              return (
                <TouchableOpacity
                  key={opcion}
                  style={[styles.roleButton, seleccionado && styles.roleActive]}
                  onPress={() => setRol(opcion)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleIcon, seleccionado && styles.roleIconActive]}>
                    {opcion === 'Estudiante' ? '01' : '02'}
                  </Text>
                  <Text style={[styles.roleText, seleccionado && styles.roleTextActive]}>{opcion}</Text>
                  <Text style={[styles.roleHint, seleccionado && styles.roleHintActive]}>
                    {opcion === 'Estudiante' ? 'Explora y aprende' : 'Gestiona recursos'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Crear mi cuenta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginLinkText}>¿Ya tienes cuenta? <Text style={styles.loginLinkStrong}>Inicia sesión</Text></Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.versionText}>TECNOLOGÍA · CONOCIMIENTO · FUTURO</Text>
      </ScrollView>
      <FeedbackDialog notice={feedback?.notice ?? null} onClose={closeFeedback} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navyDeep },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 24 },
  brandMark: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.cyan, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  brandMarkText: { color: colors.navyDeep, fontSize: 21, fontWeight: '900', letterSpacing: -2 },
  schoolName: { color: colors.surface, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, textAlign: 'center' },
  brandCaption: { color: '#9DB6CC', fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginTop: 7 },
  card: { width: '100%', maxWidth: 460, alignSelf: 'center', backgroundColor: colors.surface, borderRadius: 24, padding: 24, shadowColor: colors.shadow, shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  eyebrow: { color: colors.blue, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 7 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 20 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: '#F8FAFC', paddingHorizontal: 13, paddingVertical: 12, marginBottom: 14, borderRadius: 12, color: colors.text, fontSize: 14 },
  roleContainer: { flexDirection: 'row', marginHorizontal: -4, marginBottom: 18 },
  roleButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: '#F8FAFC', marginHorizontal: 4, borderRadius: 14 },
  roleActive: { borderColor: colors.blue, backgroundColor: '#EAF4FC' },
  roleIcon: { color: colors.muted, fontSize: 11, fontWeight: '800', marginBottom: 8 },
  roleIconActive: { color: colors.blue },
  roleText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  roleTextActive: { color: colors.blue },
  roleHint: { color: colors.muted, fontSize: 10, marginTop: 4 },
  roleHintActive: { color: colors.blue },
  primaryButton: { minHeight: 50, backgroundColor: colors.blue, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.surface, fontWeight: '800', fontSize: 15 },
  loginLink: { alignItems: 'center', marginTop: 18 },
  loginLinkText: { color: colors.muted, fontSize: 13 },
  loginLinkStrong: { color: colors.blue, fontWeight: '800' },
  versionText: { color: '#7890A7', fontSize: 9, fontWeight: '700', letterSpacing: 2, textAlign: 'center', marginTop: 22 },
});