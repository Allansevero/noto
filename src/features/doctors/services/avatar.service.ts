import { supabase } from '@/lib/supabase/client';

// Lista de buckets suportados em ordem de prioridade
const BUCKET_CANDIDATES = ['assets', 'avatares', 'avatars', 'public'];

/**
 * Redimensiona e comprime uma imagem para um Base64 leve e de alta qualidade (300x300)
 */
export function compressImageToBase64(file: File, maxSize = 300): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Converte base64 para Blob
 */
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/png';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Realiza upload real da imagem de perfil para o bucket do Supabase Storage.
 * Salva no bucket 'assets' (ou 'avatares'/'avatars') gerando a URL pública oficial.
 */
export async function uploadDoctorAvatar(
  fileOrBase64: File | string,
  identifier = 'doctor'
): Promise<string> {
  let file: File | Blob;
  let fileExt = 'jpg';
  let mimeType = 'image/jpeg';
  let fallbackBase64 = '';

  if (fileOrBase64 instanceof File) {
    fallbackBase64 = await compressImageToBase64(fileOrBase64);
    file = fileOrBase64;
    mimeType = fileOrBase64.type || 'image/jpeg';
    fileExt = fileOrBase64.name.split('.').pop() || 'jpg';
  } else if (typeof fileOrBase64 === 'string') {
    if (!fileOrBase64.startsWith('data:image/')) {
      return fileOrBase64;
    }
    fallbackBase64 = fileOrBase64;
    file = base64ToBlob(fileOrBase64);
    mimeType = fileOrBase64.split(';base64,')[0].split(':')[1] || 'image/jpeg';
    fileExt = mimeType.split('/')[1] || 'jpg';
  } else {
    return '';
  }

  const cleanIdentifier = identifier.replace(/[^a-zA-Z0-9_-]/g, '');
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  const fileName = `avatars/${cleanIdentifier}-${timestamp}-${random}.${fileExt}`;

  // Tenta upload no bucket 'assets' e demais candidatos
  for (const bucket of BUCKET_CANDIDATES) {
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: mimeType,
        });

      if (!uploadError && uploadData) {
        const { data: publicData } = supabase.storage
          .from(bucket)
          .getPublicUrl(uploadData.path || fileName);

        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }
      }
    } catch {
      // Tenta próximo bucket
    }
  }

  return fallbackBase64;
}
