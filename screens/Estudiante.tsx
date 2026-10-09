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
import { fetchRecursos, Recurso } from '../services/recursos';

export default function EstudianteScreen() {
  const { logout, user } = useContext(AuthContext);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  const cargarRecursos = async (esActualizacion = false) => {
    if (esActualizacion) {
      setActualizando(true);
    } else {
      setCargando(true);
    }

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
    void cargarRecursos();
  }, []);

  const recursosFiltrados = useMemo(() => {
    const consulta = busqueda.trim().toLocaleLowerCase();
    if (!consulta) return recursos;

    return recursos.filter((recurso) =>
      [recurso.id, recurso.titulo, recurso.tipo].some((valor) =>
        valor.toLocaleLowerCase().includes(consulta),
      ),
    );
  }, [busqueda, recursos]);

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
          onRefresh={() => void cargarRecursos(true)}
          contentContainerStyle={recursosFiltrados.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <Text style={styles.messageText}>
              {recursos.length === 0
                ? 'Todavía no hay recursos. Desliza hacia abajo para actualizar.'
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
  cardLink: { color: '#0066cc', fontWeight: 'bold', marginTop: 12 },
  message: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageText: { color: '#666', textAlign: 'center', padding: 20 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
});
