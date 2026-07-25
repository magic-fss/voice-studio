#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Qwen3-TTS Rich TUI 终端工具
============================
基于官方示例封装，支持 CustomVoice / VoiceDesign / VoiceClone / Design→Clone
全链路工作流，模型路径与输出路径完全自定义。

Author: Auto-generated
Requirements: pip install qwen-tts torch soundfile rich requests
"""

import os
import sys
import json
import base64
import warnings
from pathlib import Path
from typing import List, Optional, Tuple, Union
from dataclasses import dataclass, asdict
from urllib.parse import urlparse

import torch
import soundfile as sf
from rich import box
from rich.align import Align
from rich.columns import Columns
from rich.console import Console, Group
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.progress import (
    Progress, SpinnerColumn, TextColumn, BarColumn,
    TaskProgressColumn, TimeRemainingColumn
)
from rich.prompt import Prompt, Confirm, IntPrompt
from rich.rule import Rule
from rich.status import Status
from rich.style import Style
from rich.syntax import Syntax
from rich.table import Table
from rich.text import Text

# 尝试导入 qwen_tts，若未安装给出友好提示
try:
    from qwen_tts import Qwen3TTSModel
except ImportError as e:
    print("[ERROR] 未检测到 qwen_tts 包。请执行：pip install qwen-tts")
    raise SystemExit(1)

# ---------------------------------------------------------------------------
# 全局配置与常量
# ---------------------------------------------------------------------------
console = Console()

# 配置保存到脚本同目录
CONFIG_FILE = Path(__file__).resolve().parent / ".qwen_tts_tui.json"

DEFAULT_CONFIG = {
    "customvoice_model": r"D:\models\HuggingFace\Qwen3-TTS-12Hz-1.7B-CustomVoice",
    "voicedesign_model": r"D:\models\HuggingFace\Qwen3-TTS-12Hz-1.7B-VoiceDesign",
    "clone_model": r"D:\models\HuggingFace\Qwen3-TTS-12Hz-1.7B-Base",
    "tokenizer_model": r"D:\models\HuggingFace\Qwen3-TTS-12Hz-1.7B-Tokenizer",
    "output_dir": r"E:\个人项目\qwen3-tts\output",
    "device": "cuda:0" if torch.cuda.is_available() else "cpu",
    "dtype": "bfloat16",
    "attn_impl": "sdpa",
    "auto_save_config": True,
}

CUSTOM_VOICE_SPEAKERS = {
    "Vivian":   ("明亮、略带锋芒的年轻女性声音", "中文"),
    "Serena":   ("温暖、温柔的年轻女性声音", "中文"),
    "Uncle_Fu": ("经验丰富的男性嗓音，音色低沉柔和", "中文"),
    "Dylan":    ("年轻的北京男性嗓音，音色清晰自然", "汉语（北京方言）"),
    "Eric":     ("活泼的成都男声，带着一丝沙哑明亮", "中文（四川话）"),
    "Ryan":     ("充满活力的男性声音，节奏感强劲", "英语"),
    "Aiden":    ("阳光的美国男声，中音清晰", "英语"),
    "Ono_Anna": ("活泼的日本女性声音，音色轻盈灵巧", "日语"),
    "Sohee":    ("温暖的韩国女性声音，情感丰富", "朝鲜语"),
}

LANGUAGE_MAP = {
    "Auto": "自动检测",
    "Chinese": "中文",
    "English": "英语",
    "Japanese": "日语",
    "Korean": "韩语",
    "French": "法语",
    "German": "德语",
    "Spanish": "西班牙语",
    "Italian": "意大利语",
    "Russian": "俄语",
    "Arabic": "阿拉伯语",
}

SPEAKER_NAMES = list(CUSTOM_VOICE_SPEAKERS.keys())
LANGUAGE_KEYS = list(LANGUAGE_MAP.keys())

# ---------------------------------------------------------------------------
# 异常类：用于子菜单返回主菜单
# ---------------------------------------------------------------------------
class ReturnToMenu(Exception):
    """在任何子菜单中输入 q 或按 Enter 返回时抛出，触发清屏并回到主菜单"""
    pass


# ---------------------------------------------------------------------------
# 数据模型
# ---------------------------------------------------------------------------
@dataclass
class AppConfig:
    """应用运行时配置，支持本地路径或 HuggingFace ID"""
    customvoice_model: str = DEFAULT_CONFIG["customvoice_model"]
    voicedesign_model: str = DEFAULT_CONFIG["voicedesign_model"]
    clone_model: str = DEFAULT_CONFIG["clone_model"]
    tokenizer_model: str = DEFAULT_CONFIG["tokenizer_model"]
    output_dir: str = DEFAULT_CONFIG["output_dir"]
    device: str = DEFAULT_CONFIG["device"]
    dtype: str = DEFAULT_CONFIG["dtype"]
    attn_impl: str = DEFAULT_CONFIG["attn_impl"]
    auto_save_config: bool = True

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "AppConfig":
        valid_keys = {f.name for f in cls.__dataclass_fields__.values()}
        filtered = {k: v for k, v in d.items() if k in valid_keys}
        return cls(**filtered)


# ---------------------------------------------------------------------------
# 配置持久化
# ---------------------------------------------------------------------------
def load_config() -> AppConfig:
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return AppConfig.from_dict(json.load(f))
        except Exception:
            pass
    return AppConfig()


def save_config(cfg: AppConfig) -> None:
    try:
        CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg.to_dict(), f, ensure_ascii=False, indent=2)
    except Exception as e:
        console.print(f"[yellow]⚠ 配置保存失败: {e}[/yellow]")


# ---------------------------------------------------------------------------
# 工具函数
# ---------------------------------------------------------------------------
def ensure_dir(path: Union[str, Path]) -> Path:
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def is_valid_audio_source(src: str) -> bool:
    """判断是否为合法音频来源：本地文件 / URL / base64"""
    if not src:
        return False
    if Path(src).exists():
        return True
    parsed = urlparse(src)
    if parsed.scheme in ("http", "https"):
        return True
    if len(src) > 100 and src.strip().endswith("="):
        return True
    return False


def get_dtype(dtype_str: str):
    mapping = {
        "bfloat16": torch.bfloat16,
        "float16": torch.float16,
        "float32": torch.float32,
    }
    return mapping.get(dtype_str, torch.bfloat16)


def clear_screen():
    """清屏：Rich console.clear + 系统级 cls/clear"""
    console.clear()
    if os.name == 'nt':
        os.system('cls')
    else:
        os.system('clear')


def print_banner():
    """打印 QWEN3-TTS ASCII 艺术字横幅，居中对齐"""
    banner = r"""
 ██████╗ ██╗    ██╗███████╗███╗   ██╗██████╗ ████████╗███████████████╗
██╔═══██╗██║    ██║██╔════╝████╗  ██║╚════██╗╚══██╔══╝╚══██╔══██╔════╝
██║   ██║██║ █╗ ██║█████╗  ██╔██╗ ██║ █████╔╝   ██║      ██║  ███████╗
██║▄▄ ██║██║███╗██║██╔══╝  ██║╚██╗██║ ╚═══██╗   ██║      ██║  ╚════██║
╚██████╔╝╚███╔███╔╝███████╗██║ ╚████║██████╔╝   ██║      ██║  ███████║
 ╚═════╝  ╚══╝╚══╝ ╚══════╝╚═╝  ╚═══╝╚═════╝    ╚═╝      ╚═╝  ╚══════╝
    """
    console.print(Align.center(Text(banner, style="bold cyan")))
    console.print(Align.center(Text("Rich Terminal Interface", style="dim cyan")))
    console.print()


def print_model_info(cfg: AppConfig):
    """打印当前模型配置表格（设置菜单中仍可调用）"""
    table = Table(
        title="[bold green]当前模型配置[/bold green]",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold magenta",
    )
    table.add_column("功能", style="cyan", no_wrap=True)
    table.add_column("模型路径 / HuggingFace ID", style="green")
    table.add_column("设备", style="yellow")

    table.add_row("CustomVoice", cfg.customvoice_model, cfg.device)
    table.add_row("VoiceDesign", cfg.voicedesign_model, cfg.device)
    table.add_row("VoiceClone", cfg.clone_model, cfg.device)
    table.add_row("Tokenizer", cfg.tokenizer_model, "-")
    table.add_row("输出目录", cfg.output_dir, "-")
    table.add_row("推理精度", cfg.dtype, "-")
    console.print(table)
    console.print()


# ---------------------------------------------------------------------------
# 统一返回主菜单函数
# ---------------------------------------------------------------------------
def pause_to_menu(prompt: str = "[dim]按 Enter 或 q 返回主菜单...[/dim]"):
    """
    暂停等待用户按键，按 Enter 或 q 都触发 ReturnToMenu，
    由主循环统一捕获并清屏回到主菜单
    """
    console.print(prompt)
    console.input()
    raise ReturnToMenu()


# ---------------------------------------------------------------------------
# 统一输入包装（全局 q 捕获）
# ---------------------------------------------------------------------------
def ask_str(text: str, default: str = "") -> str:
    """字符串输入，输入 q 返回主菜单"""
    val = Prompt.ask(text, default=default)
    if val.strip().lower() == 'q':
        raise ReturnToMenu()
    return val


def ask_confirm(text: str, default: bool = True) -> bool:
    """确认输入，输入 q 返回主菜单"""
    hint = " [y/n/q]"
    default_str = "y" if default else "n"
    val = Prompt.ask(f"{text}{hint}", default=default_str)
    val = val.strip().lower()
    if val == 'q':
        raise ReturnToMenu()
    return val in ('y', 'yes', '是', '1', 'true')


def ask_int(text: str, default: int = 0, min_val: int = None, max_val: int = None) -> int:
    """整数输入，输入 q 返回主菜单"""
    val = Prompt.ask(text, default=str(default))
    val = val.strip().lower()
    if val == 'q':
        raise ReturnToMenu()
    try:
        num = int(val)
    except ValueError:
        console.print("[yellow]⚠ 请输入有效数字[/yellow]")
        return ask_int(text, default, min_val, max_val)
    if min_val is not None and num < min_val:
        console.print(f"[yellow]⚠ 最小值为 {min_val}[/yellow]")
        return ask_int(text, default, min_val, max_val)
    if max_val is not None and num > max_val:
        console.print(f"[yellow]⚠ 最大值为 {max_val}[/yellow]")
        return ask_int(text, default, min_val, max_val)
    return num


def ask_lines(prompt: str = "  > ", end_hint: str = "[dim]空行结束 / q 返回主菜单[/dim]") -> List[str]:
    """批量输入，空行结束，输入 q 返回主菜单"""
    if end_hint:
        console.print(end_hint)
    lines = []
    while True:
        line = console.input(prompt)
        if line.strip().lower() == 'q':
            raise ReturnToMenu()
        if not line.strip():
            break
        lines.append(line.strip())
    return lines


# ---------------------------------------------------------------------------
# 编号选择菜单工具函数
# ---------------------------------------------------------------------------
def choose_speaker(default_idx: int = 1) -> str:
    """
    展示编号式说话人菜单，返回选中的 speaker 名称
    """
    spk_table = Table(title="[bold cyan]可用说话人[/bold cyan]", box=box.SIMPLE_HEAD)
    spk_table.add_column("编号", style="bold yellow", justify="center", width=4)
    spk_table.add_column("名称", style="bold cyan", width=10)
    spk_table.add_column("描述", style="white")
    spk_table.add_column("母语", style="dim", width=14)

    for i, (name, (desc, lang)) in enumerate(CUSTOM_VOICE_SPEAKERS.items(), 1):
        spk_table.add_row(str(i), name, desc, f"[{lang}]")

    console.print(spk_table)
    console.print()

    total = len(SPEAKER_NAMES)
    choice = ask_int(f"选择说话人编号 [1-{total}]", default=default_idx, min_val=1, max_val=total)

    speaker = SPEAKER_NAMES[choice - 1]
    desc, lang = CUSTOM_VOICE_SPEAKERS[speaker]
    console.print(f"[green]✓ 已选择: {speaker} — {desc} [{lang}][/green]")
    return speaker


def choose_language(default_idx: int = 1) -> str:
    """
    展示编号式语言菜单，返回选中的语言标识
    """
    lang_table = Table(title="[bold cyan]目标语言[/bold cyan]", box=box.SIMPLE_HEAD)
    lang_table.add_column("编号", style="bold yellow", justify="center", width=4)
    lang_table.add_column("标识", style="bold cyan", width=10)
    lang_table.add_column("释义", style="white")

    for i, (key, val) in enumerate(LANGUAGE_MAP.items(), 1):
        lang_table.add_row(str(i), key, val)

    console.print(lang_table)
    console.print()

    total = len(LANGUAGE_KEYS)
    choice = ask_int(f"选择语言编号 [1-{total}]", default=default_idx, min_val=1, max_val=total)

    lang_key = LANGUAGE_KEYS[choice - 1]
    console.print(f"[green]✓ 已选择: {lang_key} ({LANGUAGE_MAP[lang_key]})[/green]")
    return lang_key


# ---------------------------------------------------------------------------
# 模型加载（带缓存与进度显示）
# ---------------------------------------------------------------------------
class ModelCache:
    """简单 LRU 风格的模型缓存，避免重复加载"""
    _cache: dict = {}

    @classmethod
    def load(cls, model_path: str, cfg: AppConfig, desc: str = "加载模型"):
        key = f"{model_path}|{cfg.device}|{cfg.dtype}|{cfg.attn_impl}"
        if key in cls._cache:
            console.print(f"[dim]↻ 从缓存复用 {desc}[/dim]")
            return cls._cache[key]

        dtype = get_dtype(cfg.dtype)
        kwargs = {
            "device_map": cfg.device,
            "dtype": dtype,
        }
        if cfg.attn_impl == "flash_attention_2":
            try:
                import flash_attn  # noqa: F401
                kwargs["attn_implementation"] = "flash_attention_2"
            except ImportError:
                console.print("[yellow]⚠ flash_attn 未安装，回退到 sdpa[/yellow]")
                kwargs["attn_implementation"] = "sdpa"
        else:
            kwargs["attn_implementation"] = cfg.attn_impl

        with Status(f"[bold green]{desc}...[/bold green]", spinner="dots", console=console):
            model = Qwen3TTSModel.from_pretrained(model_path, **kwargs)

        cls._cache[key] = model
        return model

    @classmethod
    def clear(cls):
        cls._cache.clear()
        torch.cuda.empty_cache() if torch.cuda.is_available() else None


# ---------------------------------------------------------------------------
# 各模式业务逻辑
# ---------------------------------------------------------------------------
def mode_custom_voice(cfg: AppConfig):
    """模式 1：CustomVoice —— 预设高品质音色"""
    console.print(Rule("[bold blue]CustomVoice — 预设音色生成", style="blue"))

    # 编号式说话人选择
    speaker = choose_speaker(default_idx=1)
    # 编号式语言选择
    language = choose_language(default_idx=1)

    use_instruct = ask_confirm("是否添加语气/风格指令？", default=False)
    instruct = ""
    if use_instruct:
        instruct = ask_str("输入指令（如：用特别愤怒的语气说）", default="")

    # 文本输入（支持批量）
    batch_mode = ask_confirm("是否批量生成？", default=False)
    texts: List[str] = []
    if batch_mode:
        texts = ask_lines(end_hint="[dim]请输入文本，每行一条，空行结束，q 返回主菜单：[/dim]")
        if not texts:
            console.print("[red]✗ 未输入任何文本[/red]")
            pause_to_menu()
            return
    else:
        text = ask_str("输入要合成的文本")
        if not text.strip():
            console.print("[red]✗ 文本为空[/red]")
            pause_to_menu()
            return
        texts = [text]

    # 确认输出
    out_dir = ensure_dir(cfg.output_dir)
    console.print(f"[dim]输出目录: {out_dir}[/dim]")

    # 加载模型 & 生成
    model = ModelCache.load(cfg.customvoice_model, cfg, "CustomVoice 模型")

    # 构造参数
    languages = [language] * len(texts) if language != "Auto" else ["Auto"] * len(texts)
    speakers = [speaker] * len(texts)
    instructs = [instruct] * len(texts)

    with Progress(
        SpinnerColumn(),
        TextColumn("[bold green]{task.description}"),
        BarColumn(bar_width=40),
        TaskProgressColumn(),
        TimeRemainingColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("合成中...", total=len(texts))
        results: List[Path] = []

        if len(texts) == 1:
            wavs, sr = model.generate_custom_voice(
                text=texts[0],
                language=languages[0] if languages[0] != "Auto" else None,
                speaker=speakers[0],
                instruct=instructs[0] or None,
            )
            out_path = out_dir / f"custom_{speaker}_{results.__len__()}.wav"
            sf.write(str(out_path), wavs[0], sr)
            results.append(out_path)
            progress.advance(task)
        else:
            wavs, sr = model.generate_custom_voice(
                text=texts,
                language=languages,
                speaker=speakers,
                instruct=instructs,
            )
            for i, w in enumerate(wavs):
                out_path = out_dir / f"custom_{speaker}_batch_{i:03d}.wav"
                sf.write(str(out_path), w, sr)
                results.append(out_path)
                progress.advance(task)

    # 结果展示
    res_table = Table(title="生成结果", box=box.ROUNDED)
    res_table.add_column("#", style="cyan")
    res_table.add_column("文件路径", style="green")
    res_table.add_column("时长(样本)", style="yellow")
    for i, p in enumerate(results, 1):
        info = sf.info(str(p))
        dur = f"{info.duration:.2f}s" if info else "未知"
        res_table.add_row(str(i), str(p), dur)
    console.print(res_table)
    console.print(f"[bold green]✓ 共生成 {len(results)} 个音频文件[/bold green]")
    pause_to_menu()


def mode_voice_design(cfg: AppConfig):
    """模式 2：VoiceDesign —— 自然语言描述生成声音"""
    console.print(Rule("[bold purple]VoiceDesign — 描述式声音设计", style="purple"))

    # 编号式语言选择
    language = choose_language(default_idx=2)  # 默认中文

    instruct = ask_str(
        "声音描述指令",
        default="体现撒娇稚嫩的萝莉女声，音调偏高且起伏明显，营造出黏人、做作又刻意卖萌的听觉效果。"
    )

    batch_mode = ask_confirm("是否批量生成？", default=False)
    texts: List[str] = []
    if batch_mode:
        texts = ask_lines(end_hint="[dim]请输入文本，每行一条，空行结束，q 返回主菜单：[/dim]")
    else:
        text = ask_str("输入要合成的文本")
        texts = [text] if text.strip() else []

    if not texts:
        console.print("[red]✗ 无有效文本[/red]")
        pause_to_menu()
        return

    out_dir = ensure_dir(cfg.output_dir)
    model = ModelCache.load(cfg.voicedesign_model, cfg, "VoiceDesign 模型")

    with Progress(
        SpinnerColumn(),
        TextColumn("[bold purple]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        TimeRemainingColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("VoiceDesign 合成中...", total=len(texts))
        results: List[Path] = []

        if len(texts) == 1:
            wavs, sr = model.generate_voice_design(
                text=texts[0],
                language=language,
                instruct=instruct,
            )
            out_path = out_dir / "voice_design_000.wav"
            sf.write(str(out_path), wavs[0], sr)
            results.append(out_path)
            progress.advance(task)
        else:
            wavs, sr = model.generate_voice_design(
                text=texts,
                language=[language] * len(texts),
                instruct=[instruct] * len(texts),
            )
            for i, w in enumerate(wavs):
                out_path = out_dir / f"voice_design_{i:03d}.wav"
                sf.write(str(out_path), w, sr)
                results.append(out_path)
                progress.advance(task)

    res_table = Table(title="VoiceDesign 生成结果", box=box.ROUNDED)
    res_table.add_column("#", style="cyan")
    res_table.add_column("文件路径", style="green")
    for i, p in enumerate(results, 1):
        res_table.add_row(str(i), str(p))
    console.print(res_table)
    console.print(f"[bold green]✓ 共生成 {len(results)} 个音频[/bold green]")
    pause_to_menu()


def mode_voice_clone(cfg: AppConfig):
    """模式 3：VoiceClone —— 参考音频克隆"""
    console.print(Rule("[bold yellow]VoiceClone — 参考音频克隆", style="yellow"))

    # 参考音频输入
    console.print("[dim]参考音频支持：本地文件路径 / URL / base64 字符串[/dim]")
    ref_audio = ask_str("参考音频路径或 URL")
    if not is_valid_audio_source(ref_audio):
        console.print(f"[red]✗ 无法解析音频源: {ref_audio}[/red]")
        pause_to_menu()
        return

    ref_text = ask_str("参考音频对应的文字内容（转录）")
    if not ref_text.strip():
        console.print("[red]✗ 参考文本不能为空[/red]")
        pause_to_menu()
        return

    # 是否仅使用 x_vector（快速但质量略降）
    x_vector_only = ask_confirm("启用 x_vector_only_mode？（无需 ref_text，但质量可能下降）", default=False)

    # 编号式语言选择
    language = choose_language(default_idx=1)  # 默认 Auto

    # 目标文本
    batch_mode = ask_confirm("是否批量生成？", default=False)
    texts: List[str] = []
    if batch_mode:
        texts = ask_lines(end_hint="[dim]请输入要克隆合成的目标文本，每行一条，空行结束，q 返回主菜单：[/dim]")
    else:
        text = ask_str("输入要合成的目标文本")
        texts = [text] if text.strip() else []

    if not texts:
        console.print("[red]✗ 无目标文本[/red]")
        pause_to_menu()
        return

    out_dir = ensure_dir(cfg.output_dir)
    model = ModelCache.load(cfg.clone_model, cfg, "VoiceClone 模型")

    # 构建可复用 prompt（多代时加速）
    with Status("[bold yellow]提取参考音频特征...[/bold yellow]", console=console):
        prompt_items = model.create_voice_clone_prompt(
            ref_audio=ref_audio,
            ref_text=ref_text if not x_vector_only else "",
            x_vector_only_mode=x_vector_only,
        )

    with Progress(
        SpinnerColumn(),
        TextColumn("[bold yellow]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        TimeRemainingColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("克隆合成中...", total=len(texts))
        results: List[Path] = []

        if len(texts) == 1:
            wavs, sr = model.generate_voice_clone(
                text=texts[0],
                language=language if language != "Auto" else None,
                voice_clone_prompt=prompt_items,
            )
            out_path = out_dir / "voice_clone_000.wav"
            sf.write(str(out_path), wavs[0], sr)
            results.append(out_path)
            progress.advance(task)
        else:
            wavs, sr = model.generate_voice_clone(
                text=texts,
                language=[language if language != "Auto" else None] * len(texts),
                voice_clone_prompt=prompt_items,
            )
            for i, w in enumerate(wavs):
                out_path = out_dir / f"voice_clone_{i:03d}.wav"
                sf.write(str(out_path), w, sr)
                results.append(out_path)
                progress.advance(task)

    res_table = Table(title="VoiceClone 生成结果", box=box.ROUNDED)
    res_table.add_column("#", style="cyan")
    res_table.add_column("文件路径", style="green")
    for i, p in enumerate(results, 1):
        res_table.add_row(str(i), str(p))
    console.print(res_table)
    console.print(f"[bold green]✓ 共生成 {len(results)} 个克隆音频[/bold green]")
    pause_to_menu()


def mode_design_then_clone(cfg: AppConfig):
    """模式 4：Design → Clone 组合工作流"""
    console.print(Rule("[bold magenta]Design → Clone — 先设计再复用", style="magenta"))
    console.print(
        "[dim]工作流说明：先用 VoiceDesign 生成一段参考音频，"
        "再用 Base 模型将其固化为可复用的克隆音色。[/dim]"
    )

    # Step 1: VoiceDesign 生成参考
    console.print(Panel("Step 1/3: VoiceDesign 生成参考片段", style="purple"))
    ref_text = ask_str("参考片段文本内容")
    if not ref_text.strip():
        console.print("[red]✗ 参考文本不能为空[/red]")
        pause_to_menu()
        return

    ref_instruct = ask_str(
        "声音设计描述",
        default="男，17 岁，男高音音域，自信心逐步提升，气息支撑更扎实沉稳。"
    )
    # 编号式语言选择
    ref_language = choose_language(default_idx=3)  # 默认 English

    out_dir = ensure_dir(cfg.output_dir)
    ref_path = out_dir / "voice_design_reference.wav"

    design_model = ModelCache.load(cfg.voicedesign_model, cfg, "VoiceDesign 模型")
    with Status("[bold purple]生成设计参考音频...[/bold purple]", console=console):
        ref_wavs, sr = design_model.generate_voice_design(
            text=ref_text,
            language=ref_language,
            instruct=ref_instruct,
        )
        sf.write(str(ref_path), ref_wavs[0], sr)
    console.print(f"[green]✓ 参考音频已保存: {ref_path}[/green]")

    # Step 2: Base 模型固化音色
    console.print(Panel("Step 2/3: Base 模型提取可复用 Prompt", style="yellow"))
    clone_model = ModelCache.load(cfg.clone_model, cfg, "VoiceClone 模型")
    with Status("[bold yellow]构建可复用克隆 Prompt...[/bold yellow]", console=console):
        voice_clone_prompt = clone_model.create_voice_clone_prompt(
            ref_audio=(ref_wavs[0], sr),
            ref_text=ref_text,
        )
    console.print("[green]✓ 音色 Prompt 已构建完成，可在多代中复用[/green]")

    # Step 3: 批量生成目标内容
    console.print(Panel("Step 3/3: 使用固化音色生成内容", style="green"))
    # 编号式语言选择
    target_language = choose_language(default_idx=LANGUAGE_KEYS.index(ref_language) + 1)

    sentences = ask_lines(end_hint="[dim]请输入目标文本，每行一条，空行结束，q 返回主菜单：[/dim]")

    if not sentences:
        console.print("[red]✗ 无目标文本，流程终止[/red]")
        pause_to_menu()
        return

    with Progress(
        SpinnerColumn(),
        TextColumn("[bold magenta]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        TimeRemainingColumn(),
        console=console,
    ) as progress:
        task = progress.add_task("组合工作流合成中...", total=len(sentences))
        results: List[Path] = []

        if len(sentences) == 1:
            wavs, sr = clone_model.generate_voice_clone(
                text=sentences[0],
                language=target_language if target_language != "Auto" else None,
                voice_clone_prompt=voice_clone_prompt,
            )
            out_path = out_dir / "design_clone_000.wav"
            sf.write(str(out_path), wavs[0], sr)
            results.append(out_path)
            progress.advance(task)
        else:
            wavs, sr = clone_model.generate_voice_clone(
                text=sentences,
                language=[target_language if target_language != "Auto" else None] * len(sentences),
                voice_clone_prompt=voice_clone_prompt,
            )
            for i, w in enumerate(wavs):
                out_path = out_dir / f"design_clone_{i:03d}.wav"
                sf.write(str(out_path), w, sr)
                results.append(out_path)
                progress.advance(task)

    res_table = Table(title="Design→Clone 最终结果", box=box.ROUNDED)
    res_table.add_column("#", style="cyan")
    res_table.add_column("文件路径", style="green")
    for i, p in enumerate(results, 1):
        res_table.add_row(str(i), str(p))
    console.print(res_table)
    console.print(f"[bold green]✓ 组合工作流完成，共生成 {len(results)} 个音频[/bold green]")
    pause_to_menu()


# ---------------------------------------------------------------------------
# 设置菜单
# ---------------------------------------------------------------------------
def menu_settings(cfg: AppConfig) -> AppConfig:
    """交互式设置面板"""
    console.print(Rule("[bold cyan]⚙ 应用设置", style="cyan"))

    # 在设置菜单中展示模型配置表格
    print_model_info(cfg)

    table = Table(box=box.ROUNDED, show_header=False)
    table.add_column("项", style="bold cyan")
    table.add_column("当前值", style="green")
    table.add_row("1. CustomVoice 模型", cfg.customvoice_model)
    table.add_row("2. VoiceDesign 模型", cfg.voicedesign_model)
    table.add_row("3. VoiceClone 模型", cfg.clone_model)
    table.add_row("4. Tokenizer 模型", cfg.tokenizer_model)
    table.add_row("5. 输出目录", cfg.output_dir)
    table.add_row("6. 推理设备", cfg.device)
    table.add_row("7. 推理精度", cfg.dtype)
    table.add_row("8. Attention 实现", cfg.attn_impl)
    table.add_row("9. 自动保存配置", "是" if cfg.auto_save_config else "否")
    table.add_row("0. 返回主菜单", "-")
    console.print(table)

    choice = ask_int("选择要修改的项 [0-9]", default=0, min_val=0, max_val=9)

    if choice == 0:
        # 返回主菜单，触发清屏（和按 q 效果完全一致）
        raise ReturnToMenu()

    if choice == 1:
        cfg.customvoice_model = ask_str("CustomVoice 模型路径或 HF ID", default=cfg.customvoice_model)
    elif choice == 2:
        cfg.voicedesign_model = ask_str("VoiceDesign 模型路径或 HF ID", default=cfg.voicedesign_model)
    elif choice == 3:
        cfg.clone_model = ask_str("VoiceClone 模型路径或 HF ID", default=cfg.clone_model)
    elif choice == 4:
        cfg.tokenizer_model = ask_str("Tokenizer 模型路径或 HF ID", default=cfg.tokenizer_model)
    elif choice == 5:
        new_dir = ask_str("输出目录", default=cfg.output_dir)
        cfg.output_dir = str(ensure_dir(new_dir))
    elif choice == 6:
        cfg.device = ask_str("设备 [cuda:0/cuda/cpu]", default=cfg.device)
    elif choice == 7:
        cfg.dtype = ask_str("精度 [bfloat16/float16/float32]", default=cfg.dtype)
    elif choice == 8:
        cfg.attn_impl = ask_str("Attention [sdpa/eager/flash_attention_2]", default=cfg.attn_impl)
    elif choice == 9:
        cfg.auto_save_config = ask_confirm("退出时自动保存配置？", default=cfg.auto_save_config)

    if cfg.auto_save_config:
        save_config(cfg)
        console.print("[green]✓ 配置已保存[/green]")
    return cfg


# ---------------------------------------------------------------------------
# 主菜单与程序入口
# ---------------------------------------------------------------------------
def print_main_menu() -> int:
    menu_table = Table(
        title="[bold cyan]主菜单[/bold cyan]",
        box=box.DOUBLE_EDGE,
        show_header=False,
        width=70,
    )
    menu_table.add_column("选项", style="bold yellow", justify="center", width=4)
    menu_table.add_column("功能", style="bold white")
    menu_table.add_column("说明", style="dim", width=35)

    items = [
        ("1", "CustomVoice", "预设高品质音色（9种角色）"),
        ("2", "VoiceDesign", "自然语言描述生成声音"),
        ("3", "VoiceClone", "参考音频克隆音色"),
        ("4", "Design → Clone", "先设计声音，再固化复用"),
        ("5", "⚙ 设置", "自定义模型路径 / 输出目录 / 设备"),
        ("6", "🗑 清理缓存", "释放模型显存缓存"),
        ("0", "退出", "退出程序,子菜单内输入q并回车返回主菜单"),
    ]
    for opt, name, desc in items:
        menu_table.add_row(opt, name, desc)

    console.print(Align.center(menu_table))
    console.print()
    # 主菜单也支持 q 退出
    val = Prompt.ask("请选择功能 [0-6]", default="0")
    val = val.strip().lower()
    if val == 'q':
        return -1  # 特殊标记：退出
    try:
        return int(val)
    except ValueError:
        return -2  # 无效输入，循环会处理


def main():
    cfg = load_config()
    
    # 启动时清屏，清除 SoX 警告等导入日志
    clear_screen()
    print_banner()

    while True:
        try:
            choice = print_main_menu()
            
            # q 或 0 退出
            if choice == -1 or choice == 0:
                break
            
            if choice == -2:
                console.print("[yellow]无效选项，请重新选择[/yellow]")
                continue

            console.print()

            if choice == 1:
                mode_custom_voice(cfg)
            elif choice == 2:
                mode_voice_design(cfg)
            elif choice == 3:
                mode_voice_clone(cfg)
            elif choice == 4:
                mode_design_then_clone(cfg)
            elif choice == 5:
                cfg = menu_settings(cfg)
            elif choice == 6:
                ModelCache.clear()
                console.print("[green]✓ 模型缓存已清理[/green]")
                pause_to_menu()
            else:
                console.print("[yellow]无效选项，请重新选择[/yellow]")

        except ReturnToMenu:
            # 任何子菜单输入 q 或按 Enter 返回，清屏并回到主菜单
            clear_screen()
            print_banner()
            continue
        except KeyboardInterrupt:
            console.print("[bold yellow]用户中断，程序退出[/bold yellow]")
            break
        except Exception as e:
            console.print_exception(show_locals=False)
            console.print(f"[red]✗ 执行失败: {e}[/red]")
            pause_to_menu()
            # 出错后也清屏回到主菜单（pause_to_menu 已抛出 ReturnToMenu，这里不会执行到）
            # 但如果 pause_to_menu 内部出错，兜底清屏
            clear_screen()
            print_banner()

    # 退出前保存
    if cfg.auto_save_config:
        save_config(cfg)
    console.print("[bold green]再见！[/bold green]")


if __name__ == "__main__":
    # 抑制 transformers 的 FutureWarning 等冗余输出，保持 TUI 整洁
    warnings.filterwarnings("ignore")
    try:
        main()
    except KeyboardInterrupt:
        console.print("[bold yellow]用户中断，程序退出[/bold yellow]")
        sys.exit(0)