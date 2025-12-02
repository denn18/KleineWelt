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

  let url = '';
  if (typeof p === 'string') {
    url = p;
  } else {
    url = p.url || (p.key ? `/api/files/${encodeURIComponent(p.key)}` : '');
  }

  if (!url) return '';

  return url.startsWith('http') ? url : `${import.meta.env.VITE_BACKEND_URL || ''}${url}`;
}
