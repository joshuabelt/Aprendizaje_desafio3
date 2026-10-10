export interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  enlace: string;
  imagen: string;
  calificacion: number;
  calificaciones: Calificacion[];
  favoritos: string[];
}

export interface Calificacion {
  usuarioId: string;
  valor: number;
}

export const API_RECURSOS = 'https://6ac8213575a4ce3fe7227957.mockapi.io/recursos';

function normalizarRecurso(data: unknown): Recurso {
  if (typeof data !== 'object' || data === null) {
    throw new Error('La API devolvió un recurso con formato inválido.');
  }

  const recurso = data as Record<string, unknown>;
  const camposTexto = ['id', 'titulo', 'descripcion', 'tipo', 'enlace', 'imagen'];
  if (camposTexto.some((campo) => typeof recurso[campo] !== 'string')) {
    throw new Error('La API devolvió un recurso con campos de texto inválidos.');
  }

  const calificaciones = recurso.calificaciones ?? [];
  const favoritos = recurso.favoritos ?? [];
  const calificacion = recurso.calificacion ?? 0;

  if (
    !Array.isArray(calificaciones) ||
    !calificaciones.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.usuarioId === 'string' &&
        Number.isInteger(item.valor) &&
        item.valor >= 1 &&
        item.valor <= 5,
    ) ||
    !Array.isArray(favoritos) ||
    !favoritos.every((usuarioId) => typeof usuarioId === 'string') ||
    typeof calificacion !== 'number'
  ) {
    throw new Error('La API devolvió favoritos o calificaciones con formato inválido.');
  }

  return {
    id: recurso.id as string,
    titulo: recurso.titulo as string,
    descripcion: recurso.descripcion as string,
    tipo: recurso.tipo as string,
    enlace: recurso.enlace as string,
    imagen: recurso.imagen as string,
    calificacion,
    calificaciones: calificaciones as Calificacion[],
    favoritos,
  };
}

export async function fetchRecursos(): Promise<Recurso[]> {
  const response = await fetch(API_RECURSOS);

  if (!response.ok) {
    throw new Error(`La API respondió con el estado ${response.status}.`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('La respuesta de la API no contiene una lista de recursos.');
  }

  return data.map(normalizarRecurso);
}

export async function actualizarRecurso(
  id: string,
  cambios: Pick<Recurso, 'favoritos' | 'calificacion' | 'calificaciones'>,
): Promise<Recurso> {
  const response = await fetch(`${API_RECURSOS}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambios),
  });

  if (!response.ok) {
    throw new Error(`No se pudo actualizar el recurso (estado ${response.status}).`);
  }

  return normalizarRecurso(await response.json());
}
