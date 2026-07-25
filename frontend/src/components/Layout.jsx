import { Link, useLocation } from 'react-router-dom';
import {
  Mic,
  Copy,
  Wand2,
  Settings,
  FolderOpen,
  Trash2,
  AudioWaveform,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { path: '/', label: '预设音色', icon: Mic, num: '01', desc: '内置说话人' },
  { path: '/voice-design', label: '声音设计', icon: Wand2, num: '02', desc: '文字生成声线' },
  { path: '/voice-clone', label: '声音克隆', icon: Copy, num: '03', desc: '上传参考音频' },
  { path: '/design-clone', label: '设计再复用', icon: AudioWaveform, num: '04', desc: '工作流组合' },
  { path: '/files', label: '文件库', icon: FolderOpen, num: '05', desc: '全部输出' },
  { path: '/config', label: '系统设置', icon: Settings, num: '06', desc: '模型与参数' },
];

/* 动态声纹 Logo */
function SoundLogo() {
  const bars = [
    { h: 8, delay: '0s' },
    { h: 14, delay: '0.15s' },
    { h: 20, delay: '0.3s' },
    { h: 14, delay: '0.45s' },
    { h: 8, delay: '0.6s' },
  ];
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="flex items-center justify-center gap-[3px] h-5">
        {bars.map((b, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-current animate-eq-bar"
            style={{ height: `${b.h}px`, animationDelay: b.delay }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary font-sans">
      {/* 侧边栏 */}
      <aside className="w-[288px] flex-shrink-0 flex flex-col relative bg-bg-secondary border-r border-border-subtle">
        {/* 装饰性背景 */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute bottom-20 -left-10 w-48 h-48 rounded-full bg-accent/[0.03] blur-2xl" />
        </div>

        {/* 品牌区 */}
        <div className="px-6 pt-8 pb-6 relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-transparent flex items-center justify-center relative overflow-hidden text-text-primary">
              <div className="absolute inset-0 bg-accent-bg animate-breathe" />
              <SoundLogo />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[15.5px] font-semibold tracking-tight text-text-primary leading-none">
                Qwen3-TTS
              </h1>
              <p className="text-[11px] text-text-muted leading-none mt-1.5 font-serif italic">
                语音合成工作坊
              </p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />
        </div>

        {/* 导航 */}
        <nav className="flex-1 px-4 pb-4 overflow-y-auto relative">
          <div className="px-3 mb-3 section-marker">功能菜单</div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13.5px] transition-all duration-250 ${
                    active
                      ? 'text-accent bg-accent-bg shadow-sm'
                      : 'text-text-secondary hover:text-accent hover:bg-bg-tertiary/70'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                  )}
                  <span className={`archive-number w-5 flex-shrink-0 ${active ? 'text-accent' : 'text-text-muted group-hover:text-accent'}`}>
                    {item.num}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    active
                      ? 'bg-accent/10 text-accent'
                      : 'bg-bg-tertiary/60 text-text-muted group-hover:bg-bg-tertiary group-hover:text-accent'
                  }`}>
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium tracking-tight leading-tight">
                      {item.label}
                    </div>
                    <div className={`text-[10.5px] mt-0.5 leading-tight ${active ? 'text-accent-light' : 'text-text-muted'}`}>
                      {item.desc}
                    </div>
                  </div>
                  {active && (
                    <Sparkles className="w-3.5 h-3.5 text-accent animate-float-soft flex-shrink-0" strokeWidth={2} />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* 底部状态区 */}
        <div className="px-5 py-5 border-t border-border-subtle relative">
          <div className="flex items-center justify-between mb-4">
            <div className="section-marker">运行状态</div>
            <span className="pill pill-success">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-dot-pulse" />
              就绪
            </span>
          </div>
          <button
            onClick={() => fetch('/api/cache/clear', { method: 'POST' }).then(() => alert('缓存已清理')).catch(() => alert('清理失败'))}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-[10px] text-[12.5px] text-text-secondary border border-border-subtle hover:border-accent hover:text-accent hover:bg-accent-bg transition-all duration-250"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            清理模型缓存
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full px-12 py-10 max-w-[1440px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
