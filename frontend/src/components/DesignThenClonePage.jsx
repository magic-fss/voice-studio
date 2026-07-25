import { useEffect, useState } from 'react';
import { api, extractFilename } from '../api';
import { Loader2, Plus, Trash2, AudioWaveform, ArrowUpRight } from 'lucide-react';
import { MagneticButton, Reveal, SplitText } from './interactions';

export default function DesignThenClonePage() {
  const [languages, setLanguages] = useState([]);
  const [refText, setRefText] = useState('');
  const [refInstruct, setRefInstruct] = useState(
    '男，17 岁，男高音音域，自信心逐步提升，气息支撑更扎实沉稳。'
  );
  const [refLanguage, setRefLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('Auto');
  const [targetTexts, setTargetTexts] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    api.getLanguages().then((data) => setLanguages(data));
  }, []);

  const addText = () => setTargetTexts([...targetTexts, '']);
  const removeText = (i) => setTargetTexts(targetTexts.filter((_, idx) => idx !== i));
  const updateText = (i, v) => {
    const next = [...targetTexts];
    next[i] = v;
    setTargetTexts(next);
  };

  const handleGenerate = async () => {
    const valid = targetTexts.filter((t) => t.trim());
    if (!valid.length) return;
    if (!refText.trim()) {
      setError('参考文本不能为空');
      return;
    }
    setLoading(true);
    setError('');
    setResults([]);
    setStep(1);
    try {
      const res = await api.generateDesignThenClone({
        ref_text: refText,
        ref_instruct: refInstruct,
        ref_language: refLanguage,
        target_language: targetLanguage,
        target_texts: valid,
      });
      if (res.success) {
        setResults(res.files);
        setStep(3);
      }
    } catch (e) {
      setError(e.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: '声音设计', detail: '雕刻声线特征' },
    { num: 2, label: '生成提示词', detail: '建立可复用指纹' },
    { num: 3, label: '声音克隆', detail: '渲染目标语音' },
  ];

  return (
    <div className="space-y-10 animate-fade-in-up">
      <header className="relative">
        <div className="grid grid-cols-12 gap-6 items-end pb-8">
          <div className="col-span-12 lg:col-span-8">
            <div className="section-marker mb-3">§ 04 / 设计再复用</div>
            <h1 className="font-serif text-[46px] leading-[1.06] tracking-tight text-text-primary">
              <SplitText text="先设计声音，" />
              <br />
              <span className="text-text-secondary font-normal italic">
                再永久复用它。
              </span>
            </h1>
            <p className="mt-4 text-[14.5px] text-text-secondary leading-relaxed max-w-[480px]">
              先用声音设计捏出一位说话人，再把它固化为可复用音色，之后任意文本都能直接合成。
              <span className="italic font-serif text-text-muted"> 一次设计，永久复用。</span>
            </p>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-accent-bg border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-breathe" />
              <span className="text-[11.5px] text-accent font-mono font-medium">3 步工作流</span>
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

      <Reveal>
      <section className="rounded-xl bg-bg-card border border-border-subtle p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="section-marker mb-5">工作流</div>
        <div className="flex items-start">
          {steps.map((s, i) => {
            const isActive = step >= s.num;
            const isPast = step > s.num;
            return (
              <div key={s.num} className="flex items-start flex-1 last:flex-none">
                <div className="flex items-start gap-3 flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-mono transition-all duration-500 relative ${
                    isActive
                      ? 'bg-accent text-black shadow-[0_0_0_4px_var(--color-accent-bg)]'
                      : 'bg-bg-tertiary text-text-muted border border-border-subtle'
                  }`}>
                    {String(s.num).padStart(2, '0')}
                  </div>
                  <div className="pt-0.5">
                    <div className={`text-[13.5px] font-medium tracking-tight transition-colors duration-300 ${
                      isActive ? 'text-text-primary' : 'text-text-muted'
                    }`}>
                      {s.label}
                    </div>
                    <div className={`text-[11px] mt-0.5 transition-colors duration-300 ${
                      isActive ? 'text-text-secondary' : 'text-text-muted'
                    }`}>
                      {s.detail}
                    </div>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 mx-3 mt-5 h-px bg-border-subtle relative">
                    <div
                      className={`absolute inset-y-0 left-0 bg-accent transition-all duration-700 ease-out ${
                        step > s.num ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <Reveal>
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-[22px] tracking-tight text-text-primary">
                声音设计 · 参考片段
              </h2>
              <span className="pill pill-accent">第一步</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="section-marker block">参考片段语言</label>
                <select
                  className="w-full h-11 px-4 rounded-xl bg-bg-card border border-border-subtle text-[13.5px] text-text-primary outline-none transition-all hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)]"
                  value={refLanguage}
                  onChange={(e) => setRefLanguage(e.target.value)}
                >
                  {languages.map((l) => (
                    <option key={l.key} value={l.key}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="section-marker block">目标语言</label>
                <select
                  className="w-full h-11 px-4 rounded-xl bg-bg-card border border-border-subtle text-[13.5px] text-text-primary outline-none transition-all hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)]"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                >
                  {languages.map((l) => (
                    <option key={l.key} value={l.key}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="section-marker block">参考片段文本</label>
              <textarea
                className="w-full rounded-xl bg-bg-card border border-border-subtle px-4 py-3.5 text-[14px] text-text-primary outline-none transition-all resize-none min-h-[92px] leading-relaxed hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)] placeholder:text-text-muted"
                placeholder="输入作为设计种子的参考文本..."
                value={refText}
                onChange={(e) => setRefText(e.target.value)}
              />
            </div>

            <div className="mt-4 space-y-2">
              <label className="section-marker block">声音特征描述</label>
              <textarea
                className="w-full rounded-xl bg-bg-card border border-border-subtle px-4 py-3.5 text-[14px] text-text-primary outline-none transition-all resize-none min-h-[110px] leading-relaxed font-serif hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)] placeholder:text-text-muted"
                value={refInstruct}
                onChange={(e) => setRefInstruct(e.target.value)}
              />
            </div>
          </section>
          </Reveal>

          <Reveal delay={80}>
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-[22px] tracking-tight text-text-primary">
                声音克隆 · 目标文本
              </h2>
              <div className="flex items-center gap-3">
                <span className="pill pill-accent">第三步</span>
                <button
                  onClick={addText}
                  className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-accent transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span className="underline-grow">新增一行</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {targetTexts.map((t, i) => (
                <div key={i} className="relative group">
                  <textarea
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-bg-card border border-border-subtle text-[14px] text-text-primary outline-none transition-all resize-none min-h-[92px] leading-relaxed hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)] placeholder:text-text-muted"
                    placeholder="输入最终要合成的目标文本..."
                    value={t}
                    onChange={(e) => updateText(i, e.target.value)}
                  />
                  <div className="absolute left-3.5 top-3.5 archive-number">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  {targetTexts.length > 1 && (
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

          <Reveal delay={160}>
          <MagneticButton
            onClick={handleGenerate}
            disabled={loading || !targetTexts.some((t) => t.trim())}
            strength={0.15}
            className={`group w-full h-12 rounded-xl font-medium text-[14.5px] tracking-tight ripple flex items-center justify-center gap-3 transition-all ${
              loading || !targetTexts.some((t) => t.trim())
                ? 'bg-bg-tertiary text-text-muted cursor-not-allowed border border-border-subtle'
                : 'bg-accent text-black hover:bg-accent-dark border border-accent shadow-md hover:shadow-accent hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                正在执行工作流...
              </>
            ) : (
              <>
                <AudioWaveform className="w-4.5 h-4.5" strokeWidth={1.75} />
                执行设计再复用
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
                <AudioWaveform className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
              </div>
              <span className="section-marker mb-2">等待执行</span>
              <p className="text-[13px] text-text-secondary leading-relaxed max-w-[220px]">
                填好两个步骤的内容后点击执行，链路会生成最终的音频。
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
