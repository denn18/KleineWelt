export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}


export function assetUrl(p) {
  if (!p) return '';
  return p.startsWith('http') ? p : `${import.meta.env.VITE_BACKEND_URL || ''}${p}`;
}
