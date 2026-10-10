import { useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { actualizarRecurso, fetchRecursos, Recurso } from '../services/recursos';
import FeedbackDialog, { FeedbackNotice } from '../components/FeedbackDialog';
import colors from '../theme/colors';

export default function EstudianteScreen() {
  const { logout, user } = useContext(AuthContext);
  const puedeInteractuar = user?.rol === 'Estudiante';
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [recursoActualizando, setRecursoActualizando] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackNotice | null>(null);

  const cargarRecursos = async () => {
    setActualizando(true);
    try {
      setRecursos(await fetchRecursos());
    } catch {
      setFeedback({
        kind: 'error',
        title: 'No se cargó el catálogo',
        message: 'No pudimos obtener los recursos. Comprueba tu conexión e intenta actualizar la lista.',
      });
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const cargarInicialmente = async () => {
      try {
        const data = await fetchRecursos();
        if (mounted) setRecursos(data);
      } catch {
        if (mounted) {
          setFeedback({
            kind: 'error',
            title: 'No se cargó el catálogo',
            message: 'No pudimos obtener los recursos. Comprueba tu conexión e intenta actualizar la lista.',
          });
        }
      } finally {
        if (mounted) setCargando(false);
      }
    };

    void cargarInicialmente();
    return () => {
      mounted = false;
    };
  }, []);

  const recursosFiltrados = useMemo(() => {
    const consulta = busqueda.trim().toLocaleLowerCase();

    return recursos.filter((recurso) => {
      const coincideBusqueda =
        !consulta ||
        [recurso.id, recurso.titulo, recurso.tipo].some((valor) =>
          valor.toLocaleLowerCase().includes(consulta),
        );
      const esFavorito = user ? recurso.favoritos.includes(user.id) : false;
      return coincideBusqueda && (!soloFavoritos || esFavorito);
    });
  }, [busqueda, recursos, soloFavoritos, user]);

  const guardarCambios = async (
    recurso: Recurso,
    cambios: Pick<Recurso, 'favoritos' | 'calificacion' | 'calificaciones'>,
    mensajeExito: { title: string; message: string },
  ) => {
    if (!puedeInteractuar || !user || recursoActualizando) return;

    setRecursoActualizando(recurso.id);
    try {
      const recursoActualizado = await actualizarRecurso(recurso.id, cambios);
      setRecursos((actuales) =>
        actuales.map((item) => (item.id === recursoActualizado.id ? recursoActualizado : item)),
      );
      setFeedback({
        kind: 'success',
        title: mensajeExito.title,
        message: mensajeExito.message,
      });
    } catch {
      setFeedback({
        kind: 'error',
        title: 'No se guardó el cambio',
        message: 'No pudimos actualizar el recurso. Comprueba tu conexión e inténtalo nuevamente.',
      });
    } finally {
      setRecursoActualizando(null);
    }
  };

  const cambiarFavorito = (recurso: Recurso) => {
    if (!puedeInteractuar || !user) return;
    const yaEsFavorito = recurso.favoritos.includes(user.id);
    const favoritos = yaEsFavorito
      ? recurso.favoritos.filter((usuarioId) => usuarioId !== user.id)
      : [...recurso.favoritos, user.id];

    void guardarCambios(recurso, {
      favoritos,
      calificacion: recurso.calificacion,
      calificaciones: recurso.calificaciones,
    }, yaEsFavorito
      ? {
          title: 'Favorito actualizado',
          message: 'El recurso se quitó de tu lista de favoritos.',
        }
      : {
          title: '¡Guardado en favoritos!',
          message: 'Encontrarás este recurso en tu lista de favoritos.',
        });
  };

  const calificarRecurso = (recurso: Recurso, valor: number) => {
    if (!puedeInteractuar || !user) return;
    const calificaciones = recurso.calificaciones.filter(
      (calificacion) => calificacion.usuarioId !== user.id,
    );
    calificaciones.push({ usuarioId: user.id, valor });
    const promedio =
      calificaciones.reduce((suma, calificacion) => suma + calificacion.valor, 0) /
      calificaciones.length;

    void guardarCambios(recurso, {
      favoritos: recurso.favoritos,
      calificaciones,
      calificacion: Math.round(promedio * 10) / 10,
    }, {
      title: '¡Calificación registrada!',
      message: 'Gracias por valorar este recurso; tu opinión actualizó el promedio.',
    });
  };

  const abrirEnlace = async (enlace: string) => {
    if (!/^https?:\/\//i.test(enlace)) {
      setFeedback({
        kind: 'error',
        title: 'Enlace no disponible',
        message: 'Este recurso todavía no tiene una dirección web válida.',
      });
      return;
    }

    try {
      await Linking.openURL(enlace);
    } catch {
      setFeedback({
        kind: 'error',
        title: 'No se pudo abrir el recurso',
        message: 'Revisa tu conexión o intenta abrir el enlace más tarde.',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.brand}>ETA · ESCUELA DE TECNOLOGÍA AVANZADA</Text>
          <Text style={styles.title}>Lista de Recursos</Text>
          <Text style={styles.welcome}>
            Bienvenido, {user?.nombre_usuario || user?.correo}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar por ID, título o tipo..."
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {puedeInteractuar ? (
        <TouchableOpacity
          style={[styles.favoritesToggle, soloFavoritos && styles.favoritesToggleActive]}
          onPress={() => setSoloFavoritos((actual) => !actual)}
          activeOpacity={0.8}
        >
          <Text style={[styles.favoritesToggleText, soloFavoritos && styles.favoritesToggleTextActive]}>
            {soloFavoritos ? '♥  Mostrando mis favoritos' : '♡  Ver mis favoritos'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {cargando ? (
        <View style={styles.message}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.messageText}>Cargando recursos...</Text>
        </View>
      ) : (
        <FlatList
          data={recursosFiltrados}
          keyExtractor={(item) => item.id}
          refreshing={actualizando}
          onRefresh={() => void cargarRecursos()}
          contentContainerStyle={recursosFiltrados.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <Text style={styles.messageText}>
              {recursos.length === 0
                ? 'Todavía no hay recursos. Desliza hacia abajo para actualizar.'
                : soloFavoritos && !busqueda.trim()
                  ? 'Aún no has agregado recursos a tus favoritos.'
                : 'No se encontraron recursos con esa búsqueda.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/^https?:\/\//i.test(item.imagen) ? (
                <Image source={{ uri: item.imagen }} style={styles.image} resizeMode="cover" />
              ) : null}
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              <Text style={styles.cardType}>{item.tipo.toLocaleUpperCase()}</Text>
              <Text style={styles.cardDescription}>{item.descripcion}</Text>
              <Text style={styles.ratingSummary}>
                {item.calificaciones.length > 0
                  ? `Promedio: ${item.calificacion.toFixed(1)} / 5 (${item.calificaciones.length} calificaciones)`
                  : 'Aún sin calificaciones'}
              </Text>
              {puedeInteractuar ? (
                <>
                  <View style={styles.ratingControls}>
                    {[1, 2, 3, 4, 5].map((valor) => {
                      const miCalificacion = item.calificaciones.find(
                        (calificacion) => calificacion.usuarioId === user?.id,
                      )?.valor ?? 0;

                      return (
                        <TouchableOpacity
                          key={valor}
                          accessibilityRole="button"
                          accessibilityLabel={`Calificar con ${valor} de 5 estrellas`}
                          disabled={recursoActualizando !== null}
                          onPress={() => calificarRecurso(item, valor)}
                        >
                          <Text style={[styles.star, valor <= miCalificacion && styles.selectedStar]}>
                            ★
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {recursoActualizando === item.id ? (
                      <ActivityIndicator size="small" color="#0066cc" />
                    ) : null}
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={
                      item.favoritos.includes(user?.id ?? '') ? 'Quitar de favoritos' : 'Agregar a favoritos'
                    }
                    disabled={recursoActualizando !== null}
                    onPress={() => cambiarFavorito(item)}
                  >
                    <Text style={styles.favoriteButton}>
                      {item.favoritos.includes(user?.id ?? '')
                        ? '♥ Quitar de favoritos'
                        : '♡ Agregar a favoritos'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}
              <TouchableOpacity onPress={() => void abrirEnlace(item.enlace)}>
                <Text style={styles.cardLink}>Abrir recurso</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      <FeedbackDialog notice={feedback} onClose={() => setFeedback(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 54, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.navy, borderRadius: 20, padding: 18, marginBottom: 16,
  },
  headerCopy: { flex: 1, paddingRight: 8 },
  brand: { color: colors.cyan, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.surface },
  welcome: { fontSize: 13, color: '#B6C8D8', marginTop: 5 },
  logoutButton: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, backgroundColor: '#203A54' },
  logoutText: { color: colors.surface, fontSize: 12, fontWeight: '700' },
  search: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.surface, marginBottom: 10, color: colors.text },
  favoritesToggle: { minHeight: 43, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F7F8', borderRadius: 11, marginBottom: 8 },
  favoritesToggleActive: { backgroundColor: colors.cyan },
  favoritesToggleText: { color: colors.navy, fontSize: 13, fontWeight: '800' },
  favoritesToggleTextActive: { color: colors.navyDeep },
  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginVertical: 8, elevation: 3, shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: '#E8EEF4' },
  image: { width: '100%', height: 170, borderRadius: 10, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  cardType: { alignSelf: 'flex-start', overflow: 'hidden', fontSize: 10, fontWeight: '800', color: colors.blue, backgroundColor: '#EAF4FC', letterSpacing: 1, marginTop: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 },
  cardDescription: { fontSize: 14, color: colors.muted, lineHeight: 21, marginTop: 10 },
  ratingSummary: { fontSize: 12, color: colors.muted, marginTop: 14 },
  ratingControls: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  star: { color: '#B8C4D0', fontSize: 31, paddingHorizontal: 3 },
  selectedStar: { color: colors.warning },
  favoriteButton: { color: colors.danger, fontWeight: '800', marginTop: 7 },
  cardLink: { color: colors.blue, fontWeight: '800', marginTop: 13 },
  message: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageText: { color: colors.muted, textAlign: 'center', padding: 20 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
});
