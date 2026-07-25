import { useEffect, useState, useRef } from 'react';
import { api, extractFilename } from '../api';
import { Loader2, Plus, Trash2, Upload, Copy, Play, AlertCircle, ArrowUpRight, Mic } from 'lucide-react';
import { MagneticButton, Reveal, SplitText } from './interactions';

export default function VoiceClonePage() {
  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState('Auto');
  const [refAudio, setRefAudio] = useState('');
  const [refText, setRefText] = useState('');
  const [xVectorOnly, setXVectorOnly] = useState(false);
  const [texts, setTexts] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.getLanguages().then((data) => setLanguages(data));
  }, []);

  const addText = () => setTexts([...texts, '']);
  const removeText = (i) => setTexts(texts.filter((_, idx) => idx !== i));
  const updateText = (i, v) => {
    const next = [...texts];
    next[i] = v;
    setTexts(next);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadFile(file);
      setRefAudio(res.path);
      setUploadedFile(file.name);
    } catch (err) {
      setError('上传失败: ' + err.message);
    }
  };

  const handleGenerate = async () => {
    const valid = texts.filter((t) => t.trim());
    if (!valid.length) return;
    if (!refAudio.trim()) {
      setError('请提供参考音频');
      return;
    }
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const res = await api.generateVoiceClone({
        ref_audio: refAudio,
        ref_text: refText,
        x_vector_only: xVectorOnly,
        language,
        texts: valid,
      });
      if (res.success) setResults(res.files);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in-up">
      <header className="relative">
        <div className="grid grid-cols-12 gap-6 items-end pb-8">
          <div className="col-span-12 lg:col-span-8">
            <div className="section-marker mb-3">§ 03 / 声音克隆</div>
            <h1 className="font-serif text-[46px] leading-[1.06] tracking-tight text-text-primary">
              <SplitText text="借来一个声音，" />
              <br />
              <span className="text-text-secondary font-normal italic">
                说出新的句子。
              </span>
            </h1>
            <p className="mt-4 text-[14.5px] text-text-secondary leading-relaxed max-w-[480px]">
              上传一段参考音频并提供对应文字，让模型克隆这位说话人，读出你想要的任意内容。
            </p>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-accent-bg border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-breathe" />
              <span className="text-[11.5px] text-accent font-mono font-medium">Voice Clone</span>
            </div>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />
      </header>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50/60 border border-red-200/60 flex items-center gap-3">
          <span className="section-marker text-red-700">错误</span>
          <span className="text-[13px] text-red-800 flex-1">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <Reveal>
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-[22px] tracking-tight text-text-primary">
                参考音频
              </h2>
              <span className="section-marker">素材来源</span>
            </div>

            <div className="relative group">
              <input
                type="text"
                className="w-full h-11 px-4 pr-24 rounded-xl bg-bg-card border border-border-subtle text-[13.5px] text-text-primary outline-none transition-all hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)] placeholder:text-text-muted font-mono"
                placeholder="本地路径 / 链接 / base64"
                value={refAudio}
                onChange={(e) => { setRefAudio(e.target.value); setUploadedFile(null); }}
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="audio/*"
                onChange={handleUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-text-primary border border-border-subtle hover:border-accent hover:bg-accent hover:text-black transition-all"
              >
                <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
                上传
              </button>
            </div>

            {uploadedFile && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span className="section-marker text-emerald-700">已上传</span>
                <span className="text-[12.5px] text-emerald-800 font-mono truncate">{uploadedFile}</span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: '格式', value: 'WAV / MP3 / OGG' },
                { label: '时长', value: '5–30 秒' },
                { label: '大小', value: '< 50 MB' },
              ].map((item) => (
                <div key={item.label} className="px-3 py-2.5 rounded-xl bg-bg-tertiary">
                  <div className="section-marker">{item.label}</div>
                  <div className="text-[12.5px] text-text-primary mt-0.5 font-mono">{item.value}</div>
                </div>
              ))}
            </div>
          </section>
          </Reveal>

          <Reveal delay={80}>
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-[22px] tracking-tight text-text-primary">
                参考文本
              </h2>
              <span className="section-marker">对应转写</span>
            </div>

            <textarea
              className="w-full px-4 py-3 rounded-xl bg-bg-card border border-border-subtle text-[14px] text-text-primary outline-none transition-all resize-none min-h-[96px] leading-relaxed hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)] placeholder:text-text-muted"
              placeholder="输入参考音频中说话人念出的对应文字..."
              value={refText}
              onChange={(e) => setRefText(e.target.value)}
            />

            <label className="flex items-start gap-3 mt-4 p-4 rounded-xl bg-bg-tertiary border border-border-subtle cursor-pointer hover:border-accent transition-all">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={xVectorOnly}
                onChange={(e) => setXVectorOnly(e.target.checked)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" strokeWidth={1.75} />
                  <span className="text-[13px] text-text-primary font-medium">启用 x_vector_only 模式</span>
                </div>
                <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                  无需提供参考文本即可克隆，但合成质量可能下降，适用于没有转写文字的场景。
                </p>
              </div>
            </label>
          </section>
          </Reveal>

          <Reveal delay={160}>
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-[22px] tracking-tight text-text-primary">
                合成设置
              </h2>
              <span className="section-marker">目标语言</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="section-marker block">目标语言</label>
                <select
                  className="w-full h-11 px-4 rounded-xl bg-bg-card border border-border-subtle text-[13.5px] text-text-primary outline-none transition-all hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)]"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {languages.map((l) => (
                    <option key={l.key} value={l.key}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="section-marker block">克隆模式</label>
                <div className="h-11 px-4 rounded-xl bg-bg-card border border-border-subtle flex items-center">
                  <span className="pill pill-accent">
                    {xVectorOnly ? '仅声纹' : '完整克隆'}
                  </span>
                </div>
              </div>
            </div>
          </section>
          </Reveal>

          <Reveal delay={240}>
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-[22px] tracking-tight text-text-primary">
                待合成文本
              </h2>
              <button
                onClick={addText}
                className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-accent transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span className="underline-grow">新增一行</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {texts.map((t, i) => (
                <div key={i} className="relative group">
                  <textarea
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-bg-card border border-border-subtle text-[14px] text-text-primary outline-none transition-all resize-none min-h-[92px] leading-relaxed hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)] placeholder:text-text-muted"
                    placeholder="输入克隆声音要朗读的文本..."
                    value={t}
                    onChange={(e) => updateText(i, e.target.value)}
                  />
                  <div className="absolute left-3.5 top-3.5 archive-number">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  {texts.length > 1 && (
                    <button
                      onClick={() => removeText(i)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
          </Reveal>

          <Reveal delay={320}>
          <MagneticButton
            onClick={handleGenerate}
            disabled={loading || !texts.some((t) => t.trim())}
            strength={0.15}
            className={`group w-full h-12 rounded-xl font-medium text-[14.5px] tracking-tight ripple flex items-center justify-center gap-3 transition-all ${
              loading || !texts.some((t) => t.trim())
                ? 'bg-bg-tertiary text-text-muted cursor-not-allowed border border-border-subtle'
                : 'bg-accent text-black hover:bg-accent-dark border border-accent shadow-md hover:shadow-accent hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                正在克隆声音...
              </>
            ) : (
              <>
                <Copy className="w-4.5 h-4.5" strokeWidth={1.75} />
                开始克隆
                <ArrowUpRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.75} />
              </>
            )}
          </MagneticButton>
          </Reveal>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          {results.length > 0 ? (
            <section className="sticky top-8">
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="font-serif text-[22px] tracking-tight text-text-primary">
                  生成结果
                </h2>
                <span className="pill pill-success">
                  {results.length} 个文件
                </span>
              </div>

              <div className="space-y-3">
                {results.map((f, i) => {
                  const filename = extractFilename(f);
                  return (
                    <div key={i} className="p-4 rounded-xl bg-bg-card border border-border-subtle shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[11px] text-text-muted truncate flex-1 mr-2">
                          {filename}
                        </span>
                        <span className="archive-number flex-shrink-0">#{String(i + 1).padStart(2, '0')}</span>
                      </div>
                      <audio controls className="w-full h-9" src={api.downloadUrl(filename)} />
                      <a
                        href={api.downloadUrl(filename)}
                        download={filename}
                        className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-[12.5px] text-text-secondary border border-border-subtle hover:border-accent hover:text-accent hover:bg-accent-bg transition-all"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 rotate-90" strokeWidth={1.75} />
                        下载音频
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="empty-state p-10 flex flex-col items-center justify-center text-center min-h-[300px] sticky top-8">
              <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center mb-4">
                <Mic className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
              </div>
              <span className="section-marker mb-2">等待素材</span>
              <p className="text-[13px] text-text-secondary leading-relaxed max-w-[220px]">
                上传一段参考音频并填入目标文本，克隆结果将在此处显示。
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
