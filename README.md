# 观知框架

观知框架是一个可复用的学习网站底层。它提供教材型学习网站需要的页面结构、视觉系统和学习交互，内容由具体站点自行接入。

框架包含：

- 首页、大纲、真题库、模拟库、资料库、云助手、设置，以及题收藏和错题集；
- 教材 → 章节 → 题型的可折叠大纲；
- 右侧分题型答题卡、主观题作答、客观题选项、判断题、整卷交卷；
- 答题草稿恢复、收藏、错题、统一批改和“一题一改”；
- 护眼绿、雾蓝、丁香紫、暖杏、浅玫瑰、岩灰六种主题，浅色、深色和跟随系统模式；
- 可配置的 OpenAI、DeepSeek、智谱 GLM、MiniMax、自定义服务接入界面；
- 本机偏好与学习记录、可选云端同步适配器；
- 无科目、教材、题库、原题或示范题内置内容。

## 运行

```sh
npm run dev
```

打开终端显示的本地地址。项目是原生 HTML、CSS 和 JavaScript 模块，无需前端构建即可运行。

```sh
npm run check
```

检查模块语法、内容为空约束、题型契约、AI 服务商配置和通用评分逻辑。

## 内容接入

编辑 [dist/content.js](/Users/jocelyn/Desktop/观知框架/dist/content.js) 中的 `siteContent`：

```js
export const siteContent = {
  name: '你的站点名称',
  subtitle: '副标题',
  subject: '科目名称',
  textbooks: [{ id, title, author, edition, cover, chapters }],
  questions: [{ id, source: 'past' | 'mock', type, textbookId, chapterId, title, answer, score }],
  papers: [{ id, source, title, year, description }],
  materials: [{ id, title, type, textbookId, fileUrl, description }],
  examTracks: [{ id, label }],
};
```

所有 ID 应保持唯一、稳定。`source: 'past'` 才会进入教材章节的“考过什么”；`source: 'mock'` 独立显示在模拟库。`type` 可以使用 `term`、`short`、`case`、`essay`、`single`、`multiple`、`judge` 或 `choice`。选择题等通用题型保留在框架里，具体站点可以通过内容数据决定是否使用。

章节题目可以通过 `chapterId` 直接关联，也可以在站点适配器中提供 `chapterReferences`；框架不会自行猜测教材出处。主观题可以录入 `grading.points`，每个要点包含 `text`、`keywords` 和 `score`；没有评分要点时，答题页保留对照答案自评流程。客观题使用 `options` 和 `correctAnswer`，判断题使用 `format: 'boolean'`。

## AI 接入

设置页的“智能服务接入”提供五个服务商预设：OpenAI、DeepSeek、智谱 GLM、MiniMax、自定义。API Key、接口地址和模型名保存在当前浏览器的 `guanzhi:ai-config` 中，源码、示范内容和 Git 提交中不包含任何密钥。

`dist/ai-config.js` 是前端配置契约，`dist/ai-client.js` 会将服务商和模型信息以请求头及请求字段传给站点自己的 `/api/grade`、`/api/chat` 后台。框架本身不替具体服务商保存或代理密钥；生产站点应自行实现后台鉴权、限流和日志策略。

## 目录约定

- `dist/app.js`：页面路由、导航、筛选、设置和整体 UI 组装；
- `dist/practice.js`：答题卡、作答、交卷和反馈时机；
- `dist/learning.js`：主题、收藏、错题和评分基础函数；
- `dist/ai-config.js`：AI 服务商与本机配置契约；
- `dist/content.js`：具体站点唯一需要替换的内容入口；
- `dist/styles.css`、`dist/themes.css`、`dist/practice-layout.css`：基础样式、语义主题和答题布局；
- `dist/assistant.js`、`dist/cloud.js`：可选云助手与同步适配器。

旧备份、压缩包和预览图片不属于源码发布内容。真实 API Key、教材源文件、抽取缓存和学习记录也不应提交到 GitHub。

## 许可证

本框架使用 [MIT License](./LICENSE)。保留版权声明后，可以自由使用、修改、分发，并将其作为其他学习网站的基础。
