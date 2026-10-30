# T3 Code 简体中文界面

本 fork 基于官方稳定版 [v0.1.5](https://github.com/pingdotgg/t3code/releases/tag/v0.1.5)，为桌面端和 Web 提供简体中文界面，与 T3 Code 官方团队无隶属关系。

## 切换语言

进入 **Settings → General → App language**（设置 → 常规 → 应用语言），选择 **简体中文**、**English** 或 **跟随系统**。语言保存在当前客户端；桌面菜单同步切换。中文系统默认显示中文，暂不支持的系统语言回退到英文。

主要覆盖项目与任务、侧栏、对话操作、设置、命令面板、Pull Request、用量、配对和常见提示。模型名称、命令、快捷键、路径、URL、Git 标识符和用户内容保留原文；第三方动态消息及未收录文案回退到英文。Android 和 iOS 不在此 fork 的汉化范围内。

## 源码运行

使用仓库锁定的 Node 和包管理器版本，按官方 [开发说明](docs/internals/overview.md)安装现有依赖：

```sh
vp i
vp run dev
```

桌面开发使用 `vp run dev:desktop`。官方安装脚本、Homebrew 和 `npx t3@latest` 安装的是官方版，无法安装此 fork 的中文改动。

打包时将 `T3CODE_DESKTOP_UPDATE_REPOSITORY` 指向 `soul99soul-glitch/t3code`，避免构建配置指向官方更新源。当前没有为此 fork 发布安装包或更新服务。

## 来源与许可证

产品与核心实现来自 [pingdotgg/t3code](https://github.com/pingdotgg/t3code)。语言解析、翻译目录及大量界面汉化复用并适配自肖志伟维护的 [ZhiweiXiao98/t3code](https://github.com/ZhiweiXiao98/t3code)，参考提交为 [`9190762640a415c4d9b4ceb53c52289ccc237cbc`](https://github.com/ZhiweiXiao98/t3code/commit/9190762640a415c4d9b4ceb53c52289ccc237cbc)。保留原有 [MIT 许可证](LICENSE)与版权声明。

此分支仅移植桌面端、Web 与必要的共享语言代码，没有引入参考仓库的移动端、托盘行为或发布工作流改动。跟进官方版本时，以新的稳定标签为基线合并，补齐新增文案并运行 `vp run check:changed <原稳定标签>`。
