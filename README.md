<div align="center">
  <h1><strong>Qwen3-TTS Web</strong></h1>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/PyTorch-2.2+-EE4C2C?logo=pytorch&logoColor=white" alt="PyTorch">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
</p>

基于 Qwen3-TTS 模型的文本转语音（TTS）Web 应用，提供预设音色生成、语音描述设计、声音克隆等多种语音合成能力。采用 FastAPI 后端 + React 前端架构，开箱即用，支持在线配置模型参数与管理生成的音频文件。

---

## 项目结构

```
voice-studio/
├── backend/                    FastAPI 后端
│   ├── app/
│   │   ├── main.py             FastAPI 应用入口，注册路由与中间件
│   │   ├── config.py           配置管理（读取/保存 .qwen_tts_web.json）
│   │   ├── models.py           请求/响应 Pydantic 数据模型
│   │   ├── routers/
│   │   │   ├── voice.py        TTS 生成相关 API（语音合成、配置、说话人）
│   │   │   └── files.py        文件管理 API（上传/下载/删除）
│   │   └── services/
│   │       ├── tts_service.py   TTS 推理核心逻辑
│   │       └── model_manager.py 模型加载与缓存管理
│   ├── run.py                  启动入口（uvicorn）
│   └── requirements.txt        Python 依赖
├── frontend/                   React + Vite + Tailwind CSS 前端
│   ├── src/
│   │   ├── main.jsx            前端入口
│   │   ├── App.jsx             路由配置
│   │   ├── api.js              后端 API 调用封装
│   │   ├── index.css           全局样式（Tailwind）
│   │   └── components/         页面组件
│   │       ├── Layout.jsx              布局框架 & 导航
│   │       ├── CustomVoicePage.jsx     预设音色生成页
│   │       ├── VoiceDesignPage.jsx     声音设计页
│   │       ├── VoiceClonePage.jsx      声音克隆页
│   │       ├── DesignThenClonePage.jsx 设计→克隆组合工作流
│   │       ├── FilesPage.jsx           文件管理页
│   │       ├── ConfigPage.jsx          设置页
│   │       ├── Loading.jsx             加载动画
│   │       └── interactions.jsx        交互反馈组件
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
└── .gitignore
```

---

## 项目截图
<img width="2544" height="1430" alt="image" src="https://github.com/user-attachments/assets/adc22683-d004-4908-9e78-02c4d742a05b" />

<img width="2544" height="1430" alt="image" src="https://github.com/user-attachments/assets/6b24a513-ccda-4713-971b-013560ffdd98" />

<img width="2544" height="1430" alt="image" src="https://github.com/user-attachments/assets/6211fef7-e9b4-4596-99d2-2832152784c2" />

<img width="2544" height="1430" alt="image" src="https://github.com/user-attachments/assets/50784e5c-c94f-45ce-84ee-42b2c426182a" />

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | FastAPI + Uvicorn |
| 模型推理 | Qwen3-TTS（基于 PyTorch） |
| 前端框架 | React 18 + React Router v6 |
| 构建工具 | Vite 5 |
| CSS 框架 | Tailwind CSS 3 |
| 图标库 | Lucide React |

---

## 功能

### CustomVoice — 预设音色生成
使用 9 位内置说话人快速生成语音，支持中/英/日/韩/法/德/西/意/俄/阿拉伯语等 10 种语言，可附加指令文本微调语气。

| 说话人 | 描述 |
|--------|------|
| Vivian | 明亮、略带锋芒的年轻女性声音（中文） |
| Serena | 温暖、温柔的年轻女性声音（中文） |
| Uncle_Fu | 经验丰富的男性嗓音，音色低沉柔和（中文） |
| Dylan | 年轻的北京男性嗓音，音色清晰自然（北京方言） |
| Eric | 活泼的成都男声，带着一丝沙哑明亮（四川话） |
| Ryan | 充满活力的男性声音，节奏感强劲（英语） |
| Aiden | 阳光的美国男声，中音清晰（英语） |
| Ono_Anna | 活泼的日本女性声音，音色轻盈灵巧（日语） |
| Sohee | 温暖的韩国女性声音，情感丰富（韩语） |

### VoiceDesign — 描述式声音设计
通过自然语言描述想要的音色特征（如"温柔的女声，略带磁性"），由模型根据描述合成语音，无需参考音频。

### VoiceClone — 声音克隆
提供一段参考音频，模型将克隆该音色并用其朗读目标文本。支持三种参考音频来源：
- **本地上传** — 直接选择音频文件
- **URL** — 输入远程音频链接
- **Base64** — 粘贴 Base64 编码的音频数据

### Design → Clone — 组合工作流
先用文字描述设计音色，再将该音色作为克隆目标生成语音。适合需要灵活控制音色特征的场景。

### 文件库
管理所有生成的音频文件，支持在线播放、下载和删除。

### 设置
在线修改模型路径、推理设备（CPU/CUDA）、数据类型（bfloat16/float32）、注意力实现方式等配置，无需重启服务。

### 模型缓存
自动复用已加载的模型，避免重复加载耗时。支持手动清理缓存以释放显存/内存。

---

## 环境要求

| 依赖 | 版本要求 |
|------|---------|
| Python | ≥ 3.10 |
| Node.js | ≥ 18 |
| PyTorch | ≥ 2.2.0（推荐 CUDA 版本以使用 GPU 推理） |
| 磁盘空间 | 约 10GB（模型文件） |

---

## 安装与运行

### 1. 后端

```bash
cd backend

# 安装 Python 依赖
pip install -r requirements.txt

# 启动后端服务
python run.py
```

后端默认运行在 `http://localhost:8000`。

- API 文档（Swagger UI）：`http://localhost:8000/docs`
- 首次运行会自动在 `backend/` 下生成配置文件 `.qwen_tts_web.json`

### 2. 前端

```bash
cd frontend

# 安装 Node.js 依赖
npm install

# 启动开发服务器
npm run dev
```

前端默认运行在 `http://localhost:5173`，已通过 Vite 代理自动将 `/api` 请求转发到后端 `http://localhost:8000`。

### 3. 生产构建

```bash
cd frontend
npm run build
```

构建产物输出到 `frontend/dist/`，可通过以下方式部署：
- 配置后端 FastAPI 挂载静态文件服务
- 使用 Nginx 等反向代理同时托管前后端
- 部署到静态托管平台（Vercel、Netlify 等），后端单独部署

---

## 配置说明

配置文件位于 `backend/.qwen_tts_web.json`，首次运行自动生成默认值。可通过 Web 设置页面或手动编辑 JSON 文件修改。

| 配置项 | 说明 | 默认值示例 |
|--------|------|-----------|
| `customvoice_model` | CustomVoice 模型路径 | `D:\models\Qwen3-TTS-12Hz-1.7B-CustomVoice` |
| `voicedesign_model` | VoiceDesign 模型路径 | `D:\models\Qwen3-TTS-12Hz-1.7B-VoiceDesign` |
| `clone_model` | 声音克隆模型路径 | `D:\models\Qwen3-TTS-12Hz-1.7B-Base` |
| `tokenizer_model` | 分词器模型路径 | `D:\models\Qwen3-TTS-12Hz-1.7B-Tokenizer` |
| `output_dir` | 音频输出目录 | `E:\个人项目\qwen3-tts\output` |
| `device` | 推理设备 | `cuda:0`（GPU）/ `cpu`（CPU） |
| `dtype` | 推理精度 | `bfloat16` / `float32` |
| `attn_impl` | 注意力实现方式 | `sdpa` / `flash_attention_2` |

> **注意**：模型文件不会随项目分发，请自行从 HuggingFace 等渠道下载对应模型并配置路径。

---

## API 概览

### 配置

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/config` | 获取当前配置 |
| `POST` | `/api/config` | 更新配置（部分更新） |

### 说话人 & 语言

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/speakers` | 获取内置说话人列表 |
| `GET` | `/api/languages` | 获取支持的语言列表 |

### 语音生成

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/generate/custom-voice` | CustomVoice 预设音色生成 |
| `POST` | `/api/generate/voice-design` | VoiceDesign 描述式声音设计 |
| `POST` | `/api/generate/voice-clone` | VoiceClone 声音克隆 |
| `POST` | `/api/generate/design-then-clone` | Design → Clone 组合工作流 |

### 缓存

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/cache/clear` | 清理模型缓存（释放显存） |

### 文件管理

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/files/list` | 获取文件列表 |
| `GET` | `/api/files/download/{filename}` | 下载指定文件 |
| `POST` | `/api/files/upload` | 上传文件 |
| `DELETE` | `/api/files/delete/{filename}` | 删除指定文件 |

---

## 请求示例

### CustomVoice 生成

```json
POST /api/generate/custom-voice
{
  "speaker": "Vivian",
  "language": "Chinese",
  "instruct": "用温柔的语气朗读",
  "texts": ["你好，欢迎使用 Qwen3-TTS。"]
}
```

### VoiceClone 生成

```json
POST /api/generate/voice-clone
{
  "ref_audio": "/path/to/reference.wav",
  "ref_text": "参考音频对应的文本内容",
  "language": "Chinese",
  "texts": ["这是需要克隆音色朗读的目标文本。"]
}
```

### 更新配置

```json
POST /api/config
{
  "device": "cuda:0",
  "dtype": "bfloat16"
}
```

---

## 常见问题

**Q: 启动后端时提示找不到 `qwen_tts` 模块？**

A: 请确保已安装 Qwen3-TTS 包，可执行 `pip install qwen-tts`，或从源码安装。

**Q: GPU 推理时显存不足？**

A: 可尝试将 `dtype` 设为 `float32`（精度更低但显存占用更小），或切换到 CPU 推理（`device: "cpu"`）。也可通过设置页面的「清理缓存」按钮释放未使用的模型。

**Q: 前端请求后端报 CORS 错误？**

A: 后端已配置 `allow_origins=["*"]`，开发模式下 Vite 代理会自动转发。如果单独部署，请确保后端 CORS 配置正确。

**Q: 生成的音频在哪里？**

A: 默认输出到配置中 `output_dir` 指定的目录，也可在 Web 界面的「文件库」页面查看和下载。
