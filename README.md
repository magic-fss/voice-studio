# Qwen3-TTS Web

Qwen3-TTS 的完整 Web 界面，包含 FastAPI 后端与 React 前端。

## 项目结构

```
qwen3-tts-web/
├── backend/          FastAPI 后端
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── models.py
│   │   ├── routers/
│   │   └── services/
│   └── run.py
├── frontend/         React + Vite + Tailwind 前端
│   ├── src/
│   └── package.json
└── README.md
```

## 功能

- **CustomVoice**: 预设音色生成（9位内置说话人）
- **VoiceDesign**: 描述式声音设计
- **VoiceClone**: 参考音频克隆（支持本地上传/URL/base64）
- **Design → Clone**: 先设计再复用的组合工作流
- **文件库**: 管理生成的音频文件
- **设置**: 在线修改模型路径、设备、精度等配置
- **模型缓存**: 自动复用已加载模型，支持手动清理

## 安装与运行

### 1. 后端

```bash
cd backend
pip install -r requirements.txt
python run.py
```

后端默认运行在 `http://localhost:8000`，自动提供 API 文档：`http://localhost:8000/docs`

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`，已配置代理自动转发 `/api` 到后端。

### 生产构建

```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist/`，可通过后端挂载静态文件或单独部署。

## 配置说明

首次运行时会在 `backend/.qwen_tts_web.json` 生成默认配置，包含模型路径与推理参数。请在**设置页面**或手动修改该 JSON 文件以适配你的环境。

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config` | 获取配置 |
| POST | `/api/config` | 更新配置 |
| GET | `/api/speakers` | 获取说话人列表 |
| GET | `/api/languages` | 获取语言列表 |
| POST | `/api/generate/custom-voice` | CustomVoice 生成 |
| POST | `/api/generate/voice-design` | VoiceDesign 生成 |
| POST | `/api/generate/voice-clone` | VoiceClone 生成 |
| POST | `/api/generate/design-then-clone` | Design→Clone 工作流 |
| POST | `/api/cache/clear` | 清理模型缓存 |
| GET | `/api/files/list` | 文件列表 |
| GET | `/api/files/download/{filename}` | 下载文件 |
| POST | `/api/files/upload` | 上传文件 |
| DELETE | `/api/files/delete/{filename}` | 删除文件 |
