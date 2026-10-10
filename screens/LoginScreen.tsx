import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useContext, useState } from 'react';
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
import { AuthContext, User } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { fetchUsuarios } from '../services/usuarios';
import FeedbackDialog, { FeedbackNotice } from '../components/FeedbackDialog';
import colors from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [identificador, setIdentificador] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [feedback, setFeedback] = useState<{
    notice: FeedbackNotice;
    afterClose?: () => void;
  } | null>(null);
  const { login } = useContext(AuthContext);

  const showFeedback = (notice: FeedbackNotice, afterClose?: () => void) => {
    setFeedback({ notice, afterClose });
  };

  const closeFeedback = () => {
    const afterClose = feedback?.afterClose;
    setFeedback(null);
    afterClose?.();
  };

  const handleLogin = async (): Promise<void> => {
    const identificadorLimpio = identificador.trim();
    if (!identificadorLimpio || !password) {
      showFeedback({
        kind: 'error',
        title: 'Faltan tus datos',
        message: 'Ingresa tu nombre de usuario o correo y tu contraseña para continuar.',
      });
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
        showFeedback({
          kind: 'error',
          title: 'Cuenta no encontrada',
          message: 'No encontramos una cuenta con ese nombre de usuario o correo. Revisa los datos e inténtalo de nuevo.',
        });
        return;
      }

      if (usuarioEncontrado.password !== password) {
        showFeedback({
          kind: 'error',
          title: 'Contraseña incorrecta',
          message: 'La contraseña no coincide con esta cuenta. Verifícala e inténtalo otra vez.',
        });
        return;
      }

      const rolNormalizado = usuarioEncontrado.rol.trim().toLocaleLowerCase();
      if (rolNormalizado !== 'docente' && rolNormalizado !== 'estudiante') {
        showFeedback({
          kind: 'error',
          title: 'Perfil no válido',
          message: 'Esta cuenta no tiene un perfil reconocido. Contacta con la administración de la escuela.',
        });
        return;
      }

      const usuarioAutenticado: User = {
        ...usuarioEncontrado,
        rol: rolNormalizado === 'docente' ? 'Docente' : 'Estudiante',
      };
      showFeedback(
        {
          kind: 'success',
          title: `¡Bienvenido${usuarioAutenticado.nombre_usuario ? `, ${usuarioAutenticado.nombre_usuario}` : ''}!`,
          message: usuarioAutenticado.rol === 'Docente'
            ? `Has iniciado sesión correctamente como ${usuarioAutenticado.rol.toLocaleLowerCase()}. Ya puedes seguir administrando tus recursos para enseñanza.`
            : `Has iniciado sesión correctamente como ${usuarioAutenticado.rol}. Ya puedes continuar aprendiendo en la Escuela de Tecnología Avanzada.`,
          actionLabel: 'Continuar',
        },
        () => login(usuarioAutenticado),
      );
    } catch {
      showFeedback({
        kind: 'error',
        title: 'No pudimos iniciar sesión',
        message: 'No fue posible conectar con el servidor. Comprueba tu conexión e inténtalo nuevamente.',
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
          <Text style={styles.brandCaption}>RECURSOS PARA APRENDER Y CREAR</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>BIENVENIDO DE VUELTA</Text>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>Accede a tu espacio de aprendizaje tecnológico.</Text>

          <Text style={styles.label}>Usuario o correo</Text>
          <TextInput
            style={styles.input}
            placeholder="nombre de usuario o correo"
            placeholderTextColor={colors.muted}
            value={identificador}
            onChangeText={setIdentificador}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu contraseña"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Ingresar a mi cuenta</Text>
          </TouchableOpacity>

          <View style={styles.divider} />
          <Text style={styles.footerText}>¿Aún no tienes cuenta?</Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Crear una cuenta</Text>
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
  brand: { alignItems: 'center', marginBottom: 28 },
  brandMark: {
    width: 66, height: 66, borderRadius: 20, backgroundColor: colors.cyan,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  brandMarkText: { color: colors.navyDeep, fontSize: 24, fontWeight: '900', letterSpacing: -2 },
  schoolName: { color: colors.surface, fontSize: 14, fontWeight: '800', letterSpacing: 1.4, textAlign: 'center' },
  brandCaption: { color: '#9DB6CC', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 8 },
  card: {
    width: '100%', maxWidth: 460, alignSelf: 'center', backgroundColor: colors.surface,
    borderRadius: 24, padding: 24, shadowColor: colors.shadow, shadowOpacity: 0.2,
    shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
  eyebrow: { color: colors.blue, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: colors.text, fontSize: 29, fontWeight: '800', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 24 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#F8FAFC',
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 18, borderRadius: 12,
    color: colors.text, fontSize: 15,
  },
  primaryButton: {
    minHeight: 52, backgroundColor: colors.blue, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  primaryButtonText: { color: colors.surface, fontWeight: '800', fontSize: 15 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
  footerText: { color: colors.muted, textAlign: 'center', fontSize: 13 },
  secondaryButton: {
    minHeight: 48, borderColor: colors.border, borderWidth: 1,
    borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  secondaryButtonText: { color: colors.navy, fontWeight: '700', fontSize: 14 },
  versionText: { color: '#7890A7', fontSize: 9, fontWeight: '700', letterSpacing: 2, textAlign: 'center', marginTop: 24 },
});