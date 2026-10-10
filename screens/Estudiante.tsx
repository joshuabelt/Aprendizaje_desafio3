import { useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
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

export default function EstudianteScreen() {
  const { logout, user } = useContext(AuthContext);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [recursoActualizando, setRecursoActualizando] = useState<string | null>(null);

  const cargarRecursos = async () => {
    setActualizando(true);
    try {
      setRecursos(await fetchRecursos());
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los recursos. Intenta actualizar la lista.');
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
          Alert.alert('Error', 'No se pudieron cargar los recursos. Intenta actualizar la lista.');
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
  ) => {
    if (!user || recursoActualizando) return;

    setRecursoActualizando(recurso.id);
    try {
      const recursoActualizado = await actualizarRecurso(recurso.id, cambios);
      setRecursos((actuales) =>
        actuales.map((item) => (item.id === recursoActualizado.id ? recursoActualizado : item)),
      );
    } catch {
      Alert.alert('Error', 'No se pudo guardar el cambio. Comprueba tu conexión e inténtalo otra vez.');
    } finally {
      setRecursoActualizando(null);
    }
  };

  const cambiarFavorito = (recurso: Recurso) => {
    if (!user) return;
    const yaEsFavorito = recurso.favoritos.includes(user.id);
    const favoritos = yaEsFavorito
      ? recurso.favoritos.filter((usuarioId) => usuarioId !== user.id)
      : [...recurso.favoritos, user.id];

    void guardarCambios(recurso, {
      favoritos,
      calificacion: recurso.calificacion,
      calificaciones: recurso.calificaciones,
    });
  };

  const calificarRecurso = (recurso: Recurso, valor: number) => {
    if (!user) return;
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
    });
  };

  const abrirEnlace = async (enlace: string) => {
    if (!/^https?:\/\//i.test(enlace)) {
      Alert.alert('Enlace no disponible', 'Este recurso no tiene una URL válida.');
      return;
    }

    try {
      await Linking.openURL(enlace);
    } catch {
      Alert.alert('Error', 'No se pudo abrir el enlace del recurso.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Lista de Recursos</Text>
          <Text style={styles.welcome}>Bienvenido, {user?.correo}</Text>
        </View>
        <Button title="Cerrar sesión" onPress={logout} color="#b42318" />
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar por ID, título o tipo..."
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="none"
        returnKeyType="search"
      />
      <Button
        title={soloFavoritos ? 'Mostrar todos los recursos' : 'Ver mis favoritos'}
        onPress={() => setSoloFavoritos((actual) => !actual)}
      />

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
              <Text style={styles.cardType}>Tipo: {item.tipo}</Text>
              <Text style={styles.cardDescription}>{item.descripcion}</Text>
              <Text style={styles.ratingSummary}>
                {item.calificaciones.length > 0
                  ? `Promedio: ${item.calificacion.toFixed(1)} / 5 (${item.calificaciones.length} calificaciones)`
                  : 'Aún sin calificaciones'}
              </Text>
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
              <TouchableOpacity onPress={() => void abrirEnlace(item.enlace)}>
                <Text style={styles.cardLink}>Abrir recurso</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#f9f9f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  welcome: { fontSize: 14, color: 'gray', marginTop: 4 },
  search: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, backgroundColor: 'white', marginBottom: 12 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 8, marginVertical: 8, elevation: 2 },
  image: { width: '100%', height: 160, borderRadius: 6, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardType: { fontSize: 13, fontWeight: 'bold', color: '#0066cc', marginTop: 6 },
  cardDescription: { fontSize: 14, color: '#555', marginTop: 8 },
  ratingSummary: { fontSize: 13, color: '#555', marginTop: 12 },
  ratingControls: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  star: { color: '#aaa', fontSize: 30, paddingHorizontal: 3 },
  selectedStar: { color: '#f0ad4e' },
  favoriteButton: { color: '#b42318', fontWeight: 'bold', marginTop: 8 },
  cardLink: { color: '#0066cc', fontWeight: 'bold', marginTop: 12 },
  message: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageText: { color: '#666', textAlign: 'center', padding: 20 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
});
