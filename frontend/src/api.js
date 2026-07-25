const API_BASE = '/api';

export function extractFilename(path) {
  if (!path) return '';
  const parts = path.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || '';
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(err.detail || '请求失败');
  }
  return res.json();
}

export const api = {
  getConfig: () => request('/config'),
  updateConfig: (data) => request('/config', { method: 'POST', body: JSON.stringify(data) }),
  getSpeakers: () => request('/speakers'),
  getLanguages: () => request('/languages'),
  generateCustomVoice: (data) => request('/generate/custom-voice', { method: 'POST', body: JSON.stringify(data) }),
  generateVoiceDesign: (data) => request('/generate/voice-design', { method: 'POST', body: JSON.stringify(data) }),
  generateVoiceClone: (data) => request('/generate/voice-clone', { method: 'POST', body: JSON.stringify(data) }),
  generateDesignThenClone: (data) => request('/generate/design-then-clone', { method: 'POST', body: JSON.stringify(data) }),
  clearCache: () => request('/cache/clear', { method: 'POST' }),
  listFiles: () => request('/files/list'),
  deleteFile: (filename) => request(`/files/delete/${filename}`, { method: 'DELETE' }),
  uploadFile: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: '上传失败' }));
      throw new Error(err.detail || '上传失败');
    }
    return res.json();
  },
  downloadUrl: (filename) => `/api/files/download/${filename}`,
};
