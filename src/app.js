const folderInput = document.querySelector("#folderInput");
const fileInput = document.querySelector("#fileInput");
const chooseFolderButton = document.querySelector("#chooseFolderButton");
const chooseFilesButton = document.querySelector("#chooseFilesButton");
const sampleButton = document.querySelector("#sampleButton");
const clearButton = document.querySelector("#clearButton");
const copyReportButton = document.querySelector("#copyReportButton");
const downloadReportButton = document.querySelector("#downloadReportButton");
const dropZone = document.querySelector("#dropZone");
const errorInput = document.querySelector("#errorInput");
const projectTitle = document.querySelector("#projectTitle");
const statusPill = document.querySelector("#statusPill");
const fileCount = document.querySelector("#fileCount");
const engineCount = document.querySelector("#engineCount");
const assetCount = document.querySelector("#assetCount");
const riskCount = document.querySelector("#riskCount");
const scanBanner = document.querySelector("#scanBanner");
const scanTitle = document.querySelector("#scanTitle");
const scanDetail = document.querySelector("#scanDetail");
const scanProgressBar = document.querySelector("#scanProgressBar");
const launchPanel = document.querySelector("#launchPanel");
const enginePanel = document.querySelector("#enginePanel");
const assetsPanel = document.querySelector("#assetsPanel");
const reportPanel = document.querySelector("#reportPanel");
const emptyStateTemplate = document.querySelector("#emptyStateTemplate");

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "bmp", "webp", "tga", "dds", "gif", "psd"]);
const AUDIO_EXTS = new Set(["ogg", "mp3", "wav", "flac", "m4a", "aac", "opus", "mid", "midi"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "avi", "wmv", "mpg", "mpeg", "mkv", "mov"]);
const SCRIPT_EXTS = new Set(["rpy", "rpyc", "ks", "txt", "json", "csv", "xml", "ini", "lua", "js"]);
const ARCHIVE_EXTS = new Set(["zip", "rar", "7z", "tar", "gz", "bz2", "xz"]);
const DISC_EXTS = new Set(["iso", "mdf", "mds", "cue", "bin", "ccd", "img", "nrg"]);
const EXE_EXTS = new Set(["exe", "bat", "cmd", "com", "lnk"]);
const RESOURCE_ARCHIVES = new Set(["rpa", "rpi", "xp3", "nsa", "ns2", "sar", "arc", "pck", "dat", "pak", "wolf"]);
const SCAN_BATCH_SIZE = 1000;
const LARGE_FOLDER_THRESHOLD = 20000;
const HUGE_FOLDER_THRESHOLD = 50000;
const MAX_SORTED_FILES = 50000;

const SAMPLE_FILES = [
  ["SakuraTrial/game.exe", 1422000],
  ["SakuraTrial/data.xp3", 423000000],
  ["SakuraTrial/patch.xp3", 59000000],
  ["SakuraTrial/plugin/AlphaMovie.dll", 480000],
  ["SakuraTrial/save/readme.txt", 2800],
  ["SakuraTrial/manual/startup_error_jp_locale.txt", 1300],
  ["SakuraTrial/BGM/theme01.ogg", 6920000],
  ["SakuraTrial/BGM/theme02.ogg", 5840000],
  ["SakuraTrial/ev/ev001.png", 982000],
  ["SakuraTrial/ev/ev002.png", 1004000],
  ["SakuraTrial/fg/heroine_smile.png", 820000],
  ["SakuraTrial/fg/heroine_sad.png", 790000],
  ["SakuraTrial/scenario/common.ks", 33000],
  ["SakuraTrial/scenario/route_a.ks", 61000],
  ["SakuraTrial/Setup.exe", 2610000],
  ["SakuraTrial/vcredist_x86.exe", 6500000],
];

let currentFiles = [];
let currentAnalysis = null;
let scanRunId = 0;

function normalizePath(path) {
  return String(path || "").replaceAll("\\", "/").replace(/^\/+/, "");
}

function getExt(name) {
  const clean = String(name || "").split("?")[0].split("#")[0];
  const index = clean.lastIndexOf(".");
  return index >= 0 ? clean.slice(index + 1).toLowerCase() : "";
}

function getBaseName(path) {
  return normalizePath(path).split("/").filter(Boolean).pop() || "";
}

function getDepth(path) {
  return Math.max(0, normalizePath(path).split("/").filter(Boolean).length - 1);
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function yieldToBrowser() {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

function fileFromNative(file) {
  const path = normalizePath(file.webkitRelativePath || file.relativePath || file.name);
  const name = getBaseName(path);
  return {
    name,
    path,
    lowerPath: path.toLowerCase(),
    ext: getExt(name),
    size: file.size || 0,
    depth: getDepth(path),
  };
}

function fileFromSample([path, size]) {
  const normalized = normalizePath(path);
  const name = getBaseName(normalized);
  return {
    name,
    path: normalized,
    lowerPath: normalized.toLowerCase(),
    ext: getExt(name),
    size,
    depth: getDepth(normalized),
  };
}

function uniqueFiles(files) {
  const seen = new Map();
  for (const file of files) {
    if (!file || !file.path) continue;
    const key = `${file.path}:${file.size}`;
    if (!seen.has(key)) seen.set(key, file);
  }
  const result = [...seen.values()];
  if (result.length > MAX_SORTED_FILES) return result;
  return result.sort((a, b) => a.path.localeCompare(b.path));
}

async function filesFromFileList(fileList, onProgress) {
  const files = [];
  const total = fileList.length;
  for (let index = 0; index < total; index += 1) {
    files.push(fileFromNative(fileList[index]));
    if ((index + 1) % SCAN_BATCH_SIZE === 0 || index + 1 === total) {
      onProgress?.(index + 1, total);
      await yieldToBrowser();
    }
  }
  return files;
}

async function collectDroppedFiles(dataTransfer, onProgress) {
  const items = [...(dataTransfer.items || [])];
  const entries = items
    .map((item) => (item.webkitGetAsEntry ? item.webkitGetAsEntry() : null))
    .filter(Boolean);

  if (!entries.length) {
    return filesFromFileList(dataTransfer.files || [], onProgress);
  }

  const files = [];
  let scanned = 0;
  for (const entry of entries) {
    files.push(
      ...(await traverseEntry(entry, "", () => {
        scanned += 1;
        if (scanned % SCAN_BATCH_SIZE === 0) onProgress?.(scanned, null);
      })),
    );
  }
  onProgress?.(files.length, files.length);
  return files;
}

async function traverseEntry(entry, prefix, onFile) {
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
    file.relativePath = normalizePath(`${prefix}${file.name}`);
    onFile?.();
    return [fileFromNative(file)];
  }

  if (!entry.isDirectory) return [];

  const reader = entry.createReader();
  const children = [];
  let batch = [];
  do {
    batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
    children.push(...batch);
  } while (batch.length);

  const nested = await Promise.all(children.map((child) => traverseEntry(child, `${prefix}${entry.name}/`, onFile)));
  return nested.flat();
}

function analyze(files, errorText = "") {
  const roots = getRoots(files);
  const extCounts = countBy(files, (file) => file.ext || "(none)");
  const categories = getCategories(files);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const mode = getAnalysisMode(files.length, totalSize);
  const engines = detectEngines(files);
  const launchCandidates = detectLaunchCandidates(files, engines);
  const findings = buildFindings(files, roots, engines, launchCandidates, errorText, mode);
  const riskTotal = findings.filter((item) => item.level === "warning" || item.level === "blocker").length;
  const status = getStatus(findings, launchCandidates);

  return {
    files,
    roots,
    extCounts,
    categories,
    totalSize,
    mode,
    engines,
    launchCandidates,
    findings,
    status,
    riskTotal,
    report: "",
  };
}

function getAnalysisMode(fileTotal, totalSize) {
  if (fileTotal >= HUGE_FOLDER_THRESHOLD) {
    return {
      id: "huge",
      label: "Large folder mode",
      detail: `${formatNumber(fileTotal)} files, ${formatBytes(totalSize)}. Full metadata was scanned; UI samples are capped to stay responsive.`,
      findingLevel: "warning",
    };
  }

  if (fileTotal >= LARGE_FOLDER_THRESHOLD) {
    return {
      id: "large",
      label: "Large folder mode",
      detail: `${formatNumber(fileTotal)} files, ${formatBytes(totalSize)}. Diagnosis uses the full metadata list with compact rendering.`,
      findingLevel: "info",
    };
  }

  return {
    id: "normal",
    label: "Full metadata scan",
    detail: `${formatNumber(fileTotal)} files, ${formatBytes(totalSize)}. File contents were not read or uploaded.`,
    findingLevel: "good",
  };
}

function countBy(items, getter) {
  return items.reduce((map, item) => {
    const key = getter(item);
    map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map());
}

function getRoots(files) {
  const roots = countBy(files, (file) => normalizePath(file.path).split("/").filter(Boolean)[0] || "(files)");
  return [...roots.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function hasFile(files, predicate) {
  return files.some(predicate);
}

function countFiles(files, predicate) {
  return files.filter(predicate).length;
}

function samplePaths(files, predicate, limit = 4) {
  return files.filter(predicate).slice(0, limit).map((file) => file.path);
}

function detectEngines(files) {
  const detectors = [
    {
      id: "kirikiri",
      name: "KiriKiri / 吉里吉里",
      score: 0,
      evidence: [],
      test(file) {
        const hit =
          file.ext === "xp3" ||
          file.lowerPath.includes("kirikiri") ||
          file.lowerPath.includes("krkr") ||
          file.lowerPath.endsWith(".ks") ||
          file.lowerPath.includes("/scenario/");
        return hit;
      },
      advice: "优先尝试根目录主程序；乱码或闪退时先检查日区/Locale Emulator 与路径编码。",
    },
    {
      id: "renpy",
      name: "Ren'Py",
      score: 0,
      evidence: [],
      test(file) {
        return (
          file.ext === "rpa" ||
          file.ext === "rpy" ||
          file.ext === "rpyc" ||
          file.lowerPath.includes("/renpy/") ||
          file.lowerPath.includes("/game/")
        );
      },
      advice: "通常根目录同名 exe 就是入口；macOS/Linux 版本可能包含 .app 或 .sh。",
    },
    {
      id: "nscript",
      name: "NScripter / ONScripter",
      score: 0,
      evidence: [],
      test(file) {
        return (
          ["nsa", "ns2", "sar"].includes(file.ext) ||
          /(^|\/)(nscript\.dat|0\.txt|00\.txt|arc\.nsa)$/i.test(file.path)
        );
      },
      advice: "老游戏更容易受系统区域、字体和兼容模式影响。",
    },
    {
      id: "unity",
      name: "Unity",
      score: 0,
      evidence: [],
      test(file) {
        return (
          file.name === "UnityPlayer.dll" ||
          file.name === "GameAssembly.dll" ||
          /_Data\//i.test(file.path)
        );
      },
      advice: "优先运行与 _Data 文件夹同级的 exe；报 Mono/UnityPlayer 错误时检查文件是否完整。",
    },
    {
      id: "rpgmaker",
      name: "RPG Maker",
      score: 0,
      evidence: [],
      test(file) {
        return (
          file.name === "Game.ini" ||
          /^RGSS\d+.*\.dll$/i.test(file.name) ||
          file.lowerPath.endsWith("/www/data/system.json") ||
          file.lowerPath.endsWith("/data/system.json")
        );
      },
      advice: "提示 RTP 时安装对应 RPG Maker RTP；HTML5 版本可从 www/index.html 启动。",
    },
    {
      id: "siglus",
      name: "Siglus / RealLive family",
      score: 0,
      evidence: [],
      test(file) {
        return (
          file.name.toLowerCase() === "siglusengine.exe" ||
          file.lowerPath.endsWith("/scene.pck") ||
          file.lowerPath.includes("reallive")
        );
      },
      advice: "常见问题是日区、字体和旧运行库；先用根目录启动器或 SiglusEngine.exe 尝试。",
    },
    {
      id: "tyrano",
      name: "TyranoScript / web VN",
      score: 0,
      evidence: [],
      test(file) {
        return (
          file.lowerPath.includes("/tyrano/") ||
          file.lowerPath.includes("/data/scenario/") ||
          file.lowerPath.endsWith("/index.html")
        );
      },
      advice: "可以尝试本地服务器打开 index.html；浏览器安全限制会影响直接 file:// 运行。",
    },
  ];

  for (const detector of detectors) {
    for (const file of files) {
      if (detector.test(file)) {
        detector.score += scoreEvidence(file);
        if (detector.evidence.length < 5) detector.evidence.push(file.path);
      }
    }
  }

  return detectors
    .filter((detector) => detector.score > 0)
    .map((detector) => ({
      id: detector.id,
      name: detector.name,
      confidence:
        detector.score >= 12 ? "high" : detector.score >= 6 ? "medium" : "low",
      score: detector.score,
      evidence: detector.evidence,
      advice: detector.advice,
    }))
    .sort((a, b) => b.score - a.score);
}

function scoreEvidence(file) {
  if (["xp3", "rpa", "nsa", "ns2", "sar", "pck"].includes(file.ext)) return 4;
  if (["exe", "dll"].includes(file.ext)) return 3;
  if (["rpy", "rpyc", "ks"].includes(file.ext)) return 2;
  return 1;
}

function detectLaunchCandidates(files, engines) {
  const engineIds = new Set(engines.map((engine) => engine.id));
  const candidates = [];

  for (const file of files) {
    if (!EXE_EXTS.has(file.ext) && file.name.toLowerCase() !== "index.html") continue;

    const lower = file.lowerPath;
    const base = file.name.toLowerCase();
    const reasons = [];
    let score = 35;

    if (file.name.toLowerCase() === "index.html") {
      score = engineIds.has("tyrano") ? 74 : 46;
      reasons.push("web entry");
      if (file.depth <= 1) {
        score += 12;
        reasons.push("near root");
      }
    }

    if (EXE_EXTS.has(file.ext)) {
      if (file.depth <= 1) {
        score += 30;
        reasons.push("root-level executable");
      } else if (file.depth <= 2) {
        score += 14;
        reasons.push("near root");
      }

      if (base === "game.exe") {
        score += 18;
        reasons.push("common VN entry");
      }

      if (base.includes("launcher") || base.includes("start")) {
        score += 10;
        reasons.push("launcher name");
      }

      if (engineIds.has("renpy") && file.depth <= 1) {
        score += 12;
        reasons.push("Ren'Py root exe");
      }

      if (engineIds.has("siglus") && base === "siglusengine.exe") {
        score += 18;
        reasons.push("engine executable");
      }

      if (isSetupLike(lower)) {
        score -= 42;
        reasons.push("installer or support tool");
      }

      if (/(config|setting|option|環境設定|設定)/i.test(file.name)) {
        score -= 18;
        reasons.push("configuration tool");
      }

      if (/(unins|uninstall|update|patch|crash|vcredist|redist|dxsetup|dotnet|support)/i.test(lower)) {
        score -= 34;
        reasons.push("not the game");
      }
    }

    candidates.push({
      file,
      score: Math.max(0, Math.min(100, score)),
      reasons,
    });
  }

  return candidates
    .filter((item) => item.score >= 35)
    .sort((a, b) => b.score - a.score || a.file.path.localeCompare(b.file.path))
    .slice(0, 8);
}

function isSetupLike(lowerPath) {
  return /(setup|install|installer|autorun|inst|修正|patch)/i.test(lowerPath);
}

function buildFindings(files, roots, engines, launchCandidates, errorText, mode) {
  if (!files.length) return [];

  const findings = [];
  const archiveCount = countFiles(files, (file) => ARCHIVE_EXTS.has(file.ext));
  const discCount = countFiles(files, (file) => DISC_EXTS.has(file.ext));
  const executableCount = countFiles(files, (file) => EXE_EXTS.has(file.ext));
  const resourceArchiveCount = countFiles(files, (file) => RESOURCE_ARCHIVES.has(file.ext));
  const nonAsciiPaths = samplePaths(files, (file) => /[^\x00-\x7F]/.test(file.path), 3);
  const longPaths = samplePaths(files, (file) => file.path.length > 180, 3);
  const setupFiles = samplePaths(files, (file) => isSetupLike(file.lowerPath), 3);

  if (mode.id !== "normal") {
    findings.push({
      level: mode.findingLevel,
      title: "已启用大文件夹模式",
      body: `${mode.detail} 这不会读取 10GB 级游戏文件内容，只会分析文件清单。`,
    });
  }

  if (launchCandidates.length) {
    findings.push({
      level: "good",
      title: "找到可尝试启动入口",
      body: `最高置信度入口是 ${launchCandidates[0].file.path}。如果它失败，再按候选列表从上到下尝试。`,
    });
  } else if (executableCount === 0 && !hasFile(files, (file) => file.name.toLowerCase() === "index.html")) {
    findings.push({
      level: "blocker",
      title: "没有发现明显启动入口",
      body: "当前选择里没有 exe、bat、cmd、lnk 或 index.html。可能只选中了压缩包、镜像、补丁包，或还没有完整解压。",
    });
  } else {
    findings.push({
      level: "warning",
      title: "启动入口不明确",
      body: "发现了可执行文件，但它们更像安装器、配置工具或运行库。请优先选择完整解压后的游戏根目录。",
    });
  }

  if (archiveCount && executableCount === 0) {
    findings.push({
      level: "warning",
      title: "看起来还停在压缩包阶段",
      body: "先完整解压 zip/rar/7z，再把解压后的文件夹拖进来。直接在压缩软件里双击游戏经常会缺文件。",
    });
  } else if (archiveCount) {
    findings.push({
      level: "info",
      title: "发现压缩包",
      body: "如果压缩包是补丁或分卷，请确认所有分卷都在同一目录，并先解压到英文路径。",
    });
  }

  if (discCount) {
    findings.push({
      level: "warning",
      title: "发现镜像文件",
      body: "iso/mds/cue/bin 通常需要先挂载或解包。挂载后再从虚拟光驱里运行安装器或复制完整游戏目录。",
    });
  }

  if (nonAsciiPaths.length) {
    findings.push({
      level: "warning",
      title: "路径里有非英文字符",
      body: `老游戏可能因为路径编码打不开。建议移动到 C:/Games/VNName 这类英文短路径。样例：${nonAsciiPaths.join(", ")}`,
    });
  }

  if (longPaths.length) {
    findings.push({
      level: "warning",
      title: "路径过长",
      body: `Windows 老程序可能无法读取很长路径。建议缩短目录层级。样例：${longPaths.join(", ")}`,
    });
  }

  if (roots.length > 1) {
    findings.push({
      level: "info",
      title: "选择里包含多个根目录",
      body: `检测到 ${roots.length} 个顶层目录。诊断仍可用，但启动判断会更保守。`,
    });
  }

  if (setupFiles.length && !launchCandidates.some((candidate) => candidate.score >= 75)) {
    findings.push({
      level: "info",
      title: "可能需要先安装",
      body: `发现安装器或补丁工具：${setupFiles.join(", ")}。如果这是光盘镜像内容，通常先运行安装器。`,
    });
  }

  if (engines.some((engine) => ["kirikiri", "nscript", "siglus"].includes(engine.id))) {
    findings.push({
      level: "warning",
      title: "日区/编码风险较高",
      body: "吉里吉里、NScripter、Siglus/RealLive 系老游戏常见乱码或闪退。优先尝试日区环境、Locale Emulator、英文路径和管理员权限。",
    });
  }

  if (engines.some((engine) => engine.id === "unity") && !hasFile(files, (file) => file.name === "UnityPlayer.dll")) {
    findings.push({
      level: "warning",
      title: "Unity 文件可能不完整",
      body: "发现 Unity 结构线索，但没有看到 UnityPlayer.dll。请确认解压完整，尤其不要漏掉同名 _Data 文件夹。",
    });
  }

  if (resourceArchiveCount) {
    findings.push({
      level: "info",
      title: "发现资源封包",
      body: "检测到 rpa/xp3/nsa/arc/pck 等资源封包。GalAid 当前只做识别和清单，不绕过加密或 DRM。",
    });
  }

  findings.push(...analyzeErrorText(errorText));
  return findings;
}

function analyzeErrorText(text) {
  const value = text.trim();
  if (!value) return [];
  const lower = value.toLowerCase();
  const findings = [];

  if (/d3dx|directx|xinput|dsound|dinput/i.test(value)) {
    findings.push({
      level: "warning",
      title: "报错指向 DirectX 旧组件",
      body: "常见于老 galgame。可安装 DirectX End-User Runtime，并确认游戏目录没有被杀软隔离文件。",
    });
  }

  if (/msvcr|msvcp|vcruntime|visual c\+\+|vc\+\+/i.test(value)) {
    findings.push({
      level: "warning",
      title: "报错指向 VC++ 运行库",
      body: "安装 Microsoft Visual C++ Redistributable x86/x64。老游戏即使在 64 位系统上也经常需要 x86。",
    });
  }

  if (/rtp|rgss|rpg maker/i.test(value)) {
    findings.push({
      level: "warning",
      title: "报错指向 RPG Maker RTP",
      body: "安装对应版本 RTP，或确认游戏包是否自带 RTP 文件。",
    });
  }

  if (/文字化け|乱码|mojibake|locale|\?{4,}|\uFFFD/.test(value)) {
    findings.push({
      level: "warning",
      title: "报错指向系统区域或字体",
      body: "尝试日区环境、Locale Emulator、安装日文字体，并把游戏移动到英文短路径。",
    });
  }

  if (/not found|cannot find|missing|找不到|缺少|failed to load/i.test(value)) {
    findings.push({
      level: "warning",
      title: "报错指向缺文件",
      body: "优先重新完整解压，确认分卷齐全，避免在压缩软件预览窗口里直接运行。",
    });
  }

  if (/access denied|permission|拒绝访问|权限/i.test(value)) {
    findings.push({
      level: "warning",
      title: "报错指向权限",
      body: "移动到用户目录或 C:/Games，避免 Program Files；必要时再尝试管理员权限。",
    });
  }

  if (!findings.length) {
    findings.push({
      level: "info",
      title: "已记录错误信息",
      body: "当前规则没有命中特定报错。报告里会保留这段文本，方便继续排查。",
    });
  }

  return findings;
}

function getCategories(files) {
  const definitions = [
    {
      id: "images",
      name: "CG / 立绘",
      match: (file) => IMAGE_EXTS.has(file.ext),
    },
    {
      id: "audio",
      name: "音乐 / 语音",
      match: (file) => AUDIO_EXTS.has(file.ext),
    },
    {
      id: "video",
      name: "视频",
      match: (file) => VIDEO_EXTS.has(file.ext),
    },
    {
      id: "script",
      name: "文本 / 脚本",
      match: (file) => SCRIPT_EXTS.has(file.ext),
    },
    {
      id: "archives",
      name: "资源封包",
      match: (file) => RESOURCE_ARCHIVES.has(file.ext),
    },
    {
      id: "launchers",
      name: "启动/工具",
      match: (file) => EXE_EXTS.has(file.ext) || file.name.toLowerCase() === "index.html",
    },
  ];

  return definitions.map((definition) => {
    const matches = files.filter(definition.match);
    return {
      ...definition,
      count: matches.length,
      size: matches.reduce((sum, file) => sum + file.size, 0),
      samples: matches.slice(0, 5).map((file) => file.path),
    };
  });
}

function getStatus(findings, launchCandidates) {
  const hasBlocker = findings.some((finding) => finding.level === "blocker");
  const hasWarning = findings.some((finding) => finding.level === "warning");
  if (hasBlocker) return { label: "Blocked", className: "blocked" };
  if (hasWarning || !launchCandidates.length) return { label: "Needs check", className: "warn" };
  return { label: "Ready-ish", className: "ready" };
}

function setControlsBusy(isBusy) {
  [chooseFolderButton, chooseFilesButton, sampleButton, copyReportButton, downloadReportButton].forEach((button) => {
    button.disabled = isBusy;
  });
  dropZone.classList.toggle("is-busy", isBusy);
}

function updateScanState({ title, detail, progress = 0, visible = true, phase = "ready" }) {
  scanBanner.hidden = !visible;
  scanBanner.className = `scan-banner ${phase}`;
  scanTitle.textContent = title;
  scanDetail.textContent = detail;
  scanProgressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;

  if (phase === "scanning" || phase === "analyzing") {
    statusPill.textContent = "Scanning";
    statusPill.className = "status-pill scanning";
  }
}

async function importNativeFiles(fileList, sourceLabel) {
  const runId = ++scanRunId;
  setControlsBusy(true);
  updateScanState({
    title: "Scanning files",
    detail: `Reading ${sourceLabel} metadata...`,
    progress: 5,
    phase: "scanning",
  });

  try {
    const files = await filesFromFileList(fileList, (done, total) => {
      if (runId !== scanRunId) return;
      const progress = total ? Math.min(82, Math.round((done / total) * 80)) : 20;
      updateScanState({
        title: "Scanning files",
        detail: `${formatNumber(done)} / ${formatNumber(total || done)} files indexed`,
        progress,
        phase: "scanning",
      });
    });
    if (runId === scanRunId) await setFiles(files, { runId });
  } finally {
    if (runId === scanRunId) setControlsBusy(false);
  }
}

async function setFiles(files, options = {}) {
  const runId = options.runId || ++scanRunId;
  setControlsBusy(true);
  try {
    updateScanState({
      title: "Analyzing metadata",
      detail: `${formatNumber(files.length)} files queued`,
      progress: 88,
      phase: "analyzing",
    });
    await yieldToBrowser();
    if (runId !== scanRunId) return;

    currentFiles = uniqueFiles(files);
    currentAnalysis = analyze(currentFiles, errorInput.value);
    currentAnalysis.report = buildMarkdownReport(currentAnalysis, errorInput.value);
    updateScanState({
      title: currentAnalysis.mode.label,
      detail: currentAnalysis.mode.detail,
      progress: 100,
      phase: currentAnalysis.mode.id === "normal" ? "ready" : "large",
    });
    render();
  } finally {
    if (runId === scanRunId) setControlsBusy(false);
  }
}

function render() {
  if (!currentAnalysis || !currentAnalysis.files.length) {
    renderEmpty();
    return;
  }

  const analysis = currentAnalysis;
  projectTitle.textContent = analysis.roots[0]?.name || "已导入文件";
  statusPill.textContent = analysis.status.label;
  statusPill.className = `status-pill ${analysis.status.className}`;
  fileCount.textContent = String(analysis.files.length);
  engineCount.textContent = String(analysis.engines.length);
  assetCount.textContent = String(
    analysis.categories
      .filter((category) => ["images", "audio", "video", "script"].includes(category.id))
      .reduce((sum, category) => sum + category.count, 0),
  );
  riskCount.textContent = String(analysis.riskTotal);

  launchPanel.innerHTML = renderLaunch(analysis);
  enginePanel.innerHTML = renderEngines(analysis);
  assetsPanel.innerHTML = renderAssets(analysis);
  reportPanel.innerHTML = `<div class="report-box">${escapeHtml(analysis.report)}</div>`;
}

function renderEmpty() {
  projectTitle.textContent = "等待导入";
  statusPill.textContent = "No data";
  statusPill.className = "status-pill neutral";
  fileCount.textContent = "0";
  engineCount.textContent = "0";
  assetCount.textContent = "0";
  riskCount.textContent = "0";
  scanBanner.hidden = true;
  const empty = emptyStateTemplate.innerHTML;
  launchPanel.innerHTML = empty;
  enginePanel.innerHTML = empty;
  assetsPanel.innerHTML = empty;
  reportPanel.innerHTML = empty;
}

function renderLaunch(analysis) {
  const candidates = analysis.launchCandidates.length
    ? analysis.launchCandidates
        .map(
          (candidate) => `
            <article class="candidate">
              <div>
                <h4>${escapeHtml(candidate.file.name)}</h4>
                <p>${escapeHtml(candidate.file.path)}</p>
                <div class="meta-row">
                  <span class="chip good">${formatBytes(candidate.file.size)}</span>
                  ${candidate.reasons.map((reason) => `<span class="chip">${escapeHtml(reason)}</span>`).join("")}
                </div>
              </div>
              <div class="candidate-score">${candidate.score}</div>
            </article>
          `,
        )
        .join("")
    : `<article class="finding blocker"><div><h4>没有候选入口</h4><p>请换成完整解压后的游戏根目录再试。</p></div></article>`;

  return `
    ${renderModeCard(analysis)}
    <div class="section-title">
      <h3>启动候选</h3>
      <span>${analysis.launchCandidates.length} items</span>
    </div>
    <div class="card-list">${candidates}</div>
    <div class="section-title">
      <h3>诊断结论</h3>
      <span>${analysis.findings.length} findings</span>
    </div>
    <div class="card-list">${analysis.findings.map(renderFinding).join("")}</div>
  `;
}

function renderModeCard(analysis) {
  if (analysis.mode.id === "normal") return "";
  return `
    <article class="finding ${analysis.mode.findingLevel}">
      <div>
        <h4>${escapeHtml(analysis.mode.label)}</h4>
        <p>${escapeHtml(analysis.mode.detail)} 页面只展示关键样例，报告仍基于完整文件清单。</p>
      </div>
    </article>
  `;
}

function renderFinding(finding) {
  return `
    <article class="finding ${finding.level}">
      <div>
        <h4>${escapeHtml(finding.title)}</h4>
        <p>${escapeHtml(finding.body)}</p>
      </div>
    </article>
  `;
}

function renderEngines(analysis) {
  if (!analysis.engines.length) {
    return `
      <div class="section-title"><h3>引擎线索</h3><span>0 matches</span></div>
      <article class="finding warning"><div><h4>没有明显引擎标记</h4><p>可以继续用启动候选排查；也可能是私有引擎或文件还没完整解压。</p></div></article>
    `;
  }

  return `
    <div class="section-title">
      <h3>引擎线索</h3>
      <span>${analysis.engines.length} matches</span>
    </div>
    <div class="grid-two">
      ${analysis.engines
        .map(
          (engine) => `
            <article class="engine-card">
              <h4>${escapeHtml(engine.name)}</h4>
              <p>${escapeHtml(engine.advice)}</p>
              <div class="meta-row">
                <span class="chip ${engine.confidence === "high" ? "good" : "warn"}">${engine.confidence}</span>
                <span class="chip">score ${engine.score}</span>
              </div>
              <div class="sample-list">
                ${engine.evidence.map((path) => `<code>${escapeHtml(path)}</code>`).join("")}
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderAssets(analysis) {
  const max = Math.max(1, ...analysis.categories.map((category) => category.count));
  const bars = analysis.categories
    .map(
      (category) => `
        <div class="asset-bar">
          <strong>${escapeHtml(category.name)}</strong>
          <div class="bar-track" aria-hidden="true">
            <div class="bar-fill" style="width: ${(category.count / max) * 100}%"></div>
          </div>
          <span>${category.count}</span>
        </div>
      `,
    )
    .join("");

  const cards = analysis.categories
    .filter((category) => category.count)
    .map(
      (category) => `
        <article class="asset-card">
          <h4>${escapeHtml(category.name)}</h4>
          <p>${category.count} files, ${formatBytes(category.size)}</p>
          <div class="sample-list">
            ${category.samples.map((path) => `<code>${escapeHtml(path)}</code>`).join("")}
          </div>
        </article>
      `,
    )
    .join("");

  return `
    <div class="section-title">
      <h3>素材地图</h3>
      <span>${formatBytes(analysis.files.reduce((sum, file) => sum + file.size, 0))}</span>
    </div>
    <article class="asset-card"><div class="asset-bars">${bars}</div></article>
    <div class="section-title"><h3>样例路径</h3><span>local manifest</span></div>
    <div class="grid-two">${cards || `<article class="finding warning"><div><h4>没有素材线索</h4><p>可能只导入了启动器或压缩包。</p></div></article>`}</div>
  `;
}

function buildMarkdownReport(analysis, errorText) {
  const lines = [];
  lines.push("# GalAid diagnosis report");
  lines.push("");
  lines.push(`- Root: ${analysis.roots.map((root) => `${root.name} (${root.count})`).join(", ") || "unknown"}`);
  lines.push(`- Files: ${analysis.files.length}`);
  lines.push(`- Size: ${formatBytes(analysis.totalSize)}`);
  lines.push(`- Status: ${analysis.status.label}`);
  lines.push(`- Mode: ${analysis.mode.label}`);
  lines.push(`- Mode detail: ${analysis.mode.detail}`);
  lines.push(`- Risk findings: ${analysis.riskTotal}`);
  lines.push("");
  lines.push("## Launch candidates");
  if (analysis.launchCandidates.length) {
    for (const candidate of analysis.launchCandidates) {
      lines.push(`- ${candidate.score}/100 ${candidate.file.path} (${candidate.reasons.join(", ") || "candidate"})`);
    }
  } else {
    lines.push("- No launch candidates found.");
  }
  lines.push("");
  lines.push("## Engine clues");
  if (analysis.engines.length) {
    for (const engine of analysis.engines) {
      lines.push(`- ${engine.name}: ${engine.confidence}, score ${engine.score}`);
      for (const evidence of engine.evidence) lines.push(`  - ${evidence}`);
    }
  } else {
    lines.push("- No obvious engine markers found.");
  }
  lines.push("");
  lines.push("## Findings");
  for (const finding of analysis.findings) {
    lines.push(`- [${finding.level}] ${finding.title}: ${finding.body}`);
  }
  lines.push("");
  lines.push("## Asset map");
  for (const category of analysis.categories) {
    lines.push(`- ${category.name}: ${category.count} files, ${formatBytes(category.size)}`);
  }
  if (errorText.trim()) {
    lines.push("");
    lines.push("## Error text");
    lines.push("```");
    lines.push(errorText.trim());
    lines.push("```");
  }
  return lines.join("\n");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 2400);
}

chooseFolderButton.addEventListener("click", () => folderInput.click());
chooseFilesButton.addEventListener("click", () => fileInput.click());
sampleButton.addEventListener("click", () => {
  void setFiles(SAMPLE_FILES.map(fileFromSample));
});
clearButton.addEventListener("click", () => {
  scanRunId += 1;
  currentFiles = [];
  currentAnalysis = null;
  folderInput.value = "";
  fileInput.value = "";
  errorInput.value = "";
  setControlsBusy(false);
  renderEmpty();
});

folderInput.addEventListener("change", () => {
  void importNativeFiles(folderInput.files, "folder");
});
fileInput.addEventListener("change", () => {
  void importNativeFiles(fileInput.files, "selected files");
});
errorInput.addEventListener("input", () => {
  if (!currentFiles.length) return;
  currentAnalysis = analyze(currentFiles, errorInput.value);
  currentAnalysis.report = buildMarkdownReport(currentAnalysis, errorInput.value);
  updateScanState({
    title: currentAnalysis.mode.label,
    detail: currentAnalysis.mode.detail,
    progress: 100,
    phase: currentAnalysis.mode.id === "normal" ? "ready" : "large",
  });
  render();
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  dropZone.classList.remove("drag-over");
  const runId = ++scanRunId;
  setControlsBusy(true);
  updateScanState({
    title: "Scanning dropped folder",
    detail: "Walking folder tree...",
    progress: 8,
    phase: "scanning",
  });
  try {
    const files = await collectDroppedFiles(event.dataTransfer, (done, total) => {
      if (runId !== scanRunId) return;
      updateScanState({
        title: "Scanning dropped folder",
        detail: total
          ? `${formatNumber(done)} / ${formatNumber(total)} files indexed`
          : `${formatNumber(done)} files indexed`,
        progress: total ? Math.min(82, Math.round((done / total) * 80)) : 45,
        phase: "scanning",
      });
    });
    if (runId === scanRunId) await setFiles(files, { runId });
  } finally {
    if (runId === scanRunId) setControlsBusy(false);
  }
});

dropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    folderInput.click();
  }
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((button) => button.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.tab}Panel`).classList.add("active");
  });
});

copyReportButton.addEventListener("click", async () => {
  if (!currentAnalysis) {
    showToast("还没有报告");
    return;
  }
  await navigator.clipboard.writeText(currentAnalysis.report);
  showToast("报告已复制");
});

downloadReportButton.addEventListener("click", () => {
  if (!currentAnalysis) {
    showToast("还没有报告");
    return;
  }
  const blob = new Blob([currentAnalysis.report], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "galaid-report.md";
  link.click();
  URL.revokeObjectURL(url);
});

renderEmpty();
