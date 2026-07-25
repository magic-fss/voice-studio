import { useEffect, useState } from 'react';
import { api } from '../api';
import { Save, RefreshCw, Settings } from 'lucide-react';
import { MagneticButton, Reveal, SplitText } from './interactions';

const fields = [
  { key: 'customvoice_model', label: 'CustomVoice 模型路径', type: 'text', group: '模型' },
  { key: 'voicedesign_model', label: 'VoiceDesign 模型路径', type: 'text', group: '模型' },
  { key: 'clone_model', label: 'VoiceClone 模型路径', type: 'text', group: '模型' },
  { key: 'tokenizer_model', label: 'Tokenizer 模型路径', type: 'text', group: '模型' },
  { key: 'output_dir', label: '输出目录', type: 'text', group: '运行' },
  { key: 'device', label: '推理设备', type: 'text', group: '运行' },
  { key: 'dtype', label: '推理精度', type: 'select', options: ['bfloat16', 'float16', 'float32'], group: '运行' },
  { key: 'attn_impl', label: '注意力实现', type: 'select', options: ['sdpa', 'eager', 'flash_attention_2'], group: '运行' },
];

export default function ConfigPage() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await api.getConfig();
      setConfig(data);
    } catch (e) {
      setMessage('加载配置失败: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.updateConfig(config);
      setMessage('配置已保存');
    } catch (e) {
      setMessage('保存失败: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const groups = Array.from(new Set(fields.map((f) => f.group)));

  return (
    <div className="space-y-10 animate-fade-in-up">
      <header className="relative">
        <div className="grid grid-cols-12 gap-6 items-end pb-8">
          <div className="col-span-12 lg:col-span-8">
            <div className="section-marker mb-3">§ 06 / 系统设置</div>
            <h1 className="font-serif text-[46px] leading-[1.06] tracking-tight text-text-primary">
              <SplitText text="调校这台语音机器，" />
              <br />
              <span className="text-text-secondary font-normal italic">
                让它为你所用。
              </span>
            </h1>
            <p className="mt-4 text-[14.5px] text-text-secondary leading-relaxed max-w-[480px]">
              配置模型路径、推理设备与精度。保存后需要重新加载模型才会生效。
            </p>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:text-right">
            <button
              onClick={loadConfig}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-accent transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
              <span className="underline-grow">从磁盘重载</span>
            </button>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />
      </header>

      {message && (
        <div className={`px-4 py-3 rounded-xl border flex items-center gap-3 transition-colors ${
          message.includes('失败')
            ? 'bg-red-50/60 border-red-200/60'
            : 'bg-emerald-50/60 border-emerald-200/60'
        }`}>
          <span className={`section-marker ${
            message.includes('失败') ? 'text-red-700' : 'text-emerald-700'
          }`}>
            {message.includes('失败') ? '错误' : '已保存'}
          </span>
          <span className={`text-[13px] flex-1 ${
            message.includes('失败') ? 'text-red-800' : 'text-emerald-800'
          }`}>
            {message}
          </span>
        </div>
      )}

      {loading ? (
        <section className="rounded-xl bg-bg-card border border-border-subtle p-16 flex items-center justify-center shadow-sm">
          <RefreshCw className="w-5 h-5 text-text-muted animate-spin" />
        </section>
      ) : (
        <div className="space-y-10">
          {groups.map((g, idx) => (
            <Reveal key={g} delay={idx * 80}>
              <section>
                <div className="flex items-baseline justify-between mb-5">
                  <h2 className="font-serif text-[22px] tracking-tight text-text-primary">
                    {g === '模型' ? '模型路径' : '运行参数'}
                  </h2>
                  <span className="pill pill-accent">
                    共 {fields.filter(f => f.group === g).length} 项
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-bg-card border border-border-subtle shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                    {fields.filter(f => f.group === g).map((f) => (
                      <div key={f.key} className="space-y-2">
                        <label className="section-marker block">{f.label}</label>
                        {f.type === 'select' ? (
                          <select
                            className="w-full h-11 px-4 rounded-xl bg-bg-card border border-border-subtle text-[13.5px] text-text-primary outline-none transition-all hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)]"
                            value={config[f.key] || ''}
                            onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })}
                          >
                            {f.options.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="w-full h-11 px-4 rounded-xl bg-bg-card border border-border-subtle text-[13.5px] text-text-primary outline-none transition-all hover:border-border-hover focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-bg)] placeholder:text-text-muted font-mono"
                            value={config[f.key] || ''}
                            onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </Reveal>
          ))}

          <Reveal delay={groups.length * 80}>
            <section className="p-6 rounded-xl bg-bg-card border border-border-subtle shadow-sm">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-accent-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Settings className="w-4.5 h-4.5 text-accent" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-semibold text-[14px] text-text-primary">
                      配置文件路径
                    </div>
                    <p className="text-[12.5px] text-text-secondary mt-1 leading-relaxed">
                      配置文件保存于 <code className="px-1.5 py-0.5 rounded-lg bg-bg-tertiary text-text-primary text-[12px] font-mono">backend/.qwen_tts_web.json</code>
                    </p>
                    <p className="text-[12px] text-text-muted mt-1">
                      保存后请重新加载模型以应用最新配置。
                    </p>
                  </div>
                </div>
                <MagneticButton
                  onClick={handleSave}
                  disabled={saving}
                  strength={0.15}
                  className={`group h-12 px-6 rounded-xl font-medium text-[14.5px] tracking-tight ripple flex items-center gap-2.5 transition-all ${
                    saving
                      ? 'bg-bg-tertiary text-text-muted cursor-not-allowed border border-border-subtle'
                      : 'bg-accent text-black hover:bg-accent-dark border border-accent shadow-md hover:shadow-accent hover:-translate-y-0.5'
                  }`}
                >
                  <Save className="w-4.5 h-4.5" strokeWidth={1.75} />
                  {saving ? '正在保存...' : '保存配置'}
                </MagneticButton>
              </div>
            </section>
          </Reveal>
        </div>
      )}
    </div>
  );
}
