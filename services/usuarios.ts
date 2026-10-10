export interface UsuarioAPI {
  id: string;
  nombre_usuario?: string;
  correo: string;
  password: string;
  rol: string;
}

export const API_USUARIOS = 'https://6ac8213575a4ce3fe7227957.mockapi.io/usuarios';

export async function fetchUsuarios(): Promise<UsuarioAPI[]> {
  const response = await fetch(`${API_USUARIOS}?page=1&limit=100`);
  if (!response.ok) {
    throw new Error(`No se pudieron consultar los usuarios (estado ${response.status}).`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('El servidor devolvió una lista de usuarios inválida.');
  }

  return data.map((usuario: unknown) => {
    if (typeof usuario !== 'object' || usuario === null) {
      throw new Error('El servidor devolvió un usuario inválido.');
    }

    const registro = usuario as Record<string, unknown>;
    if (
      typeof registro.id !== 'string' ||
      typeof registro.correo !== 'string' ||
      typeof registro.password !== 'string' ||
      typeof registro.rol !== 'string' ||
      (registro.nombre_usuario !== undefined && typeof registro.nombre_usuario !== 'string')
    ) {
      throw new Error('El servidor devolvió un usuario con campos inválidos.');
    }

    return {
      id: registro.id,
      nombre_usuario:
        typeof registro.nombre_usuario === 'string' ? registro.nombre_usuario : undefined,
      correo: registro.correo,
      password: registro.password,
      rol: registro.rol,
    };
  });
}
