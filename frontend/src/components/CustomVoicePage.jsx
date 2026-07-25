import { useEffect, useState } from 'react';
import { api, extractFilename } from '../api';
import { Play, Loader2, Plus, Trash2, Wand2, ArrowUpRight, Volume2 } from 'lucide-react';
import { MagneticButton, TiltCard, Reveal, SplitText } from './interactions';

export default function CustomVoicePage() {
  const [speakers, setSpeakers] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [speaker, setSpeaker] = useState('');
  const [language, setLanguage] = useState('Auto');
  const [instruct, setInstruct] = useState('');
  const [texts, setTexts] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSpeakers().then((data) => {
      setSpeakers(data);
      if (data.length) setSpeaker(data[0].name);
    });
    api.getLanguages().then((data) => setLanguages(data));
  }, []);

  const addText = () => setTexts([...texts, '']);
  const removeText = (i) => setTexts(texts.filter((_, idx) => idx !== i));
  const updateText = (i, v) => {
    const next = [...texts];
    next[i] = v;
    setTexts(next);
  };

  const handleGenerate = async () => {
    const valid = texts.filter((t) => t.trim());
    if (!valid.length) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const res = await api.generateCustomVoice({
        speaker,
        language,
        instruct,
        texts: valid,
      });
      if (res.success) setResults(res.files);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedSpeakerInfo = speakers.find((s) => s.name === speaker);

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* 页面头部 */}
      <header className="relative">
        <div className="grid grid-cols-12 gap-6 items-end pb-8">
          <div className="col-span-12 lg:col-span-8">
            <div className="section-marker mb-3">§ 01 / 预设音色</div>
            <h1 className="font-serif text-[46px] leading-[1.06] tracking-tight text-text-primary">
              <SplitText text="挑选一位说话人，" />
              <br />
              <span className="text-text-secondary font-normal italic">
                让声音即刻发声。
              </span>
            </h1>
            <p className="mt-4 text-[14.5px] text-text-secondary leading-relaxed max-w-[480px]">
              从精心录制的内置声线库中选择，几秒钟内生成自然流畅的语音。
            </p>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-accent-bg border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-breathe" />
              <span className="text-[11.5px] text-accent font-mono font-medium">{speakers.length} 位说话人</span>
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
          {/* 说话人选择 */}
          <Reveal>
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-[22px] tracking-tight text-text-primary">
                说话人档案
              </h2>
              <span className="archive-number">共 {speakers.length} 位</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {speakers.map((s) => {
                const active = speaker === s.name;
                return (
                  <TiltCard
                    key={s.name}
                    max={5}
                    onClick={() => setSpeaker(s.name)}
                    className={`group px-4 py-3.5 rounded-xl text-left transition-all duration-300 border cursor-pointer relative overflow-hidden ${
                      active
                        ? 'border-accent bg-accent-bg/60 shadow-md z-10'
                        : 'border-border-subtle bg-bg-card hover:border-border-hover hover:shadow-sm hover:bg-bg-tertiary/40'
                    }`}
                  >
                    <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full transition-opacity duration-300 ${
                      active ? 'opacity-30' : 'opacity-0 group-hover:opacity-10'
                    }`} style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 65%)' }} />
                    <div className="flex items-center justify-between mb-2 relative">
                      <span className={`section-marker transition-colors duration-300 ${active ? 'text-accent' : 'text-text-muted group-hover:text-accent'}`}>
                        说话人
                      </span>
                      {active && (
                        <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_0_3px_rgba(184,92,56,0.15)] animate-breathe" />
                      )}
                    </div>
                    <div className={`font-semibold text-[14.5px] tracking-tight transition-colors duration-300 relative ${
                      active ? 'text-accent-dark' : 'text-text-primary'
                    }`}>
                      {s.name}
                    </div>
                    <p className={`text-[12px] mt-1 leading-relaxed transition-colors duration-300 relative line-clamp-2 ${
                      active ? 'text-accent-light' : 'text-text-muted group-hover:text-accent'
                    }`}>
                      {s.description}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2 relative">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-mono transition-all duration-300 ${
                        active
                          ? 'bg-accent text-black'
                          : 'bg-bg-tertiary text-text-secondary group-hover:bg-bg-secondary'
                      }`}>
                        {s.language}
                      </span>
                    </div>
                  </TiltCard>
                );
              })}
            </div>

            {selectedSpeakerInfo && (
              <div className="mt-5 p-4 rounded-xl bg-bg-card border border-border-subtle flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-accent-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Volume2 className="w-4 h-4 text-accent" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] text-text-primary">
                    {selectedSpeakerInfo.name}
                  </div>
                  <p className="text-[12.5px] text-text-secondary mt-1 leading-relaxed">
                    {selectedSpeakerInfo.description}
                  </p>
                </div>
                <span className="pill pill-accent">
                  {selectedSpeakerInfo.language}
                </span>
              </div>
            )}
          </section>
          </Reveal>

          {/* 合成参数 */}
          <Reveal delay={80}>
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-[22px] tracking-tight text-text-primary">
                合成设置
              </h2>
              <span className="section-marker">语言 / 风格</span>
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
                <label className="section-marker block">语气风格指令 <span className="text-text-muted">(可选)</span></label>
                <input
                  type="text"
                  className="w-full h-11 px-4 rounded-xl bg-bg-card border border-border-subtle text-[13.5px] text-text-primary outline-none transition-all hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)] placeholder:text-text-muted"
                  placeholder="例如：用特别愤怒的语气说"
                  value={instruct}
                  onChange={(e) => setInstruct(e.target.value)}
                />
              </div>
            </div>
          </section>
          </Reveal>

          {/* 待合成文本 */}
          <Reveal delay={160}>
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
                    placeholder="输入要合成的文本..."
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

          {/* 生成按钮 */}
          <Reveal delay={240}>
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
                正在合成语音...
              </>
            ) : (
              <>
                <Wand2 className="w-4.5 h-4.5" strokeWidth={1.75} />
                开始合成
                <ArrowUpRight className="w-4.5 h-4.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.75} />
              </>
            )}
          </MagneticButton>
          </Reveal>
        </div>

        {/* 右侧结果区 */}
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
                <Volume2 className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
              </div>
              <span className="section-marker mb-2">等待合成</span>
              <p className="text-[13px] text-text-secondary leading-relaxed max-w-[220px]">
                选择一位说话人，填入文本，合成结果将在此处显示。
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
