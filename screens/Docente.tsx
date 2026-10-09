import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, TextInput, Button, FlatList, Image, 
  StyleSheet, Alert, Modal, TouchableOpacity
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { API_RECURSOS, fetchRecursos, Recurso } from '../services/recursos';

export default function DocenteScreen() {
  const { logout, user } = useContext(AuthContext);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [recursosFiltrados, setRecursosFiltrados] = useState<Recurso[]>([]);
  
  // Estados para búsqueda y filtrado
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  // Estados del Modal (para Agregar/Editar)
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Campos del formulario
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('');
  const [enlace, setEnlace] = useState('');
  const [imagen, setImagen] = useState('');

  // Cargar recursos al iniciar
  useEffect(() => {
    obtenerRecursos();
  }, []);

  const obtenerRecursos = async () => {
    try {
      const data = await fetchRecursos();
      setRecursos(data);
      setRecursosFiltrados(data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los recursos.");
    }
  };

  // Búsqueda avanzada por ID, título o tipo
  useEffect(() => {
    let resultado = recursos;

    if (busqueda.trim() !== '') {
      const query = busqueda.toLowerCase();
      resultado = resultado.filter(r => 
        r.id.toLowerCase().includes(query) ||
        r.titulo.toLowerCase().includes(query) ||
        r.tipo.toLowerCase().includes(query)
      );
    }

    if (filtroTipo.trim() !== '') {
      resultado = resultado.filter(r => r.tipo.toLowerCase() === filtroTipo.toLowerCase());
    }

    setRecursosFiltrados(resultado);
  }, [busqueda, filtroTipo, recursos]);

  // Limpiar formulario y abrir modal para CREAR
  const abrirModalCrear = () => {
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
    if (!titulo || !descripcion || !tipo || !enlace) {
      Alert.alert("Campos incompletos", "Por favor llena los campos obligatorios.");
      return;
    }

    const recursoData = { titulo, descripcion, tipo, enlace, imagen };

    try {
      if (isEditing && currentId) {
        // Operación PUT (Actualizar)
        const response = await fetch(`${API_RECURSOS}/${currentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recursoData),
        });
        if (response.ok) {
          Alert.alert("Éxito", "Recurso modificado correctamente.");
        }
      } else {
        // Operación POST (Crear)
        const response = await fetch(API_RECURSOS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recursoData),
        });
        if (response.ok) {
          Alert.alert("Éxito", "Recurso agregado correctamente.");
        }
      }

      setModalVisible(false);
      obtenerRecursos();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el recurso.");
    }
  };

  // Operación DELETE (Eliminar con confirmación)
  const eliminarRecurso = (id: string) => {
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
              if (response.ok) {
                Alert.alert("Éxito", "Recurso eliminado.");
                obtenerRecursos();
              }
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el recurso.");
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

      <Button title="+ Agregar Nuevo Recurso" onPress={abrirModalCrear} color="#0066cc" />

      {/* Lista de Recursos en Tarjetas */}
      <FlatList 
        data={recursosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imagen ? <Image source={{ uri: item.imagen }} style={styles.image} /> : null}
            <Text style={styles.cardTitle}>{item.titulo} (ID: {item.id})</Text>
            <Text style={styles.cardType}>Tipo: {item.tipo}</Text>
            <Text style={styles.cardDesc}>{item.descripcion}</Text>
            <Text style={styles.cardLink} numberOfLines={1}>{item.enlace}</Text>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.btnEdit} onPress={() => abrirModalEditar(item)}>
                <Text style={styles.btnText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDelete} onPress={() => eliminarRecurso(item.id)}>
                <Text style={styles.btnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal para Crear / Editar */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? "Modificar Recurso" : "Nuevo Recurso"}</Text>

            <TextInput style={styles.input} placeholder="Título" value={titulo} onChangeText={setTitulo} />
            <TextInput style={styles.input} placeholder="Descripción" value={descripcion} onChangeText={setDescripcion} multiline />
            <TextInput style={styles.input} placeholder="Tipo (libro, video, artículo...)" value={tipo} onChangeText={setTipo} />
            <TextInput style={styles.input} placeholder="Enlace (URL)" value={enlace} onChangeText={setEnlace} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Imagen (URL opcional)" value={imagen} onChangeText={setImagen} autoCapitalize="none" />

            <View style={styles.modalButtons}>
              <Button title="Cancelar" onPress={() => setModalVisible(false)} color="gray" />
              <Button title={isEditing ? "Actualizar" : "Guardar"} onPress={guardarRecurso} color="#0066cc" />
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
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }
});