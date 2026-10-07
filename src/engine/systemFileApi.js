/**
 * 系统文件能力的渲染层适配：Electron 使用 preload 暴露的 IPC，
 * 浏览器环境由调用方继续使用 input 与下载链接回退。
 */
function electronApi() {
  if (typeof window === "undefined") return null;
  return window.electronAPI?.isElectron ? window.electronAPI : null;
}

function base64ToFile(payload) {
  if (!payload?.data || !payload?.name) return null;
  const binary = atob(payload.data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], payload.name, {
    type: payload.type || "application/octet-stream",
    lastModified: Number(payload.lastModified) || Date.now(),
  });
}

/** Electron 中打开系统文件选择器；浏览器环境返回 null，让调用方打开 input。 */
export async function openImageFiles() {
  const api = electronApi();
  if (!api?.openImageFiles) return null;
  const payloads = await api.openImageFiles();
  return (payloads || []).map(base64ToFile).filter(Boolean);
}

/** 将导出 Blob 交给系统保存对话框；返回 null 表示当前环境没有原生保存 API。 */
export async function saveBlobWithSystemDialog(blob, filename) {
  const api = electronApi();
  if (!api?.saveFile || !blob) return null;
  const data = await blob.arrayBuffer();
  return api.saveFile({
    data,
    filename,
    mimeType: blob.type || "application/octet-stream",
  });
}

