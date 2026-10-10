import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  View, Text, TextInput, FlatList, Image, ActivityIndicator,
  StyleSheet, Alert, Modal, TouchableOpacity
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { API_RECURSOS, fetchRecursos, Recurso } from '../services/recursos';
import FeedbackDialog, { FeedbackNotice } from '../components/FeedbackDialog';
import colors from '../theme/colors';

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
  const [feedback, setFeedback] = useState<FeedbackNotice | null>(null);

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
        if (mounted) {
          setRecursos(data);
        }
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
      setFeedback({
        kind: 'error',
        title: 'Faltan datos del recurso',
        message: 'Completa el título, la descripción, el tipo y el enlace antes de guardar.',
      });
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
      setFeedback({
        kind: 'success',
        title: isEditing ? '¡Recurso actualizado!' : '¡Recurso agregado!',
        message: isEditing
          ? 'Los cambios ya están disponibles en el catálogo de la escuela.'
          : 'El nuevo recurso ya está disponible en el catálogo de aprendizaje.',
      });
      await obtenerRecursos();
    } catch {
      setFeedback({
        kind: 'error',
        title: 'No se guardó el recurso',
        message: 'La operación no se completó. Comprueba los datos y la conexión, y vuelve a intentarlo.',
      });
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
              setFeedback({
                kind: 'success',
                title: 'Recurso eliminado',
                message: 'El recurso se quitó correctamente del catálogo.',
              });
              await obtenerRecursos();
            } catch {
              setFeedback({
                kind: 'error',
                title: 'No se eliminó el recurso',
                message: 'No pudimos completar la eliminación. Comprueba tu conexión e inténtalo nuevamente.',
              });
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.brand}>ETA · ESCUELA DE TECNOLOGÍA AVANZADA</Text>
          <Text style={styles.title}>Panel docente</Text>
          <Text style={styles.welcome}>Hola, {user?.nombre_usuario || user?.correo}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Búsqueda Avanzada */}
      <TextInput 
        style={styles.inputSearch}
        placeholder="Buscar por ID, título o tipo..."
        value={busqueda}
        onChangeText={setBusqueda}
      />

      {puedeGestionar ? (
        <TouchableOpacity style={styles.createButton} onPress={abrirModalCrear} activeOpacity={0.85}>
          <Text style={styles.createButtonIcon}>＋</Text>
          <Text style={styles.createButtonText}>Agregar recurso</Text>
        </TouchableOpacity>
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
            <Text style={styles.cardType}>{item.tipo.toLocaleUpperCase()}</Text>
            <Text style={styles.cardDesc}>{item.descripcion}</Text>
            <Text style={styles.cardLink} numberOfLines={1}>{item.enlace}</Text>

            {puedeGestionar ? (
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.btnEdit} onPress={() => abrirModalEditar(item)}>
                  <Text style={styles.btnEditText}>Editar recurso</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDelete} onPress={() => eliminarRecurso(item.id)}>
                  <Text style={styles.btnDeleteText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
          )}
        />
      )}

      {/* Modal para Crear / Editar */}
      <Modal visible={modalVisible && puedeGestionar} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? "Modificar Recurso" : "Nuevo Recurso"}</Text>

            <TextInput style={styles.input} placeholder="Título" placeholderTextColor="#A7B0BA" value={titulo} onChangeText={setTitulo} />
            <TextInput style={styles.input} placeholder="Descripción" placeholderTextColor="#A7B0BA" value={descripcion} onChangeText={setDescripcion} multiline />
            <TextInput style={styles.input} placeholder="Tipo (libro, video, artículo...)" placeholderTextColor="#A7B0BA" value={tipo} onChangeText={setTipo} />
            <TextInput style={styles.input} placeholder="Enlace (URL)" placeholderTextColor="#A7B0BA" value={enlace} onChangeText={setEnlace} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Imagen (URL opcional)" placeholderTextColor="#A7B0BA" value={imagen} onChangeText={setImagen} autoCapitalize="none" />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={guardando}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={guardarRecurso}
                disabled={guardando}
                activeOpacity={0.85}
              >
                <Text style={styles.saveButtonText}>
                  {guardando ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <FeedbackDialog notice={feedback} onClose={() => setFeedback(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background, paddingTop: 54 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.navy, borderRadius: 20, padding: 18, marginBottom: 18,
  },
  headerCopy: { flex: 1, paddingRight: 8 },
  brand: { color: colors.cyan, fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 8 },
  title: { fontSize: 23, fontWeight: '800', color: colors.surface },
  welcome: { fontSize: 13, color: '#B6C8D8', marginTop: 5 },
  logoutButton: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10, backgroundColor: '#203A54' },
  logoutText: { color: colors.surface, fontSize: 12, fontWeight: '700' },
  inputSearch: { borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.surface, marginBottom: 12, color: colors.text },
  createButton: { flexDirection: 'row', minHeight: 50, backgroundColor: colors.blue, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  createButtonIcon: { color: colors.surface, fontSize: 22, fontWeight: '500', marginRight: 8, marginTop: -2 },
  createButtonText: { color: colors.surface, fontSize: 15, fontWeight: '800' },
  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginVertical: 8, shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3, borderWidth: 1, borderColor: '#E8EEF4' },
  image: { width: '100%', height: 150, borderRadius: 10, marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  cardType: { fontSize: 10, fontWeight: '800', color: colors.blue, letterSpacing: 1, marginTop: 8, marginBottom: 5 },
  cardDesc: { fontSize: 14, color: colors.muted, lineHeight: 20, marginBottom: 6 },
  cardLink: { fontSize: 12, color: colors.blue, textDecorationLine: 'underline', marginBottom: 12 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, borderTopWidth: 1, borderTopColor: '#E8EEF4', paddingTop: 12 },
  btnEdit: { backgroundColor: '#EAF4FC', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 9 },
  btnDelete: { backgroundColor: '#FFF0F0', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 9 },
  btnEditText: { color: colors.blue, fontWeight: '800', fontSize: 12 },
  btnDeleteText: { color: colors.danger, fontWeight: '800', fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(9,23,39,0.72)', padding: 20 },
  modalContent: { backgroundColor: '#101418', padding: 22, borderRadius: 20, borderWidth: 1, borderColor: '#303943' },
  modalTitle: { fontSize: 21, fontWeight: '800', color: '#FFFFFF', marginBottom: 18 },
  input: { borderWidth: 1, borderColor: '#3B4652', padding: 12, borderRadius: 11, marginBottom: 12, backgroundColor: '#1B222A', color: '#FFFFFF' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#56616D' },
  cancelButtonText: { color: '#FFFFFF', fontWeight: '700' },
  saveButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, borderRadius: 10, backgroundColor: colors.cyan },
  saveButtonText: { color: '#091727', fontWeight: '800' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { textAlign: 'center', color: colors.muted, padding: 24 },
});