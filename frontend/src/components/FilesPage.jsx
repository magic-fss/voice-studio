import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { Trash2, Download, RefreshCw, Music, FolderOpen, Play, Pause } from 'lucide-react';
import { Reveal, SplitText } from './interactions';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatTime(ts) {
  return new Date(ts * 1000).toLocaleString('zh-CN');
}

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [playing, setPlaying] = useState(null);
  const audioEl = useRef(null);

  const togglePlay = (name) => {
    if (playing === name) {
      audioEl.current?.pause();
      setPlaying(null);
    } else {
      if (audioEl.current) {
        audioEl.current.pause();
      }
      audioEl.current = new Audio(api.downloadUrl(name));
      audioEl.current.onended = () => setPlaying(null);
      audioEl.current.onerror = () => setPlaying(null);
      audioEl.current.play().catch(() => setPlaying(null));
      setPlaying(name);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.listFiles();
      setFiles(res.files || []);
    } catch (e) {
      alert('加载失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (name) => {
    if (!confirm(`确定删除 ${name} 吗？`)) return;
    setDeleting(name);
    try {
      await api.deleteFile(name);
      await load();
    } catch (e) {
      alert('删除失败: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in-up">
      <header className="relative">
        <div className="grid grid-cols-12 gap-6 items-end pb-8">
          <div className="col-span-12 lg:col-span-8">
            <div className="section-marker mb-3">§ 05 / 文件库</div>
            <h1 className="font-serif text-[46px] leading-[1.06] tracking-tight text-text-primary">
              <SplitText text="浏览全部音频文件，" />
              <br />
              <span className="text-text-secondary font-normal italic">
                每一个声音，都妥帖归档。
              </span>
            </h1>
            <p className="mt-4 text-[14.5px] text-text-secondary leading-relaxed max-w-[480px]">
              浏览、试听、下载或删除工作台生成的全部音频文件。
            </p>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:text-right">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-accent transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
              <span className="underline-grow">刷新列表</span>
            </button>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />
      </header>

      {files.length === 0 ? (
        <Reveal>
          <section className="empty-state p-16 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center mb-4">
              <FolderOpen className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
            </div>
            <span className="section-marker mb-2">暂无文件</span>
            <h3 className="font-serif text-[20px] tracking-tight text-text-primary mb-2">
              文件库还是空的
            </h3>
            <p className="text-[13px] text-text-secondary leading-relaxed max-w-[280px]">
              使用上方任意一种工作流合成音频，输出文件会自动归档到这里。
            </p>
          </section>
        </Reveal>
      ) : (
        <Reveal>
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-[22px] tracking-tight text-text-primary">
                全部文件
              </h2>
              <span className="pill pill-muted">
                共 {files.length} 个
              </span>
            </div>

            <div className="rounded-xl bg-bg-card border border-border-subtle overflow-hidden shadow-soft">
              <div className="divide-y divide-border-subtle">
                {files.map((f, i) => (
                  <div
                    key={f.name}
                    className="px-5 py-4 hover:bg-accent-bg transition-colors flex items-center gap-4 group"
                  >
                    <div className="archive-number w-7 flex-shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center flex-shrink-0 group-hover:bg-accent-bg transition-colors duration-300">
                      <Music className="w-4 h-4 text-text-secondary group-hover:text-accent transition-colors duration-300" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium text-text-primary truncate tracking-tight">
                        {f.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-mono text-[11px] text-text-muted">{formatSize(f.size)}</span>
                        <span className="text-text-muted">·</span>
                        <span className="font-mono text-[11px] text-text-muted">{formatTime(f.modified)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePlay(f.name)}
                        className={`p-2 rounded-lg transition-all border ${
                          playing === f.name
                            ? 'bg-accent-bg text-accent border-accent'
                            : 'text-text-muted hover:text-accent hover:bg-accent-bg border-transparent'
                        }`}
                        title={playing === f.name ? '暂停' : '播放'}
                      >
                        {playing === f.name ? (
                          <Pause className="w-4 h-4" strokeWidth={1.75} />
                        ) : (
                          <Play className="w-4 h-4" strokeWidth={1.75} />
                        )}
                      </button>
                      <a
                        href={api.downloadUrl(f.name)}
                        download
                        className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent-bg transition-colors"
                        title="下载"
                      >
                        <Download className="w-4 h-4" strokeWidth={1.75} />
                      </a>
                      <button
                        onClick={() => handleDelete(f.name)}
                        disabled={deleting === f.name}
                        className="p-2 rounded-lg text-text-muted hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="删除"
                      >
                        <Trash2 className={`w-4 h-4 ${deleting === f.name ? 'animate-pulse' : ''}`} strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}
