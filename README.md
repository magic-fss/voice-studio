# Qwen3-TTS Rich TUI

| |
|:--:|
| [![Python](https://img.shields.io/badge/Python-3.8%2B-blue)](https://python.org) [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) [![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-orange)](https://pytorch.org) |

> 🎙️ 基于 [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) 封装的 Rich 终端交互工具，支持 CustomVoice / VoiceDesign / VoiceClone / Design→Clone 全链路工作流。

<img width="2560" height="1092" alt="QQ_1779957201611" src="https://github.com/user-attachments/assets/45887e19-f070-48eb-864d-ee4c0174c56e" />


## ✨ 特性

- **🎨 精美 TUI**：基于 [Rich](https://github.com/Textualize/rich) 的终端界面，ASCII 艺术字、进度条、表格全支持
- **🗣️ 四种模式**：
  - **CustomVoice**：9 种预设高品质音色（中英日韩等多语言）
  - **VoiceDesign**：自然语言描述生成任意声音
  - **VoiceClone**：参考音频克隆音色
  - **Design→Clone**：先设计声音，再固化复用
- **⚡ 模型缓存**：LRU 风格缓存，避免重复加载，支持显存清理
- **📝 配置持久化**：JSON 配置文件保存在脚本同目录，随项目迁移
- **🌐 本地/在线模型**：支持 HuggingFace ID 或本地绝对路径
- **🔢 编号菜单**：说话人、语言选择改为编号式，附带中文释义
- **⌨️ 全局快捷键**：任意界面输入 `q` 返回主菜单，按 `Enter` 确认返回
- **🧹 自动清屏**：启动及返回主菜单时自动清屏，保持界面整洁

## 📦 环境要求

| 项目 | 最低要求 | 推荐配置 |
|------|---------|---------|
| Python | 3.8+ | 3.10+ |
| CUDA | 11.8+ | 12.1+ |
| VRAM | 8GB | 16GB+ |
| 系统 | Windows 10/11 / Linux / macOS | Windows 11 |

> ⚠️ **注意**：`soundfile` 依赖系统级音频库，Windows 用户需先安装 [SoX](http://sox.sourceforge.net/) 或 [libsndfile](https://github.com/libsndfile/libsndfile/releases)。

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/magic-fss/voice-studio.git
cd voice-studio
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 下载模型（可选，支持在线加载）

从 [HuggingFace](https://huggingface.co/Qwen) 下载所需模型到本地目录：

```
D:\models\HuggingFace\
├── Qwen3-TTS-12Hz-1.7B-Base
├── Qwen3-TTS-12Hz-1.7B-CustomVoice
├── Qwen3-TTS-12Hz-1.7B-VoiceDesign
└── Qwen3-TTS-12Hz-1.7B-Tokenizer
```

### 4. 运行

```bash
python qwen3_tts_tui.py
```

## 📁 项目结构

```
voice-studio/
├── qwen3_tts_tui.py      # 主程序
├── requirements.txt       # Python 依赖
├── README.md              # 说明文档
├── .gitignore             # Git 忽略规则
├── .qwen_tts_tui.json     # 本地配置文件（自动生成）
└── output/                # 默认音频输出目录
```

## 🎮 使用指南

### 主菜单

```
╔═══════╤══════════════════╤═════════════════════════════════════════╗
║   1   │ CustomVoice      │ 预设高品质音色（9种角色）               ║
║   2   │ VoiceDesign      │ 自然语言描述生成声音                    ║
║   3   │ VoiceClone       │ 参考音频克隆音色                        ║
║   4   │ Design → Clone   │ 先设计声音，再固化复用                  ║
║   5   │ ⚙ 设置           │ 自定义模型路径 / 输出目录 / 设备        ║
║   6   │ 🗑 清理缓存       │ 释放模型显存缓存                        ║
║   0   │ 退出             │ 保存配置并退出程序                      ║
╚═══════╧══════════════════╧═════════════════════════════════════════╝
```

### 全局快捷键

| 按键 | 作用 |
|------|------|
| `q` | 任意界面返回主菜单 |
| `Enter` | 确认 / 返回主菜单 |
| `Ctrl+C` | 强制退出 |

### 配置说明

首次运行后会在脚本同目录生成 `.qwen_tts_tui.json`：

```json
{
  "customvoice_model": "D:\\models\\HuggingFace\\Qwen3-TTS-12Hz-1.7B-CustomVoice",
  "voicedesign_model": "D:\\models\\HuggingFace\\Qwen3-TTS-12Hz-1.7B-VoiceDesign",
  "clone_model": "D:\\models\\HuggingFace\\Qwen3-TTS-12Hz-1.7B-Base",
  "tokenizer_model": "D:\\models\\HuggingFace\\Qwen3-TTS-12Hz-1.7B-Tokenizer",
  "output_dir": "E:\\个人项目\\qwen3-tts\\output",
  "device": "cuda:0",
  "dtype": "bfloat16",
  "attn_impl": "sdpa",
  "auto_save_config": true
}
```

可通过 **选项 5 → 设置菜单** 交互式修改，或直接编辑 JSON 文件。

## 🛠️ 开发相关

### 技术栈

- **后端**：PyTorch + Qwen3-TTS
- **TUI**：Rich（Console / Table / Progress / Prompt / Panel）
- **音频**：soundfile（WAV 读写）

### 自定义模型路径

修改 `qwen3_tts_tui.py` 中 `DEFAULT_CONFIG` 字典，或使用设置菜单（选项 5）：

```python
DEFAULT_CONFIG = {
    "customvoice_model": r"你的本地路径或HF ID",
    "output_dir": r"你的输出目录",
    # ...
}
```

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

- [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS) — 阿里巴巴通义千问团队
- [Rich](https://github.com/Textualize/rich) — Textualize 终端美化库
