const { spawn } = require("node:child_process");

const CHECK_TIMEOUT_MS = 10 * 1000;
const MAX_OUTPUT_BYTES = 96 * 1024;

async function checkRuntimeEnvironment({ platform = process.platform, spawnImpl = spawn } = {}) {
  const checkedAt = new Date().toISOString();
  if (platform !== "win32") {
    const checks = [
      makeCheck({
        id: "desktop-platform",
        title: "本机运行环境检测",
        status: "info",
        detail: "当前桌面端不在 Windows 上，无法直接读取 Windows 运行库和系统区域状态。",
        action: "Windows 用户可以在桌面端点击本机检测；其他平台继续使用文件结构和报错文本诊断。",
        evidence: [platform || "unknown"],
      }),
    ];
    return { ok: true, platform, checkedAt, checks, summary: summarizeChecks(checks) };
  }

  const [directx, vcredist, rtp, locale] = await Promise.all([
    inspectDirectX(spawnImpl),
    inspectVisualCpp(spawnImpl),
    inspectRpgMakerRtp(spawnImpl),
    inspectLocale(spawnImpl),
  ]);
  const checks = [directx, vcredist, rtp, locale];
  return { ok: true, platform, checkedAt, checks, summary: summarizeChecks(checks) };
}

async function inspectDirectX(spawnImpl) {
  const result = await runPowerShell(
    [
      "$names=@('d3dx9_43.dll','xinput1_3.dll','xaudio2_7.dll','xactengine3_7.dll');",
      "$roots=@($env:WINDIR + '\\System32',$env:WINDIR + '\\SysWOW64');",
      "foreach($name in $names){",
      "  foreach($root in $roots){",
      "    if(Test-Path (Join-Path $root $name)){ Write-Output ($name + ' (' + (Split-Path $root -Leaf) + ')') }",
      "  }",
      "}",
    ].join(" "),
    spawnImpl,
  );
  if (!result.ok) return commandProbeCheck("directx-native", "DirectX 旧组件", result);
  const evidence = uniqueLines(result.stdout).slice(0, 6);
  return makeCheck({
    id: "directx-native",
    title: "DirectX 旧组件",
    status: evidence.length ? "good" : "warning",
    detail: evidence.length
      ? "检测到常见 DirectX 9 时代 DLL，老游戏黑屏或缺 d3dx/xinput 的概率会低一些。"
      : "没有检测到常见 DirectX 9 时代 DLL。很多老 galgame 在新系统上仍需要这些旧组件。",
    action: evidence.length
      ? "如果仍黑屏，继续结合报错文字排查显卡切换、窗口模式和游戏完整性。"
      : "遇到 d3dx、xinput、xaudio、xact、dinput 相关报错时，优先补 DirectX End-User Runtime。",
    evidence,
  });
}

async function inspectVisualCpp(spawnImpl) {
  const result = await runPowerShell(
    [
      "$keys=@('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*');",
      "Get-ItemProperty $keys -ErrorAction SilentlyContinue |",
      "Where-Object { $_.DisplayName -match 'Microsoft Visual C\\+\\+.*Redistributable' } |",
      "ForEach-Object { $_.DisplayName } | Sort-Object -Unique",
    ].join(" "),
    spawnImpl,
  );
  if (!result.ok) return commandProbeCheck("vcredist-native", "VC++ 运行库", result);
  const evidence = uniqueLines(result.stdout).slice(0, 8);
  return makeCheck({
    id: "vcredist-native",
    title: "VC++ 运行库",
    status: evidence.length ? "good" : "warning",
    detail: evidence.length
      ? "检测到已安装的 Microsoft Visual C++ Redistributable。"
      : "没有在常见注册表位置检测到 VC++ Redistributable。缺 msvcr/msvcp/vcruntime 时会直接启动失败。",
    action: evidence.length
      ? "如果报错点名某个 msvcr/msvcp/vcruntime DLL，按报错年份补对应 x86/x64 版本。"
      : "遇到 msvcr、msvcp、vcruntime 相关报错时，优先安装 Microsoft Visual C++ Redistributable，老游戏常需要 x86。",
    evidence,
  });
}

async function inspectRpgMakerRtp(spawnImpl) {
  const result = await runPowerShell(
    [
      "$keys=@('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*');",
      "Get-ItemProperty $keys -ErrorAction SilentlyContinue |",
      "Where-Object { $_.DisplayName -match '(RPG.*Maker.*RTP|RPG.*RTP|VX Ace RTP|RTP.*VX|RGSS)' } |",
      "ForEach-Object { $_.DisplayName } | Sort-Object -Unique",
    ].join(" "),
    spawnImpl,
  );
  if (!result.ok) return commandProbeCheck("rtp-native", "RPG Maker RTP", result);
  const evidence = uniqueLines(result.stdout).slice(0, 6);
  return makeCheck({
    id: "rtp-native",
    title: "RPG Maker RTP",
    status: evidence.length ? "good" : "info",
    detail: evidence.length
      ? "检测到 RPG Maker RTP 或相关运行环境。"
      : "没有检测到 RPG Maker RTP。只有 RPG Maker 旧版游戏或报错点名 RTP/RGSS 时才需要处理。",
    action: evidence.length
      ? "RPG Maker 游戏仍报 RTP/RGSS 时，确认游戏版本和已安装 RTP 版本一致。"
      : "如果启动时报 RTP、RGSS、找不到素材，再按游戏版本补对应 RPG Maker RTP。",
    evidence,
  });
}

async function inspectLocale(spawnImpl) {
  const result = await runPowerShell(
    [
      "$current=[System.Globalization.CultureInfo]::CurrentCulture.Name;",
      "$ui=[System.Globalization.CultureInfo]::CurrentUICulture.Name;",
      "try { $system=(Get-WinSystemLocale).Name } catch { $system='' }",
      "Write-Output ('CurrentCulture=' + $current);",
      "Write-Output ('CurrentUICulture=' + $ui);",
      "Write-Output ('SystemLocale=' + $system);",
    ].join(" "),
    spawnImpl,
  );
  if (!result.ok) return commandProbeCheck("locale-native", "日区与系统区域", result);
  const evidence = uniqueLines(result.stdout).slice(0, 6);
  const hasJapaneseLocale = evidence.some((line) => /=ja(-|_)?jp/i.test(line));
  return makeCheck({
    id: "locale-native",
    title: "日区与系统区域",
    status: hasJapaneseLocale ? "good" : "info",
    detail: hasJapaneseLocale
      ? "当前 Windows 文化或系统区域里检测到日语环境。"
      : "当前 Windows 文化或系统区域未显示为日语。很多现代游戏不受影响，但古早日文游戏可能乱码或闪退。",
    action: hasJapaneseLocale
      ? "如果仍乱码，继续检查游戏路径、字体和 Locale Emulator 启动方式。"
      : "只有出现乱码、脚本读取失败或启动即退时，再尝试日区环境或 Locale Emulator。",
    evidence,
  });
}

function commandProbeCheck(id, title, result) {
  return makeCheck({
    id,
    title,
    status: "info",
    detail: "本机检测命令没有成功返回结果。",
    action: "继续使用报错文本和文件结构诊断；如果需要本机检测，请确认 Windows PowerShell 可正常运行。",
    evidence: compactEvidence([result.errorCode, result.message], 4),
  });
}

function runPowerShell(script, spawnImpl = spawn) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timer;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };

    const child = spawnImpl("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    timer = setTimeout(() => {
      child.kill?.();
      finish({ ok: false, errorCode: "timeout", message: "PowerShell runtime check timed out." });
    }, CHECK_TIMEOUT_MS);

    child.stdout?.on("data", (chunk) => {
      stdout = appendLimited(stdout, chunk.toString("utf8"));
    });
    child.stderr?.on("data", (chunk) => {
      stderr = appendLimited(stderr, chunk.toString("utf8"));
    });
    child.on("error", (error) => {
      finish({
        ok: false,
        errorCode: error?.code === "ENOENT" ? "powershell-missing" : "powershell-error",
        message: error?.message || "PowerShell check failed.",
      });
    });
    child.on("close", (code) => {
      if (code === 0) finish({ ok: true, stdout, stderr });
      else finish({ ok: false, errorCode: "powershell-exit", message: stderr.trim() || `PowerShell exited with code ${code}.` });
    });
  });
}

function appendLimited(current, next) {
  if (current.length >= MAX_OUTPUT_BYTES) return current;
  return current + next.slice(0, Math.max(0, MAX_OUTPUT_BYTES - current.length));
}

function makeCheck({ id, title, status, detail, action, evidence = [] }) {
  return {
    id,
    title,
    status,
    statusLabel: getStatusLabel(status),
    detail,
    action,
    evidence: compactEvidence(evidence, 8),
  };
}

function summarizeChecks(checks) {
  const counts = {
    good: checks.filter((check) => check.status === "good").length,
    warning: checks.filter((check) => check.status === "warning").length,
    info: checks.filter((check) => check.status === "info").length,
  };
  const firstWarning = checks.find((check) => check.status === "warning");
  if (firstWarning) {
    return {
      status: "warning",
      label: `${counts.warning} 个本机环境建议项`,
      detail: firstWarning.action,
      counts,
    };
  }
  return {
    status: "good",
    label: "本机环境检测没有发现明显缺口",
    detail: "如果游戏仍启动失败，继续结合报错截图、路径和游戏完整性排查。",
    counts,
  };
}

function getStatusLabel(status) {
  const labels = {
    good: "OK",
    warning: "建议处理",
    info: "观察",
  };
  return labels[status] || labels.info;
}

function uniqueLines(value) {
  return compactEvidence(String(value || "").split(/\r?\n/).map((line) => line.trim()), 100);
}

function compactEvidence(values, limit = 4) {
  return [...new Set(values.filter(Boolean))].slice(0, limit);
}

module.exports = {
  checkRuntimeEnvironment,
  inspectDirectX,
  inspectLocale,
  inspectRpgMakerRtp,
  inspectVisualCpp,
  runPowerShell,
};
