export interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  enlace: string;
  imagen: string;
}

export const API_RECURSOS = 'https://6ac8213575a4ce3fe7227957.mockapi.io/recursos';

export async function fetchRecursos(): Promise<Recurso[]> {
  const response = await fetch(API_RECURSOS);

  if (!response.ok) {
    throw new Error(`La API respondió con el estado ${response.status}.`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('La respuesta de la API no contiene una lista de recursos.');
  }

  return data as Recurso[];
}
