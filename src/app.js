const folderInput = document.querySelector("#folderInput");
const fileInput = document.querySelector("#fileInput");
const chooseFolderButton = document.querySelector("#chooseFolderButton");
const chooseFilesButton = document.querySelector("#chooseFilesButton");
const sampleButton = document.querySelector("#sampleButton");
const commercialSampleButton = document.querySelector("#commercialSampleButton");
const packageSampleButton = document.querySelector("#packageSampleButton");
const clearButton = document.querySelector("#clearButton");
const copyReportButton = document.querySelector("#copyReportButton");
const downloadReportButton = document.querySelector("#downloadReportButton");
const downloadBundleButton = document.querySelector("#downloadBundleButton");
const assistantLanguageSelect = document.querySelector("#assistantLanguageSelect");
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
const roadmapPanel = document.querySelector("#roadmapPanel");
const profilesPanel = document.querySelector("#profilesPanel");
const environmentPanel = document.querySelector("#environmentPanel");
const errorsPanel = document.querySelector("#errorsPanel");
const packagesPanel = document.querySelector("#packagesPanel");
const enginePanel = document.querySelector("#enginePanel");
const assetsPanel = document.querySelector("#assetsPanel");
const supportPanel = document.querySelector("#supportPanel");
const reportPanel = document.querySelector("#reportPanel");
const emptyStateTemplate = document.querySelector("#emptyStateTemplate");

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "bmp", "webp", "tga", "dds", "gif", "psd"]);
const AUDIO_EXTS = new Set(["ogg", "mp3", "wav", "flac", "m4a", "aac", "opus", "mid", "midi"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "avi", "wmv", "mpg", "mpeg", "mkv", "mov"]);
const SCRIPT_EXTS = new Set(["rpy", "rpyc", "ks", "tjs", "tpm", "txt", "json", "csv", "xml", "ini", "lua", "js"]);
const ARCHIVE_EXTS = new Set(["zip", "rar", "7z", "tar", "gz", "bz2", "xz"]);
const DISC_EXTS = new Set(["iso", "mdf", "mds", "cue", "bin", "ccd", "img", "nrg", "sub", "isz", "cdi"]);
const EXE_EXTS = new Set(["exe", "bat", "cmd", "com", "lnk"]);
const RESOURCE_ARCHIVES = new Set(["rpa", "rpi", "xp3", "nsa", "ns2", "sar", "arc", "pck", "dat", "pak", "wolf", "cpk", "pac", "vol", "iro"]);
const ENGINE_RULES = Array.isArray(window.GALAID_ENGINE_RULES) ? window.GALAID_ENGINE_RULES : [];
const COMMERCIAL_RESOURCE_ARCHIVES = new Set(getEngineRuleExtensions("commercial-proprietary", ["arc", "dat", "pak", "pck", "cpk", "pac", "vol", "iro", "wolf"]));
const SCAN_BATCH_SIZE = 1000;
const LARGE_FOLDER_THRESHOLD = 20000;
const HUGE_FOLDER_THRESHOLD = 50000;
const MAX_SORTED_FILES = 50000;
const SUPPORT_BUNDLE_FILE_LIMIT = 5000;
const ERROR_RECIPES = Array.isArray(window.GALAID_ERROR_RECIPES) ? window.GALAID_ERROR_RECIPES : [];
const ASSISTANT_LANGUAGE_STORAGE_KEY = "GalAid.assistantLanguage.v1";
const LAUNCH_FAILURE_SYMPTOMS = [
  {
    id: "nothing",
    diagnosticText: "manual follow-up: nothing happened after clicking the launcher; no window and no error",
    label: {
      "zh-CN": "点了没反应",
      en: "Nothing happened",
      ja: "クリックしても反応なし",
    },
    hint: {
      "zh-CN": "没有窗口、没有报错，或只在后台闪了一下。",
      en: "No window, no dialog, or only a brief background flash.",
      ja: "ウィンドウやエラーが出ず、一瞬だけ反応したように見える状態。",
    },
    step: {
      "zh-CN": {
        title: "启动后没反应",
        detail: "用户手动标记：点击入口后没有明显窗口或报错。GalAid 没有监控进程，只记录这条现象。",
        action: "先确认不是点到安装器/配置工具；再按英文短路径、管理员权限、杀软隔离、备用启动入口的顺序排查。",
      },
      en: {
        title: "Nothing happened after launch",
        detail: "Manually marked: the launcher produced no obvious window or dialog. GalAid is not monitoring the process; it only records this evidence.",
        action: "Confirm the entry is not an installer/config tool, then check a short ASCII path, permissions, antivirus quarantine, and alternate launch candidates.",
      },
      ja: {
        title: "起動後に反応がない",
        detail: "手動入力: 起動ファイルを押しても明確なウィンドウやエラーが出ません。GalAid はプロセスを監視せず、この情報だけを記録します。",
        action: "インストーラや設定ツールを押していないか確認し、短い英数字パス、権限、セキュリティソフト隔離、別候補の順に確認してください。",
      },
    },
  },
  {
    id: "crash",
    diagnosticText: "manual follow-up: game crashes immediately or exits after launch",
    label: {
      "zh-CN": "闪退/立即退出",
      en: "Crashes immediately",
      ja: "すぐ落ちる",
    },
    hint: {
      "zh-CN": "窗口出现后立刻消失，或启动器马上退出。",
      en: "The window appears and closes, or the launcher exits right away.",
      ja: "ウィンドウが出てすぐ消える、またはランチャーが即終了します。",
    },
    step: {
      "zh-CN": {
        title: "闪退后收集报错",
        detail: "用户手动标记：启动后立即退出。无弹窗时也应按环境线索继续排查。",
        action: "先贴弹窗/日志；如果没有文本，优先尝试日区/Locale Emulator、英文短路径、完整解压和 DirectX/VC++ 运行库。",
      },
      en: {
        title: "Collect crash evidence",
        detail: "Manually marked: the game exits immediately after launch.",
        action: "Paste any dialog/log text. If there is no text, try Japanese locale / Locale Emulator, a short ASCII path, full extraction, and DirectX/VC++ runtimes.",
      },
      ja: {
        title: "クラッシュ情報を集める",
        detail: "手動入力: 起動直後に終了します。",
        action: "ダイアログやログがあれば貼り付けます。本文がない場合は、日本語 locale / Locale Emulator、短い英数字パス、完全展開、DirectX/VC++ ランタイムを確認してください。",
      },
    },
  },
  {
    id: "mojibake",
    diagnosticText: "manual follow-up: mojibake 文字化け 乱码 locale Japanese locale",
    label: {
      "zh-CN": "乱码/文字化け",
      en: "Mojibake",
      ja: "文字化け",
    },
    hint: {
      "zh-CN": "菜单、报错、路径或脚本文字显示乱码。",
      en: "Menus, dialogs, paths, or script text show garbled characters.",
      ja: "メニュー、ダイアログ、パス、スクリプト文字が崩れて表示されます。",
    },
    step: {
      "zh-CN": {
        title: "优先处理日区/编码",
        detail: "用户手动标记：出现乱码或日文编码问题。",
        action: "先尝试日区环境或 Locale Emulator，并把游戏移动到 C:/Games/VNName 这类英文短路径后重试。",
      },
      en: {
        title: "Prioritize locale and encoding",
        detail: "Manually marked: garbled text or Japanese encoding trouble appeared.",
        action: "Try Japanese locale or Locale Emulator first, and move the game to a short ASCII path such as C:/Games/VNName.",
      },
      ja: {
        title: "locale と文字コードを優先確認",
        detail: "手動入力: 文字化けまたは日本語エンコードの問題が出ています。",
        action: "まず日本語 locale または Locale Emulator を試し、C:/Games/VNName のような短い英数字パスに移動して再試行してください。",
      },
    },
  },
  {
    id: "black-screen",
    diagnosticText: "manual follow-up: black screen after launch graphics or DirectX issue",
    label: {
      "zh-CN": "黑屏",
      en: "Black screen",
      ja: "黒画面",
    },
    hint: {
      "zh-CN": "有窗口或声音，但画面黑屏、白屏或不刷新。",
      en: "A window or audio appears, but the image is black, white, or frozen.",
      ja: "ウィンドウや音は出るが、画面が黒い、白い、または更新されません。",
    },
    step: {
      "zh-CN": {
        title: "黑屏/画面异常",
        detail: "用户手动标记：启动后出现黑屏、白屏或画面不刷新。",
        action: "优先检查 DirectX 旧组件、窗口/全屏兼容模式、显卡切换和游戏目录完整性；如果有报错文字，再贴到错误信息里。",
      },
      en: {
        title: "Black screen or frozen display",
        detail: "Manually marked: the game shows a black/white/frozen screen after launch.",
        action: "Check legacy DirectX components, window/fullscreen compatibility, GPU switching, and folder completeness. Paste exact error text if any appears.",
      },
      ja: {
        title: "黒画面/表示異常",
        detail: "手動入力: 起動後に黒画面、白画面、または表示停止が出ています。",
        action: "古い DirectX コンポーネント、ウィンドウ/全画面互換設定、GPU 切り替え、フォルダ完全性を確認し、エラー本文があれば貼り付けてください。",
      },
    },
  },
  {
    id: "missing-dll",
    diagnosticText: "manual follow-up: missing dll not found cannot find missing runtime library",
    label: {
      "zh-CN": "缺 DLL/运行库",
      en: "Missing DLL/runtime",
      ja: "DLL/ランタイム不足",
    },
    hint: {
      "zh-CN": "弹窗提到 dll、runtime、not found、找不到文件。",
      en: "The dialog mentions dll, runtime, not found, or a missing file.",
      ja: "dll、runtime、not found、ファイル不足などが表示されます。",
    },
    step: {
      "zh-CN": {
        title: "缺 DLL/运行库",
        detail: "用户手动标记：启动失败疑似缺少 DLL 或运行库。",
        action: "把完整 DLL 名贴到错误信息里；d3dx/xinput 多半看 DirectX，msvcr/msvcp/vcruntime 多半看 VC++，RGSS/RTP 看 RPG Maker RTP。",
      },
      en: {
        title: "Missing DLL or runtime",
        detail: "Manually marked: launch failure may be caused by a missing DLL or runtime.",
        action: "Paste the exact DLL name. d3dx/xinput usually points to DirectX, msvcr/msvcp/vcruntime to VC++, and RGSS/RTP to RPG Maker RTP.",
      },
      ja: {
        title: "DLL/ランタイム不足",
        detail: "手動入力: DLL またはランタイム不足の可能性があります。",
        action: "正確な DLL 名を貼り付けてください。d3dx/xinput は DirectX、msvcr/msvcp/vcruntime は VC++、RGSS/RTP は RPG Maker RTP が主な確認先です。",
      },
    },
  },
];
const ASSISTANT_LANGUAGE_PACKS = {
  "zh-CN": {
    name: "中文",
    reportTitle: "GalAid 诊断报告",
    checklistTitle: "GalAid 下一步路线清单",
    supportTitle: "GalAid 求助摘要",
    supportBundleTitle: "GalAid 求助包",
    ui: {
      documentTitle: "GalAid - VN 启动医生",
      brandSubtitle: "VN 启动医生",
      dropTitle: "拖入游戏文件夹",
      dropHint: "或选择文件夹 / 压缩包 / 镜像文件",
      chooseFolder: "选择文件夹",
      chooseFiles: "选择文件",
      sampleGame: "游戏样例",
      sampleCommercial: "自研样例",
      samplePackage: "包/镜像样例",
      clear: "清空",
      errorLabel: "错误信息",
      errorPlaceholder: "粘贴报错文本，例如 d3dx9_43.dll、乱码、RTP、VCRUNTIME...",
      copyReport: "复制报告",
      downloadReport: "下载报告",
      downloadBundle: "下载求助包",
      languageLabel: "界面/诊断语言",
      privacyTitle: "Local only.",
      privacyBody: "浏览器只读取文件名、路径和大小，不上传游戏内容。",
      eyebrow: "诊断",
      waitingTitle: "等待导入",
      importedFiles: "已导入文件",
      selectedFiles: "已选择 {count} 个文件",
      moreRoots: "{name} + 另外 {count} 个根目录",
      noData: "无数据",
      scanning: "扫描中",
      summaryFiles: "文件",
      summaryEngine: "引擎线索",
      summaryAssets: "素材",
      summaryRisks: "风险",
      ready: "就绪",
      noFolder: "未选择文件夹。",
      tabLaunch: "启动",
      tabRoadmap: "路线",
      tabProfiles: "配置",
      tabEnvironment: "环境",
      tabErrors: "报错",
      tabPackages: "包/镜像",
      tabEngine: "引擎/结构",
      tabAssets: "素材",
      tabSupport: "求助",
      tabReport: "报告",
      emptyTitle: "先丢一个游戏文件夹进来",
      emptyBody: "GalAid 会在本地分析启动文件、引擎/结构线索、镜像/压缩包、路径风险和素材分布。",
      launchCandidates: "启动候选",
      diagnosisFindings: "诊断结论",
      evidenceTitle: "判断依据",
      whyMatched: "为什么命中",
      nextStepLabel: "下一步",
      launchTemplatesTitle: "可选启动模板",
      copyTemplate: "复制模板",
      localeEmulatorTemplateDescription: "仅在本机已安装可信 Locale Emulator 时使用；如果需要，请把 LEProc.exe 换成你的本机启动器路径。",
      wineJaTemplateDescription: "给已配置 Wine 和日文 locale 的 Linux 高阶用户参考。",
      protonRunTemplateDescription: "给 Proton / Steam Deck 高阶环境参考；请把 compatdata 路径换成你自己的本机 Steam 前缀。",
      launchFailureTitle: "启动失败了吗？",
      launchFailureBody: "GalAid 不会监控游戏进程；这里只记录你手动选择或粘贴的现象，用来更新路线图和求助包。",
      launchFailureSymptomsTitle: "失败现象",
      launchFailureNoteLabel: "报错或补充说明",
      launchFailureNotePlaceholder: "粘贴弹窗/日志，或写下“点了没反应”“黑屏但有声音”等现象...",
      launchFailureEmptyState: "还没有记录启动失败现象。",
      launchFailureEvidenceReady: "已记录 {count} 条现象",
      applyFailureFollowup: "更新路线",
      clearFailureFollowup: "清空跟进",
      launchAttemptTitle: "刚才启动了吗？",
      launchAttemptBody: "GalAid 已记录这次启动尝试。如果游戏没正常打开，点下面的现象会立刻更新路线和求助包。",
      launchAttemptOk: "正常打开了",
      launchAttemptDismissed: "已记录为正常打开",
      launchAttemptMarked: "已记录启动现象",
      unmountImage: "卸载镜像",
      unmountingImage: "卸载中...",
      mountedImageReady: "当前来自已挂载镜像：{drive}",
      mountedImageUnmounted: "镜像已卸载",
      preparedHandoffTitle: "准备完成",
      preparedHandoffReadyBody: "已从 {source} 准备并重扫 {target}。下一步优先尝试 {entry}。",
      preparedHandoffNoLaunchBody: "已从 {source} 准备并重扫 {target}，但还没有找到可信启动入口。请查看下面的诊断结论，或把安装后的完整游戏目录拖回来。",
      preparedRecommendedEntry: "推荐入口",
      noLaunchTitle: "没有候选入口",
      noLaunchBody: "请换成完整解压后的游戏根目录再试。",
      items: "项",
      findings: "条结论",
      largeModeReportNote: "页面只展示关键样例，报告仍基于完整文件清单。",
      roadmapTitle: "下一步路线",
      steps: "步",
      copyRoadmap: "复制路线清单",
      blockedCount: "先处理",
      todoCount: "建议",
      readyCount: "可执行",
      infoCount: "参考",
      profilesTitle: "启动配置",
      profiles: "配置",
      noProfilesTitle: "还不能生成启动配置",
      noProfilesBody: "当前没有可信启动入口。先处理压缩包/镜像，或换成完整解压后的游戏文件夹再试。",
      safeModeTitle: "安全模式",
      safeModeBody: "GalAid 默认只生成配置和命令；桌面版可以在你点击后用正确工作目录启动本地 .exe/.com。报告和页面默认保留相对路径。",
      entryLabel: "entry",
      workdirLabel: "workdir",
      desktopPathReady: "desktop path ready",
      relativePathOnly: "relative path only",
      launchNow: "启动",
      launching: "启动中...",
      launchUnavailable: "仅桌面版可启动",
      launchUnsupported: "仅支持 Windows .exe/.com",
      createShortcut: "创建快捷方式",
      creatingShortcut: "创建中...",
      launchHistoryTitle: "最近启动",
      noLaunchHistoryTitle: "还没有启动历史",
      noLaunchHistoryBody: "用桌面版启动一次可信入口后，这里会记录最近启动过的文件。",
      launchedAt: "启动时间",
      copyCommand: "复制命令",
      copyJson: "复制 JSON",
      downloadConfig: "下载配置",
      environmentTitle: "环境检查",
      checks: "检查",
      environmentCountsLabel: "environment check counts",
      ok: "OK",
      suggestions: "建议",
      blockers: "阻断",
      observations: "观察",
      errorsTitle: "报错诊断",
      recipes: "配方",
      matches: "命中",
      noErrorTextTitle: "还没有粘贴报错文本",
      noErrorTextBody: "当前没有错误文本；如果启动失败，把弹窗或日志文字放到左侧输入框后会重新诊断。",
      noRecipeTitle: "没有命中已知配方",
      noRecipeBody: "这段报错已经保留在报告中，可以作为后续新增社区配方的素材。",
      errorRecipeCountsLabel: "error recipe counts",
      recipeCoverageTitle: "配方覆盖",
      rules: "规则",
      engineTitle: "引擎/文件结构线索",
      matchesLabel: "命中",
      noEngineTitle: "没有明显结构线索",
      noEngineBody: "可以继续用启动候选排查；也可能只选中了补丁、压缩包，或需要换成完整游戏根目录。",
      scoreLabel: "score",
      startupStructure: "启动结构",
      packagesTitle: "包/镜像识别",
      packageResultsTitle: "识别结果",
      groups: "组",
      noPackagesTitle: "没有压缩包或镜像",
      noPackagesBody: "当前文件更像已经解压后的目录，可以直接看启动页。",
      zipPreview: "ZIP 目录预检",
      packagePreview: "包/镜像预检",
      preparePackage: "解压并重扫",
      prepareImage: "挂载/解包并重扫",
      preparingPackage: "解压中...",
      preparingImage: "镜像处理中...",
      preparePasswordPrompt: "这个包可能需要解压密码。请输入你已经知道的密码；留空会取消。",
      preparePasswordRetryPrompt: "密码不正确或缺少密码。请重新输入解压密码；留空会取消。",
      metadataOnly: "仅元数据",
      unavailable: "不可用",
      internalFiles: "内部文件",
      imageFiles: "镜像文件",
      launchClues: "启动线索",
      installerClues: "安装线索",
      truncated: "已截断",
      assetsTitle: "素材地图",
      samplePathsTitle: "样例路径",
      localManifest: "本地清单",
      noAssetsTitle: "没有素材线索",
      noAssetsBody: "可能只导入了启动器或压缩包。",
      supportBundle: "求助包",
      supportSummaryBody: "适合发 issue、论坛或聊天求助。只包含诊断元数据，不包含游戏文件。",
      copySupportSummary: "复制求助摘要",
      copyManifest: "复制清单 JSON",
      downloadSupportBundle: "下载求助包",
      privacyBoundary: "隐私边界",
      noGameFiles: "不包含游戏文件",
      noFileContents: "不读取文件内容",
      zipMetadataOnly: "包/镜像只预检元数据",
      relativePaths: "只保留相对路径",
      noUpload: "不上传任何内容",
      diagnosisSummary: "诊断摘要",
      includedFiles: "会包含的文件",
      exportLimitNote: "文件清单最多导出 {count} 条相对路径；超出时会在 file-manifest.json 标记 truncated。",
      copyableSummary: "可复制摘要",
      issueReady: "issue-ready",
      noBlockersTitle: "没有明显阻断项",
      noBlockersBody: "可以先按推荐启动配置尝试；失败后再补充报错文本。",
      statusStat: "状态",
      filesStat: "文件",
      recipesStat: "配方",
      checksStat: "检查",
      scanDesktop: "桌面扫描",
      scanFiles: "扫描文件中",
      scanDroppedFolder: "扫描拖入文件夹中",
      scanReadingMetadata: "正在读取{source}元数据...",
      scanFolderSource: "文件夹",
      scanFilesSource: "所选文件",
      scanFilesIndexed: "已索引 {done} / {total} 个文件",
      scanFilesIndexedSolo: "已索引 {done} 个文件",
      scanFilesSkipped: "已跳过 {count} 个文件",
      scanChooseFolder: "选择要扫描的文件夹...",
      scanChooseFiles: "选择要扫描的文件...",
      scanNoSelection: "没有选择桌面文件。",
      scanAnalyzing: "正在分析元数据",
      scanQueued: "{count} 个文件等待分析",
      scanWalkingTree: "正在遍历文件夹...",
      toastDesktopScanFailed: "桌面扫描失败",
      toastNoReport: "还没有报告",
      toastReportCopied: "报告已复制",
      toastNoDiagnosis: "还没有可导出的诊断",
      toastSupportCreated: "求助包已生成",
      toastDesktopCommandCopied: "已复制桌面命令",
      toastRelativeCommandCopied: "已复制相对命令",
      toastTemplateCopied: "启动模板已复制",
      toastFailureUpdated: "启动失败跟进已更新",
      toastFailureCleared: "启动失败跟进已清空",
      toastProfileJsonCopied: "配置 JSON 已复制",
      toastLaunchStarted: "已启动 {name}",
      toastLaunchUnavailable: "当前环境不能直接启动",
      toastLaunchFailed: "启动失败",
      toastImageUnmounted: "已卸载镜像：{name}",
      toastImageUnmountFailed: "镜像卸载失败",
      toastShortcutCreated: "快捷方式已创建：{name}",
      toastShortcutFailed: "快捷方式创建失败",
      toastPackagePrepared: "已准备并重新扫描：{name}",
      toastPrepareFailed: "解压准备失败",
      toastPrepareToolMissing: "内置或本机 7z 工具暂时不可用，无法处理这个包",
      toastPrepareUnsupported: "这个类型暂时不能自动解压",
      toastPrepareImageFailed: "镜像暂时无法自动挂载或解包",
      toastPrepareMissingVolume: "分卷不完整，请补齐后从第一分卷开始",
      toastPrepareDamaged: "压缩包可能损坏或不完整",
      toastRoadmapCopied: "路线清单已复制",
      toastSummaryCopied: "求助摘要已复制",
      toastManifestCopied: "求助包清单已复制",
    },
    labels: {
      project: "项目",
      generated: "生成时间",
      root: "Root",
      files: "Files",
      size: "Size",
      status: "Status",
      mode: "Mode",
      modeDetail: "Mode detail",
      riskFindings: "Risk findings",
      assistantLanguage: "Assistant language",
      launchCandidates: "Launch candidates",
      launchProfiles: "Launch profiles",
      launchFailure: "启动失败跟进",
      launchFailureSymptoms: "失败现象",
      launchFailureNote: "补充说明",
      nextRoadmap: "Next-step roadmap",
      environmentChecks: "Environment checks",
      errorRecipes: "Error recipes",
      engineClues: "Engine and structure clues",
      findings: "Findings",
      packages: "Archives and disc images",
      assetMap: "Asset map",
      errorText: "Error text",
      summary: "Summary",
      detail: "Detail",
      action: "Action",
      evidence: "Evidence",
      step: "Step",
      workdir: "Workdir",
      command: "Command",
      noLaunch: "No launch candidates found.",
      noProfiles: "No launch profiles generated.",
      noErrorText: "No error text provided.",
      noErrorRecipe: "No known error recipe matched.",
      noEngine: "No obvious engine markers found.",
      noPackages: "No archives or disc images found.",
      privacy: "隐私说明",
      mainNotices: "主要提示",
      route: "路线图",
      supportFile: "求助包",
      recommendedEntry: "推荐入口",
      environmentConclusion: "环境结论",
      nextStep: "下一步",
      recipeResult: "报错配方",
      noBlockers: "暂无明显阻断项。",
      privacyMetadata: "求助包只包含诊断元数据，不包含游戏文件或文件内容。",
      privacyPaths: "文件路径为相对路径，桌面绝对路径已省略。",
      privacyZip: "包/镜像预检只读取本地目录或介质元数据；解压或挂载需要你明确点击准备动作。",
    },
  },
  en: {
    name: "English",
    reportTitle: "GalAid diagnosis report",
    checklistTitle: "GalAid next-step checklist",
    supportTitle: "GalAid support summary",
    supportBundleTitle: "GalAid support bundle",
    ui: {
      documentTitle: "GalAid - VN launch doctor",
      brandSubtitle: "VN launch doctor",
      dropTitle: "Drop a game folder",
      dropHint: "or choose a folder / archive / disc image",
      chooseFolder: "Choose folder",
      chooseFiles: "Choose files",
      sampleGame: "Game sample",
      sampleCommercial: "Proprietary sample",
      samplePackage: "Package sample",
      clear: "Clear",
      errorLabel: "Error text",
      errorPlaceholder: "Paste an error such as d3dx9_43.dll, mojibake, RTP, VCRUNTIME...",
      copyReport: "Copy report",
      downloadReport: "Download report",
      downloadBundle: "Download support bundle",
      languageLabel: "Interface / diagnosis language",
      privacyTitle: "Local only.",
      privacyBody: "The browser reads file names, paths, and sizes only. It never uploads game content.",
      eyebrow: "Diagnosis",
      waitingTitle: "Waiting for input",
      importedFiles: "Imported files",
      selectedFiles: "{count} selected files",
      moreRoots: "{name} + {count} more",
      noData: "No data",
      scanning: "Scanning",
      summaryFiles: "files",
      summaryEngine: "engine clues",
      summaryAssets: "assets",
      summaryRisks: "risks",
      ready: "Ready",
      noFolder: "No folder selected.",
      tabLaunch: "Launch",
      tabRoadmap: "Roadmap",
      tabProfiles: "Profiles",
      tabEnvironment: "Environment",
      tabErrors: "Errors",
      tabPackages: "Packages",
      tabEngine: "Engine/structure",
      tabAssets: "Assets",
      tabSupport: "Support",
      tabReport: "Report",
      emptyTitle: "Drop a game folder first",
      emptyBody: "GalAid analyzes launch files, engine/structure clues, archives/images, path risks, and asset categories locally.",
      launchCandidates: "Launch candidates",
      diagnosisFindings: "Diagnosis findings",
      evidenceTitle: "Evidence",
      whyMatched: "Why it matched",
      nextStepLabel: "Next step",
      launchTemplatesTitle: "Optional launch templates",
      copyTemplate: "Copy template",
      localeEmulatorTemplateDescription: "Use only with a trusted local Locale Emulator install; replace LEProc.exe with your own launcher path if needed.",
      wineJaTemplateDescription: "For advanced Linux users with Wine and Japanese locale support already installed.",
      protonRunTemplateDescription: "For advanced Proton setups; replace the compatdata path with your own local Steam prefix.",
      launchFailureTitle: "Did launch fail?",
      launchFailureBody: "GalAid does not monitor the game process. It only records symptoms you manually choose or paste, then updates the roadmap and support bundle.",
      launchFailureSymptomsTitle: "Failure symptoms",
      launchFailureNoteLabel: "Error or extra note",
      launchFailureNotePlaceholder: "Paste a dialog/log, or write notes like \"nothing happened\" or \"black screen with audio\"...",
      launchFailureEmptyState: "No launch-failure symptoms recorded yet.",
      launchFailureEvidenceReady: "{count} symptoms recorded",
      applyFailureFollowup: "Update roadmap",
      clearFailureFollowup: "Clear follow-up",
      launchAttemptTitle: "Did it launch?",
      launchAttemptBody: "GalAid recorded this launch attempt. If the game did not open normally, choose a symptom below to update the roadmap and support bundle.",
      launchAttemptOk: "It opened normally",
      launchAttemptDismissed: "Marked as opened normally",
      launchAttemptMarked: "Launch symptom recorded",
      unmountImage: "Unmount image",
      unmountingImage: "Unmounting...",
      mountedImageReady: "Current scan came from a mounted image: {drive}",
      mountedImageUnmounted: "Image unmounted",
      preparedHandoffTitle: "Prepared and rescanned",
      preparedHandoffReadyBody: "GalAid prepared {target} from {source}. Try {entry} first.",
      preparedHandoffNoLaunchBody: "GalAid prepared {target} from {source}, but no trusted launch entry was found yet. Review the findings below or drop the installed game folder back into GalAid.",
      preparedRecommendedEntry: "Recommended entry",
      noLaunchTitle: "No launch candidate",
      noLaunchBody: "Try again with the fully extracted game root folder.",
      items: "items",
      findings: "findings",
      largeModeReportNote: "This page shows key samples only; the report still uses the full file list.",
      roadmapTitle: "Next-step roadmap",
      steps: "steps",
      copyRoadmap: "Copy roadmap checklist",
      blockedCount: "blocked",
      todoCount: "suggested",
      readyCount: "ready",
      infoCount: "reference",
      profilesTitle: "Launch profiles",
      profiles: "profiles",
      noProfilesTitle: "No launch profile yet",
      noProfilesBody: "There is no trusted launcher yet. Handle archives/images first, or retry with the fully extracted game folder.",
      safeModeTitle: "Safe mode",
      safeModeBody: "GalAid generates profiles and commands by default. In the desktop app, a deliberate click can launch local .exe/.com entries with the correct working directory. Reports and the page keep relative paths by default.",
      entryLabel: "entry",
      workdirLabel: "workdir",
      desktopPathReady: "desktop path ready",
      relativePathOnly: "relative path only",
      launchNow: "Launch",
      launching: "Launching...",
      launchUnavailable: "Desktop only",
      launchUnsupported: "Windows .exe/.com only",
      createShortcut: "Create shortcut",
      creatingShortcut: "Creating...",
      launchHistoryTitle: "Recent launches",
      noLaunchHistoryTitle: "No launch history yet",
      noLaunchHistoryBody: "After the desktop app launches a trusted entry, recent files will appear here.",
      launchedAt: "Launched",
      copyCommand: "Copy command",
      copyJson: "Copy JSON",
      downloadConfig: "Download config",
      environmentTitle: "Environment checks",
      checks: "checks",
      environmentCountsLabel: "environment check counts",
      ok: "OK",
      suggestions: "suggestions",
      blockers: "blockers",
      observations: "observations",
      errorsTitle: "Error diagnosis",
      recipes: "recipes",
      matches: "matches",
      noErrorTextTitle: "No error text yet",
      noErrorTextBody: "No error text is available. If launch fails, paste the dialog or log text on the left to diagnose again.",
      noRecipeTitle: "No known recipe matched",
      noRecipeBody: "This error text is kept in the report and can become material for a future community recipe.",
      errorRecipeCountsLabel: "error recipe counts",
      recipeCoverageTitle: "Recipe coverage",
      rules: "rules",
      engineTitle: "Engine/file-structure clues",
      matchesLabel: "matches",
      noEngineTitle: "No clear structure clues",
      noEngineBody: "You can keep checking launch candidates. This may also mean only a patch/archive was selected, or the full game root is needed.",
      scoreLabel: "score",
      startupStructure: "startup structure",
      packagesTitle: "Archive/image detection",
      packageResultsTitle: "Detected groups",
      groups: "groups",
      noPackagesTitle: "No archives or images",
      noPackagesBody: "These files look like an extracted folder, so the launch page is the next stop.",
      zipPreview: "ZIP directory preflight",
      packagePreview: "Package/image preflight",
      preparePackage: "Extract and rescan",
      prepareImage: "Mount/extract and rescan",
      preparingPackage: "Extracting...",
      preparingImage: "Preparing image...",
      preparePasswordPrompt: "This package may need an extraction password. Enter the password you already have; leave blank to cancel.",
      preparePasswordRetryPrompt: "The password is missing or incorrect. Enter the extraction password again; leave blank to cancel.",
      metadataOnly: "metadata only",
      unavailable: "unavailable",
      internalFiles: "internal files",
      imageFiles: "image files",
      launchClues: "launch clues",
      installerClues: "installer clues",
      truncated: "truncated",
      assetsTitle: "Asset map",
      samplePathsTitle: "Sample paths",
      localManifest: "local manifest",
      noAssetsTitle: "No asset clues",
      noAssetsBody: "Only a launcher or archive may have been imported.",
      supportBundle: "Support bundle",
      supportSummaryBody: "Good for GitHub issues, forums, or chat support. It contains diagnosis metadata only, never game files.",
      copySupportSummary: "Copy support summary",
      copyManifest: "Copy manifest JSON",
      downloadSupportBundle: "Download support bundle",
      privacyBoundary: "Privacy boundary",
      noGameFiles: "No game files",
      noFileContents: "No file contents",
      zipMetadataOnly: "Package/image metadata only",
      relativePaths: "Relative paths only",
      noUpload: "No uploads",
      diagnosisSummary: "Diagnosis summary",
      includedFiles: "Included files",
      exportLimitNote: "The file manifest exports up to {count} relative paths; if exceeded, file-manifest.json is marked truncated.",
      copyableSummary: "Copyable summary",
      issueReady: "issue-ready",
      noBlockersTitle: "No obvious blockers",
      noBlockersBody: "Try the recommended launch profile first. If it fails, add the error text and diagnose again.",
      statusStat: "status",
      filesStat: "files",
      recipesStat: "recipes",
      checksStat: "checks",
      scanDesktop: "Desktop scan",
      scanFiles: "Scanning files",
      scanDroppedFolder: "Scanning dropped folder",
      scanReadingMetadata: "Reading {source} metadata...",
      scanFolderSource: "folder",
      scanFilesSource: "selected files",
      scanFilesIndexed: "{done} / {total} files indexed",
      scanFilesIndexedSolo: "{done} files indexed",
      scanFilesSkipped: "{count} skipped",
      scanChooseFolder: "Choose a folder to scan...",
      scanChooseFiles: "Choose files to scan...",
      scanNoSelection: "No desktop selection made.",
      scanAnalyzing: "Analyzing metadata",
      scanQueued: "{count} files queued",
      scanWalkingTree: "Walking folder tree...",
      toastDesktopScanFailed: "Desktop scan failed",
      toastNoReport: "No report yet",
      toastReportCopied: "Report copied",
      toastNoDiagnosis: "No diagnosis to export yet",
      toastSupportCreated: "Support bundle created",
      toastDesktopCommandCopied: "Desktop command copied",
      toastRelativeCommandCopied: "Relative command copied",
      toastTemplateCopied: "Launch template copied",
      toastFailureUpdated: "Launch follow-up updated",
      toastFailureCleared: "Launch follow-up cleared",
      toastProfileJsonCopied: "Profile JSON copied",
      toastLaunchStarted: "Launched {name}",
      toastLaunchUnavailable: "Direct launch is unavailable here",
      toastLaunchFailed: "Launch failed",
      toastImageUnmounted: "Unmounted image: {name}",
      toastImageUnmountFailed: "Image unmount failed",
      toastShortcutCreated: "Shortcut created: {name}",
      toastShortcutFailed: "Shortcut creation failed",
      toastPackagePrepared: "Prepared and rescanned: {name}",
      toastPrepareFailed: "Package preparation failed",
      toastPrepareToolMissing: "A bundled or local 7z-compatible extractor is needed to prepare this package",
      toastPrepareUnsupported: "This package type cannot be extracted automatically yet",
      toastPrepareImageFailed: "This image could not be mounted or extracted automatically",
      toastPrepareMissingVolume: "A split volume is missing; start from the first volume after collecting all parts",
      toastPrepareDamaged: "The package may be damaged or incomplete",
      toastRoadmapCopied: "Roadmap checklist copied",
      toastSummaryCopied: "Support summary copied",
      toastManifestCopied: "Support manifest copied",
    },
    labels: {
      project: "Project",
      generated: "Generated",
      root: "Root",
      files: "Files",
      size: "Size",
      status: "Status",
      mode: "Mode",
      modeDetail: "Mode detail",
      riskFindings: "Risk findings",
      assistantLanguage: "Assistant language",
      launchCandidates: "Launch candidates",
      launchProfiles: "Launch profiles",
      launchFailure: "Launch failure follow-up",
      launchFailureSymptoms: "Failure symptoms",
      launchFailureNote: "Extra note",
      nextRoadmap: "Next-step roadmap",
      environmentChecks: "Environment checks",
      errorRecipes: "Error recipes",
      engineClues: "Engine and structure clues",
      findings: "Findings",
      packages: "Archives and disc images",
      assetMap: "Asset map",
      errorText: "Error text",
      summary: "Summary",
      detail: "Detail",
      action: "Action",
      evidence: "Evidence",
      step: "Step",
      workdir: "Workdir",
      command: "Command",
      noLaunch: "No launch candidates found.",
      noProfiles: "No launch profiles generated.",
      noErrorText: "No error text provided.",
      noErrorRecipe: "No known error recipe matched.",
      noEngine: "No obvious engine or structure markers found.",
      noPackages: "No archives or disc images found.",
      privacy: "Privacy",
      mainNotices: "Main notices",
      route: "Roadmap",
      supportFile: "Support bundle",
      recommendedEntry: "Recommended entry",
      environmentConclusion: "Environment conclusion",
      nextStep: "Next step",
      recipeResult: "Error recipes",
      noBlockers: "No obvious blockers.",
      privacyMetadata: "The support bundle contains diagnosis metadata only, not game files or file contents.",
      privacyPaths: "Paths are relative; desktop absolute paths are omitted.",
      privacyZip: "Package/image preflight reads local directory or media metadata only; extraction or mounting requires an explicit prepare action.",
    },
  },
  ja: {
    name: "日本語",
    reportTitle: "GalAid 診断レポート",
    checklistTitle: "GalAid 次の手順チェックリスト",
    supportTitle: "GalAid サポート概要",
    supportBundleTitle: "GalAid サポートバンドル",
    ui: {
      documentTitle: "GalAid - VN 起動診断",
      brandSubtitle: "VN 起動診断",
      dropTitle: "ゲームフォルダをドロップ",
      dropHint: "またはフォルダ / アーカイブ / ディスクイメージを選択",
      chooseFolder: "フォルダを選択",
      chooseFiles: "ファイルを選択",
      sampleGame: "ゲーム例",
      sampleCommercial: "自社エンジン例",
      samplePackage: "パッケージ例",
      clear: "クリア",
      errorLabel: "エラー本文",
      errorPlaceholder: "d3dx9_43.dll、文字化け、RTP、VCRUNTIME などのエラーを貼り付けます...",
      copyReport: "レポートをコピー",
      downloadReport: "レポートを保存",
      downloadBundle: "サポートバンドルを保存",
      languageLabel: "UI / 診断言語",
      privacyTitle: "Local only.",
      privacyBody: "ブラウザはファイル名、パス、サイズだけを読み取り、ゲーム内容はアップロードしません。",
      eyebrow: "診断",
      waitingTitle: "入力待ち",
      importedFiles: "インポート済みファイル",
      selectedFiles: "{count} 件のファイル",
      moreRoots: "{name} + 他 {count} 件",
      noData: "データなし",
      scanning: "スキャン中",
      summaryFiles: "ファイル",
      summaryEngine: "エンジン手がかり",
      summaryAssets: "アセット",
      summaryRisks: "リスク",
      ready: "準備完了",
      noFolder: "フォルダ未選択。",
      tabLaunch: "起動",
      tabRoadmap: "手順",
      tabProfiles: "設定",
      tabEnvironment: "環境",
      tabErrors: "エラー",
      tabPackages: "パッケージ",
      tabEngine: "エンジン/構造",
      tabAssets: "アセット",
      tabSupport: "サポート",
      tabReport: "レポート",
      emptyTitle: "まずゲームフォルダを入れてください",
      emptyBody: "GalAid は起動ファイル、エンジン/構造の手がかり、アーカイブ/イメージ、パスのリスク、アセット分類をローカルで分析します。",
      launchCandidates: "起動候補",
      diagnosisFindings: "診断結果",
      evidenceTitle: "根拠",
      whyMatched: "一致理由",
      nextStepLabel: "次の手順",
      launchTemplatesTitle: "任意の起動テンプレート",
      copyTemplate: "テンプレートをコピー",
      localeEmulatorTemplateDescription: "信頼できるローカルの Locale Emulator がある場合のみ使用します。必要に応じて LEProc.exe を自分のランチャーパスに置き換えてください。",
      wineJaTemplateDescription: "Wine と日本語 locale を設定済みの Linux 上級者向けの参考テンプレートです。",
      protonRunTemplateDescription: "Proton / Steam Deck の上級設定向けです。compatdata パスは自分の Steam prefix に置き換えてください。",
      launchFailureTitle: "起動に失敗しましたか？",
      launchFailureBody: "GalAid はゲームプロセスを監視しません。手動で選択または貼り付けた症状だけを記録し、手順とサポートバンドルに反映します。",
      launchFailureSymptomsTitle: "失敗症状",
      launchFailureNoteLabel: "エラーまたは補足",
      launchFailureNotePlaceholder: "ダイアログ/ログ、または「反応なし」「音は出るが黒画面」などを貼り付けてください...",
      launchFailureEmptyState: "起動失敗の症状はまだ記録されていません。",
      launchFailureEvidenceReady: "{count} 件の症状を記録済み",
      applyFailureFollowup: "手順を更新",
      clearFailureFollowup: "フォローを消去",
      launchAttemptTitle: "起動しましたか？",
      launchAttemptBody: "GalAid はこの起動操作を記録しました。正常に開かなかった場合は、下の症状を選ぶと手順とサポートバンドルを更新します。",
      launchAttemptOk: "正常に開いた",
      launchAttemptDismissed: "正常起動として記録しました",
      launchAttemptMarked: "起動症状を記録しました",
      unmountImage: "イメージをアンマウント",
      unmountingImage: "アンマウント中...",
      mountedImageReady: "現在のスキャン元はマウント済みイメージです: {drive}",
      mountedImageUnmounted: "イメージをアンマウントしました",
      preparedHandoffTitle: "準備と再スキャンが完了",
      preparedHandoffReadyBody: "{source} から {target} を準備して再スキャンしました。まず {entry} を試してください。",
      preparedHandoffNoLaunchBody: "{source} から {target} を準備して再スキャンしましたが、信頼できる起動入口はまだ見つかっていません。下の診断結果を確認するか、インストール後の完全なゲームフォルダをもう一度投入してください。",
      preparedRecommendedEntry: "推奨起動ファイル",
      noLaunchTitle: "起動候補なし",
      noLaunchBody: "完全に展開されたゲームのルートフォルダで再試行してください。",
      items: "件",
      findings: "件",
      largeModeReportNote: "この画面には主要サンプルだけを表示します。レポートは完全なファイル一覧を使用します。",
      roadmapTitle: "次の手順",
      steps: "手順",
      copyRoadmap: "手順チェックリストをコピー",
      blockedCount: "先に対応",
      todoCount: "推奨",
      readyCount: "実行可能",
      infoCount: "参考",
      profilesTitle: "起動設定",
      profiles: "設定",
      noProfilesTitle: "起動設定はまだ生成できません",
      noProfilesBody: "信頼できる起動ファイルがありません。先にアーカイブ/イメージを処理するか、展開済みゲームフォルダで再試行してください。",
      safeModeTitle: "安全モード",
      safeModeBody: "GalAid は既定では設定とコマンドを生成します。デスクトップ版では、明示的にクリックした場合だけ、正しい作業フォルダでローカルの .exe/.com を起動できます。レポートと画面は既定で相対パスを保持します。",
      entryLabel: "入口",
      workdirLabel: "作業フォルダ",
      desktopPathReady: "デスクトップパスあり",
      relativePathOnly: "相対パスのみ",
      launchNow: "起動",
      launching: "起動中...",
      launchUnavailable: "デスクトップ版のみ",
      launchUnsupported: "Windows .exe/.com のみ",
      createShortcut: "ショートカット作成",
      creatingShortcut: "作成中...",
      launchHistoryTitle: "最近の起動",
      noLaunchHistoryTitle: "起動履歴はまだありません",
      noLaunchHistoryBody: "デスクトップ版で信頼済みの入口を起動すると、最近使ったファイルがここに表示されます。",
      launchedAt: "起動日時",
      copyCommand: "コマンドをコピー",
      copyJson: "JSON をコピー",
      downloadConfig: "設定を保存",
      environmentTitle: "環境チェック",
      checks: "チェック",
      environmentCountsLabel: "environment check counts",
      ok: "OK",
      suggestions: "推奨",
      blockers: "阻害",
      observations: "確認",
      errorsTitle: "エラー診断",
      recipes: "レシピ",
      matches: "一致",
      noErrorTextTitle: "エラー本文はまだありません",
      noErrorTextBody: "現在エラー本文はありません。起動に失敗したら、左側にダイアログやログを貼り付けると再診断できます。",
      noRecipeTitle: "既知レシピに一致しません",
      noRecipeBody: "このエラー本文はレポートに保存され、今後のコミュニティレシピ追加に使えます。",
      errorRecipeCountsLabel: "error recipe counts",
      recipeCoverageTitle: "レシピ対応範囲",
      rules: "ルール",
      engineTitle: "エンジン/ファイル構造の手がかり",
      matchesLabel: "一致",
      noEngineTitle: "明確な構造の手がかりなし",
      noEngineBody: "起動候補の確認を続けられます。パッチやアーカイブだけを選んだ場合、または完全なゲームルートが必要な場合もあります。",
      scoreLabel: "score",
      startupStructure: "起動構造",
      packagesTitle: "アーカイブ/イメージ判定",
      packageResultsTitle: "判定結果",
      groups: "グループ",
      noPackagesTitle: "アーカイブやイメージなし",
      noPackagesBody: "展開済みフォルダに見えるため、次は起動画面を確認してください。",
      zipPreview: "ZIP ディレクトリ事前チェック",
      packagePreview: "パッケージ/イメージ事前チェック",
      preparePackage: "展開して再スキャン",
      prepareImage: "マウント/展開して再スキャン",
      preparingPackage: "展開中...",
      preparingImage: "イメージ処理中...",
      preparePasswordPrompt: "このパッケージは展開パスワードが必要な可能性があります。既に知っているパスワードを入力してください。空欄ならキャンセルします。",
      preparePasswordRetryPrompt: "パスワードが不足しているか正しくありません。展開パスワードをもう一度入力してください。空欄ならキャンセルします。",
      metadataOnly: "メタデータのみ",
      unavailable: "利用不可",
      internalFiles: "内部ファイル",
      imageFiles: "イメージファイル",
      launchClues: "起動手がかり",
      installerClues: "インストーラー手がかり",
      truncated: "切り詰め",
      assetsTitle: "アセットマップ",
      samplePathsTitle: "サンプルパス",
      localManifest: "ローカル一覧",
      noAssetsTitle: "アセットの手がかりなし",
      noAssetsBody: "起動ファイルまたはアーカイブだけがインポートされた可能性があります。",
      supportBundle: "サポートバンドル",
      supportSummaryBody: "issue、フォーラム、チャット相談向けです。診断メタデータだけを含み、ゲームファイルは含みません。",
      copySupportSummary: "サポート概要をコピー",
      copyManifest: "マニフェスト JSON をコピー",
      downloadSupportBundle: "サポートバンドルを保存",
      privacyBoundary: "プライバシー範囲",
      noGameFiles: "ゲームファイルなし",
      noFileContents: "ファイル内容なし",
      zipMetadataOnly: "パッケージ/イメージはメタデータのみ",
      relativePaths: "相対パスのみ",
      noUpload: "アップロードなし",
      diagnosisSummary: "診断概要",
      includedFiles: "含まれるファイル",
      exportLimitNote: "ファイル一覧は最大 {count} 件の相対パスを出力します。超過時は file-manifest.json に truncated と記録されます。",
      copyableSummary: "コピー用概要",
      issueReady: "issue-ready",
      noBlockersTitle: "明確な阻害要因なし",
      noBlockersBody: "まず推奨起動設定を試してください。失敗した場合はエラー本文を追加して再診断します。",
      statusStat: "状態",
      filesStat: "ファイル",
      recipesStat: "レシピ",
      checksStat: "チェック",
      scanDesktop: "デスクトップスキャン",
      scanFiles: "ファイルをスキャン中",
      scanDroppedFolder: "ドロップされたフォルダをスキャン中",
      scanReadingMetadata: "{source} のメタデータを読み取り中...",
      scanFolderSource: "フォルダ",
      scanFilesSource: "選択ファイル",
      scanFilesIndexed: "{done} / {total} 件を取得",
      scanFilesIndexedSolo: "{done} 件を取得",
      scanFilesSkipped: "{count} 件をスキップ",
      scanChooseFolder: "スキャンするフォルダを選択...",
      scanChooseFiles: "スキャンするファイルを選択...",
      scanNoSelection: "デスクトップ選択はありません。",
      scanAnalyzing: "メタデータを分析中",
      scanQueued: "{count} 件のファイルを処理待ち",
      scanWalkingTree: "フォルダツリーを読み取り中...",
      toastDesktopScanFailed: "デスクトップスキャンに失敗しました",
      toastNoReport: "レポートはまだありません",
      toastReportCopied: "レポートをコピーしました",
      toastNoDiagnosis: "エクスポートできる診断はまだありません",
      toastSupportCreated: "サポートバンドルを作成しました",
      toastDesktopCommandCopied: "デスクトップ用コマンドをコピーしました",
      toastRelativeCommandCopied: "相対パスコマンドをコピーしました",
      toastTemplateCopied: "起動テンプレートをコピーしました",
      toastFailureUpdated: "起動失敗フォローを更新しました",
      toastFailureCleared: "起動失敗フォローを消去しました",
      toastProfileJsonCopied: "設定 JSON をコピーしました",
      toastLaunchStarted: "{name} を起動しました",
      toastLaunchUnavailable: "ここでは直接起動できません",
      toastLaunchFailed: "起動に失敗しました",
      toastImageUnmounted: "イメージをアンマウントしました: {name}",
      toastImageUnmountFailed: "イメージのアンマウントに失敗しました",
      toastShortcutCreated: "ショートカットを作成しました: {name}",
      toastShortcutFailed: "ショートカット作成に失敗しました",
      toastPackagePrepared: "準備して再スキャンしました: {name}",
      toastPrepareFailed: "パッケージ準備に失敗しました",
      toastPrepareToolMissing: "このパッケージの準備には同梱またはローカルの 7z 互換ツールが必要です",
      toastPrepareUnsupported: "この種類はまだ自動展開できません",
      toastPrepareImageFailed: "このイメージはまだ自動マウント/展開できません",
      toastPrepareMissingVolume: "分割ボリュームが不足しています。すべて揃えて最初のボリュームから開始してください",
      toastPrepareDamaged: "パッケージが破損または不完全な可能性があります",
      toastRoadmapCopied: "手順チェックリストをコピーしました",
      toastSummaryCopied: "サポート概要をコピーしました",
      toastManifestCopied: "サポートマニフェストをコピーしました",
    },
    labels: {
      project: "プロジェクト",
      generated: "生成日時",
      root: "ルート",
      files: "ファイル数",
      size: "サイズ",
      status: "状態",
      mode: "モード",
      modeDetail: "モード詳細",
      riskFindings: "注意点",
      assistantLanguage: "診断言語",
      launchCandidates: "起動候補",
      launchProfiles: "起動プロファイル",
      launchFailure: "起動失敗フォロー",
      launchFailureSymptoms: "失敗症状",
      launchFailureNote: "補足",
      nextRoadmap: "次の手順",
      environmentChecks: "環境チェック",
      errorRecipes: "エラーレシピ",
      engineClues: "エンジン/構造の手がかり",
      findings: "診断メモ",
      packages: "アーカイブとディスクイメージ",
      assetMap: "アセット概要",
      errorText: "エラー本文",
      summary: "概要",
      detail: "詳細",
      action: "対応",
      evidence: "根拠",
      step: "手順",
      workdir: "作業フォルダ",
      command: "コマンド",
      noLaunch: "起動候補は見つかりませんでした。",
      noProfiles: "起動プロファイルは生成されませんでした。",
      noErrorText: "エラー本文は入力されていません。",
      noErrorRecipe: "既知のエラーレシピには一致しませんでした。",
      noEngine: "明確なエンジン/構造の手がかりは見つかりませんでした。",
      noPackages: "アーカイブやディスクイメージは見つかりませんでした。",
      privacy: "プライバシー",
      mainNotices: "主な注意点",
      route: "手順",
      supportFile: "サポートバンドル",
      recommendedEntry: "推奨起動ファイル",
      environmentConclusion: "環境チェック結果",
      nextStep: "次の手順",
      recipeResult: "エラーレシピ",
      noBlockers: "明確な阻害要因はありません。",
      privacyMetadata: "サポートバンドルには診断メタデータのみが含まれ、ゲームファイルや内容は含まれません。",
      privacyPaths: "パスは相対パスで保存され、デスクトップの絶対パスは省略されます。",
      privacyZip: "パッケージ/イメージ事前チェックはローカルのディレクトリまたは媒体メタデータのみを読み取ります。展開やマウントには明示的な準備操作が必要です。",
    },
  },
};

const SAMPLE_FILES = [
  ["SakuraTrial/game.exe", 1422000],
  ["SakuraTrial/data.xp3", 423000000],
  ["SakuraTrial/patch.xp3", 59000000],
  ["SakuraTrial/plugin/AlphaMovie.dll", 480000],
  ["SakuraTrial/startup.tjs", 2200],
  ["SakuraTrial/system/Config.tjs", 4100],
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

const COMMERCIAL_SAMPLE_FILES = [
  ["AsterCompanyGame/AsterTrial.exe", 1820000],
  ["AsterCompanyGame/MovieRuntime.dll", 520000],
  ["AsterCompanyGame/AudioDevice.dll", 430000],
  ["AsterCompanyGame/data00.arc", 1380000000],
  ["AsterCompanyGame/data01.arc", 824000000],
  ["AsterCompanyGame/data02.pak", 712000000],
  ["AsterCompanyGame/voice.pck", 356000000],
  ["AsterCompanyGame/movie.cpk", 604000000],
  ["AsterCompanyGame/patch.pac", 99000000],
  ["AsterCompanyGame/archive.vol", 154000000],
  ["AsterCompanyGame/system.dat", 4800000],
  ["AsterCompanyGame/boot.ini", 3400],
  ["AsterCompanyGame/config.cfg", 1800],
  ["AsterCompanyGame/plugin/movie.dll", 520000],
  ["AsterCompanyGame/plugin/audio.dll", 430000],
  ["AsterCompanyGame/save/readme.txt", 1400],
  ["AsterCompanyGame/bgm/theme01.ogg", 7100000],
  ["AsterCompanyGame/manual/startup.txt", 2400],
];

const PACKAGE_SAMPLE_FILES = [
  [
    "SnowTrial.zip",
    3870000000,
    {
      archivePreview: {
        schema: "galaid.archivePreview.v1",
        format: "ZIP",
        status: "ok",
        totalEntries: 128,
        scannedEntries: 128,
        fileCount: 114,
        directoryCount: 14,
        encryptedEntries: 0,
        truncated: false,
        warnings: [],
        sampleFiles: [
          { path: "SnowTrial/Game.exe", name: "Game.exe", ext: "exe", size: 1422000, compressedSize: 980000, depth: 1 },
          { path: "SnowTrial/data.xp3", name: "data.xp3", ext: "xp3", size: 423000000, compressedSize: 386000000, depth: 1 },
          { path: "SnowTrial/scenario/common.ks", name: "common.ks", ext: "ks", size: 33000, compressedSize: 12000, depth: 2 },
          { path: "SnowTrial/BGM/theme01.ogg", name: "theme01.ogg", ext: "ogg", size: 6920000, compressedSize: 6510000, depth: 2 },
        ],
        signals: {
          launchCandidateCount: 1,
          launchSamples: ["SnowTrial/Game.exe"],
          installerCount: 0,
          installerSamples: [],
          engineHints: [{ id: "kirikiri", name: "KiriKiri / 吉里吉里", count: 2, samples: ["SnowTrial/data.xp3", "SnowTrial/scenario/common.ks"] }],
          assetCounts: {
            images: 18,
            audio: 12,
            video: 0,
            scripts: 24,
            resourceArchives: 2,
            commercialArchives: 0,
          },
        },
      },
    },
  ],
  [
    "MoonlightCafe.part1.rar",
    2147483648,
    {
      archivePreview: {
        schema: "galaid.archivePreview.v1",
        format: "RAR",
        packageKind: "archive",
        status: "ok",
        totalEntries: 86,
        scannedEntries: 86,
        fileCount: 79,
        directoryCount: 7,
        encryptedEntries: 0,
        truncated: false,
        warnings: ["Listed with a local 7z-compatible command; no files were extracted."],
        sampleFiles: [
          { path: "MoonlightCafe/Game.exe", name: "Game.exe", ext: "exe", size: 1680000, compressedSize: 910000, depth: 1 },
          { path: "MoonlightCafe/setup.exe", name: "setup.exe", ext: "exe", size: 2610000, compressedSize: 1800000, depth: 1 },
          { path: "MoonlightCafe/data00.arc", name: "data00.arc", ext: "arc", size: 1380000000, compressedSize: 1200000000, depth: 1 },
          { path: "MoonlightCafe/system.dat", name: "system.dat", ext: "dat", size: 4800000, compressedSize: 2800000, depth: 1 },
        ],
        signals: {
          launchCandidateCount: 1,
          launchSamples: ["MoonlightCafe/Game.exe"],
          installerCount: 1,
          installerSamples: ["MoonlightCafe/setup.exe"],
          engineHints: [{ id: "commercial-proprietary", name: "商业/自研引擎（文件结构）", count: 2, samples: ["MoonlightCafe/Game.exe", "MoonlightCafe/data00.arc"] }],
          assetCounts: {
            images: 0,
            audio: 0,
            video: 0,
            scripts: 1,
            resourceArchives: 2,
            commercialArchives: 2,
          },
        },
      },
    },
  ],
  ["MoonlightCafe.part2.rar", 2147483648],
  ["MoonlightCafe.part3.rar", 913000000],
  ["MoonlightCafe_readme.txt", 2400],
  [
    "MoonlightCafe_Bonus.iso",
    4810000000,
    {
      archivePreview: {
        schema: "galaid.archivePreview.v1",
        format: "ISO disc image",
        packageKind: "disc-image",
        status: "ok",
        totalEntries: 1,
        scannedEntries: 1,
        fileCount: 1,
        directoryCount: 0,
        encryptedEntries: 0,
        truncated: false,
        warnings: ["Disc image metadata only; use the desktop prepare action to mount or extract and rescan when available."],
        sampleFiles: [{ path: "MoonlightCafe_Bonus.iso", name: "MoonlightCafe_Bonus.iso", ext: "iso", size: 4810000000, compressedSize: 4810000000, depth: 0 }],
        signals: {
          launchCandidateCount: 0,
          launchSamples: [],
          installerCount: 0,
          installerSamples: [],
          engineHints: [],
          assetCounts: {
            images: 0,
            audio: 0,
            video: 0,
            scripts: 0,
            resourceArchives: 0,
            commercialArchives: 0,
          },
        },
      },
    },
  ],
  ["OldVN_Disc2.cue", 1200],
  ["OldVN_Disc2.bin", 734000000],
];

let currentFiles = [];
let currentAnalysis = null;
let scanRunId = 0;
let desktopLaunchHistory = [];
let launchFailureState = getEmptyLaunchFailureState();
let pendingLaunchFollowup = null;
const desktopApi = window.galaidDesktop || null;

assistantLanguageSelect.value = getStoredAssistantLanguage();

function getAssistantLanguage() {
  const value = assistantLanguageSelect?.value || getStoredAssistantLanguage();
  return ASSISTANT_LANGUAGE_PACKS[value] ? value : "zh-CN";
}

function getAssistantPack(language = getAssistantLanguage()) {
  return ASSISTANT_LANGUAGE_PACKS[language] || ASSISTANT_LANGUAGE_PACKS["zh-CN"];
}

function getStoredAssistantLanguage() {
  try {
    const stored = window.localStorage?.getItem(ASSISTANT_LANGUAGE_STORAGE_KEY);
    return ASSISTANT_LANGUAGE_PACKS[stored] ? stored : "zh-CN";
  } catch {
    return "zh-CN";
  }
}

function getUiText(key, params = {}, language = getAssistantLanguage()) {
  const pack = getAssistantPack(language);
  const fallbackPack = ASSISTANT_LANGUAGE_PACKS["zh-CN"];
  const template = pack.ui?.[key] ?? fallbackPack.ui?.[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (match, name) => {
    return Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match;
  });
}

function applyStaticUiLanguage() {
  const language = getAssistantLanguage();
  const pack = getAssistantPack(language);
  document.documentElement.lang = language;
  document.title = pack.ui?.documentTitle || "GalAid - VN launch doctor";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = getUiText(element.dataset.i18n, {}, language);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", getUiText(element.dataset.i18nPlaceholder, {}, language));
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", getUiText(element.dataset.i18nAriaLabel, {}, language));
  });
}

function getEmptyStateHtml() {
  return `
    <div class="empty-state">
      <div class="empty-glyph" aria-hidden="true"></div>
      <h3>${escapeHtml(getUiText("emptyTitle"))}</h3>
      <p>${escapeHtml(getUiText("emptyBody"))}</p>
    </div>
  `;
}

function getEmptyLaunchFailureState() {
  return { symptoms: [], note: "" };
}

function normalizeLaunchFailureInput(input = {}) {
  const knownIds = new Set(LAUNCH_FAILURE_SYMPTOMS.map((symptom) => symptom.id));
  const symptoms = compactEvidence(
    Array.isArray(input.symptoms) ? input.symptoms.filter((id) => knownIds.has(id)) : [],
    LAUNCH_FAILURE_SYMPTOMS.length,
  );
  const note = String(input.note || "").trim().slice(0, 4000);
  return {
    schema: "galaid.launchFailure.v1",
    hasEvidence: Boolean(symptoms.length || note),
    symptoms,
    note,
    diagnosticText: buildLaunchFailureDiagnosticText(symptoms, note),
  };
}

function buildLaunchFailureDiagnosticText(symptoms, note) {
  const lines = symptoms
    .map((id) => getLaunchFailureSymptomDefinition(id)?.diagnosticText)
    .filter(Boolean);
  if (note) lines.push(note);
  return lines.join("\n");
}

function getLaunchFailureSymptomDefinition(id) {
  return LAUNCH_FAILURE_SYMPTOMS.find((symptom) => symptom.id === id);
}

function getLaunchFailureSymptomText(id, field, language = getAssistantLanguage()) {
  const definition = getLaunchFailureSymptomDefinition(id);
  return definition?.[field]?.[language] || definition?.[field]?.["zh-CN"] || id;
}

function getLaunchFailureStep(id, language = getAssistantLanguage()) {
  const definition = getLaunchFailureSymptomDefinition(id);
  return definition?.step?.[language] || definition?.step?.["zh-CN"] || null;
}

function getLaunchFailureEvidence(launchFailure, language = getAssistantLanguage()) {
  const symptoms = (launchFailure?.symptoms || []).map((id) => getLaunchFailureSymptomText(id, "label", language));
  const note = launchFailure?.note ? [launchFailure.note] : [];
  return compactEvidence([...symptoms, ...note], 6);
}

function refreshCurrentReport() {
  if (!currentAnalysis) return;
  currentAnalysis.report = buildMarkdownReport(currentAnalysis, errorInput.value, getAssistantLanguage());
}

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

function slugifyFilename(value, fallback = "galaid") {
  const slug = String(value || "")
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || fallback;
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

function fileFromSample([path, size, extra = {}]) {
  const normalized = normalizePath(path);
  const name = getBaseName(normalized);
  return {
    ...extra,
    name,
    path: normalized,
    lowerPath: normalized.toLowerCase(),
    ext: getExt(name),
    size,
    depth: getDepth(normalized),
  };
}

function normalizeFileRecord(file) {
  const normalized = normalizePath(file.path || file.webkitRelativePath || file.relativePath || file.name);
  const name = file.name || getBaseName(normalized);
  return {
    ...file,
    name,
    path: normalized,
    lowerPath: (file.lowerPath || normalized).toLowerCase(),
    ext: file.ext || getExt(name),
    size: file.size || 0,
    depth: typeof file.depth === "number" ? file.depth : getDepth(normalized),
  };
}

function uniqueFiles(files) {
  const seen = new Map();
  for (const rawFile of files) {
    if (!rawFile) continue;
    const file = normalizeFileRecord(rawFile);
    if (!file.path) continue;
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

function analyze(files, errorText = "", launchFailureInput = getEmptyLaunchFailureState()) {
  const roots = getRoots(files);
  const extCounts = countBy(files, (file) => file.ext || "(none)");
  const categories = getCategories(files);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const mode = getAnalysisMode(files.length, totalSize);
  const packages = analyzePackages(files);
  const engines = detectEngines(files);
  const launchCandidates = detectLaunchCandidates(files, engines);
  const profiles = buildLaunchProfiles(launchCandidates, engines, packages);
  const launchFailure = normalizeLaunchFailureInput(launchFailureInput);
  const diagnosticErrorText = combineDiagnosticErrorText(errorText, launchFailure);
  const errorDiagnostics = buildErrorDiagnostics(diagnosticErrorText);
  const environment = buildEnvironmentDiagnostics(files, engines, packages, launchCandidates, diagnosticErrorText, errorDiagnostics, launchFailure);
  const findings = buildFindings(files, roots, engines, launchCandidates, mode, packages, errorDiagnostics, launchFailure);
  const roadmap = buildRoadmap({ packages, launchCandidates, profiles, environment, errorDiagnostics, findings, engines, mode, launchFailure });
  const riskTotal = findings.filter((item) => item.level === "warning" || item.level === "blocker").length;
  const status = getStatus(findings, launchCandidates);

  return {
    files,
    roots,
    extCounts,
    categories,
    totalSize,
    mode,
    packages,
    engines,
    launchCandidates,
    profiles,
    launchFailure,
    errorDiagnostics,
    environment,
    roadmap,
    findings,
    status,
    riskTotal,
    report: "",
  };
}

function combineDiagnosticErrorText(errorText, launchFailure) {
  return [String(errorText || "").trim(), launchFailure?.diagnosticText || ""].filter(Boolean).join("\n");
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

function stripLastExtension(path) {
  return path.replace(/\.[^/.]+$/, "");
}

function getArchiveInfo(file) {
  const lower = file.lowerPath;
  let match = lower.match(/^(.*)\.part(\d+)\.rar$/);
  if (match) {
    const volumeIndex = Number(match[2]);
    return {
      kind: "archive",
      format: "RAR split archive",
      family: match[1],
      volumeIndex,
      role: volumeIndex === 1 ? "start here" : "follow-up volume",
      action: volumeIndex === 1 ? "把所有 .part*.rar 分卷放在同一目录，再从 part1.rar 开始完整解压" : "不要单独打开这个分卷；先和 part1.rar 放在同一目录",
      file,
    };
  }

  match = lower.match(/^(.*)\.(7z|zip)\.(\d{3})$/);
  if (match) {
    const volumeIndex = Number(match[3]);
    return {
      kind: "archive",
      format: `${match[2].toUpperCase()} split archive`,
      family: match[1],
      volumeIndex,
      role: volumeIndex === 1 ? "start here" : "follow-up volume",
      action: volumeIndex === 1 ? `把所有 .${match[2]} 分卷放在同一目录，再从 .${match[2]}.001 开始完整解压` : "不要单独打开这个分卷；先和第一分卷放在同一目录",
      file,
    };
  }

  match = lower.match(/^(.*)\.r(\d{2})$/);
  if (match) {
    return {
      kind: "archive",
      format: "RAR old split archive",
      family: match[1],
      volumeIndex: Number(match[2]) + 2,
      role: "follow-up volume",
      action: "这是旧式 RAR 后续分卷；请和同名 .rar 主分卷放在同一目录后再解压",
      file,
    };
  }

  if (ARCHIVE_EXTS.has(file.ext)) {
    return {
      kind: "archive",
      format: `${file.ext.toUpperCase()} archive`,
      family: stripLastExtension(lower),
      volumeIndex: file.ext === "rar" ? 1 : null,
      role: "single archive or first volume",
      action: "先完整解压到短英文路径，再把解压后的游戏文件夹拖进 GalAid",
      file,
    };
  }

  return null;
}

function getDiscInfo(file) {
  if (!DISC_EXTS.has(file.ext)) return null;
  const ext = file.ext;
  const roleByExt = {
    iso: "standalone image",
    cue: "descriptor, expects .bin",
    bin: "data track, often needs .cue",
    mds: "descriptor, expects .mdf",
    mdf: "data image, often needs .mds",
    ccd: "descriptor, expects .img/.sub",
    img: "raw image data",
    sub: "subchannel data",
    nrg: "standalone Nero image",
    isz: "compressed image",
    cdi: "DiscJuggler image",
  };
  const family = stripLastExtension(file.lowerPath);
  return {
    kind: "disc",
    format: `${ext.toUpperCase()} disc image`,
    family,
    role: roleByExt[ext] || "disc image file",
    action: ext === "iso" || ext === "nrg" || ext === "isz" || ext === "cdi" ? "先挂载或解包镜像，再从虚拟光驱运行安装器或复制完整游戏目录" : "先和配套镜像描述/数据文件放在同一目录，再挂载或解包",
    file,
  };
}

function analyzePackages(files) {
  const archives = files.map(getArchiveInfo).filter(Boolean);
  const discs = files.map(getDiscInfo).filter(Boolean);
  const archiveSets = buildArchiveSets(archives);
  const discSets = buildDiscSets(discs);
  const totalSize = [...archives, ...discs].reduce((sum, item) => sum + item.file.size, 0);
  const recommendations = buildPackageRecommendations(archiveSets, discSets, archives, discs, files);

  return {
    archives,
    discs,
    archiveSets,
    discSets,
    recommendations,
    totalSize,
    hasPackages: archives.length > 0 || discs.length > 0,
  };
}

function buildArchiveSets(archives) {
  const groups = groupBy(archives, (item) => item.family);
  return [...groups.entries()]
    .map(([family, items]) => {
      const sorted = [...items].sort((a, b) => {
        const left = a.volumeIndex || 0;
        const right = b.volumeIndex || 0;
        return left - right || a.file.path.localeCompare(b.file.path);
      });
      const volumeIndexes = sorted.map((item) => item.volumeIndex).filter(Boolean);
      const expected = volumeIndexes.length ? Math.max(...volumeIndexes) : 0;
      const missing = [];
      for (let index = 1; index <= expected; index += 1) {
        if (!volumeIndexes.includes(index)) missing.push(index);
      }
      const first = sorted.find((item) => item.volumeIndex === 1) || sorted[0];
      const isSplit = sorted.length > 1 || sorted.some((item) => item.volumeIndex);
      const archivePreview = getBestArchivePreview(sorted);
      const previewLaunchSample = archivePreview?.signals?.launchSamples?.[0];
      const previewInstallerSample = archivePreview?.signals?.installerSamples?.[0];
      const level = missing.length ? "warning" : archivePreview?.status === "ok" || isSplit ? "good" : "info";
      const summary = archivePreview
        ? summarizeArchivePreview(archivePreview)
        : missing.length
        ? `可能缺少分卷：${missing.join(", ")}`
        : isSplit
          ? "分卷看起来放在一起了"
          : "单个压缩包，网页版不会读取内部目录";
      const nextStep = archivePreview?.status === "ok" && previewLaunchSample
        ? `先完整解压，再优先检查 ${previewLaunchSample}`
        : archivePreview?.status === "ok" && previewInstallerSample
          ? `先完整解压，再检查安装器/介质线索 ${previewInstallerSample}`
        : first.action;

      return {
        family,
        type: "archive",
        format: first.format,
        files: sorted,
        firstFile: first.file,
        missing,
        level,
        summary,
        nextStep,
        archivePreview,
      };
    })
    .sort((a, b) => b.files.length - a.files.length || a.family.localeCompare(b.family));
}

function getBestArchivePreview(items) {
  return items.find((item) => item.file.archivePreview?.status === "ok")?.file.archivePreview || items.find((item) => item.file.archivePreview)?.file.archivePreview || null;
}

function summarizeArchivePreview(preview) {
  if (!preview) return "";
  const label = getPreviewFormatLabel(preview);
  if (preview.status !== "ok") return `${label} 预检不可用：${preview.warnings?.[0] || "无法读取元数据"}`;
  if (preview.packageKind === "disc-image") {
    const pieces = [`${label} 已识别：镜像元数据`];
    if (preview.warnings?.length) pieces.push(preview.warnings[0]);
    return pieces.join("，");
  }
  const pieces = [`${label} 目录已预检：${formatNumber(preview.fileCount || 0)} files`];
  const launchCount = preview.signals?.launchCandidateCount || 0;
  if (launchCount) pieces.push(`${formatNumber(launchCount)} 个解压后启动线索`);
  const installerCount = preview.signals?.installerCount || 0;
  if (installerCount) pieces.push(`${formatNumber(installerCount)} 个安装/介质线索`);
  const engineNames = (preview.signals?.engineHints || []).slice(0, 2).map((hint) => hint.name);
  if (engineNames.length) pieces.push(engineNames.join(" / "));
  if (preview.truncated) pieces.push("结果已截断");
  return pieces.join("，");
}

function getPreviewFormatLabel(preview) {
  return preview?.format || "包/镜像";
}

function buildDiscSets(discs) {
  const groups = groupBy(discs, (item) => item.family);
  const byExt = countBy(discs, (item) => item.file.ext);
  return [...groups.entries()]
    .map(([family, items]) => {
      const sorted = items.sort((a, b) => a.file.path.localeCompare(b.file.path));
      const archivePreview = getBestArchivePreview(sorted);
      const exts = new Set(items.map((item) => item.file.ext));
      let level = "info";
      let format = items[0].format;
      let summary = archivePreview ? summarizeArchivePreview(archivePreview) : "镜像文件已识别";
      let nextStep = "先挂载或解包镜像，再运行镜像内的安装器或复制完整游戏目录";

      if (exts.has("cue") && exts.has("bin")) {
        format = "CUE/BIN disc image";
      } else if (exts.has("mds") && exts.has("mdf")) {
        format = "MDS/MDF disc image";
      } else if (exts.has("ccd") && exts.has("img")) {
        format = "CCD/IMG disc image";
      }

      if (exts.has("cue") && !exts.has("bin")) {
        level = "warning";
        summary = "有 .cue 但没看到同名 .bin";
        nextStep = "把 .cue 和配套 .bin 放在同一目录后再挂载";
      } else if (exts.has("bin") && !exts.has("cue") && byExt.get("cue")) {
        level = "warning";
        summary = "有 .bin，但没有同名 .cue";
        nextStep = "确认 .cue 是否和 .bin 名称匹配";
      } else if (exts.has("mds") && !exts.has("mdf")) {
        level = "warning";
        summary = "有 .mds 但没看到同名 .mdf";
        nextStep = "把 .mds 和配套 .mdf 放在同一目录后再挂载";
      } else if (exts.has("ccd") && !exts.has("img")) {
        level = "warning";
        summary = "有 .ccd 但没看到同名 .img";
        nextStep = "把 .ccd/.img/.sub 放在同一目录后再挂载";
      } else if (exts.has("iso")) {
        summary = archivePreview ? summarizeArchivePreview(archivePreview) : "ISO 通常可以直接挂载";
      }

      return {
        family,
        type: "disc",
        format,
        files: sorted,
        firstFile: sorted[0].file,
        level,
        summary,
        nextStep,
        archivePreview,
      };
    })
    .sort((a, b) => b.files.length - a.files.length || a.family.localeCompare(b.family));
}

function buildPackageRecommendations(archiveSets, discSets, archives, discs, files) {
  const steps = [];
  const executableCount = countFiles(files, (file) => EXE_EXTS.has(file.ext));
  const packageSets = [...archiveSets, ...discSets];
  const previewedArchiveSet = packageSets.find((set) => set.archivePreview?.status === "ok");
  const previewWithLaunch = packageSets.find((set) => set.archivePreview?.status === "ok" && set.archivePreview.signals?.launchCandidateCount);
  const previewWithInstaller = packageSets.find((set) => set.archivePreview?.status === "ok" && set.archivePreview.signals?.installerCount);

  if (archives.length && !executableCount) {
    steps.push({
      title: "先解压，再诊断",
      body: "当前更像压缩包阶段。先确认所有分卷都在同一目录，从 part1.rar、.7z.001 或 .zip.001 这类第一分卷开始完整解压，再把解压后的游戏文件夹拖回来。",
    });
  }

  if (archiveSets.some((set) => set.missing?.length)) {
    steps.push({
      title: "分卷可能不完整",
      body: "缺少任意一个分卷都会导致解压失败或游戏缺文件。先补齐缺失分卷，并从第一分卷开始解压，不要只解压其中一个文件。",
    });
  }

  if (previewWithLaunch) {
    const preview = previewWithLaunch.archivePreview;
    const sample = preview.signals.launchSamples[0];
    const engineNames = (preview.signals.engineHints || []).slice(0, 2).map((hint) => hint.name).join(" / ");
    steps.push({
      title: "包里看到启动线索",
      body: `桌面预检只读取本地目录/介质元数据；已经看到 ${sample}${engineNames ? `，并有 ${engineNames} 线索` : ""}。需要时点击准备动作完整解压、挂载或解包，再扫描处理后的文件夹。`,
    });
  } else if (previewWithInstaller) {
    const sample = previewWithInstaller.archivePreview.signals.installerSamples[0];
    steps.push({
      title: "看到古早安装盘线索",
      body: `预检里看到了 ${sample} 这类安装/介质线索。先按压缩包或镜像的正常流程解压、挂载或安装，再把安装后的完整目录拖回 GalAid。`,
    });
  } else if (previewedArchiveSet) {
    steps.push({
      title: "包/镜像元数据已预检",
      body: "桌面版已读取本地目录或介质元数据，但还没有发现明确启动入口。先完整解压、挂载或安装，再用处理后的目录重新诊断。",
    });
  }

  if (packageSets.some((set) => set.archivePreview?.encryptedEntries)) {
    steps.push({
      title: "压缩包可能包含加密条目",
      body: "GalAid 只做目录预检，不破解密码也不绕过保护。请只处理你合法拥有且有权限解压的文件。",
    });
  }

  if (discSets.length) {
    steps.push({
      title: "镜像需要挂载或解包",
      body: "镜像文件不是直接运行的游戏目录。.iso 通常可以挂载；.cue/.bin、.mds/.mdf 需要配套文件放在一起。挂载或解包后，从虚拟光驱运行安装器，或把安装后的完整游戏目录拖进 GalAid。",
    });
  }

  if (!steps.length) {
    steps.push({
      title: "没有发现压缩包或镜像",
      body: "当前导入内容更像已经解压的游戏目录。可以回到启动页查看候选入口。",
    });
  }

  return steps;
}

function groupBy(items, getter) {
  const groups = new Map();
  for (const item of items) {
    const key = getter(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function getEngineRule(id) {
  return ENGINE_RULES.find((rule) => rule.id === id) || null;
}

function getEngineRuleExtensions(id, fallback = []) {
  const extensions = getEngineRule(id)?.match?.extensions;
  return Array.isArray(extensions) && extensions.length ? extensions.map((ext) => ext.toLowerCase()) : fallback;
}

function isEngineRuleFilename(id, filename) {
  const names = getEngineRule(id)?.match?.filenames;
  if (!Array.isArray(names)) return false;
  const lowerName = filename.toLowerCase();
  return names.some((name) => name.toLowerCase() === lowerName);
}

function detectEngines(files) {
  const matched = [];

  for (const rule of ENGINE_RULES) {
    if (rule.id === "commercial-proprietary") continue;
    let score = Number.isFinite(rule.score) ? rule.score : 0;
    const evidence = [];
    const evidenceDetails = [];

    for (const file of files) {
      const reasons = getEngineRuleMatchReasons(rule, file);
      if (reasons.length) {
        score += scoreEvidence(file);
        if (evidence.length < 5) evidence.push(file.path);
        if (evidenceDetails.length < 5) {
          evidenceDetails.push({
            path: file.path,
            reasons: reasons.slice(0, 3),
            weight: scoreEvidence(file),
          });
        }
      }
    }

    if (score > 0) {
      matched.push(decorateEngineResult({
        id: rule.id,
        name: rule.name,
        confidence: confidenceFromEngineScore(score),
        score,
        evidence,
        evidenceDetails,
        advice: rule.advice,
      }));
    }
  }

  const commercialStructure = detectCommercialEngineStructure(files, matched);
  if (commercialStructure) matched.push(commercialStructure);

  return matched.sort((a, b) => b.score - a.score);
}

function matchesEngineRule(rule, file) {
  return getEngineRuleMatchReasons(rule, file).length > 0;
}

function getEngineRuleMatchReasons(rule, file) {
  const match = rule?.match || {};
  const lowerName = file.name.toLowerCase();
  const lowerPath = file.lowerPath || file.path.toLowerCase();
  const reasons = [];

  if (arrayIncludesLower(match.extensions, file.ext)) reasons.push(`.${file.ext} extension`);
  if (arrayIncludesLower(match.filenames, lowerName)) reasons.push(`known filename: ${file.name}`);
  appendMatchingPatterns(reasons, match.pathIncludes, (pattern) => lowerPath.includes(normalizeRulePathPattern(pattern)), "path contains");
  appendMatchingPatterns(reasons, match.pathEndsWith, (pattern) => lowerPath.endsWith(normalizeRulePathPattern(pattern)), "path ends with");
  appendMatchingPatterns(reasons, match.filenameRegex, (pattern) => safeRegexTest(pattern, file.name), "filename pattern");
  appendMatchingPatterns(reasons, match.pathRegex, (pattern) => safeRegexTest(pattern, file.path), "path pattern");
  if (file.ext === "dll") appendMatchingPatterns(reasons, match.dllNameIncludes, (pattern) => lowerName.includes(pattern.toLowerCase()), "DLL name contains");

  return reasons;
}

function appendMatchingPatterns(reasons, patterns, predicate, label) {
  if (!Array.isArray(patterns)) return;
  for (const pattern of patterns) {
    if (typeof pattern === "string" && predicate(pattern)) reasons.push(`${label}: ${pattern}`);
  }
}

function normalizeRulePathPattern(pattern) {
  return pattern.replace(/\\/g, "/").toLowerCase();
}

function arrayIncludesLower(values, candidate) {
  return Array.isArray(values) && values.some((value) => value.toLowerCase() === candidate);
}

function arraySome(values, predicate) {
  return Array.isArray(values) && values.some((value) => typeof value === "string" && predicate(value));
}

function safeRegexTest(pattern, value) {
  try {
    return new RegExp(pattern, "i").test(value);
  } catch {
    return false;
  }
}

function confidenceFromEngineScore(score) {
  return score >= 12 ? "high" : score >= 6 ? "medium" : "low";
}

function decorateEngineResult(engine) {
  return {
    ...engine,
    explanation: buildEngineExplanation(engine),
    nextStep: getEngineNextStep(engine),
  };
}

function buildEngineExplanation(engine, language = getAssistantLanguage()) {
  const clueCount = engine.evidenceDetails?.length || engine.evidence?.length || 0;
  const reasonSamples = compactEvidence(
    (engine.evidenceDetails || []).flatMap((detail) => detail.reasons || []),
    3,
  );
  if (language === "en") {
    const reasonText = reasonSamples.length ? `, for example ${reasonSamples.join(", ")}` : "";
    return `${engine.confidence} confidence: ${clueCount} metadata clue${clueCount === 1 ? "" : "s"} matched${reasonText}.`;
  }
  if (language === "ja") {
    const reasonText = reasonSamples.length ? `。例: ${reasonSamples.join("、")}` : "";
    return `${engine.confidence} 信頼度：${clueCount} 件のメタデータ手がかりが一致しました${reasonText}。`;
  }
  const reasonText = reasonSamples.length ? `，例如 ${reasonSamples.join("、")}` : "";
  return `${engine.confidence} 置信度：命中 ${clueCount} 条元数据线索${reasonText}。`;
}

function getEngineNextStep(engine, language = getAssistantLanguage()) {
  const fallback = engine.advice || "先按命中的文件结构确认入口，再根据报错补充诊断。";
  const steps = {
    "zh-CN": {
      kirikiri: "优先尝试根目录主程序；如果乱码、闪退或脚本报错，先检查日区/Locale Emulator、英文短路径和完整 .xp3/.tjs 文件结构。",
      renpy: "优先尝试根目录同名启动器；如果是网页版结构，检查是否需要本地服务器而不是直接 file:// 打开。",
      nscript: "优先检查 0.txt/nscript.dat 与资源封包是否同目录；老游戏失败时先看日区、字体和兼容模式。",
      unity: "优先运行与 _Data/UnityPlayer.dll 同级的 exe；缺 DLL 或黑屏时先检查文件完整性和运行库。",
      rpgmaker: "优先运行 Game.exe；如果提示 RTP 或 RGSS DLL，安装对应 RPG Maker RTP/运行库后再试。",
      siglus: "优先尝试 SiglusEngine.exe 或根目录启动器；乱码/闪退时先检查日区、字体、英文路径和旧运行库。",
      tyrano: "优先用本地服务器打开 index.html；直接 file:// 运行可能被浏览器安全策略阻止。",
      "commercial-proprietary": "不要只拷贝 exe；保持 exe、DLL、资源封包和配置文件的原始相对位置，再按工作目录、日区和运行库顺序排查。",
      fallback,
    },
    en: {
      kirikiri: "Try the root launcher first. If mojibake, crashes, or script errors appear, check Japanese locale / Locale Emulator, a short ASCII path, and a complete .xp3/.tjs structure.",
      renpy: "Try the root launcher with the game name first. For web-style builds, check whether a local server is required instead of opening file:// directly.",
      nscript: "Check that 0.txt/nscript.dat and resource archives stay in the same folder. For older games, start with Japanese locale, fonts, and compatibility mode.",
      unity: "Run the exe next to _Data/UnityPlayer.dll. If DLL errors or black screens appear, verify file completeness and runtimes.",
      rpgmaker: "Run Game.exe first. If RTP or RGSS DLL errors appear, install the matching RPG Maker RTP/runtime and retry.",
      siglus: "Try SiglusEngine.exe or the root launcher first. For mojibake or crashes, check Japanese locale, fonts, an ASCII path, and older runtimes.",
      tyrano: "Open index.html through a local server. Direct file:// launch can be blocked by browser security rules.",
      "commercial-proprietary": "Do not copy only the exe. Keep the exe, DLLs, resource archives, and config files in their original relative layout, then check working directory, Japanese locale, and runtimes.",
      fallback: "Confirm the matched startup structure first, then use the exact error text for the next diagnosis step.",
    },
    ja: {
      kirikiri: "まずルートフォルダの起動ファイルを試します。文字化け、クラッシュ、スクリプトエラーが出る場合は、日本語 locale / Locale Emulator、短い英数字パス、完全な .xp3/.tjs 構成を確認してください。",
      renpy: "まずルートフォルダの同名ランチャーを試します。Web 形式の構成では、file:// ではなくローカルサーバーが必要か確認してください。",
      nscript: "0.txt/nscript.dat とリソースアーカイブが同じ場所にあるか確認します。古いゲームでは日本語 locale、フォント、互換モードから確認してください。",
      unity: "_Data/UnityPlayer.dll と同じ階層の exe を実行します。DLL エラーや黒画面が出る場合は、ファイル完全性とランタイムを確認してください。",
      rpgmaker: "まず Game.exe を実行します。RTP や RGSS DLL のエラーが出る場合は、対応する RPG Maker RTP/ランタイムを入れてから再試行してください。",
      siglus: "SiglusEngine.exe またはルートのランチャーを先に試します。文字化けやクラッシュでは、日本語 locale、フォント、英数字パス、古いランタイムを確認してください。",
      tyrano: "index.html はローカルサーバー経由で開いてください。file:// 直開きはブラウザの安全制限で止まることがあります。",
      "commercial-proprietary": "exe だけをコピーしないでください。exe、DLL、リソースアーカイブ、設定ファイルの相対配置を保ち、作業ディレクトリ、日本語 locale、ランタイムの順に確認してください。",
      fallback: "一致した起動構造を先に確認し、実際のエラー文に沿って次の診断へ進んでください。",
    },
  };
  const pack = steps[language] || steps["zh-CN"];
  return pack[engine.id] || pack.fallback;
}

function detectCommercialEngineStructure(files, knownEngines) {
  const commercialRule = getEngineRule("commercial-proprietary") || {
    name: "商业/自研引擎（文件结构）",
    advice: "按商业 galgame 常见启动链排查：根目录主程序、同级 DLL、资源封包和配置文件必须保持原结构；不要只拷 exe，失败时先看报错、日区和运行库。",
  };
  const executableSamples = samplePaths(
    files,
    (file) => EXE_EXTS.has(file.ext) && file.depth <= 2 && !isSetupLike(file.lowerPath),
    4,
  );
  if (!executableSamples.length) return null;

  const genericResources = files.filter((file) => COMMERCIAL_RESOURCE_ARCHIVES.has(file.ext));
  const largeResources = genericResources.filter((file) => file.size >= 20 * 1024 * 1024);
  const rootDllSamples = samplePaths(
    files,
    (file) => file.ext === "dll" && file.depth <= 2 && !/^(unityplayer|gameassembly|rgss)/i.test(file.name),
    4,
  );
  const configSamples = samplePaths(
    files,
    (file) => ["ini", "cfg", "dat"].includes(file.ext) && /(boot|config|env|game|setting|startup|system)/i.test(file.name),
    4,
  );
  const structuredFolders = samplePaths(files, (file) => /(^|\/)(plugin|system|script|scenario|data|movie|bgm)\//i.test(file.path), 4);
  const specificHighConfidence = knownEngines.some((engine) => engine.confidence === "high");

  let score = 0;
  score += Math.min(12, executableSamples.length * 4);
  score += Math.min(14, genericResources.length * 3);
  score += Math.min(12, largeResources.length * 4);
  score += Math.min(8, rootDllSamples.length * 2);
  score += Math.min(6, configSamples.length * 2);
  score += Math.min(4, structuredFolders.length);

  if (genericResources.length < 2 && !rootDllSamples.length) return null;
  if (specificHighConfidence && score < 22) return null;
  if (!specificHighConfidence && score < 11) return null;

  const resourceSamples = sampleDiverseCommercialResources(largeResources.length ? largeResources : genericResources, 5);
  const evidence = compactEvidence([...executableSamples, ...resourceSamples, ...rootDllSamples, ...configSamples], 9);
  const evidenceDetails = [
    ...executableSamples.map((sample) => ({ path: sample, reasons: ["root or near-root executable"], weight: 4 })),
    ...resourceSamples.map((sample) => ({ path: sample, reasons: ["commercial resource archive family"], weight: 4 })),
    ...rootDllSamples.map((sample) => ({ path: sample, reasons: ["same-folder DLL/plugin clue"], weight: 2 })),
    ...configSamples.map((sample) => ({ path: sample, reasons: ["startup/config file clue"], weight: 2 })),
  ].slice(0, 6);

  return decorateEngineResult({
    id: "commercial-proprietary",
    name: commercialRule.name,
    confidence: score >= 22 ? "high" : score >= 15 ? "medium" : "low",
    score,
    evidence,
    evidenceDetails,
    advice: commercialRule.advice,
  });
}

function sampleDiverseCommercialResources(files, limit = 5) {
  const selected = [];
  const seenExts = new Set();

  for (const file of files) {
    if (seenExts.has(file.ext)) continue;
    selected.push(file.path);
    seenExts.add(file.ext);
    if (selected.length >= limit) return selected;
  }

  for (const file of files) {
    if (selected.includes(file.path)) continue;
    selected.push(file.path);
    if (selected.length >= limit) break;
  }

  return selected;
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

      if (engineIds.has("siglus") && isEngineRuleFilename("siglus", base)) {
        score += 18;
        reasons.push("engine executable");
      }

      if (engineIds.has("kirikiri") && isEngineRuleFilename("kirikiri", base)) {
        score += 18;
        reasons.push("KiriKiri/KAG launcher");
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

function buildLaunchProfiles(launchCandidates, engines, packages) {
  if (!launchCandidates.length) return [];
  const topEngines = engines.slice(0, 2).map((engine) => engine.name);
  const localeSensitive = engines.some((engine) => ["kirikiri", "nscript", "siglus"].includes(engine.id));
  const commercialStructure = engines.some((engine) => engine.id === "commercial-proprietary");
  const packageBlocked = packages.hasPackages && !launchCandidates.length;

  return launchCandidates.slice(0, 4).map((candidate, index) => {
    const file = candidate.file;
    const workingDirectory = getDirectoryName(file.path);
    const workingDirectoryFull = file.fullPath ? getDirectoryName(file.fullPath) : "";
    const entryName = file.name;
    const notes = [];
    const checks = [
      "先确认游戏已经完整解压，不要在压缩软件预览窗口里直接运行。",
      "如果闪退或乱码，优先尝试英文短路径和日区环境。",
    ];

    if (topEngines.length) notes.push(`Engine/structure clues: ${topEngines.join(", ")}`);
    if (commercialStructure) notes.push("Commercial/proprietary structure: keep the exe, DLLs, archives, and config files together.");
    if (localeSensitive) notes.push("Likely needs Japanese locale or Locale Emulator.");
    if (/[^\x00-\x7F]/.test(file.path)) notes.push("Path contains non-ASCII characters; old games may fail.");
    if (packageBlocked) notes.push("Archive/image handling should happen before launching.");
    if (candidate.reasons.length) notes.push(`Reason: ${candidate.reasons.join(", ")}`);

    const commandPreview = buildWindowsCommand({
      entryName,
      entryPath: file.path,
      workingDirectory,
      useAbsolute: false,
    });
    const commandAbsolute = buildWindowsCommand({
      entryName,
      entryPath: file.fullPath || file.path,
      workingDirectory: workingDirectoryFull || workingDirectory,
      useAbsolute: Boolean(file.fullPath),
    });
    const launchTemplates = buildOptionalLaunchTemplates({
      entryPath: file.path,
      localeSensitive: localeSensitive || commercialStructure || /[^\x00-\x7F]/.test(file.path),
    });

    return {
      id: `profile-${index + 1}`,
      title: index === 0 ? "Recommended launch profile" : `Alternative profile ${index + 1}`,
      entryName,
      entryPath: file.path,
      entryFullPath: file.fullPath || "",
      workingDirectory,
      hasDesktopPath: Boolean(file.fullPath),
      confidence: candidate.score,
      commandPreview,
      commandAbsolute,
      launchTemplates,
      notes,
      checks,
      config: {
        schema: "galaid.launchProfile.v1",
        title: index === 0 ? "Recommended launch profile" : `Alternative profile ${index + 1}`,
        entryPath: file.path,
        workingDirectory,
        command: commandPreview,
        confidence: candidate.score,
        engineClues: topEngines,
        localeSensitive,
        launchTemplates,
      },
    };
  });
}

function buildOptionalLaunchTemplates({ entryPath, localeSensitive }) {
  if (!localeSensitive) return [];
  const windowsEntry = toWindowsPath(entryPath);
  const posixEntry = String(entryPath || "").replaceAll("\\", "/");
  return [
    {
      id: "locale-emulator",
      title: "Locale Emulator (Windows)",
      descriptionKey: "localeEmulatorTemplateDescription",
      command: `"LEProc.exe" "${windowsEntry}"`,
    },
    {
      id: "wine-ja",
      title: "Wine Japanese locale",
      descriptionKey: "wineJaTemplateDescription",
      command: `LANG=ja_JP.UTF-8 wine "${posixEntry}"`,
    },
    {
      id: "proton-run",
      title: "Proton / Steam Deck",
      descriptionKey: "protonRunTemplateDescription",
      command: `STEAM_COMPAT_DATA_PATH="/path/to/compatdata" proton run "${posixEntry}"`,
    },
  ];
}

function buildEnvironmentDiagnostics(files, engines, packages, launchCandidates, errorText, errorDiagnostics, launchFailure = normalizeLaunchFailureInput()) {
  const checks = [];
  const engineIds = new Set(engines.map((engine) => engine.id));
  const engineNames = engines.map((engine) => engine.name);
  const errorValue = String(errorText || "");
  const failureSymptoms = new Set(launchFailure.symptoms || []);
  const packageEvidence = compactEvidence(
    [...packages.archiveSets, ...packages.discSets].map((set) => set.firstFile?.path || set.files?.[0]?.file?.path),
    4,
  );
  const missingArchiveSet = packages.archiveSets.find((set) => set.missing?.length);
  const nonAsciiPaths = samplePaths(files, (file) => /[^\x00-\x7F]/.test(file.path), 3);
  const longPaths = samplePaths(files, (file) => file.path.length > 180, 3);
  const topLaunch = launchCandidates[0]?.file;
  const commercialEngine = engines.find((engine) => engine.id === "commercial-proprietary");
  const localeEngineNames = engines
    .filter((engine) => ["kirikiri", "nscript", "siglus", "commercial-proprietary"].includes(engine.id))
    .map((engine) => engine.name);
  const localeError =
    failureSymptoms.has("mojibake") ||
    hasErrorRecipe(errorDiagnostics, "locale-encoding") ||
    /文字化け|乱码|mojibake|locale|\?{4,}|\uFFFD|日区|区域设置/i.test(errorValue);
  const directXError = failureSymptoms.has("black-screen") || hasErrorRecipe(errorDiagnostics, "directx-legacy");
  const vcError = hasErrorRecipe(errorDiagnostics, "visual-cpp-redist");
  const rtpError = hasErrorRecipe(errorDiagnostics, "rpgmaker-rtp");
  const permissionError = hasErrorRecipe(errorDiagnostics, "permission-write");
  const webFileError = hasErrorRecipe(errorDiagnostics, "web-local-files");
  const directXInstallers = samplePaths(files, (file) => /(dxsetup|dxwebsetup|directx|d3dx)/i.test(file.lowerPath), 3);
  const vcInstallers = samplePaths(files, (file) => /(vcredist|vc_redist|visual.?c|redist)/i.test(file.lowerPath), 3);
  const rtpEvidence = compactEvidence(
    [
      ...samplePaths(files, (file) => /^RGSS\d+.*\.dll$/i.test(file.name) || file.name === "Game.ini", 3),
      ...engines.filter((engine) => engine.id === "rpgmaker").flatMap((engine) => engine.evidence.slice(0, 2)),
    ],
    4,
  );
  const webEntry = files.find((file) => file.name.toLowerCase() === "index.html");
  const webLaunch = launchCandidates.find((candidate) => candidate.file.name.toLowerCase() === "index.html");

  if (packages.hasPackages && !launchCandidates.length) {
    checks.push(
      makeEnvironmentCheck({
        id: "extraction",
        title: "完整解压状态",
        status: "blocker",
        detail: "当前更像压缩包或镜像阶段，而且没有发现可靠启动入口。",
        action: "先补齐分卷、挂载或完整解压，再把解压后的游戏目录拖回来诊断。",
        evidence: packageEvidence,
      }),
    );
  } else if (missingArchiveSet) {
    checks.push(
      makeEnvironmentCheck({
        id: "extraction",
        title: "完整解压状态",
        status: launchCandidates.length ? "warning" : "blocker",
        detail: `发现分卷编号缺口：${missingArchiveSet.missing.join(", ")}。缺任意分卷都可能导致解压后缺文件。`,
        action: "先确认所有分卷在同一目录，再从第一分卷重新解压。",
        evidence: packageEvidence,
      }),
    );
  } else if (packages.hasPackages) {
    checks.push(
      makeEnvironmentCheck({
        id: "extraction",
        title: "完整解压状态",
        status: "warning",
        detail: "发现压缩包或镜像。它们可能是补丁、附加盘，也可能说明还没有处理到可运行目录。",
        action: "如果这是主游戏包，先完成解压或挂载；如果是补丁包，确认它已被正确放到游戏目录。",
        evidence: packageEvidence,
      }),
    );
  } else {
    checks.push(
      makeEnvironmentCheck({
        id: "extraction",
        title: "完整解压状态",
        status: "good",
        detail: "没有发现常见压缩包或光盘镜像，当前内容更像已经展开的游戏目录。",
        action: "继续检查启动入口和运行环境。",
      }),
    );
  }

  checks.push(
    makeEnvironmentCheck({
      id: "launcher",
      title: "启动入口",
      status: launchCandidates.length ? "good" : "blocker",
      detail: launchCandidates.length
        ? `最高置信度入口是 ${topLaunch.path}。`
        : "没有发现可信的 exe、bat、cmd、lnk 或 index.html 启动入口。",
      action: launchCandidates.length
        ? "优先使用配置页的推荐命令；如果失败，再尝试候选列表里的备用入口。"
        : "换成完整解压或安装后的游戏根目录再扫描。",
      evidence: topLaunch ? [topLaunch.path] : [],
    }),
  );

  if (commercialEngine) {
    checks.push(
      makeEnvironmentCheck({
        id: "commercial-engine",
        title: "商业/自研引擎启动链",
        status: "warning",
        detail: "检测到商业或自研 galgame 常见结构：根目录启动器、资源封包、DLL 插件和配置文件共同工作。",
        action: "保持原目录结构，从根目录主程序启动；不要单独复制 exe。失败后优先结合报错截图检查日区、运行库和缺失封包。",
        evidence: commercialEngine.evidence,
      }),
    );
  }

  if (localeEngineNames.length || localeError) {
    checks.push(
      makeEnvironmentCheck({
        id: "locale",
        title: "日区与文本编码",
        status: "warning",
        detail: localeEngineNames.length
          ? `${localeEngineNames.join(", ")} 常见乱码、无法读取脚本或启动即闪退。`
          : "粘贴的报错文本指向乱码、区域设置或字体问题。",
        action: "优先尝试日区环境或 Locale Emulator，并把游戏移到英文短路径。",
        evidence: compactEvidence([...localeEngineNames, ...nonAsciiPaths], 4),
      }),
    );
  } else {
    checks.push(
      makeEnvironmentCheck({
        id: "locale",
        title: "日区与文本编码",
        status: "info",
        detail: "没有强烈日区线索，但老 galgame 仍可能受系统区域、字体和路径编码影响。",
        action: "如果出现乱码或启动即退出，再回到这一项排查。",
        evidence: engineNames.slice(0, 3),
      }),
    );
  }

  checks.push(
    makeEnvironmentCheck({
      id: "path",
      title: "英文短路径",
      status: nonAsciiPaths.length || longPaths.length ? "warning" : "good",
      detail:
        nonAsciiPaths.length || longPaths.length
          ? "发现非英文字符或过长路径，老 Windows 游戏可能因此打不开资源文件。"
          : "路径长度和字符看起来没有明显风险。",
      action:
        nonAsciiPaths.length || longPaths.length
          ? "建议移动到 C:/Games/VNName 这类英文短路径后再启动。"
          : "保持目录层级简短即可。",
      evidence: compactEvidence([...nonAsciiPaths, ...longPaths], 4),
    }),
  );

  checks.push(
    makeEnvironmentCheck({
      id: "directx",
      title: "DirectX 旧组件",
      status: directXError ? "warning" : "info",
      detail: directXError
        ? "报错里出现 DirectX、D3DX、XInput 或旧声音/输入组件线索。"
        : directXInstallers.length
          ? "目录里看到了 DirectX 支持安装器，但它不应当作为游戏主入口。"
          : "文件清单和报错里没有发现明确 DirectX 旧组件线索。",
      action: directXError
        ? "安装 DirectX End-User Runtime；老游戏经常需要这个而不是新版 DirectX。"
        : "只有在报错提到 d3dx、xinput、dsound、dinput 时再处理这一项。",
      evidence: directXInstallers,
    }),
  );

  checks.push(
    makeEnvironmentCheck({
      id: "vcredist",
      title: "VC++ 运行库",
      status: vcError ? "warning" : "info",
      detail: vcError
        ? "报错里出现 msvcr、msvcp、vcruntime 或 Visual C++ 线索。"
        : vcInstallers.length
          ? "目录里看到了 VC++/redist 支持安装器，但它不应当作为游戏主入口。"
          : "文件清单和报错里没有发现明确 VC++ 运行库线索。",
      action: vcError
        ? "安装 Microsoft Visual C++ Redistributable；老游戏在 64 位系统上也常需要 x86。"
        : "只有在报错点名 msvcr、msvcp、vcruntime 时再处理这一项。",
      evidence: vcInstallers,
    }),
  );

  checks.push(
    makeEnvironmentCheck({
      id: "rtp",
      title: "RPG Maker RTP",
      status: rtpError ? "warning" : "info",
      detail: rtpError
        ? "报错文本指向 RPG Maker RTP、RGSS 或 RPG Maker 运行环境。"
        : engineIds.has("rpgmaker")
          ? "检测到 RPG Maker 线索；旧版项目可能需要对应 RTP。"
          : "没有发现 RPG Maker RTP 相关线索。",
      action: rtpError
        ? "安装与游戏版本对应的 RPG Maker RTP，或确认游戏包是否自带 RTP 文件。"
        : "如果启动时报 RTP/RGSS，再按版本安装对应 RTP。",
      evidence: rtpEvidence,
    }),
  );

  checks.push(
    makeEnvironmentCheck({
      id: "permission",
      title: "权限与安装位置",
      status: permissionError ? "warning" : "info",
      detail: permissionError ? "报错文本指向权限不足或拒绝访问。" : "没有发现明确权限报错。",
      action: permissionError
        ? "把游戏移动到用户目录或 C:/Games，避免 Program Files；必要时再尝试管理员权限。"
        : "如果保存失败或启动器无法写入配置，优先换到用户可写目录。",
      evidence: samplePaths(files, (file) => /program files|windows\/|desktop|downloads/i.test(file.lowerPath), 3),
    }),
  );

  if (webEntry || engineIds.has("tyrano") || webFileError) {
    checks.push(
      makeEnvironmentCheck({
        id: "web-vn",
        title: "网页 VN 本地服务器",
        status: webLaunch || engineIds.has("tyrano") || webFileError ? "warning" : "info",
        detail: webFileError
          ? "报错文本指向浏览器本地文件读取限制。"
          : "检测到 index.html 或 TyranoScript/web VN 结构。直接 file:// 打开可能被浏览器安全限制挡住。",
        action: "用本地服务器打开游戏目录，再访问 index.html；打包版可后续生成一键本地服务配置。",
        evidence: compactEvidence([webEntry?.path, ...(engineIds.has("tyrano") ? ["TyranoScript / web VN"] : [])], 4),
      }),
    );
  }

  return {
    checks,
    summary: summarizeEnvironmentChecks(checks),
  };
}

function makeEnvironmentCheck({ id, title, status, detail, action, evidence = [] }) {
  return {
    id,
    title,
    status,
    statusLabel: getEnvironmentStatusLabel(status),
    detail,
    action,
    evidence: compactEvidence(evidence, 4),
  };
}

function getEnvironmentStatusLabel(status) {
  const labels = {
    good: "OK",
    info: "观察",
    warning: "建议处理",
    blocker: "先处理",
  };
  return labels[status] || "观察";
}

function summarizeEnvironmentChecks(checks) {
  const counts = {
    blocker: checks.filter((check) => check.status === "blocker").length,
    warning: checks.filter((check) => check.status === "warning").length,
    good: checks.filter((check) => check.status === "good").length,
    info: checks.filter((check) => check.status === "info").length,
  };
  const firstBlocker = checks.find((check) => check.status === "blocker");
  const firstWarning = checks.find((check) => check.status === "warning");

  if (counts.blocker) {
    return {
      status: "blocker",
      label: `${counts.blocker} 个启动前阻断项`,
      detail: firstBlocker.action,
      counts,
    };
  }
  if (counts.warning) {
    return {
      status: "warning",
      label: `${counts.warning} 个建议先处理的环境项`,
      detail: firstWarning.action,
      counts,
    };
  }
  return {
    status: "good",
    label: "环境检查没有发现明显阻断",
    detail: "可以优先尝试推荐启动配置；如果仍失败，再把报错文本贴回来重新诊断。",
    counts,
  };
}

function compactEvidence(values, limit = 4) {
  return [...new Set(values.filter(Boolean))].slice(0, limit);
}

function getDirectoryName(pathValue) {
  const normalized = String(pathValue || "").replaceAll("\\", "/");
  const index = normalized.lastIndexOf("/");
  return index > 0 ? normalized.slice(0, index) : ".";
}

function buildWindowsCommand({ entryName, entryPath, workingDirectory, useAbsolute }) {
  if (useAbsolute) {
    return `cd /d "${toWindowsPath(workingDirectory || ".")}" && start "" "${entryName}"`;
  }
  const directory = workingDirectory && workingDirectory !== "." ? toWindowsPath(workingDirectory) : ".";
  const commandEntry = entryName || toWindowsPath(entryPath);
  return `cd /d "${directory}" && start "" "${commandEntry}"`;
}

function toWindowsPath(pathValue) {
  return String(pathValue || ".").replaceAll("/", "\\");
}

function isSetupLike(lowerPath) {
  return /(setup|install|installer|autorun|inst|修正|patch)/i.test(lowerPath);
}

function buildFindings(files, roots, engines, launchCandidates, mode, packages, errorDiagnostics, launchFailure = normalizeLaunchFailureInput()) {
  if (!files.length) return [];

  const findings = [];
  const archiveCount = packages.archives.length;
  const discCount = packages.discs.length;
  const executableCount = countFiles(files, (file) => EXE_EXTS.has(file.ext));
  const resourceArchiveCount = countFiles(files, (file) => RESOURCE_ARCHIVES.has(file.ext));
  const nonAsciiPaths = samplePaths(files, (file) => /[^\x00-\x7F]/.test(file.path), 3);
  const longPaths = samplePaths(files, (file) => file.path.length > 180, 3);
  const setupFiles = samplePaths(files, (file) => isSetupLike(file.lowerPath), 3);
  const commercialEngine = engines.find((engine) => engine.id === "commercial-proprietary");
  const archivePaths = packages.archives.slice(0, 3).map((item) => item.file.path);
  const discPaths = packages.discs.slice(0, 3).map((item) => item.file.path);
  const packagePaths = compactEvidence([...archivePaths, ...discPaths], 4);

  if (mode.id !== "normal") {
    findings.push({
      level: mode.findingLevel,
      title: "已启用大文件夹模式",
      body: `${mode.detail} 这不会读取 10GB 级游戏文件内容，只会分析文件清单。`,
      evidence: [`${formatNumber(files.length)} files`, mode.label],
    });
  }

  if (launchCandidates.length) {
    const topCandidate = launchCandidates[0];
    findings.push({
      level: "good",
      title: "找到可尝试启动入口",
      body: `最高置信度入口是 ${topCandidate.file.path}。如果它失败，再按候选列表从上到下尝试。`,
      evidence: compactEvidence([topCandidate.file.path, ...topCandidate.reasons], 4),
    });
  } else if (executableCount === 0 && !hasFile(files, (file) => file.name.toLowerCase() === "index.html")) {
    findings.push({
      level: "blocker",
      title: "没有发现明显启动入口",
      body: "当前选择里没有 exe、bat、cmd、lnk 或 index.html。可能只选中了压缩包、镜像、补丁包，或还没有完整解压。",
      evidence: packagePaths.length ? packagePaths : roots.slice(0, 3).map((root) => `${root.name} (${root.count})`),
    });
  } else {
    findings.push({
      level: "warning",
      title: "启动入口不明确",
      body: "发现了可执行文件，但它们更像安装器、配置工具或运行库。请优先选择完整解压后的游戏根目录。",
      evidence: compactEvidence([...setupFiles, ...launchCandidates.slice(0, 2).map((candidate) => candidate.file.path)], 4),
    });
  }

  if (commercialEngine) {
    findings.push({
      level: "warning",
      title: "主推商业/自研引擎路线",
      body: "这个目录更像商业 galgame 常见的私有启动链。诊断重点不是识别某个公开引擎，而是确认主程序、同级 DLL、资源封包、配置文件和工作目录保持完整。",
      evidence: commercialEngine.evidence,
    });
  }

  if (archiveCount && executableCount === 0) {
    findings.push({
      level: "warning",
      title: "看起来还停在压缩包阶段",
      body: "先完整解压 zip/rar/7z 等压缩包，再把解压后的游戏文件夹拖进来。分卷包要从 part1.rar、.7z.001 或 .zip.001 开始；直接在压缩软件里双击游戏经常会缺文件。",
      evidence: archivePaths,
    });
  } else if (archiveCount) {
    findings.push({
      level: "info",
      title: "发现压缩包",
      body: "如果压缩包是补丁、特典或分卷，请确认所有分卷都在同一目录，并先解压到短英文路径。",
      evidence: archivePaths,
    });
  }

  if (discCount) {
    findings.push({
      level: "warning",
      title: "发现镜像文件",
      body: "iso/mds/mdf/cue/bin 通常需要先挂载或解包；cue/bin 与 mds/mdf 要保持配套文件同名同目录。挂载后再从虚拟光驱运行安装器或复制完整游戏目录。",
      evidence: discPaths,
    });
  }

  if (packages.archiveSets.some((set) => set.missing?.length)) {
    const missingSets = packages.archiveSets
      .filter((set) => set.missing?.length)
      .map((set) => `${set.family}: missing ${set.missing.join(", ")}`);
    findings.push({
      level: "warning",
      title: "压缩包分卷可能不完整",
      body: "检测到分卷编号缺口。请确认 part1/part2 或 .001/.002 等所有分卷都在同一目录后再解压。",
      evidence: compactEvidence(missingSets, 4),
    });
  }

  if (nonAsciiPaths.length) {
    findings.push({
      level: "warning",
      title: "路径里有非英文字符",
      body: `老游戏可能因为路径编码打不开。建议移动到 C:/Games/VNName 这类英文短路径。样例：${nonAsciiPaths.join(", ")}`,
      evidence: nonAsciiPaths,
    });
  }

  if (longPaths.length) {
    findings.push({
      level: "warning",
      title: "路径过长",
      body: `Windows 老程序可能无法读取很长路径。建议缩短目录层级。样例：${longPaths.join(", ")}`,
      evidence: longPaths,
    });
  }

  if (roots.length > 1) {
    findings.push({
      level: "info",
      title: "选择里包含多个根目录",
      body: `检测到 ${roots.length} 个顶层目录。诊断仍可用，但启动判断会更保守。`,
      evidence: roots.slice(0, 4).map((root) => `${root.name} (${formatNumber(root.count)} files)`),
    });
  }

  if (setupFiles.length && !launchCandidates.some((candidate) => candidate.score >= 75)) {
    findings.push({
      level: "info",
      title: "可能需要先安装",
      body: `发现安装器或补丁工具：${setupFiles.join(", ")}。如果这是光盘镜像内容，通常先运行安装器。`,
      evidence: setupFiles,
    });
  }

  const localeRiskEngines = engines.filter((engine) => ["kirikiri", "nscript", "siglus", "commercial-proprietary"].includes(engine.id));
  if (localeRiskEngines.length) {
    findings.push({
      level: "warning",
      title: "日区/编码风险较高",
      body: "吉里吉里、NScripter、Siglus/RealLive 或商业私有引擎老游戏常见乱码或闪退。优先尝试日区环境、Locale Emulator、英文路径和管理员权限。",
      evidence: localeRiskEngines.flatMap((engine) => [engine.name, ...engine.evidence.slice(0, 1)]).slice(0, 4),
    });
  }

  if (engines.some((engine) => engine.id === "unity") && !hasFile(files, (file) => file.name === "UnityPlayer.dll")) {
    const unityEngine = engines.find((engine) => engine.id === "unity");
    findings.push({
      level: "warning",
      title: "Unity 文件可能不完整",
      body: "发现 Unity 结构线索，但没有看到 UnityPlayer.dll。请确认解压完整，尤其不要漏掉同名 _Data 文件夹。",
      evidence: unityEngine?.evidence || [],
    });
  }

  if (resourceArchiveCount) {
    findings.push({
      level: "info",
      title: "发现资源封包",
      body: "检测到 rpa/xp3/nsa/arc/pck 等资源封包。GalAid 当前只做识别和清单，不绕过加密或 DRM。",
      evidence: samplePaths(files, (file) => RESOURCE_ARCHIVES.has(file.ext), 4),
    });
  }

  if (launchFailure.hasEvidence) {
    findings.push({
      level: "warning",
      title: "已记录启动失败现象",
      body: "这些现象来自用户手动选择或粘贴，GalAid 不会监控游戏进程；路线图和求助包会把它作为后续排查依据。",
      evidence: getLaunchFailureEvidence(launchFailure, "zh-CN"),
    });
  }

  findings.push(...errorDiagnostics.findings);
  return findings;
}

function buildErrorDiagnostics(text) {
  const value = String(text || "").trim();
  if (!value) {
    return {
      hasText: false,
      matches: [],
      findings: [],
      summary: {
        status: "info",
        label: "等待报错文本",
        detail: "没有粘贴报错时，GalAid 只根据文件清单做环境判断。",
        counts: { warning: 0, info: 0 },
      },
    };
  }

  const matches = ERROR_RECIPES.map((recipe, index) => matchErrorRecipe(recipe, value, index))
    .filter(Boolean)
    .sort(
      (a, b) =>
        getLevelWeight(a.level) - getLevelWeight(b.level) ||
        getRecipeRank(a) - getRecipeRank(b) ||
        b.evidence.length - a.evidence.length,
    );

  const findings = matches.length
    ? matches.map((match) => ({
        level: match.level,
        title: `报错指向${match.title}`,
        body: `${match.cause} ${match.action}`,
        evidence: match.evidence,
      }))
    : [
        {
          level: "info",
          title: "已记录错误信息",
          body: "当前配方库没有命中特定报错。报告里会保留这段文本，方便继续排查或补充规则。",
        },
      ];

  return {
    hasText: true,
    matches,
    findings,
    summary: summarizeErrorMatches(matches),
  };
}

function matchErrorRecipe(recipe, text, index) {
  const evidence = [];
  const lowerText = text.toLowerCase();

  for (const keyword of recipe.keywords || []) {
    const normalized = String(keyword).toLowerCase();
    if (normalized && lowerText.includes(normalized)) evidence.push(keyword);
  }

  for (const pattern of recipe.patterns || []) {
    try {
      const match = text.match(new RegExp(pattern, recipe.flags || "i"));
      if (match?.[0]) evidence.push(match[0]);
    } catch {
      continue;
    }
  }

  const compacted = compactEvidence(evidence, 5);
  if (!compacted.length) return null;

  return {
    ...recipe,
    index,
    level: recipe.level || "warning",
    evidence: compacted,
    confidence: getRecipeConfidence(compacted.length),
  };
}

function summarizeErrorMatches(matches) {
  const counts = {
    warning: matches.filter((match) => match.level === "warning").length,
    info: matches.filter((match) => match.level === "info").length,
  };

  if (!matches.length) {
    return {
      status: "info",
      label: "没有命中已知配方",
      detail: "原始报错会进入报告；这类文本很适合后续沉淀成新的社区规则。",
      counts,
    };
  }

  const first = matches[0];
  return {
    status: first.level,
    label: `命中 ${matches.length} 条报错配方`,
    detail: first.action,
    counts,
  };
}

function getRecipeConfidence(evidenceCount) {
  if (evidenceCount >= 3) return "high";
  if (evidenceCount >= 2) return "medium";
  return "matched";
}

function hasErrorRecipe(errorDiagnostics, id) {
  return Boolean(errorDiagnostics?.matches?.some((match) => match.id === id));
}

function getRecipeRank(match) {
  return Number.isFinite(match.priority) ? match.priority : match.index;
}

function getLevelWeight(level) {
  const weights = { blocker: 0, warning: 1, info: 2, good: 3 };
  return weights[level] ?? 4;
}

function buildRoadmap({ packages, launchCandidates, profiles, environment, errorDiagnostics, findings, engines, mode, launchFailure }) {
  const steps = [];
  const envChecks = new Map(environment.checks.map((check) => [check.id, check]));
  const addStep = (step) => {
    steps.push({
      id: step.id,
      title: step.title,
      state: step.state || "todo",
      stateLabel: getRoadmapStateLabel(step.state || "todo"),
      priority: step.priority || steps.length + 1,
      detail: step.detail,
      action: step.action,
      evidence: compactEvidence(step.evidence || [], 4),
      source: step.source || "diagnosis",
    });
  };

  if (mode.id !== "normal") {
    addStep({
      id: "large-folder",
      title: "确认扫描模式",
      state: "info",
      priority: 5,
      detail: mode.detail,
      action: "页面只展示关键样例，报告和求助包仍基于完整文件清单。继续按下面步骤排查即可。",
      source: "scan",
    });
  }

  const extraction = envChecks.get("extraction");
  if (extraction?.status === "blocker" || (packages.hasPackages && !launchCandidates.length)) {
    addStep({
      id: "extract-first",
      title: "先处理压缩包或镜像",
      state: "blocked",
      priority: 10,
      detail: extraction?.detail || "当前内容像压缩包或镜像阶段，暂时没有可靠启动入口。",
      action: extraction?.action || "先完整解压压缩包，或挂载/解包镜像，再把可运行的游戏目录拖回 GalAid。",
      evidence: extraction?.evidence,
      source: "package",
    });
  } else if (packages.hasPackages) {
    addStep({
      id: "verify-packages",
      title: "确认补丁包或附加镜像",
      state: "todo",
      priority: 20,
      detail: "目录里仍有压缩包或镜像文件。它们可能是补丁、特典或附加盘。",
      action: "确认这些包是否已经解压、安装或合并到游戏目录；不要直接在压缩软件预览窗口里运行游戏。",
      evidence: extraction?.evidence,
      source: "package",
    });
  }

  const launcher = envChecks.get("launcher");
  if (!launchCandidates.length) {
    addStep({
      id: "find-launcher",
      title: "换成完整游戏根目录",
      state: "blocked",
      priority: 30,
      detail: launcher?.detail || "还没有发现可信启动入口。",
      action: launcher?.action || "选择包含主程序、资源封包和脚本的完整目录后重新扫描。",
      source: "launch",
    });
  }

  if (launchFailure?.hasEvidence) {
    for (const [index, symptomId] of launchFailure.symptoms.entries()) {
      const step = getLaunchFailureStep(symptomId, "zh-CN");
      if (!step) continue;
      addStep({
        id: `failure-${symptomId}`,
        title: step.title,
        state: "todo",
        priority: 32 + index,
        detail: step.detail,
        action: step.action,
        evidence: getLaunchFailureEvidence({ symptoms: [symptomId], note: "" }, "zh-CN"),
        source: "launch-failure",
      });
    }
    if (launchFailure.note) {
      addStep({
        id: "failure-note",
        title: "按补充报错继续诊断",
        state: "todo",
        priority: 38,
        detail: "用户补充了启动失败后的弹窗、日志或现象描述。",
        action: "优先按报错诊断页命中的配方处理；如果没有命中，导出求助包时保留这段说明供社区补规则。",
        evidence: [launchFailure.note],
        source: "launch-failure",
      });
    }
  }

  for (const checkId of ["commercial-engine", "path", "locale", "directx", "vcredist", "rtp", "permission", "web-vn"]) {
    const check = envChecks.get(checkId);
    if (!check || check.status !== "warning") continue;
    const recipeId = getEnvironmentRecipeId(check.id);
    if (recipeId && hasErrorRecipe(errorDiagnostics, recipeId)) continue;
    addStep({
      id: `env-${check.id}`,
      title: check.title,
      state: "todo",
      priority: getEnvironmentRoadmapPriority(check.id),
      detail: check.detail,
      action: check.action,
      evidence: check.evidence,
      source: "environment",
    });
  }

  for (const match of errorDiagnostics.matches.slice(0, 4)) {
    addStep({
      id: `error-${match.id}`,
      title: match.title,
      state: "todo",
      priority: getRecipeRank(match) + 100,
      detail: match.cause,
      action: match.action,
      evidence: match.evidence,
      source: "error",
    });
  }

  if (profiles.length) {
    const profile = profiles[0];
    addStep({
      id: "try-launch-profile",
      title: "按推荐配置启动",
      state: steps.some((step) => step.state === "blocked") ? "waiting" : "ready",
      priority: 500,
      detail: `推荐入口是 ${profile.entryPath}，工作目录是 ${profile.workingDirectory}。`,
      action: "先复制配置页的推荐命令；如果失败，再按启动页候选列表从上到下尝试。",
      evidence: [profile.commandPreview],
      source: "launch",
    });
  }

  if (engines.length) {
    addStep({
      id: "engine-notes",
      title: "按引擎/结构线索复查",
      state: "info",
      priority: 700,
      detail: `识别到 ${engines.slice(0, 3).map((engine) => engine.name).join(", ")}。`,
      action: "如果常规步骤仍失败，到引擎/结构页查看证据路径和对应建议。",
      evidence: engines.flatMap((engine) => engine.evidence.slice(0, 1)),
      source: "engine",
    });
  }

  addStep({
    id: "support-if-stuck",
    title: "仍失败就导出求助包",
    state: "info",
    priority: 900,
    detail: "求助包只包含诊断元数据和相对路径，不包含游戏文件。",
    action: "到求助页复制摘要或下载求助包，再发到 issue、论坛或聊天里。",
    source: "support",
  });

  const normalized = dedupeRoadmapSteps(steps).sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));
  return {
    steps: normalized,
    summary: summarizeRoadmap(normalized, findings, launchCandidates),
  };
}

function dedupeRoadmapSteps(steps) {
  const seen = new Set();
  return steps.filter((step) => {
    if (seen.has(step.id)) return false;
    seen.add(step.id);
    return true;
  });
}

function summarizeRoadmap(steps, findings, launchCandidates) {
  const blocked = steps.filter((step) => step.state === "blocked").length;
  const todo = steps.filter((step) => step.state === "todo").length;
  if (blocked) {
    return {
      state: "blocked",
      label: `${blocked} 个前置步骤需要先处理`,
      detail: steps.find((step) => step.state === "blocked")?.action || "先处理阻断项，再尝试启动。",
      counts: getRoadmapCounts(steps),
    };
  }
  if (todo) {
    return {
      state: "todo",
      label: `${todo} 个建议步骤`,
      detail: steps.find((step) => step.state === "todo")?.action || "按顺序处理建议项。",
      counts: getRoadmapCounts(steps),
    };
  }
  if (launchCandidates.length) {
    return {
      state: "ready",
      label: "可以尝试启动",
      detail: `优先尝试 ${launchCandidates[0].file.path}。`,
      counts: getRoadmapCounts(steps),
    };
  }
  return {
    state: findings.some((finding) => finding.level === "warning") ? "todo" : "info",
    label: "路线图已生成",
    detail: "按顺序执行下面的步骤。",
    counts: getRoadmapCounts(steps),
  };
}

function getRoadmapCounts(steps) {
  return {
    blocked: steps.filter((step) => step.state === "blocked").length,
    todo: steps.filter((step) => step.state === "todo").length,
    ready: steps.filter((step) => step.state === "ready").length,
    info: steps.filter((step) => step.state === "info" || step.state === "waiting").length,
  };
}

function getRoadmapStateLabel(state) {
  const labels = {
    blocked: "先处理",
    todo: "建议",
    ready: "可执行",
    waiting: "等待",
    info: "参考",
  };
  return labels[state] || "参考";
}

function getEnvironmentRoadmapPriority(id) {
  const priorities = {
    "commercial-engine": 35,
    path: 40,
    locale: 50,
    directx: 60,
    vcredist: 70,
    rtp: 80,
    permission: 90,
    "web-vn": 100,
  };
  return priorities[id] || 120;
}

function getEnvironmentRecipeId(id) {
  const recipeIds = {
    locale: "locale-encoding",
    directx: "directx-legacy",
    vcredist: "visual-cpp-redist",
    rtp: "rpgmaker-rtp",
    permission: "permission-write",
    "web-vn": "web-local-files",
  };
  return recipeIds[id] || "";
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
  [
    chooseFolderButton,
    chooseFilesButton,
    sampleButton,
    commercialSampleButton,
    packageSampleButton,
    copyReportButton,
    downloadReportButton,
    downloadBundleButton,
  ].forEach((button) => {
    button.disabled = isBusy;
  });
  dropZone.classList.toggle("is-busy", isBusy);
}

if (desktopApi) {
  desktopApi.onScanProgress((progress) => {
    const skipped = progress.skipped
      ? `, ${getUiText("scanFilesSkipped", { count: formatNumber(progress.skipped) })}`
      : "";
    updateScanState({
      title: getUiText("scanDesktop"),
      detail: `${getUiText("scanFilesIndexedSolo", { done: formatNumber(progress.scanned || 0) })}${skipped}`,
      progress: progress.done ? 82 : 45,
      phase: progress.done ? "analyzing" : "scanning",
    });
  });
  desktopApi.onPrepareProgress?.((progress) => {
    updateScanState({
      title: getUiText("preparingPackage"),
      detail: progress?.packageName || getUiText("scanDesktop"),
      progress: 38,
      phase: "scanning",
    });
  });
  void refreshDesktopLaunchHistory();
}

function updateScanState({ title, detail, progress = 0, visible = true, phase = "ready" }) {
  scanBanner.hidden = !visible;
  scanBanner.className = `scan-banner ${phase}`;
  scanTitle.textContent = title;
  scanDetail.textContent = detail;
  scanProgressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;

  if (phase === "scanning" || phase === "analyzing") {
    statusPill.textContent = getUiText("scanning");
    statusPill.className = "status-pill scanning";
  }
}

async function importNativeFiles(fileList, sourceLabel) {
  const runId = ++scanRunId;
  setControlsBusy(true);
  const sourceName = sourceLabel === "folder" ? getUiText("scanFolderSource") : getUiText("scanFilesSource");
  updateScanState({
    title: getUiText("scanFiles"),
    detail: getUiText("scanReadingMetadata", { source: sourceName }),
    progress: 5,
    phase: "scanning",
  });

  try {
    const files = await filesFromFileList(fileList, (done, total) => {
      if (runId !== scanRunId) return;
      const progress = total ? Math.min(82, Math.round((done / total) * 80)) : 20;
      updateScanState({
        title: getUiText("scanFiles"),
        detail: getUiText("scanFilesIndexed", {
          done: formatNumber(done),
          total: formatNumber(total || done),
        }),
        progress,
        phase: "scanning",
      });
    });
    if (runId === scanRunId) await setFiles(files, { runId });
  } finally {
    if (runId === scanRunId) setControlsBusy(false);
  }
}

async function importDesktopSelection(kind) {
  if (!desktopApi) return;
  const runId = ++scanRunId;
  setControlsBusy(true);
  updateScanState({
    title: getUiText("scanDesktop"),
    detail: kind === "folder" ? getUiText("scanChooseFolder") : getUiText("scanChooseFiles"),
    progress: 6,
    phase: "scanning",
  });

  try {
    const result = kind === "folder" ? await desktopApi.selectFolder() : await desktopApi.selectFiles();
    if (runId !== scanRunId || result?.canceled) {
      updateScanState({
        title: getUiText("ready"),
        detail: getUiText("scanNoSelection"),
        progress: 0,
        visible: false,
      });
      return;
    }
    await setFiles(result.files || [], { runId, desktopMeta: result.meta });
  } catch (error) {
    showToast(`${getUiText("toastDesktopScanFailed")}: ${error.message || error}`);
  } finally {
    if (runId === scanRunId) setControlsBusy(false);
  }
}

async function setFiles(files, options = {}) {
  const runId = options.runId || ++scanRunId;
  setControlsBusy(true);
  try {
    updateScanState({
      title: getUiText("scanAnalyzing"),
      detail: getUiText("scanQueued", { count: formatNumber(files.length) }),
      progress: 88,
      phase: "analyzing",
    });
    await yieldToBrowser();
    if (runId !== scanRunId) return;

    currentFiles = uniqueFiles(files);
    launchFailureState = getEmptyLaunchFailureState();
    pendingLaunchFollowup = null;
    currentAnalysis = analyze(currentFiles, errorInput.value, launchFailureState);
    if (options.desktopMeta) currentAnalysis.desktopMeta = options.desktopMeta;
    refreshCurrentReport();
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
  projectTitle.textContent = getDisplayTitle(analysis);
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
  roadmapPanel.innerHTML = renderRoadmap(analysis);
  profilesPanel.innerHTML = renderProfiles(analysis);
  environmentPanel.innerHTML = renderEnvironment(analysis);
  errorsPanel.innerHTML = renderErrorDiagnostics(analysis);
  packagesPanel.innerHTML = renderPackages(analysis);
  enginePanel.innerHTML = renderEngines(analysis);
  assetsPanel.innerHTML = renderAssets(analysis);
  supportPanel.innerHTML = renderSupport(analysis);
  reportPanel.innerHTML = `<div class="report-box">${escapeHtml(analysis.report)}</div>`;
}

function getDisplayTitle(analysis) {
  if (!analysis.roots.length) return getUiText("importedFiles");
  if (analysis.roots.length === 1) return analysis.roots[0].name;
  if (analysis.roots.every((root) => root.count === 1)) {
    return getUiText("selectedFiles", { count: formatNumber(analysis.files.length) });
  }
  return getUiText("moreRoots", { name: analysis.roots[0].name, count: analysis.roots.length - 1 });
}

function renderEmpty() {
  projectTitle.textContent = getUiText("waitingTitle");
  statusPill.textContent = getUiText("noData");
  statusPill.className = "status-pill neutral";
  fileCount.textContent = "0";
  engineCount.textContent = "0";
  assetCount.textContent = "0";
  riskCount.textContent = "0";
  scanTitle.textContent = getUiText("ready");
  scanDetail.textContent = getUiText("noFolder");
  scanBanner.hidden = true;
  const empty = emptyStateTemplate ? getEmptyStateHtml() : "";
  launchPanel.innerHTML = empty;
  roadmapPanel.innerHTML = empty;
  profilesPanel.innerHTML = empty;
  environmentPanel.innerHTML = empty;
  errorsPanel.innerHTML = empty;
  packagesPanel.innerHTML = empty;
  enginePanel.innerHTML = empty;
  assetsPanel.innerHTML = empty;
  supportPanel.innerHTML = empty;
  reportPanel.innerHTML = empty;
}

function renderLaunch(analysis) {
  const candidates = analysis.launchCandidates.length
    ? analysis.launchCandidates
        .map(
          (candidate, index) => `
            <article class="candidate">
              <div>
                <h4>${escapeHtml(candidate.file.name)}</h4>
                <p>${escapeHtml(candidate.file.path)}</p>
                <div class="meta-row">
                  <span class="chip good">${formatBytes(candidate.file.size)}</span>
                  ${candidate.reasons.map((reason) => `<span class="chip">${escapeHtml(reason)}</span>`).join("")}
                </div>
              </div>
              <div class="candidate-side">
                <div class="candidate-score">${candidate.score}</div>
                ${renderCandidateLaunchAction(candidate, index)}
              </div>
            </article>
          `,
        )
        .join("")
    : `<article class="finding blocker"><div><h4>${escapeHtml(getUiText("noLaunchTitle"))}</h4><p>${escapeHtml(getUiText("noLaunchBody"))}</p></div></article>`;

  return `
    ${renderModeCard(analysis)}
    ${renderPreparedHandoff(analysis)}
    ${renderLaunchAttemptFollowup()}
    <div class="section-title">
      <h3>${escapeHtml(getUiText("launchCandidates"))}</h3>
      <span>${analysis.launchCandidates.length} ${escapeHtml(getUiText("items"))}</span>
    </div>
    <div class="card-list">${candidates}</div>
    ${renderLaunchFailureFollowUp(analysis)}
    <div class="section-title">
      <h3>${escapeHtml(getUiText("diagnosisFindings"))}</h3>
      <span>${analysis.findings.length} ${escapeHtml(getUiText("findings"))}</span>
    </div>
    <div class="card-list">${analysis.findings.map(renderFinding).join("")}</div>
  `;
}

function renderPreparedHandoff(analysis) {
  const meta = analysis.desktopMeta;
  if (!meta?.preparedFrom) return "";

  const topCandidate = analysis.launchCandidates[0] || null;
  const source = meta.preparedFrom || getUiText("packagesTitle");
  const target = meta.preparedOutputName || getUiText("importedFiles");
  const body = topCandidate
    ? getUiText("preparedHandoffReadyBody", { source, target, entry: topCandidate.file.path })
    : getUiText("preparedHandoffNoLaunchBody", { source, target });
  const canLaunchTopCandidate = topCandidate ? canDesktopLaunchFile(topCandidate.file) : false;
  const mountedImageAction = renderMountedImageAction(meta);
  const action = topCandidate
    ? `
      <button
        class="launch-entry-button"
        type="button"
        data-launch-action="candidate"
        data-candidate-index="0"
        ${canLaunchTopCandidate ? "" : "disabled"}
        title="${escapeHtml(canLaunchTopCandidate ? getUiText("launchNow") : getUiText("launchUnsupported"))}"
      >
        ${escapeHtml(canLaunchTopCandidate ? getUiText("launchNow") : getUiText("launchUnsupported"))}
      </button>
    `
    : "";

  return `
    <article class="prepared-handoff ${topCandidate ? "ready" : "todo"}">
      <div>
        <h4>${escapeHtml(getUiText("preparedHandoffTitle"))}</h4>
        <p>${escapeHtml(body)}</p>
        ${meta.preparedKind === "mounted-image" ? `<p>${escapeHtml(meta.mountedImageUnmounted ? getUiText("mountedImageUnmounted") : getUiText("mountedImageReady", { drive: meta.mountedImageDrive || target }))}</p>` : ""}
        ${topCandidate ? `<div class="meta-row"><span class="chip good">${escapeHtml(getUiText("preparedRecommendedEntry"))}: ${escapeHtml(topCandidate.file.name)}</span><span class="chip">${escapeHtml(topCandidate.file.path)}</span></div>` : ""}
      </div>
      <div class="handoff-actions">${action}${mountedImageAction}</div>
    </article>
  `;
}

function renderMountedImageAction(meta) {
  if (!desktopApi?.unmountImage || desktopApi.platform !== "win32" || meta?.preparedKind !== "mounted-image" || meta?.mountedImageUnmounted) return "";
  return `
    <button
      type="button"
      data-launch-action="unmount-image"
      data-mounted-image-drive="${escapeHtml(meta.mountedImageDrive || "")}"
    >
      ${escapeHtml(getUiText("unmountImage"))}
    </button>
  `;
}

function renderLaunchAttemptFollowup() {
  if (!pendingLaunchFollowup) return "";
  const symptomIds = ["nothing", "crash", "missing-dll", "mojibake", "black-screen"];
  return `
    <article class="launch-attempt-card">
      <div>
        <h4>${escapeHtml(getUiText("launchAttemptTitle"))}</h4>
        <p>${escapeHtml(getUiText("launchAttemptBody"))}</p>
        <div class="meta-row">
          <span class="chip good">${escapeHtml(pendingLaunchFollowup.entryName || getUiText("launchNow"))}</span>
          <span class="chip">${escapeHtml(pendingLaunchFollowup.relativePath || "")}</span>
        </div>
      </div>
      <div class="launch-attempt-actions">
        <button type="button" data-launch-action="mark-launch-ok">${escapeHtml(getUiText("launchAttemptOk"))}</button>
        ${symptomIds.map((id) => `<button type="button" data-launch-action="mark-launch-symptom" data-symptom-id="${id}">${escapeHtml(getLaunchFailureSymptomText(id, "label"))}</button>`).join("")}
      </div>
    </article>
  `;
}

function renderLaunchFailureFollowUp(analysis) {
  const failure = analysis.launchFailure || normalizeLaunchFailureInput();
  const selected = new Set(failure.symptoms || []);
  const symptomCards = LAUNCH_FAILURE_SYMPTOMS.map(
    (symptom) => `
      <label class="failure-symptom ${selected.has(symptom.id) ? "selected" : ""}">
        <input type="checkbox" data-failure-symptom="${symptom.id}" ${selected.has(symptom.id) ? "checked" : ""} />
        <span>
          <strong>${escapeHtml(getLaunchFailureSymptomText(symptom.id, "label"))}</strong>
          <small>${escapeHtml(getLaunchFailureSymptomText(symptom.id, "hint"))}</small>
        </span>
      </label>
    `,
  ).join("");
  const evidence = getLaunchFailureEvidence(failure);
  const summary = failure.hasEvidence
    ? getUiText("launchFailureEvidenceReady", { count: formatNumber(evidence.length) })
    : getUiText("launchFailureEmptyState");

  return `
    <div class="section-title launch-failure-title">
      <h3>${escapeHtml(getUiText("launchFailureTitle"))}</h3>
      <span>${escapeHtml(summary)}</span>
    </div>
    <article class="launch-failure-card">
      <div class="launch-failure-copy">
        <h4>${escapeHtml(getUiText("launchFailureTitle"))}</h4>
        <p>${escapeHtml(getUiText("launchFailureBody"))}</p>
      </div>
      <div class="launch-failure-form">
        <strong>${escapeHtml(getUiText("launchFailureSymptomsTitle"))}</strong>
        <div class="failure-symptom-grid">${symptomCards}</div>
        <label class="field-label" for="launchFailureNote">${escapeHtml(getUiText("launchFailureNoteLabel"))}</label>
        <textarea
          id="launchFailureNote"
          data-failure-note
          rows="4"
          placeholder="${escapeHtml(getUiText("launchFailureNotePlaceholder"))}"
        >${escapeHtml(failure.note || "")}</textarea>
        <div class="launch-failure-actions">
          <button type="button" data-launch-action="apply-failure">${escapeHtml(getUiText("applyFailureFollowup"))}</button>
          <button type="button" data-launch-action="clear-failure">${escapeHtml(getUiText("clearFailureFollowup"))}</button>
        </div>
      </div>
      ${evidence.length ? `<div class="sample-list failure-evidence">${evidence.map((item) => `<code>${escapeHtml(item)}</code>`).join("")}</div>` : ""}
    </article>
  `;
}

function renderCandidateLaunchAction(candidate, index) {
  if (!desktopApi) return "";
  const canLaunch = canDesktopLaunchFile(candidate.file);
  return `
    <button
      class="launch-entry-button"
      type="button"
      data-launch-action="candidate"
      data-candidate-index="${index}"
      ${canLaunch ? "" : "disabled"}
      title="${escapeHtml(canLaunch ? getUiText("launchNow") : getUiText("launchUnsupported"))}"
    >
      ${escapeHtml(canLaunch ? getUiText("launchNow") : getUiText("launchUnsupported"))}
    </button>
  `;
}

function canDesktopLaunchFile(file) {
  return Boolean(
    desktopApi?.launchEntry &&
      desktopApi.platform === "win32" &&
      file?.fullPath &&
      ["exe", "com"].includes(file.ext),
  );
}

function canDesktopCreateShortcut(file) {
  return Boolean(
    desktopApi?.createShortcut &&
      desktopApi.platform === "win32" &&
      file?.fullPath &&
      ["exe", "com"].includes(file.ext),
  );
}

function renderModeCard(analysis) {
  if (analysis.mode.id === "normal") return "";
  return `
    <article class="finding ${analysis.mode.findingLevel}">
      <div>
        <h4>${escapeHtml(analysis.mode.label)}</h4>
        <p>${escapeHtml(analysis.mode.detail)} ${escapeHtml(getUiText("largeModeReportNote"))}</p>
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
        ${renderEvidenceList(finding.evidence, "finding-evidence")}
      </div>
    </article>
  `;
}

function renderEvidenceList(evidence, className = "") {
  const items = compactEvidence(Array.isArray(evidence) ? evidence : [], 4);
  if (!items.length) return "";
  const extraClass = className ? ` ${className}` : "";
  return `
    <div class="sample-list${extraClass}">
      <strong>${escapeHtml(getUiText("evidenceTitle"))}</strong>
      ${items.map((item) => `<code>${escapeHtml(item)}</code>`).join("")}
    </div>
  `;
}

function renderRoadmap(analysis) {
  const counts = analysis.roadmap.summary.counts;
  return `
    <div class="section-title">
      <h3>${escapeHtml(getUiText("roadmapTitle"))}</h3>
      <span>${analysis.roadmap.steps.length} ${escapeHtml(getUiText("steps"))}</span>
    </div>
    <article class="roadmap-summary ${analysis.roadmap.summary.state}">
      <div>
        <h4>${escapeHtml(analysis.roadmap.summary.label)}</h4>
        <p>${escapeHtml(analysis.roadmap.summary.detail)}</p>
      </div>
      <div class="roadmap-actions">
        <button type="button" data-roadmap-action="copy-checklist">${escapeHtml(getUiText("copyRoadmap"))}</button>
      </div>
    </article>
    <div class="roadmap-counts">
      <span class="blocked">${counts.blocked} ${escapeHtml(getUiText("blockedCount"))}</span>
      <span class="todo">${counts.todo} ${escapeHtml(getUiText("todoCount"))}</span>
      <span class="ready">${counts.ready} ${escapeHtml(getUiText("readyCount"))}</span>
      <span>${counts.info} ${escapeHtml(getUiText("infoCount"))}</span>
    </div>
    <div class="roadmap-list">
      ${analysis.roadmap.steps.map((step, index) => renderRoadmapStep(step, index)).join("")}
    </div>
  `;
}

function renderRoadmapStep(step, index) {
  const evidence = step.evidence.length
    ? `<div class="sample-list roadmap-evidence">${step.evidence.map((item) => `<code>${escapeHtml(item)}</code>`).join("")}</div>`
    : "";

  return `
    <article class="roadmap-step ${step.state}">
      <div class="roadmap-index">${index + 1}</div>
      <div>
        <div class="roadmap-step-header">
          <h4>${escapeHtml(step.title)}</h4>
          <span class="roadmap-state ${step.state}">${escapeHtml(step.stateLabel)}</span>
        </div>
        <p>${escapeHtml(step.detail)}</p>
        <div class="roadmap-action">${escapeHtml(step.action)}</div>
        ${evidence}
      </div>
    </article>
  `;
}

function renderProfiles(analysis) {
  if (!analysis.profiles.length) {
    return `
      <div class="section-title"><h3>${escapeHtml(getUiText("profilesTitle"))}</h3><span>0 ${escapeHtml(getUiText("profiles"))}</span></div>
      <article class="finding warning">
        <div>
          <h4>${escapeHtml(getUiText("noProfilesTitle"))}</h4>
          <p>${escapeHtml(getUiText("noProfilesBody"))}</p>
        </div>
      </article>
      ${renderLaunchHistory()}
    `;
  }

  return `
    <div class="section-title">
      <h3>${escapeHtml(getUiText("profilesTitle"))}</h3>
      <span>${analysis.profiles.length} ${escapeHtml(getUiText("profiles"))}</span>
    </div>
    <article class="finding info">
      <div>
        <h4>${escapeHtml(getUiText("safeModeTitle"))}</h4>
        <p>${escapeHtml(getUiText("safeModeBody"))}</p>
      </div>
    </article>
    <div class="card-list profile-list">
      ${analysis.profiles.map(renderProfileCard).join("")}
    </div>
    ${renderLaunchHistory()}
  `;
}

function renderProfileCard(profile) {
  return `
    <article class="profile-card">
      <div class="profile-header">
        <div>
          <h4>${escapeHtml(profile.title)}</h4>
          <p>${escapeHtml(profile.entryPath)}</p>
        </div>
        <div class="candidate-score">${profile.confidence}</div>
      </div>
      <div class="meta-row">
        <span class="chip good">${escapeHtml(getUiText("entryLabel"))}: ${escapeHtml(profile.entryName)}</span>
        <span class="chip">${escapeHtml(getUiText("workdirLabel"))}: ${escapeHtml(profile.workingDirectory)}</span>
        <span class="chip ${profile.hasDesktopPath ? "good" : "warn"}">${escapeHtml(profile.hasDesktopPath ? getUiText("desktopPathReady") : getUiText("relativePathOnly"))}</span>
      </div>
      <pre class="command-box"><code>${escapeHtml(profile.commandPreview)}</code></pre>
      ${renderLaunchTemplates(profile)}
      <div class="profile-notes">
        ${profile.notes.map((note) => `<span>${escapeHtml(note)}</span>`).join("")}
      </div>
      <div class="profile-actions">
        ${renderProfileLaunchButton(profile)}
        ${renderProfileShortcutButton(profile)}
        <button type="button" data-profile-action="copy-command" data-profile-id="${profile.id}">${escapeHtml(getUiText("copyCommand"))}</button>
        <button type="button" data-profile-action="copy-json" data-profile-id="${profile.id}">${escapeHtml(getUiText("copyJson"))}</button>
        <button type="button" data-profile-action="download-json" data-profile-id="${profile.id}">${escapeHtml(getUiText("downloadConfig"))}</button>
      </div>
    </article>
  `;
}

function renderLaunchTemplates(profile) {
  if (!profile.launchTemplates?.length) return "";
  const language = getAssistantLanguage();
  return `
    <div class="launch-template-list">
      <strong>${escapeHtml(getUiText("launchTemplatesTitle"))}</strong>
      ${profile.launchTemplates
        .map(
          (template) => `
            <article class="launch-template-card">
              <div>
                <h5>${escapeHtml(template.title)}</h5>
                <p>${escapeHtml(getLaunchTemplateDescription(template, language))}</p>
                <code>${escapeHtml(template.command)}</code>
              </div>
              <button type="button" data-profile-action="copy-template" data-profile-id="${profile.id}" data-template-id="${template.id}">
                ${escapeHtml(getUiText("copyTemplate"))}
              </button>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function getLaunchTemplateDescription(template, language = getAssistantLanguage()) {
  return template.descriptionKey ? getUiText(template.descriptionKey, {}, language) : template.description || "";
}

function renderProfileLaunchButton(profile) {
  if (!desktopApi) return "";
  const canLaunch = canDesktopLaunchFile({ ext: getExt(profile.entryName), fullPath: profile.entryFullPath });
  return `
    <button
      class="launch-entry-button"
      type="button"
      data-profile-action="launch"
      data-profile-id="${profile.id}"
      ${canLaunch ? "" : "disabled"}
      title="${escapeHtml(canLaunch ? getUiText("launchNow") : getUiText("launchUnsupported"))}"
    >
      ${escapeHtml(canLaunch ? getUiText("launchNow") : getUiText("launchUnsupported"))}
    </button>
  `;
}

function renderProfileShortcutButton(profile) {
  if (!desktopApi) return "";
  const canCreate = canDesktopCreateShortcut({ ext: getExt(profile.entryName), fullPath: profile.entryFullPath });
  return `
    <button
      type="button"
      data-profile-action="create-shortcut"
      data-profile-id="${profile.id}"
      ${canCreate ? "" : "disabled"}
      title="${escapeHtml(canCreate ? getUiText("createShortcut") : getUiText("launchUnsupported"))}"
    >
      ${escapeHtml(canCreate ? getUiText("createShortcut") : getUiText("launchUnsupported"))}
    </button>
  `;
}

function renderLaunchHistory() {
  if (!desktopApi?.getLaunchHistory) return "";
  const items = desktopLaunchHistory.length
    ? desktopLaunchHistory
        .slice(0, 5)
        .map(
          (item) => `
            <article class="launch-history-item">
              <div>
                <h4>${escapeHtml(item.entryName)}</h4>
                <p>${escapeHtml(item.relativePath)}</p>
              </div>
              <span>${escapeHtml(getUiText("launchedAt"))}: ${escapeHtml(formatLaunchHistoryTime(item.launchedAt))}</span>
            </article>
          `,
        )
        .join("")
    : `
      <article class="finding info">
        <div>
          <h4>${escapeHtml(getUiText("noLaunchHistoryTitle"))}</h4>
          <p>${escapeHtml(getUiText("noLaunchHistoryBody"))}</p>
        </div>
      </article>
    `;

  return `
    <div class="section-title launch-history-title">
      <h3>${escapeHtml(getUiText("launchHistoryTitle"))}</h3>
      <span>${desktopLaunchHistory.length} ${escapeHtml(getUiText("items"))}</span>
    </div>
    <div class="card-list launch-history-list">${items}</div>
  `;
}

function renderEnvironment(analysis) {
  const { environment } = analysis;
  const counts = environment.summary.counts;
  return `
    <div class="section-title">
      <h3>${escapeHtml(getUiText("environmentTitle"))}</h3>
      <span>${environment.checks.length} ${escapeHtml(getUiText("checks"))}</span>
    </div>
    <article class="environment-summary ${environment.summary.status}">
      <div>
        <h4>${escapeHtml(environment.summary.label)}</h4>
        <p>${escapeHtml(environment.summary.detail)}</p>
      </div>
      <div class="environment-counts" aria-label="${escapeHtml(getUiText("environmentCountsLabel"))}">
        <span class="good">${counts.good} ${escapeHtml(getUiText("ok"))}</span>
        <span class="warning">${counts.warning} ${escapeHtml(getUiText("suggestions"))}</span>
        <span class="blocker">${counts.blocker} ${escapeHtml(getUiText("blockers"))}</span>
        <span>${counts.info} ${escapeHtml(getUiText("observations"))}</span>
      </div>
    </article>
    <div class="environment-grid">
      ${environment.checks.map(renderEnvironmentCheck).join("")}
    </div>
  `;
}

function renderEnvironmentCheck(check) {
  const evidence = check.evidence.length
    ? `<div class="sample-list environment-evidence">${check.evidence.map((item) => `<code>${escapeHtml(item)}</code>`).join("")}</div>`
    : "";

  return `
    <article class="environment-check ${check.status}">
      <div class="environment-check-header">
        <h4>${escapeHtml(check.title)}</h4>
        <span class="env-status ${check.status}">${escapeHtml(check.statusLabel)}</span>
      </div>
      <p>${escapeHtml(check.detail)}</p>
      <div class="environment-action">${escapeHtml(check.action)}</div>
      ${evidence}
    </article>
  `;
}

function renderErrorDiagnostics(analysis) {
  const diagnostics = analysis.errorDiagnostics;
  const recipeCount = ERROR_RECIPES.length;

  if (!diagnostics.hasText) {
    return `
      <div class="section-title">
        <h3>${escapeHtml(getUiText("errorsTitle"))}</h3>
        <span>${recipeCount} ${escapeHtml(getUiText("recipes"))}</span>
      </div>
      <article class="error-summary info">
        <div>
          <h4>${escapeHtml(getUiText("noErrorTextTitle"))}</h4>
          <p>${escapeHtml(getUiText("noErrorTextBody"))}</p>
        </div>
      </article>
      ${renderRecipeLibrary()}
    `;
  }

  const matchCards = diagnostics.matches.length
    ? diagnostics.matches.map(renderErrorRecipeMatch).join("")
    : `<article class="error-recipe info"><h4>${escapeHtml(getUiText("noRecipeTitle"))}</h4><p>${escapeHtml(getUiText("noRecipeBody"))}</p></article>`;

  return `
    <div class="section-title">
      <h3>${escapeHtml(getUiText("errorsTitle"))}</h3>
      <span>${diagnostics.matches.length} ${escapeHtml(getUiText("matches"))}</span>
    </div>
    <article class="error-summary ${diagnostics.summary.status}">
      <div>
        <h4>${escapeHtml(diagnostics.summary.label)}</h4>
        <p>${escapeHtml(diagnostics.summary.detail)}</p>
      </div>
      <div class="environment-counts" aria-label="${escapeHtml(getUiText("errorRecipeCountsLabel"))}">
        <span class="warning">${diagnostics.summary.counts.warning} ${escapeHtml(getUiText("suggestions"))}</span>
        <span>${diagnostics.summary.counts.info} ${escapeHtml(getUiText("observations"))}</span>
      </div>
    </article>
    <div class="error-grid">${matchCards}</div>
    ${renderRecipeLibrary()}
  `;
}

function renderErrorRecipeMatch(match) {
  return `
    <article class="error-recipe ${match.level}">
      <div class="error-recipe-header">
        <div>
          <h4>${escapeHtml(match.title)}</h4>
          <p>${escapeHtml(match.cause)}</p>
        </div>
        <span class="env-status ${match.level}">${escapeHtml(match.confidence)}</span>
      </div>
      <div class="environment-action">${escapeHtml(match.action)}</div>
      <ol class="recipe-steps">
        ${(match.checklist || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
      </ol>
      <div class="sample-list environment-evidence">
        ${match.evidence.map((item) => `<code>${escapeHtml(item)}</code>`).join("")}
      </div>
    </article>
  `;
}

function renderRecipeLibrary() {
  const groups = countBy(ERROR_RECIPES, (recipe) => recipe.category || "general");
  const chips = [...groups.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([category, count]) => `<span class="chip">${escapeHtml(category)} ${count}</span>`)
    .join("");

  return `
    <div class="section-title">
      <h3>${escapeHtml(getUiText("recipeCoverageTitle"))}</h3>
      <span>${ERROR_RECIPES.length} ${escapeHtml(getUiText("rules"))}</span>
    </div>
    <article class="recipe-library-card">
      <div class="meta-row">${chips}</div>
    </article>
  `;
}

function renderEngines(analysis) {
  if (!analysis.engines.length) {
    return `
      <div class="section-title"><h3>${escapeHtml(getUiText("engineTitle"))}</h3><span>0 ${escapeHtml(getUiText("matchesLabel"))}</span></div>
      <article class="finding warning"><div><h4>${escapeHtml(getUiText("noEngineTitle"))}</h4><p>${escapeHtml(getUiText("noEngineBody"))}</p></div></article>
    `;
  }

  return `
    <div class="section-title">
      <h3>${escapeHtml(getUiText("engineTitle"))}</h3>
      <span>${analysis.engines.length} ${escapeHtml(getUiText("matchesLabel"))}</span>
    </div>
    <div class="grid-two">
      ${analysis.engines
        .map(
          (engine) => `
            <article class="engine-card">
              <h4>${escapeHtml(engine.name)}</h4>
              <p>${escapeHtml(buildEngineExplanation(engine))}</p>
              <div class="meta-row">
                <span class="chip ${engine.confidence === "high" ? "good" : "warn"}">${engine.confidence}</span>
                <span class="chip">${escapeHtml(getUiText("scoreLabel"))} ${engine.score}</span>
                ${engine.id === "commercial-proprietary" ? `<span class="chip warn">${escapeHtml(getUiText("startupStructure"))}</span>` : ""}
              </div>
              <div class="engine-next-step">
                <strong>${escapeHtml(getUiText("nextStepLabel"))}</strong>
                <p>${escapeHtml(getEngineNextStep(engine))}</p>
              </div>
              ${renderEngineEvidenceDetails(engine)}
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderEngineEvidenceDetails(engine) {
  const primaryDetails = engine.evidenceDetails?.length
    ? engine.evidenceDetails
    : (engine.evidence || []).map((path) => ({ path, reasons: [], weight: 0 }));
  const seen = new Set();
  const details = [];
  for (const detail of primaryDetails) {
    if (!detail?.path || seen.has(detail.path)) continue;
    seen.add(detail.path);
    details.push(detail);
  }
  for (const path of engine.evidence || []) {
    if (!path || seen.has(path)) continue;
    seen.add(path);
    details.push({ path, reasons: ["metadata evidence"], weight: 0 });
  }
  if (!details.length) return "";
  return `
    <div class="sample-list engine-evidence-details">
      <strong>${escapeHtml(getUiText("whyMatched"))}</strong>
      ${details
        .map(
          (detail) => `
            <code>
              ${escapeHtml(detail.path)}
              ${detail.reasons?.length ? `<span>${escapeHtml(detail.reasons.join(" / "))}</span>` : ""}
            </code>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderPackages(analysis) {
  const { packages } = analysis;
  const packageCount = packages.archives.length + packages.discs.length;
  const sets = [...packages.archiveSets, ...packages.discSets];
  const packageCards = sets.length
    ? sets.map(renderPackageSet).join("")
    : `<article class="finding good"><div><h4>${escapeHtml(getUiText("noPackagesTitle"))}</h4><p>${escapeHtml(getUiText("noPackagesBody"))}</p></div></article>`;

  return `
    <div class="section-title">
      <h3>${escapeHtml(getUiText("packagesTitle"))}</h3>
      <span>${packageCount} ${escapeHtml(getUiText("summaryFiles"))}, ${formatBytes(packages.totalSize)}</span>
    </div>
    <div class="package-roadmap">
      ${packages.recommendations
        .map(
          (step, index) => `
            <article>
              <span>${index + 1}</span>
              <div>
                <h4>${escapeHtml(step.title)}</h4>
                <p>${escapeHtml(step.body)}</p>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
    <div class="section-title">
      <h3>${escapeHtml(getUiText("packageResultsTitle"))}</h3>
      <span>${sets.length} ${escapeHtml(getUiText("groups"))}</span>
    </div>
    <div class="grid-two">${packageCards}</div>
  `;
}

function renderPackageSet(set) {
  const chips = [
    `<span class="chip ${set.level === "warning" ? "warn" : "good"}">${escapeHtml(set.summary)}</span>`,
    `<span class="chip">${set.files.length} ${escapeHtml(getUiText("summaryFiles"))}</span>`,
    `<span class="chip">${formatBytes(set.files.reduce((sum, item) => sum + item.file.size, 0))}</span>`,
  ].join("");
  const samples = set.files
    .slice(0, 6)
    .map((item) => `<code>${escapeHtml(item.file.path)} <span>${escapeHtml(item.role)}</span></code>`)
    .join("");

  return `
    <article class="package-card ${set.level}">
      <h4>${escapeHtml(set.format)}</h4>
      <p>${escapeHtml(set.nextStep)}</p>
      <div class="meta-row">${chips}</div>
      <div class="sample-list package-files">${samples}</div>
      ${renderArchivePreview(set.archivePreview)}
      ${renderPreparePackageAction(set)}
    </article>
  `;
}

function renderPreparePackageAction(set) {
  const prepareFile = getPackagePrepareFile(set);
  if (!desktopApi?.preparePackage || !prepareFile?.fullPath || set.missing?.length || set.level === "warning") return "";
  const label = set.type === "disc" ? getUiText("prepareImage") : getUiText("preparePackage");
  return `
    <div class="package-actions">
      <button type="button" data-package-action="prepare" data-package-path="${escapeHtml(prepareFile.fullPath)}">
        ${escapeHtml(label)}
      </button>
    </div>
  `;
}

function getPackagePrepareFile(set) {
  if (!set?.files?.length) return null;
  if (set.type === "archive") return set.firstFile || set.files[0]?.file || null;
  if (set.type === "disc") {
    const preferredExts = ["iso", "cue", "mds", "ccd", "nrg", "isz", "cdi", "img", "bin", "mdf"];
    for (const ext of preferredExts) {
      const match = set.files.find((item) => item.file.ext === ext);
      if (match) return match.file;
    }
    return null;
  }
  return null;
}

function renderArchivePreview(preview) {
  if (!preview) return "";
  const statusClass = preview.status === "ok" ? "good" : "warn";
  const engineNames = (preview.signals?.engineHints || []).slice(0, 2).map((hint) => hint.name);
  const installerCount = preview.signals?.installerCount || 0;
  const fileLabel = preview.packageKind === "disc-image" ? getUiText("imageFiles") : getUiText("internalFiles");
  const sampleFiles = (preview.sampleFiles || [])
    .slice(0, 5)
    .map((file) => `<code>${escapeHtml(file.path)} <span>${formatBytes(file.size || 0)}</span></code>`)
    .join("");
  const warnings = (preview.warnings || []).slice(0, 2).map((warning) => `<span class="chip warn">${escapeHtml(warning)}</span>`).join("");

  return `
    <div class="archive-preview">
      <div class="archive-preview-header">
        <strong>${escapeHtml(getArchivePreviewTitle(preview))}</strong>
        <span class="chip ${statusClass}">${escapeHtml(preview.status === "ok" ? getUiText("metadataOnly") : getUiText("unavailable"))}</span>
      </div>
      <div class="meta-row">
        <span class="chip">${formatNumber(preview.fileCount || 0)} ${escapeHtml(fileLabel)}</span>
        <span class="chip">${formatNumber(preview.signals?.launchCandidateCount || 0)} ${escapeHtml(getUiText("launchClues"))}</span>
        ${installerCount ? `<span class="chip">${formatNumber(installerCount)} ${escapeHtml(getUiText("installerClues"))}</span>` : ""}
        ${engineNames.map((name) => `<span class="chip good">${escapeHtml(name)}</span>`).join("")}
        ${preview.truncated ? `<span class="chip warn">${escapeHtml(getUiText("truncated"))}</span>` : ""}
        ${warnings}
      </div>
      ${sampleFiles ? `<div class="sample-list package-files">${sampleFiles}</div>` : ""}
    </div>
  `;
}

function getArchivePreviewTitle(preview) {
  return preview?.format === "ZIP" ? getUiText("zipPreview") : `${preview?.format || ""} ${getUiText("packagePreview")}`.trim();
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
          <p>${category.count} ${escapeHtml(getUiText("summaryFiles"))}, ${formatBytes(category.size)}</p>
          <div class="sample-list">
            ${category.samples.map((path) => `<code>${escapeHtml(path)}</code>`).join("")}
          </div>
        </article>
      `,
    )
    .join("");

  return `
    <div class="section-title">
      <h3>${escapeHtml(getUiText("assetsTitle"))}</h3>
      <span>${formatBytes(analysis.files.reduce((sum, file) => sum + file.size, 0))}</span>
    </div>
    <article class="asset-card"><div class="asset-bars">${bars}</div></article>
    <div class="section-title"><h3>${escapeHtml(getUiText("samplePathsTitle"))}</h3><span>${escapeHtml(getUiText("localManifest"))}</span></div>
    <div class="grid-two">${cards || `<article class="finding warning"><div><h4>${escapeHtml(getUiText("noAssetsTitle"))}</h4><p>${escapeHtml(getUiText("noAssetsBody"))}</p></div></article>`}</div>
  `;
}

function renderSupport(analysis) {
  const language = getAssistantLanguage();
  const bundle = buildSupportBundle(analysis, errorInput.value, language);
  const manifest = buildSupportManifest(analysis, getDisplayTitle(analysis), new Date().toISOString(), language);
  const entries = bundle.entries.map((entry) => entry.path);
  const topIssues = analysis.findings
    .filter((finding) => finding.level === "blocker" || finding.level === "warning")
    .slice(0, 4);
  const issueCards = topIssues.length
    ? topIssues.map((finding) => `<li><strong>${escapeHtml(finding.title)}</strong><span>${escapeHtml(finding.body)}</span></li>`).join("")
    : `<li><strong>${escapeHtml(getUiText("noBlockersTitle"))}</strong><span>${escapeHtml(getUiText("noBlockersBody"))}</span></li>`;

  return `
    <div class="section-title">
      <h3>${escapeHtml(getUiText("supportBundle"))}</h3>
      <span>${entries.length} ${escapeHtml(getUiText("summaryFiles"))}</span>
    </div>
    <article class="support-summary-card">
      <div>
        <h4>${escapeHtml(bundle.filename)}</h4>
        <p>${escapeHtml(getUiText("supportSummaryBody"))}</p>
      </div>
      <div class="support-actions">
        <button type="button" data-support-action="copy-summary">${escapeHtml(getUiText("copySupportSummary"))}</button>
        <button type="button" data-support-action="copy-manifest">${escapeHtml(getUiText("copyManifest"))}</button>
        <button type="button" data-support-action="download-bundle">${escapeHtml(getUiText("downloadSupportBundle"))}</button>
      </div>
    </article>
    <div class="support-grid">
      <article class="support-card">
        <h4>${escapeHtml(getUiText("privacyBoundary"))}</h4>
        <div class="support-privacy-list">
          <span>${escapeHtml(getUiText("noGameFiles"))}</span>
          <span>${escapeHtml(getUiText("noFileContents"))}</span>
          <span>${escapeHtml(getUiText("zipMetadataOnly"))}</span>
          <span>${escapeHtml(getUiText("relativePaths"))}</span>
          <span>${escapeHtml(getUiText("noUpload"))}</span>
        </div>
      </article>
      <article class="support-card">
        <h4>${escapeHtml(getUiText("diagnosisSummary"))}</h4>
        <div class="support-stat-grid">
          <span><strong>${analysis.status.label}</strong><small>${escapeHtml(getUiText("statusStat"))}</small></span>
          <span><strong>${formatNumber(analysis.files.length)}</strong><small>${escapeHtml(getUiText("filesStat"))}</small></span>
          <span><strong>${analysis.errorDiagnostics.matches.length}</strong><small>${escapeHtml(getUiText("recipesStat"))}</small></span>
          <span><strong>${analysis.environment.checks.length}</strong><small>${escapeHtml(getUiText("checksStat"))}</small></span>
        </div>
      </article>
    </div>
    <div class="section-title">
      <h3>${escapeHtml(getUiText("includedFiles"))}</h3>
      <span>${escapeHtml(getUiText("metadataOnly"))}</span>
    </div>
    <article class="support-card">
      <div class="support-file-list">
        ${entries.map((path) => `<code>${escapeHtml(path)}</code>`).join("")}
      </div>
      <p class="support-note">${escapeHtml(getUiText("exportLimitNote", { count: formatNumber(SUPPORT_BUNDLE_FILE_LIMIT) }))}</p>
    </article>
    <div class="section-title">
      <h3>${escapeHtml(getUiText("copyableSummary"))}</h3>
      <span>${escapeHtml(getUiText("issueReady"))}</span>
    </div>
    <article class="support-card">
      <ul class="support-issue-list">${issueCards}</ul>
      <pre class="support-preview"><code>${escapeHtml(buildSupportSummaryText(analysis, manifest, bundle.filename, language))}</code></pre>
    </article>
  `;
}

function buildRoadmapChecklistText(analysis, language = getAssistantLanguage()) {
  const pack = getAssistantPack(language);
  const labels = pack.labels;
  const lines = [];
  lines.push(`# ${pack.checklistTitle}`);
  lines.push("");
  lines.push(`${labels.project}: ${getDisplayTitle(analysis)}`);
  lines.push(`${labels.assistantLanguage}: ${pack.name}`);
  lines.push(`${labels.summary}: ${analysis.roadmap.summary.label}`);
  lines.push("");
  analysis.roadmap.steps.forEach((step, index) => {
    const marker = step.state === "info" ? "-" : "- [ ]";
    lines.push(`${marker} ${index + 1}. ${step.title} (${step.stateLabel})`);
    lines.push(`  - ${step.action}`);
    if (step.evidence.length) lines.push(`  - ${labels.evidence}: ${step.evidence.join(", ")}`);
  });
  return lines.join("\n");
}

function buildMarkdownReport(analysis, errorText, language = getAssistantLanguage()) {
  const pack = getAssistantPack(language);
  const labels = pack.labels;
  const lines = [];
  lines.push(`# ${pack.reportTitle}`);
  lines.push("");
  lines.push(`- ${labels.root}: ${analysis.roots.map((root) => `${root.name} (${root.count})`).join(", ") || "unknown"}`);
  lines.push(`- ${labels.files}: ${analysis.files.length}`);
  lines.push(`- ${labels.size}: ${formatBytes(analysis.totalSize)}`);
  lines.push(`- ${labels.status}: ${analysis.status.label}`);
  lines.push(`- ${labels.mode}: ${analysis.mode.label}`);
  lines.push(`- ${labels.modeDetail}: ${analysis.mode.detail}`);
  lines.push(`- ${labels.riskFindings}: ${analysis.riskTotal}`);
  lines.push(`- ${labels.assistantLanguage}: ${pack.name}`);
  if (analysis.desktopMeta) {
    lines.push(`- Desktop platform: ${analysis.desktopMeta.platform || "unknown"}`);
    lines.push(`- Desktop selections: ${analysis.desktopMeta.selectedCount || 0}`);
    lines.push(`- Desktop skipped entries: ${analysis.desktopMeta.skipped || 0}`);
    if (analysis.desktopMeta.preparedFrom) lines.push(`- Prepared from: ${analysis.desktopMeta.preparedFrom}`);
    if (analysis.desktopMeta.preparedOutputName) lines.push(`- Prepared output: ${analysis.desktopMeta.preparedOutputName}`);
    if (analysis.desktopMeta.preparedKind) lines.push(`- Prepared kind: ${analysis.desktopMeta.preparedKind}`);
    if (analysis.desktopMeta.mountedImageDrive) lines.push(`- Mounted image drive: ${analysis.desktopMeta.mountedImageDrive}`);
    if (analysis.desktopMeta.mountedImageUnmounted) lines.push("- Mounted image unmounted: yes");
  }
  lines.push("");
  lines.push(`## ${labels.launchCandidates}`);
  if (analysis.launchCandidates.length) {
    for (const candidate of analysis.launchCandidates) {
      lines.push(`- ${candidate.score}/100 ${candidate.file.path} (${candidate.reasons.join(", ") || "candidate"})`);
    }
  } else {
    lines.push(`- ${labels.noLaunch}`);
  }
  lines.push("");
  lines.push(`## ${labels.launchProfiles}`);
  if (analysis.profiles.length) {
    for (const profile of analysis.profiles) {
      lines.push(`- ${profile.title}: ${profile.entryPath}`);
      lines.push(`  - ${labels.workdir}: ${profile.workingDirectory}`);
      lines.push(`  - ${labels.command}: ${profile.commandPreview}`);
      for (const template of profile.launchTemplates || []) {
        lines.push(`  - ${template.title}: ${template.command}`);
      }
      for (const note of profile.notes.slice(0, 4)) lines.push(`  - ${note}`);
    }
  } else {
    lines.push(`- ${labels.noProfiles}`);
  }
  lines.push("");
  lines.push(`## ${labels.launchFailure}`);
  if (analysis.launchFailure?.hasEvidence) {
    const symptoms = (analysis.launchFailure.symptoms || []).map((id) => getLaunchFailureSymptomText(id, "label", language));
    lines.push(`- ${labels.launchFailureSymptoms}: ${symptoms.join(", ") || "none"}`);
    if (analysis.launchFailure.note) lines.push(`- ${labels.launchFailureNote}: ${analysis.launchFailure.note}`);
  } else {
    lines.push(`- ${getUiText("launchFailureEmptyState", {}, language)}`);
  }
  lines.push("");
  lines.push(`## ${labels.nextRoadmap}`);
  lines.push(`- ${labels.summary}: ${analysis.roadmap.summary.label}`);
  lines.push(`- ${labels.detail}: ${analysis.roadmap.summary.detail}`);
  for (const [index, step] of analysis.roadmap.steps.entries()) {
    lines.push(`- ${index + 1}. [${step.state}] ${step.title}: ${step.action}`);
    for (const evidence of step.evidence) lines.push(`  - ${labels.evidence}: ${evidence}`);
  }
  lines.push("");
  lines.push(`## ${labels.environmentChecks}`);
  lines.push(`- ${labels.summary}: ${analysis.environment.summary.label}`);
  lines.push(`- ${labels.detail}: ${analysis.environment.summary.detail}`);
  for (const check of analysis.environment.checks) {
    lines.push(`- [${check.status}] ${check.title}: ${check.detail}`);
    lines.push(`  - ${labels.action}: ${check.action}`);
    for (const evidence of check.evidence) lines.push(`  - ${labels.evidence}: ${evidence}`);
  }
  lines.push("");
  lines.push(`## ${labels.errorRecipes}`);
  if (analysis.errorDiagnostics.hasText) {
    lines.push(`- ${labels.summary}: ${analysis.errorDiagnostics.summary.label}`);
    lines.push(`- ${labels.detail}: ${analysis.errorDiagnostics.summary.detail}`);
    if (analysis.errorDiagnostics.matches.length) {
      for (const match of analysis.errorDiagnostics.matches) {
        lines.push(`- [${match.level}] ${match.title}: ${match.action}`);
        for (const evidence of match.evidence) lines.push(`  - ${labels.evidence}: ${evidence}`);
        for (const step of match.checklist || []) lines.push(`  - ${labels.step}: ${step}`);
      }
    } else {
      lines.push(`- ${labels.noErrorRecipe}`);
    }
  } else {
    lines.push(`- ${labels.noErrorText}`);
  }
  lines.push("");
  lines.push(`## ${labels.engineClues}`);
  if (analysis.engines.length) {
    for (const engine of analysis.engines) {
      lines.push(`- ${engine.name}: ${engine.confidence}, score ${engine.score}`);
      lines.push(`  - ${labels.detail}: ${buildEngineExplanation(engine, language)}`);
      lines.push(`  - ${labels.nextStep}: ${getEngineNextStep(engine, language)}`);
      for (const detail of engine.evidenceDetails || []) {
        lines.push(`  - ${labels.evidence}: ${detail.path}${detail.reasons?.length ? ` (${detail.reasons.join("; ")})` : ""}`);
      }
    }
  } else {
    lines.push(`- ${labels.noEngine}`);
  }
  lines.push("");
  lines.push(`## ${labels.findings}`);
  for (const finding of analysis.findings) {
    lines.push(`- [${finding.level}] ${finding.title}: ${finding.body}`);
  }
  lines.push("");
  lines.push(`## ${labels.packages}`);
  if (analysis.packages.hasPackages) {
    for (const set of [...analysis.packages.archiveSets, ...analysis.packages.discSets]) {
      lines.push(`- ${set.format}: ${set.summary}`);
      lines.push(`  - ${labels.nextStep}: ${set.nextStep}`);
      if (set.archivePreview) {
        lines.push(`  - ${set.archivePreview.format || "Package"} preview: ${set.archivePreview.status}, ${set.archivePreview.fileCount || 0} metadata entries, ${set.archivePreview.signals?.launchCandidateCount || 0} launch clues, ${set.archivePreview.signals?.installerCount || 0} installer clues`);
        for (const sample of set.archivePreview.signals?.launchSamples || []) lines.push(`  - Preview launch clue: ${sample}`);
        for (const sample of set.archivePreview.signals?.installerSamples || []) lines.push(`  - Preview installer clue: ${sample}`);
      }
      for (const item of set.files.slice(0, 8)) {
        lines.push(`  - ${item.file.path} (${item.role})`);
      }
    }
  } else {
    lines.push(`- ${labels.noPackages}`);
  }
  lines.push("");
  lines.push(`## ${labels.assetMap}`);
  for (const category of analysis.categories) {
    lines.push(`- ${category.name}: ${category.count} files, ${formatBytes(category.size)}`);
  }
  if (errorText.trim()) {
    lines.push("");
    lines.push(`## ${labels.errorText}`);
    lines.push("```");
    lines.push(errorText.trim());
    lines.push("```");
  }
  return lines.join("\n");
}

function buildSupportBundle(analysis, errorText, language = getAssistantLanguage()) {
  const title = getDisplayTitle(analysis);
  const generatedAt = new Date().toISOString();
  const safeTitle = slugifyFilename(title, "galaid-diagnosis");
  const diagnosisReport = buildMarkdownReport(analysis, errorText, language);
  const manifest = buildSupportManifest(analysis, title, generatedAt, language);
  const fileManifest = buildFileManifest(analysis);
  const errorRecipeReport = {
    schema: "galaid.errorRecipes.v1",
    hasErrorText: analysis.errorDiagnostics.hasText,
    summary: analysis.errorDiagnostics.summary,
    matches: analysis.errorDiagnostics.matches.map(publicErrorMatch),
  };
  const environmentReport = {
    schema: "galaid.environmentChecks.v1",
    summary: analysis.environment.summary,
    checks: analysis.environment.checks,
  };
  const roadmapReport = {
    schema: "galaid.roadmap.v1",
    summary: analysis.roadmap.summary,
    steps: analysis.roadmap.steps,
    checklist: buildRoadmapChecklistText(analysis, language),
  };
  const launchFailureReport = {
    schema: "galaid.launchFailure.v1",
    hasEvidence: Boolean(analysis.launchFailure?.hasEvidence),
    symptoms: (analysis.launchFailure?.symptoms || []).map((id) => ({
      id,
      label: getLaunchFailureSymptomText(id, "label", language),
      hint: getLaunchFailureSymptomText(id, "hint", language),
    })),
    note: analysis.launchFailure?.note || "",
    privacy: "Manual user-provided symptom notes only; GalAid does not monitor game processes.",
  };
  const profiles = analysis.profiles.map((profile) => getPublicProfile(profile, language));
  const entries = [
    {
      path: "README.txt",
      content: buildSupportReadme(analysis, title, generatedAt, language),
      type: "text/plain;charset=utf-8",
    },
    {
      path: "galaid-report.md",
      content: diagnosisReport,
      type: "text/markdown;charset=utf-8",
    },
    {
      path: "manifest.json",
      content: JSON.stringify(manifest, null, 2),
      type: "application/json;charset=utf-8",
    },
    {
      path: "file-manifest.json",
      content: JSON.stringify(fileManifest, null, 2),
      type: "application/json;charset=utf-8",
    },
    {
      path: "environment-checks.json",
      content: JSON.stringify(environmentReport, null, 2),
      type: "application/json;charset=utf-8",
    },
    {
      path: "roadmap.json",
      content: JSON.stringify(roadmapReport, null, 2),
      type: "application/json;charset=utf-8",
    },
    {
      path: "roadmap-checklist.md",
      content: roadmapReport.checklist,
      type: "text/markdown;charset=utf-8",
    },
    {
      path: "error-recipes.json",
      content: JSON.stringify(errorRecipeReport, null, 2),
      type: "application/json;charset=utf-8",
    },
    {
      path: "launch-profiles.json",
      content: JSON.stringify({ schema: "galaid.launchProfiles.v1", profiles }, null, 2),
      type: "application/json;charset=utf-8",
    },
  ];

  if (launchFailureReport.hasEvidence) {
    entries.push({
      path: "launch-failure.json",
      content: JSON.stringify(launchFailureReport, null, 2),
      type: "application/json;charset=utf-8",
    });
  }

  for (const profile of profiles) {
    entries.push({
      path: `profiles/${profile.title ? slugifyFilename(profile.title, profile.entryPath) : profile.entryPath}.galaid-profile.json`,
      content: JSON.stringify(profile, null, 2),
      type: "application/json;charset=utf-8",
    });
  }

  if (String(errorText || "").trim()) {
    entries.push({
      path: "error-text.txt",
      content: String(errorText).trim(),
      type: "text/plain;charset=utf-8",
    });
  }

  return {
    filename: `${safeTitle}-galaid-support.zip`,
    entries,
  };
}

function buildSupportManifest(analysis, title, generatedAt, language = getAssistantLanguage()) {
  const pack = getAssistantPack(language);
  return {
    schema: "galaid.supportBundle.v1",
    generatedAt,
    title,
    assistantLanguage: {
      code: language,
      name: pack.name,
    },
    privacy: {
      localOnly: true,
      includesGameFiles: false,
      includesFileContents: false,
      includesAbsolutePaths: false,
      pathPolicy: "relative paths only",
    },
    summary: {
      files: analysis.files.length,
      totalSize: analysis.totalSize,
      totalSizeLabel: formatBytes(analysis.totalSize),
      status: analysis.status.label,
      mode: analysis.mode.label,
      riskFindings: analysis.riskTotal,
      launchCandidates: analysis.launchCandidates.length,
      launchProfiles: analysis.profiles.length,
      engineClues: analysis.engines.length,
      engineStructureClues: analysis.engines.length,
      errorRecipeMatches: analysis.errorDiagnostics.matches.length,
      launchFailureEvidence: Boolean(analysis.launchFailure?.hasEvidence),
      environmentChecks: analysis.environment.checks.length,
      roadmapSteps: analysis.roadmap.steps.length,
      archivePreviews: [...analysis.packages.archiveSets, ...analysis.packages.discSets].filter((set) => set.archivePreview).length,
    },
    roots: analysis.roots,
    desktopMeta: analysis.desktopMeta
      ? {
          platform: analysis.desktopMeta.platform || "unknown",
          selectedCount: analysis.desktopMeta.selectedCount || 0,
          skipped: analysis.desktopMeta.skipped || 0,
          preparedFrom: analysis.desktopMeta.preparedFrom || "",
          preparedOutputName: analysis.desktopMeta.preparedOutputName || "",
          preparedKind: analysis.desktopMeta.preparedKind || "",
          mountedImageDrive: analysis.desktopMeta.mountedImageDrive || "",
          mountedImageTool: analysis.desktopMeta.mountedImageTool || "",
          mountedImageUnmounted: Boolean(analysis.desktopMeta.mountedImageUnmounted),
        }
      : null,
  };
}

function buildSupportReadme(analysis, title, generatedAt, language = getAssistantLanguage()) {
  const pack = getAssistantPack(language);
  const labels = pack.labels;
  return [
    pack.supportBundleTitle,
    "",
    `${labels.project}: ${title}`,
    `${labels.generated}: ${generatedAt}`,
    `${labels.status}: ${analysis.status.label}`,
    `${labels.files}: ${formatNumber(analysis.files.length)}`,
    `${labels.size}: ${formatBytes(analysis.totalSize)}`,
    `${labels.assistantLanguage}: ${pack.name}`,
    "",
    `${labels.privacy}:`,
    `- ${labels.privacyMetadata}`,
    `- ${labels.privacyZip}`,
    `- ${labels.privacyPaths}`,
    "",
    "Included files:",
    "- galaid-report.md: human-readable diagnosis",
    "- manifest.json: bundle summary",
    "- file-manifest.json: sanitized file list metadata",
    "- environment-checks.json: environment checklist",
    "- roadmap.json and roadmap-checklist.md: ordered next-step plan",
    "- error-recipes.json: matched error recipes",
    "- launch-failure.json: optional manual launch-failure follow-up notes",
    "- launch-profiles.json and profiles/*.json: safe launch profile hints",
  ].join("\n");
}

function buildSupportSummaryText(analysis, manifest, filename, language = getAssistantLanguage()) {
  const pack = getAssistantPack(language);
  const labels = pack.labels;
  const lines = [];
  const topLaunch = analysis.launchCandidates[0];
  const engineNames = analysis.engines.slice(0, 3).map((engine) => engine.name);
  const warnings = analysis.findings
    .filter((finding) => finding.level === "blocker" || finding.level === "warning")
    .slice(0, 5);

  lines.push(`## ${pack.supportTitle}`);
  lines.push("");
  lines.push(`- ${labels.project}: ${manifest.title}`);
  lines.push(`- ${labels.assistantLanguage}: ${pack.name}`);
  lines.push(`- ${labels.status}: ${analysis.status.label}`);
  lines.push(`- ${labels.files}: ${formatNumber(analysis.files.length)} files / ${formatBytes(analysis.totalSize)}`);
  lines.push(`- ${labels.mode}: ${analysis.mode.label}`);
  lines.push(`- ${labels.recommendedEntry}: ${topLaunch ? `${topLaunch.file.path} (${topLaunch.score}/100)` : labels.noLaunch}`);
  lines.push(`- ${labels.engineClues}: ${engineNames.length ? engineNames.join(", ") : labels.noEngine}`);
  if (analysis.launchFailure?.hasEvidence) {
    lines.push(`- ${labels.launchFailure}: ${getLaunchFailureEvidence(analysis.launchFailure, language).join(", ")}`);
  }
  lines.push(`- ${labels.environmentConclusion}: ${analysis.environment.summary.label}`);
  lines.push(`- ${labels.nextStep}: ${analysis.roadmap.summary.label}`);
  lines.push(`- ${labels.recipeResult}: ${analysis.errorDiagnostics.summary.label}`);
  lines.push(`- ${labels.supportFile}: ${filename}`);
  lines.push("");
  lines.push(`### ${labels.mainNotices}`);
  if (warnings.length) {
    for (const finding of warnings) lines.push(`- [${finding.level}] ${finding.title}: ${finding.body}`);
  } else {
    lines.push(`- ${labels.noBlockers}`);
  }
  lines.push("");
  lines.push(`### ${labels.route}`);
  for (const [index, step] of analysis.roadmap.steps.slice(0, 6).entries()) {
    lines.push(`- ${index + 1}. ${step.title}: ${step.action}`);
  }
  lines.push("");
  lines.push(`### ${labels.privacy}`);
  lines.push(`- ${labels.privacyMetadata}`);
  lines.push(`- ${labels.privacyZip}`);
  lines.push(`- ${labels.privacyPaths}`);
  return lines.join("\n");
}

function buildFileManifest(analysis) {
  const files = analysis.files.slice(0, SUPPORT_BUNDLE_FILE_LIMIT).map((file) => ({
    path: file.path,
    name: file.name,
    ext: file.ext,
    size: file.size,
    sizeLabel: formatBytes(file.size),
    depth: file.depth,
  }));

  return {
    schema: "galaid.fileManifest.v1",
    fileCount: analysis.files.length,
    includedCount: files.length,
    truncated: analysis.files.length > files.length,
    limit: SUPPORT_BUNDLE_FILE_LIMIT,
    totalSize: analysis.totalSize,
    totalSizeLabel: formatBytes(analysis.totalSize),
    roots: analysis.roots,
    categories: analysis.categories.map((category) => ({
      id: category.id,
      name: category.name,
      count: category.count,
      size: category.size,
      sizeLabel: formatBytes(category.size),
      samples: category.samples,
    })),
    archivePreviews: analysis.packages.archiveSets
      .filter((set) => set.archivePreview)
      .map((set) => ({
        archivePath: set.firstFile?.path || "",
        format: set.archivePreview.format,
        status: set.archivePreview.status,
        fileCount: set.archivePreview.fileCount || 0,
        directoryCount: set.archivePreview.directoryCount || 0,
        launchCandidateCount: set.archivePreview.signals?.launchCandidateCount || 0,
        launchSamples: set.archivePreview.signals?.launchSamples || [],
        engineHints: (set.archivePreview.signals?.engineHints || []).map((hint) => ({
          id: hint.id,
          name: hint.name,
          count: hint.count,
          samples: hint.samples,
        })),
        truncated: Boolean(set.archivePreview.truncated),
        warnings: set.archivePreview.warnings || [],
        sampleFiles: (set.archivePreview.sampleFiles || []).slice(0, 20).map((file) => ({
          path: file.path,
          ext: file.ext,
          size: file.size,
          sizeLabel: formatBytes(file.size || 0),
        })),
      })),
    files,
  };
}

function publicErrorMatch(match) {
  return {
    id: match.id,
    title: match.title,
    category: match.category,
    level: match.level,
    confidence: match.confidence,
    evidence: match.evidence,
    cause: match.cause,
    action: match.action,
    checklist: match.checklist || [],
  };
}

function downloadSupportBundle(analysis, errorText) {
  const bundle = buildSupportBundle(analysis, errorText);
  const blob = createZipBlob(bundle.entries);
  downloadBlob(bundle.filename, blob);
  showToast(getUiText("toastSupportCreated"));
}

function createZipBlob(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  const now = new Date();
  const dosTime = getDosTime(now);
  const dosDate = getDosDate(now);
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(cleanZipPath(entry.path));
    const dataBytes = typeof entry.content === "string" ? encoder.encode(entry.content) : new Uint8Array(entry.content || []);
    const crc = crc32(dataBytes);
    const localHeader = makeZipLocalHeader(nameBytes, dataBytes, crc, dosTime, dosDate);
    const centralHeader = makeZipCentralHeader(nameBytes, dataBytes, crc, dosTime, dosDate, offset);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = makeZipEndRecord(entries.length, centralSize, offset);
  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

function cleanZipPath(pathValue) {
  return String(pathValue || "file.txt")
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

function makeZipLocalHeader(nameBytes, dataBytes, crc, dosTime, dosDate) {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, dosTime, true);
  view.setUint16(12, dosDate, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, dataBytes.length, true);
  view.setUint32(22, dataBytes.length, true);
  view.setUint16(26, nameBytes.length, true);
  view.setUint16(28, 0, true);
  header.set(nameBytes, 30);
  return header;
}

function makeZipCentralHeader(nameBytes, dataBytes, crc, dosTime, dosDate, offset) {
  const header = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, dosTime, true);
  view.setUint16(14, dosDate, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, dataBytes.length, true);
  view.setUint32(24, dataBytes.length, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);
  header.set(nameBytes, 46);
  return header;
}

function makeZipEndRecord(entryCount, centralSize, centralOffset) {
  const record = new Uint8Array(22);
  const view = new DataView(record.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);
  return record;
}

function getDosTime(date) {
  return (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
}

function getDosDate(date) {
  const year = Math.max(1980, date.getFullYear()) - 1980;
  return (year << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

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

function getPublicProfile(profile, language = getAssistantLanguage()) {
  return {
    ...profile.config,
    checks: profile.checks,
    notes: profile.notes,
    launchTemplates: (profile.launchTemplates || []).map((template) => ({
      ...template,
      description: getLaunchTemplateDescription(template, language),
    })),
    privacy: "This profile intentionally omits absolute local paths.",
  };
}

async function copyText(text, successMessage) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(text);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.append(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  }
  showToast(successMessage);
}

function downloadText(filename, text, type = "application/json;charset=utf-8") {
  const blob = new Blob([text], { type });
  downloadBlob(filename, blob);
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function refreshDesktopLaunchHistory({ rerender = false } = {}) {
  if (!desktopApi?.getLaunchHistory) return;
  try {
    const history = await desktopApi.getLaunchHistory();
    desktopLaunchHistory = Array.isArray(history) ? history : [];
    if (rerender && currentAnalysis) render();
  } catch {
    desktopLaunchHistory = [];
  }
}

function formatLaunchHistoryTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function launchDesktopFile(file, button) {
  if (!desktopApi?.launchEntry) {
    showToast(getUiText("toastLaunchUnavailable"));
    return;
  }
  if (!canDesktopLaunchFile(file)) {
    showToast(getUiText(desktopApi.platform === "win32" ? "launchUnsupported" : "toastLaunchUnavailable"));
    return;
  }

  const originalLabel = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = getUiText("launching");
  }

  try {
    const result = await desktopApi.launchEntry({ entryFullPath: file.fullPath });
    if (result?.ok) {
      pendingLaunchFollowup = {
        entryName: result.entryName || file.name,
        relativePath: result.relativePath || file.path || file.name,
        launchedAt: new Date().toISOString(),
      };
      showToast(getUiText("toastLaunchStarted", { name: result.entryName || file.name }));
      await refreshDesktopLaunchHistory({ rerender: true });
    } else {
      showToast(result?.message || getUiText("toastLaunchFailed"));
    }
  } catch {
    showToast(getUiText("toastLaunchFailed"));
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
}

function markLaunchAttemptOk() {
  pendingLaunchFollowup = null;
  if (currentAnalysis) render();
  showToast(getUiText("launchAttemptDismissed"));
}

function markLaunchAttemptSymptom(symptomId) {
  const knownIds = new Set(LAUNCH_FAILURE_SYMPTOMS.map((symptom) => symptom.id));
  if (!knownIds.has(symptomId)) return;
  launchFailureState = normalizeLaunchFailureInput({
    symptoms: [...new Set([...(launchFailureState.symptoms || []), symptomId])],
    note: launchFailureState.note || "",
  });
  pendingLaunchFollowup = null;
  rerunCurrentAnalysis();
  showToast(getUiText("launchAttemptMarked"));
}

async function unmountPreparedImage(button) {
  if (!desktopApi?.unmountImage || !currentAnalysis?.desktopMeta?.mountedImageDrive) {
    showToast(getUiText("toastImageUnmountFailed"));
    return;
  }

  const originalLabel = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = getUiText("unmountingImage");
  }

  try {
    const result = await desktopApi.unmountImage({
      mountedImageDrive: currentAnalysis.desktopMeta.mountedImageDrive,
    });
    if (result?.ok) {
      currentAnalysis.desktopMeta.mountedImageUnmounted = true;
      refreshCurrentReport();
      render();
      showToast(getUiText("toastImageUnmounted", { name: result.mountedImageName || currentAnalysis.desktopMeta.preparedFrom || currentAnalysis.desktopMeta.mountedImageDrive }));
      return;
    }
    showToast(result?.message || getUiText("toastImageUnmountFailed"));
  } catch {
    showToast(getUiText("toastImageUnmountFailed"));
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
}

async function createDesktopShortcut(file, button) {
  if (!desktopApi?.createShortcut) {
    showToast(getUiText("toastLaunchUnavailable"));
    return;
  }
  if (!canDesktopCreateShortcut(file)) {
    showToast(getUiText(desktopApi.platform === "win32" ? "launchUnsupported" : "toastLaunchUnavailable"));
    return;
  }

  const originalLabel = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = getUiText("creatingShortcut");
  }

  try {
    const result = await desktopApi.createShortcut({ entryFullPath: file.fullPath });
    if (result?.ok) {
      showToast(getUiText("toastShortcutCreated", { name: result.shortcutName || file.name }));
    } else if (result?.errorCode !== "canceled") {
      showToast(result?.message || getUiText("toastShortcutFailed"));
    }
  } catch {
    showToast(getUiText("toastShortcutFailed"));
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
}

async function prepareDesktopPackage(packageFile, packageSet, button) {
  if (!desktopApi?.preparePackage || !packageFile?.fullPath) {
    showToast(getUiText("toastLaunchUnavailable"));
    return;
  }

  let password = "";
  if ((packageSet?.archivePreview?.encryptedEntries || 0) > 0) {
    const entered = window.prompt(getUiText("preparePasswordPrompt"), "");
    if (!entered) return;
    password = entered;
  }

  const originalLabel = button?.textContent || "";
  const preparingLabel = packageSet?.type === "disc" ? getUiText("preparingImage") : getUiText("preparingPackage");
  const runId = ++scanRunId;
  setControlsBusy(true);
  if (button) {
    button.disabled = true;
    button.textContent = preparingLabel;
  }

  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      updateScanState({
        title: preparingLabel,
        detail: packageFile.name,
        progress: 22,
        phase: "scanning",
      });

      const result = await desktopApi.preparePackage({
        packageFullPath: packageFile.fullPath,
        password,
      });

      if (runId !== scanRunId) return;
      if (result?.ok) {
        await setFiles(result.files || [], { runId, desktopMeta: result.meta });
        showToast(getUiText("toastPackagePrepared", { name: result.meta?.preparedOutputName || packageFile.name }));
        if (currentAnalysis?.launchCandidates?.length) activateTab("launch");
        return;
      }

      if (result?.errorCode === "canceled") return;
      if (result?.errorCode === "password-required" || result?.errorCode === "password-failed") {
        const entered = window.prompt(getUiText("preparePasswordRetryPrompt"), "");
        if (!entered) return;
        password = entered;
        continue;
      }

      showToast(getPrepareFailureMessage(result));
      return;
    }
  } catch {
    showToast(getUiText("toastPrepareFailed"));
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
    if (runId === scanRunId) setControlsBusy(false);
  }
}

function getPrepareFailureMessage(result) {
  const code = result?.errorCode;
  if (code === "tool-missing") return getUiText("toastPrepareToolMissing");
  if (code === "unsupported-package" || code === "follow-up-volume") return getUiText("toastPrepareUnsupported");
  if (code === "unsupported-image" || code === "image-prepare-failed" || code === "mount-failed") return getUiText("toastPrepareImageFailed");
  if (code === "missing-volume") return getUiText("toastPrepareMissingVolume");
  if (code === "damaged-package") return getUiText("toastPrepareDamaged");
  return result?.message || getUiText("toastPrepareFailed");
}

function findPackageSetByFullPath(fullPath) {
  const sets = [...(currentAnalysis?.packages?.archiveSets || []), ...(currentAnalysis?.packages?.discSets || [])];
  return sets.find((set) =>
    set.files.some((item) => item.file.fullPath === fullPath),
  );
}

function activateTab(tabName) {
  document.querySelector(`[data-tab="${tabName}"]`)?.click();
}

function readLaunchFailureForm() {
  return {
    symptoms: [...launchPanel.querySelectorAll("[data-failure-symptom]:checked")].map((input) => input.dataset.failureSymptom),
    note: launchPanel.querySelector("[data-failure-note]")?.value || "",
  };
}

function rerunCurrentAnalysis() {
  if (!currentFiles.length) return;
  const desktopMeta = currentAnalysis?.desktopMeta;
  currentAnalysis = analyze(currentFiles, errorInput.value, launchFailureState);
  if (desktopMeta) currentAnalysis.desktopMeta = desktopMeta;
  refreshCurrentReport();
  updateScanState({
    title: currentAnalysis.mode.label,
    detail: currentAnalysis.mode.detail,
    progress: 100,
    phase: currentAnalysis.mode.id === "normal" ? "ready" : "large",
  });
  render();
}

launchPanel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-launch-action]");
  if (!button || !currentAnalysis) return;

  if (button.dataset.launchAction === "candidate") {
    const candidate = currentAnalysis.launchCandidates[Number(button.dataset.candidateIndex)];
    if (candidate?.file) void launchDesktopFile(candidate.file, button);
  } else if (button.dataset.launchAction === "mark-launch-ok") {
    markLaunchAttemptOk();
  } else if (button.dataset.launchAction === "mark-launch-symptom") {
    markLaunchAttemptSymptom(button.dataset.symptomId);
  } else if (button.dataset.launchAction === "unmount-image") {
    void unmountPreparedImage(button);
  } else if (button.dataset.launchAction === "apply-failure") {
    launchFailureState = readLaunchFailureForm();
    pendingLaunchFollowup = null;
    rerunCurrentAnalysis();
    showToast(getUiText("toastFailureUpdated"));
  } else if (button.dataset.launchAction === "clear-failure") {
    launchFailureState = getEmptyLaunchFailureState();
    pendingLaunchFollowup = null;
    rerunCurrentAnalysis();
    showToast(getUiText("toastFailureCleared"));
  }
});

profilesPanel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-profile-action]");
  if (!button || !currentAnalysis) return;

  const profile = currentAnalysis.profiles.find((item) => item.id === button.dataset.profileId);
  if (!profile) return;

  const action = button.dataset.profileAction;
  const profileJson = JSON.stringify(getPublicProfile(profile, getAssistantLanguage()), null, 2);
  if (action === "launch") {
    void launchDesktopFile(
      {
        name: profile.entryName,
        ext: getExt(profile.entryName),
        fullPath: profile.entryFullPath,
      },
      button,
    );
  } else if (action === "create-shortcut") {
    void createDesktopShortcut(
      {
        name: profile.entryName,
        ext: getExt(profile.entryName),
        fullPath: profile.entryFullPath,
      },
      button,
    );
  } else if (action === "copy-template") {
    const template = profile.launchTemplates?.find((item) => item.id === button.dataset.templateId);
    if (template) void copyText(template.command, getUiText("toastTemplateCopied"));
  } else if (action === "copy-command") {
    const command = profile.hasDesktopPath ? profile.commandAbsolute : profile.commandPreview;
    void copyText(command, profile.hasDesktopPath ? getUiText("toastDesktopCommandCopied") : getUiText("toastRelativeCommandCopied"));
  } else if (action === "copy-json") {
    void copyText(profileJson, getUiText("toastProfileJsonCopied"));
  } else if (action === "download-json") {
    downloadText(`${profile.id}.galaid-profile.json`, profileJson);
  }
});

roadmapPanel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-roadmap-action]");
  if (!button || !currentAnalysis) return;

  if (button.dataset.roadmapAction === "copy-checklist") {
    void copyText(buildRoadmapChecklistText(currentAnalysis, getAssistantLanguage()), getUiText("toastRoadmapCopied"));
  }
});

supportPanel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-support-action]");
  if (!button || !currentAnalysis) return;

  const language = getAssistantLanguage();
  const bundle = buildSupportBundle(currentAnalysis, errorInput.value, language);
  const manifestEntry = bundle.entries.find((entry) => entry.path === "manifest.json");
  const manifest = JSON.parse(manifestEntry.content);
  const action = button.dataset.supportAction;

  if (action === "copy-summary") {
    void copyText(buildSupportSummaryText(currentAnalysis, manifest, bundle.filename, language), getUiText("toastSummaryCopied"));
  } else if (action === "copy-manifest") {
    void copyText(manifestEntry.content, getUiText("toastManifestCopied"));
  } else if (action === "download-bundle") {
    downloadSupportBundle(currentAnalysis, errorInput.value);
  }
});

packagesPanel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-package-action]");
  if (!button || !currentAnalysis) return;

  if (button.dataset.packageAction === "prepare") {
    const fullPath = button.dataset.packagePath || "";
    const packageSet = findPackageSetByFullPath(fullPath);
    const packageFile = packageSet?.files.find((item) => item.file.fullPath === fullPath)?.file;
    if (packageFile) void prepareDesktopPackage(packageFile, packageSet, button);
  }
});

chooseFolderButton.addEventListener("click", () => {
  if (desktopApi) {
    void importDesktopSelection("folder");
    return;
  }
  folderInput.click();
});
chooseFilesButton.addEventListener("click", () => {
  if (desktopApi) {
    void importDesktopSelection("files");
    return;
  }
  fileInput.click();
});
sampleButton.addEventListener("click", () => {
  void setFiles(SAMPLE_FILES.map(fileFromSample));
});
commercialSampleButton.addEventListener("click", () => {
  void setFiles(COMMERCIAL_SAMPLE_FILES.map(fileFromSample));
});
packageSampleButton.addEventListener("click", () => {
  void setFiles(PACKAGE_SAMPLE_FILES.map(fileFromSample));
});
clearButton.addEventListener("click", () => {
  scanRunId += 1;
  currentFiles = [];
  currentAnalysis = null;
  launchFailureState = getEmptyLaunchFailureState();
  pendingLaunchFollowup = null;
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
  rerunCurrentAnalysis();
});

assistantLanguageSelect.addEventListener("change", () => {
  try {
    window.localStorage?.setItem(ASSISTANT_LANGUAGE_STORAGE_KEY, getAssistantLanguage());
  } catch {
    // Ignore storage failures; the selected value still applies to this session.
  }
  refreshCurrentReport();
  applyStaticUiLanguage();
  if (currentAnalysis) render();
  else renderEmpty();
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
    title: getUiText("scanDroppedFolder"),
    detail: getUiText("scanWalkingTree"),
    progress: 8,
    phase: "scanning",
  });
  try {
    const files = await collectDroppedFiles(event.dataTransfer, (done, total) => {
      if (runId !== scanRunId) return;
      updateScanState({
        title: getUiText("scanDroppedFolder"),
        detail: total
          ? getUiText("scanFilesIndexed", { done: formatNumber(done), total: formatNumber(total) })
          : getUiText("scanFilesIndexedSolo", { done: formatNumber(done) }),
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
    showToast(getUiText("toastNoReport"));
    return;
  }
  await copyText(currentAnalysis.report, getUiText("toastReportCopied"));
});

downloadReportButton.addEventListener("click", () => {
  if (!currentAnalysis) {
    showToast(getUiText("toastNoReport"));
    return;
  }
  downloadText("galaid-report.md", currentAnalysis.report, "text/markdown;charset=utf-8");
});

downloadBundleButton.addEventListener("click", () => {
  if (!currentAnalysis) {
    showToast(getUiText("toastNoDiagnosis"));
    return;
  }
  downloadSupportBundle(currentAnalysis, errorInput.value);
});

applyStaticUiLanguage();
renderEmpty();
