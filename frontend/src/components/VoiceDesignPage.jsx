import { useEffect, useState } from 'react';
import { api, extractFilename } from '../api';
import { Loader2, Plus, Trash2, Wand2, Sparkles, ArrowUpRight } from 'lucide-react';
import { MagneticButton, Reveal, SplitText } from './interactions';

export default function VoiceDesignPage() {
  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState('English');
  const [instruct, setInstruct] = useState(
    '体现撒娇稚嫩的萝莉女声，音调偏高且起伏明显，营造出黏人、做作又刻意卖萌的听觉效果。'
  );
  const [texts, setTexts] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

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

  const handleGenerate = async () => {
    const valid = texts.filter((t) => t.trim());
    if (!valid.length) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const res = await api.generateVoiceDesign({
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

  return (
    <div className="space-y-10 animate-fade-in-up">
      <header className="relative">
        <div className="grid grid-cols-12 gap-6 items-end pb-8">
          <div className="col-span-12 lg:col-span-8">
            <div className="section-marker mb-3">§ 02 / 声音设计</div>
            <h1 className="font-serif text-[46px] leading-[1.06] tracking-tight text-text-primary">
              <SplitText text="用文字雕琢音色，" />
              <br />
              <span className="text-text-secondary font-normal italic">
                让声音独一无二。
              </span>
            </h1>
            <p className="mt-4 text-[14.5px] text-text-secondary leading-relaxed max-w-[480px]">
              描述你想要的声线、语气与节奏，模型会把你的文字变成一位独一无二的说话人。
            </p>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-accent-bg border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-breathe" />
              <span className="text-[11.5px] text-accent font-mono font-medium">{languages.length} 种语言</span>
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
                声音特征描述
              </h2>
              <span className="section-marker">声音简报</span>
            </div>

            <textarea
              className="w-full px-4 py-3.5 rounded-xl bg-bg-card border border-border-subtle text-[14px] text-text-primary outline-none transition-all resize-none min-h-[160px] leading-relaxed hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)] placeholder:text-text-muted font-serif"
              placeholder="详细描述你想要的声线：年龄、性别、音色、语气、语速、节奏..."
              value={instruct}
              onChange={(e) => setInstruct(e.target.value)}
            />

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="section-marker mr-1">参考</span>
              {[
                '年轻女性，温柔甜美',
                '成熟男性，低沉稳重',
                '儿童声，活泼可爱',
                '机器人，机械冷酷',
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setInstruct(tag)}
                  className="px-2.5 py-1 rounded-lg text-[11.5px] text-text-secondary border border-border-subtle hover:border-accent hover:text-accent hover:bg-accent-bg transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>
          </Reveal>

          <Reveal delay={80}>
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-[22px] tracking-tight text-text-primary">
                目标语言
              </h2>
              <span className="section-marker">输出语种</span>
            </div>

            <div className="space-y-2">
              <label className="section-marker block">选择语言</label>
              <select
                className="w-full md:w-1/2 h-11 px-4 rounded-xl bg-bg-card border border-border-subtle text-[13.5px] text-text-primary outline-none transition-all hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)]"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languages.map((l) => (
                  <option key={l.key} value={l.key}>{l.label}</option>
                ))}
              </select>
            </div>
          </section>
          </Reveal>

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
                正在设计声音...
              </>
            ) : (
              <>
                <Wand2 className="w-4.5 h-4.5" strokeWidth={1.75} />
                生成语音
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
                <Sparkles className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
              </div>
              <span className="section-marker mb-2">等待简报</span>
              <p className="text-[13px] text-text-secondary leading-relaxed max-w-[220px]">
                描述一个声音，再填入待合成文本，结果将在此处显示。
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
