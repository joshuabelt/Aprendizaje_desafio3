import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  View, Text, TextInput, Button, FlatList, Image, ActivityIndicator,
  StyleSheet, Alert, Modal, TouchableOpacity
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { API_RECURSOS, fetchRecursos, Recurso } from '../services/recursos';

export default function DocenteScreen() {
  const { logout, user } = useContext(AuthContext);
  const puedeGestionar = user?.rol === 'Docente';
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  
  // Estados para búsqueda y filtrado
  const [busqueda, setBusqueda] = useState('');

  // Estados del Modal (para Agregar/Editar)
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('');
  const [enlace, setEnlace] = useState('');
  const [imagen, setImagen] = useState('');

  const obtenerRecursos = async () => {
    setActualizando(true);
    try {
      const data = await fetchRecursos();
      setRecursos(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los recursos. Intenta actualizar la lista.");
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
        if (mounted) {
          setRecursos(data);
        }
      } catch {
        if (mounted) {
          Alert.alert("Error", "No se pudieron cargar los recursos. Intenta actualizar la lista.");
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
    const query = busqueda.trim().toLocaleLowerCase();
    if (!query) return recursos;
    return recursos.filter((recurso) =>
      [recurso.id, recurso.titulo, recurso.tipo].some((valor) =>
        valor.toLocaleLowerCase().includes(query),
      ),
    );
  }, [busqueda, recursos]);

  // Limpiar formulario y abrir modal para CREAR
  const abrirModalCrear = () => {
    if (!puedeGestionar) return;
    setIsEditing(false);
    setCurrentId(null);
    setTitulo('');
    setDescripcion('');
    setTipo('');
    setEnlace('');
    setImagen('');
    setModalVisible(true);
  };

  // Abrir modal prellenado para EDITAR (PUT)
  const abrirModalEditar = (recurso: Recurso) => {
    if (!puedeGestionar) return;
    setIsEditing(true);
    setCurrentId(recurso.id);
    setTitulo(recurso.titulo);
    setDescripcion(recurso.descripcion);
    setTipo(recurso.tipo);
    setEnlace(recurso.enlace);
    setImagen(recurso.imagen);
    setModalVisible(true);
  };

  // Guardar (POST o PUT)
  const guardarRecurso = async () => {
    if (!puedeGestionar) return;
    if (guardando) return;
    if (!titulo.trim() || !descripcion.trim() || !tipo.trim() || !enlace.trim()) {
      Alert.alert("Campos incompletos", "Por favor llena los campos obligatorios.");
      return;
    }

    const recursoActual = isEditing
      ? recursos.find((recurso) => recurso.id === currentId)
      : undefined;
    const recursoData = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      tipo: tipo.trim(),
      enlace: enlace.trim(),
      imagen: imagen.trim(),
      calificacion: recursoActual?.calificacion ?? 0,
      calificaciones: recursoActual?.calificaciones ?? [],
      favoritos: recursoActual?.favoritos ?? [],
    };

    setGuardando(true);
    try {
      let response: Response;
      if (isEditing && currentId) {
        response = await fetch(`${API_RECURSOS}/${currentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recursoData),
        });
      } else {
        response = await fetch(API_RECURSOS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recursoData),
        });
      }

      if (!response.ok) {
        throw new Error(`La API respondió con el estado ${response.status}.`);
      }

      setModalVisible(false);
      Alert.alert("Éxito", isEditing ? "Recurso modificado correctamente." : "Recurso agregado correctamente.");
      await obtenerRecursos();
    } catch {
      Alert.alert("Error", "No se pudo guardar el recurso. Revisa la conexión e inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  // Operación DELETE (Eliminar con confirmación)
  const eliminarRecurso = (id: string) => {
    if (!puedeGestionar) return;
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este recurso?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            try {
              const response = await fetch(`${API_RECURSOS}/${id}`, { method: 'DELETE' });
              if (!response.ok) {
                throw new Error(`La API respondió con el estado ${response.status}.`);
              }
              Alert.alert("Éxito", "Recurso eliminado.");
              await obtenerRecursos();
            } catch {
              Alert.alert("Error", "No se pudo eliminar el recurso. Revisa la conexión e inténtalo de nuevo.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel Docente 👨‍🏫</Text>
        <Button title="Cerrar Sesión" onPress={logout} color="red" />
      </View>

      <Text style={styles.welcome}>Bienvenido, {user?.correo}</Text>

      {/* Barra de Búsqueda Avanzada */}
      <TextInput 
        style={styles.inputSearch}
        placeholder="Buscar por ID, título o tipo..."
        value={busqueda}
        onChangeText={setBusqueda}
      />

      {puedeGestionar ? (
        <Button title="+ Agregar Nuevo Recurso" onPress={abrirModalCrear} color="#0066cc" />
      ) : null}

      {/* Lista de Recursos en Tarjetas */}
      {cargando ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text>Cargando recursos...</Text>
        </View>
      ) : (
        <FlatList
          data={recursosFiltrados}
          keyExtractor={(item) => item.id}
          refreshing={actualizando}
          onRefresh={() => void obtenerRecursos()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {recursos.length === 0
                ? "No hay recursos todavía. Usa «Agregar Nuevo Recurso» para crear el primero."
                : "No se encontraron recursos con esa búsqueda."}
            </Text>
          }
          renderItem={({ item }) => (
          <View style={styles.card}>
            {/^https?:\/\//i.test(item.imagen) ? (
              <Image source={{ uri: item.imagen }} style={styles.image} />
            ) : null}
            <Text style={styles.cardTitle}>{item.titulo} (ID: {item.id})</Text>
            <Text style={styles.cardType}>Tipo: {item.tipo}</Text>
            <Text style={styles.cardDesc}>{item.descripcion}</Text>
            <Text style={styles.cardLink} numberOfLines={1}>{item.enlace}</Text>

            {puedeGestionar ? (
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.btnEdit} onPress={() => abrirModalEditar(item)}>
                  <Text style={styles.btnText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDelete} onPress={() => eliminarRecurso(item.id)}>
                  <Text style={styles.btnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
          )}
        />
      )}

      {/* Modal para Crear / Editar */}
      <Modal visible={modalVisible && puedeGestionar} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? "Modificar Recurso" : "Nuevo Recurso"}</Text>

            <TextInput style={styles.input} placeholder="Título" value={titulo} onChangeText={setTitulo} />
            <TextInput style={styles.input} placeholder="Descripción" value={descripcion} onChangeText={setDescripcion} multiline />
            <TextInput style={styles.input} placeholder="Tipo (libro, video, artículo...)" value={tipo} onChangeText={setTipo} />
            <TextInput style={styles.input} placeholder="Enlace (URL)" value={enlace} onChangeText={setEnlace} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Imagen (URL opcional)" value={imagen} onChangeText={setImagen} autoCapitalize="none" />

            <View style={styles.modalButtons}>
              <Button title="Cancelar" onPress={() => setModalVisible(false)} color="gray" disabled={guardando} />
              <Button title={guardando ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"} onPress={guardarRecurso} color="#0066cc" disabled={guardando} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold' },
  welcome: { fontSize: 14, color: 'gray', marginBottom: 15 },
  inputSearch: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 5, backgroundColor: 'white', marginBottom: 15 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginVertical: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  image: { width: '100%', height: 120, borderRadius: 5, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardType: { fontSize: 12, fontWeight: 'bold', color: '#0066cc', marginBottom: 5 },
  cardDesc: { fontSize: 14, color: '#666', marginBottom: 5 },
  cardLink: { fontSize: 12, color: 'blue', textDecorationLine: 'underline', marginBottom: 10 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btnEdit: { backgroundColor: '#f0ad4e', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 5 },
  btnDelete: { backgroundColor: '#d9534f', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 5 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 12, backgroundColor: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { textAlign: 'center', color: '#666', padding: 24 },
});