/**
 * Converts an image File to a base64 data URL.
 * Stored in Firestore config instead of Firebase Storage
 * to avoid CORS configuration requirements.
 */
export const uploadLogo = (file) =>
  new Promise((resolve, reject) => {
    // Validate size (max 500KB for Firestore document limit)
    if (file.size > 512 * 1024) {
      reject(new Error('El logo debe ser menor a 500KB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // returns "data:image/png;base64,..."
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });

// Kept for API compatibility
export const deleteLogo = async () => {};
