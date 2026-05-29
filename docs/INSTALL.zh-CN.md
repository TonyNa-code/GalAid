# GalAid 中文快速安装与群分享稿

这份文档给第一次使用 GalAid 的玩家看。想快速发到 QQ 群、论坛或朋友聊天里，可以直接复制下面的短文案。

## 直接下载

- Windows 便携版：<https://github.com/TonyNa-code/GalAid/releases/download/v0.1.9-beta/GalAid-0.1.9-win-x64.exe>
- 发布页：<https://github.com/TonyNa-code/GalAid/releases/tag/v0.1.9-beta>
- 网页预览：<https://TonyNa-code.github.io/GalAid/>

Windows 便携版是主推荐。网页预览适合先看界面和诊断逻辑，但浏览器无法像桌面版一样直接启动本地游戏。

## 群分享短文案

分享一个自制的 galgame 启动辅助工具 GalAid。把刚下好的压缩包、分卷包、镜像文件或已经解压的游戏文件夹拖进桌面端，软件会自动识别包/镜像结构、预检启动入口和常见运行环境线索。需要解压密码时会提示输入，准备完成后再点一次启动，就会按推荐入口和正确工作目录帮你启动。

如果启动失败，可以把报错截图拖进去 OCR，或者直接粘贴报错文字；GalAid 会给出简明诊断路线，也能导出不包含游戏文件的求助包，方便在群里问人。项目开源，适合想折腾兼容性规则、报错配方和泛用启动器的同好一起改。

项目地址：<https://github.com/TonyNa-code/GalAid>

## 第一次使用

1. 下载 `GalAid-0.1.9-win-x64.exe`。
2. 双击打开桌面版。
3. 把压缩包、镜像、分卷第一卷或游戏文件夹拖进去。
4. 如果提示输入密码，填你已经知道的解压密码。
5. 点主按钮，让 GalAid 准备、重扫并启动推荐入口。
6. 如果没有直接打开游戏，按界面里的失败现象或报错诊断继续走。

## 它会自动处理什么

- 普通压缩包：`.zip/.rar/.7z/.lzh/.lha/.arj/.cab/.tar/.tgz/.tar.gz`
- 分卷包：优先从第一卷开始，例如 `.part1.rar`、`.zip + .z01`
- 自解压包：能列出内部目录的 `.exe` 会先按包处理
- 镜像文件：`.iso/.cue/.bin/.mds/.mdf/.ccd/.img/.sub/.nrg/.mdx/.daa/.uif/.pdi`
- 安装盘入口：`setup.exe`、`install.exe`、`autorun.exe`、`.msi`、`autorun.inf` 指向的安装脚本
- 常见运行环境线索：DirectX、VC++、.NET、VB6、QuickTime/旧视频组件、RPG Maker RTP、日文 locale、旧 Windows 兼容模式

## 常见情况

**压缩包需要密码**

GalAid 会弹窗要求输入密码。密码不会写进报告、求助包或启动历史。

**只有安装器，没有游戏本体**

GalAid 会把它当作安装盘入口。先打开安装器，安装完成后再把安装后的游戏目录拖回 GalAid。

**提示压缩包损坏或分卷不完整**

补齐缺失分卷或重新获取完整文件后再试。GalAid 可以指出更像哪一类问题，但不能修复已经损坏的数据。

**游戏很老，像 Win95/Win98/WinXP 时代**

GalAid 会先判断入口是不是 DOS、Win16、旧 Win32 或安装盘路线。能直接启动的 Win32 入口仍可尝试；失败后再按界面建议检查兼容模式、短英文路径、旧 DirectX/运行库和视频组件。

**想求助别人**

打开求助页导出支持包。支持包只包含诊断元数据、相对路径、报错路线和隐私摘要，不包含游戏文件。用户粘贴进去的本机绝对路径会被替换成 `[absolute-path]`。

## 校验下载文件

GitHub Release 页面会展示资产信息。当前 Windows 便携版文件名应为 `GalAid-0.1.9-win-x64.exe`。如果需要比对，可以在发布页查看资产 digest，或用本机工具计算 SHA-256。

