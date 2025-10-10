import { resizeImage } from './imageUtils';

export interface AvatarOptimizeOptions {
  maxSize?: number;      // Tamaño máximo en píxeles (cuadrado)
  quality?: number;      // Calidad de compresión (0-1)
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Optimiza una imagen de avatar para web
 * - Redimensiona a tamaño óptimo manteniendo aspect ratio
 * - Comprime usando formato WebP
 * - Reduce tamaño de archivo significativamente
 */
export async function optimizeAvatar(
  file: File,
  options: AvatarOptimizeOptions = {}
): Promise<File> {
  const {
    maxSize = 512,      // 512x512 es perfecto para avatares
    quality = 0.9,      // Alta calidad
    format = 'webp'     // WebP = mejor compresión
  } = options;

  // 1. Validación de formato
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen');
  }

  // 2. Redimensionar manteniendo aspect ratio
  const resized = await resizeImage(file, {
    maxWidth: maxSize,
    maxHeight: maxSize,
    quality,
    format,
    maintainAspectRatio: true
  });

  // 3. Retornar archivo optimizado
  return resized.file;
}

/**
 * Genera un preview base64 de una imagen para mostrar antes de subir
 */
export function getAvatarPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
