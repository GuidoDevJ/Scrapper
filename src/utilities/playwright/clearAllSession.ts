import fs from 'fs';
import path from 'path';

export const clearAllSessions = () => {
  const sessionsDir = path.resolve(__dirname, '../sessions');

  if (!fs.existsSync(sessionsDir)) {
    console.warn(
      '⚠️ La carpeta de sesiones no existe, no hay nada que borrar.'
    );
    return;
  }

  const files = fs.readdirSync(sessionsDir);

  if (files.length === 0) {
    console.log('✅ No hay archivos de sesión para eliminar.');
    return;
  }

  for (const file of files) {
    const filePath = path.join(sessionsDir, file);
    try {
      fs.unlinkSync(filePath);
      console.log(`🧹 Sesión eliminada: ${file}`);
    } catch (err) {
      console.error(`❌ Error al eliminar el archivo ${file}:`, err);
    }
  }

  console.log('✅ Todas las sesiones fueron eliminadas.');
};
