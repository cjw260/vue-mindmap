<template>
  <div class="markdown-pro-page">
    <div class="intro-card">
      <div class="intro-text">
        <h1>欢迎使用 MarkdownPro</h1>
        <p class="subtitle">轻量、直观、贴合本站风格的在线 Markdown 编辑器</p>
        <ul class="feature-list">
          <li><span class="dot"></span>实时预览：支持实时 Markdown 预览</li>
          <li><span class="dot"></span>多种格式：支持 Markdown 与纯文本</li>
          <li><span class="dot"></span>导出功能：支持 HTML / 纯文本导出</li>
          <li><span class="dot"></span>跨设备设计：轻松跨设备和平台备份</li>
          <li><span class="dot"></span>多语言支持：中英文界面切换</li>
        </ul>
      </div>
      <div class="intro-actions">
        <button class="primary" @click="handleNewDoc">新建文档</button>
        <button class="ghost" @click="handleUploadClick">上传文件</button>
        <button class="ghost" @click="handleExportHtml">导出 HTML</button>
        <button class="ghost" @click="handleSave">保存 .md</button>
      </div>
    </div>

    <div :class="['workspace-card', { fullscreen: isFullscreen }]">
      <div class="toolbar">
        <div class="toolbar-left">
          <button @click="handleNewDoc">新建文档</button>
          <button @click="handleSave">保存</button>
          <button @click="handleExportHtml">导出 HTML</button>
          <button @click="handleUploadClick">上传文件</button>
          <button @click="toggleFullscreen">{{ isFullscreen ? '退出全屏' : '全屏' }}</button>
        </div>
        <div class="toolbar-right">
          <button v-for="tool in inlineTools" :key="tool.key" :title="tool.label" @click="applyTool(tool)">
            {{ tool.icon }}
          </button>
        </div>
        <input
          ref="fileInputRef"
          class="hidden-input"
          type="file"
          accept=".md,.txt"
          @change="handleUpload"
        />
      </div>

      <div class="editor-preview">
        <div class="editor-panel">
          <div class="panel-header">
            <div class="panel-title">Markdown 编辑</div>
            <div class="status">字数：{{ stats.wordCount }} | 行数：{{ stats.lineCount }}</div>
          </div>
          <div class="editor-body">
            <div class="line-numbers" ref="lineRef">{{ lineNumberText }}</div>
            <textarea
              ref="editorRef"
              v-model="rawText"
              class="editor-textarea"
              spellcheck="false"
              @scroll="syncScroll"
            ></textarea>
          </div>
        </div>

        <div class="preview-panel">
          <div class="panel-header">
            <div class="panel-title">实时预览</div>
            <div class="status muted">自动同步预览</div>
          </div>
          <div class="preview-body">
            <section class="markdown-preview" v-html="htmlContent"></section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

const defaultContent = `# 欢迎使用 MarkdownPro

## 功能特点
- **实时预览**：支持实时 Markdown 预览
- **多种格式**：支持 Markdown 与纯文本
- **导出功能**：支持 HTML/纯文本导出
- **跨设备设计**：轻松跨设备和平台备份
- **多语言支持**：中英文界面切换

## 快速开始
开始编写您的 Markdown 文档吧！

\`\`\`javascript
console.log("Hello MarkdownPro!");
\`\`\`

> 这是一个引用示例

## 列表示例
1. 有序列项1
2. 有序列项2
3. 有序列项3

- 无序列项A
- 无序列项B
- 无序列项C

## 表格示例
| 功能 | 状态 | 说明 |
| --- | --- | --- |
| 实时预览 | ✅ | 已完成 |
| 多语言 | ✅ | 已完成 |
| 导出功能 | ✅ | 已完成 |

**祝您使用愉快！**
`;

const rawText = ref(defaultContent);
const htmlContent = ref("");
const isFullscreen = ref(false);
const editorRef = ref(null);
const lineRef = ref(null);
const fileInputRef = ref(null);

marked.use(
  markedKatex({
    throwOnError: false,
  })
);

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      try {
        return hljs.highlight(code, { language }).value;
      } catch (err) {
        console.error("代码高亮错误:", err);
        return hljs.highlightAuto(code).value;
      }
    },
  })
);

marked.setOptions({
  breaks: true,
});

const inlineTools = [
  { key: "bold", icon: "B", label: "加粗", before: "**", after: "**" },
  { key: "italic", icon: "I", label: "斜体", before: "_", after: "_" },
  { key: "code", icon: "</>", label: "行内代码", before: "`", after: "`" },
  { key: "quote", icon: "❝", label: "引用", before: "> ", after: "" },
  { key: "link", icon: "🔗", label: "链接", before: "[文本](", after: ")" },
  { key: "image", icon: "🖼", label: "图片", before: "![alt](", after: ")" },
  { key: "list", icon: "•", label: "无序列表", before: "- ", after: "" },
  { key: "ordered", icon: "1.", label: "有序列表", before: "1. ", after: "" },
  { key: "title", icon: "H2", label: "二级标题", before: "## ", after: "" },
  { key: "table", icon: "⌗", label: "表格", before: "| 表头 | 表头 |\n| --- | --- |\n| 单元 | 单元 |\n", after: "" },
];

const stats = computed(() => {
  // 优化：使用更高效的方式计算行数
  const text = rawText.value;
  let lineCount = 1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') lineCount++;
  }
  return {
    wordCount: text.length,
    lineCount: lineCount,
  };
});

const lineNumberText = computed(() => {
  // 优化：对于超长文档，限制行号计算，避免阻塞
  const count = rawText.value.split("\n").length;
  if (count > 10000) {
    // 超过10000行时，只显示前10000行，避免性能问题
    return Array.from({ length: 10000 }, (_, i) => i + 1).join("\n");
  }
  return Array.from({ length: count }, (_, i) => i + 1).join("\n");
});

let renderTimer = null;
let isUnmounted = false;

watch(
  () => rawText.value,
  (val) => {
    // 防抖：延迟300ms执行，避免频繁解析阻塞主线程
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      if (!isUnmounted) {
        renderPreview(val);
      }
    }, 300);
  },
  { immediate: true }
);

function renderPreview(text) {
  // 如果组件已卸载，不执行解析
  if (isUnmounted) return;
  
  // 使用 requestIdleCallback 或 setTimeout 将解析放到下一个事件循环，避免阻塞
  if (window.requestIdleCallback) {
    requestIdleCallback(() => {
      if (!isUnmounted) {
        htmlContent.value = marked.parse(text || "");
        nextTick(() => {
          if (!isUnmounted) syncScroll();
        });
      }
    }, { timeout: 500 });
  } else {
    setTimeout(() => {
      if (!isUnmounted) {
        htmlContent.value = marked.parse(text || "");
        nextTick(() => {
          if (!isUnmounted) syncScroll();
        });
      }
    }, 0);
  }
}

function syncScroll() {
  if (!editorRef.value || !lineRef.value) return;
  lineRef.value.scrollTop = editorRef.value.scrollTop;
}

function handleNewDoc() {
  rawText.value = defaultContent;
}

function handleSave() {
  const blob = new Blob([rawText.value], { type: "text/markdown;charset=utf-8" });
  triggerDownload(blob, "markdown_pro.md");
}

function handleExportHtml() {
  const tpl = `<html><head><meta charset="utf-8" /><title>MarkdownPro Export</title></head><body>${htmlContent.value}</body></html>`;
  const blob = new Blob([tpl], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, "markdown_pro.html");
}

function handleUploadClick() {
  fileInputRef.value?.click();
}

function handleUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    rawText.value = evt.target.result || "";
  };
  reader.readAsText(file, "utf-8");
  e.target.value = "";
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function applyTool(tool) {
  if (!editorRef.value) return;
  const textarea = editorRef.value;
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.substring(selectionStart, selectionEnd) || "文本";
  const result =
    value.substring(0, selectionStart) +
    tool.before +
    selected +
    tool.after +
    value.substring(selectionEnd);
  rawText.value = result;
  nextTick(() => {
    const cursor = selectionStart + tool.before.length + selected.length + tool.after.length;
    textarea.selectionStart = textarea.selectionEnd = cursor;
    textarea.focus();
  });
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  nextTick(() => {
    syncScroll();
  });
}

onMounted(() => {
  syncScroll();
});

onUnmounted(() => {
  // 标记组件已卸载
  isUnmounted = true;
  // 清理防抖定时器，防止内存泄漏
  if (renderTimer) {
    clearTimeout(renderTimer);
    renderTimer = null;
  }
});
</script>

<style scoped>
.markdown-pro-page {
  width: 100%;
  padding: 40px 24px 60px;
  background: #f3f4f6;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.intro-card {
  width: 100%;
  max-width: 1260px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  margin-top: 80px;
}

.intro-text h1 {
  margin: 0 0 8px;
  color: #1f2937;
  font-size: 24px;
}

.intro-text .subtitle {
  margin: 0 0 12px;
  color: #6b7280;
  font-size: 14px;
}

.feature-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
  color: #4b5563;
  line-height: 1.7;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.feature-list .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5b88e1;
  display: inline-block;
}

.intro-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.intro-actions button,
.toolbar button {
  border: 1px solid #d8e2f0;
  background: #f8fbff;
  color: #475b6d;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.intro-actions button:hover,
.toolbar button:hover {
  border-color: #5b88e1;
  color: #5b88e1;
  background: #eef4ff;
}

.intro-actions .primary {
  background: #5b88e1;
  color: #fff;
  border-color: #5b88e1;
}

.intro-actions .primary:hover {
  background: #4f7ad2;
}

.intro-actions .ghost {
  background: #fff;
}

.workspace-card {
  width: 100%;
  max-width: 1260px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  padding: 16px;
  box-sizing: border-box;
  position: relative;
}

.workspace-card.fullscreen {
  position: fixed;
  top: 70px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  z-index: 2100;
  max-width: none;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.toolbar-right {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.toolbar-right button {
  padding: 6px 10px;
  min-width: 36px;
}

.editor-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  height: calc(100vh - 240px);
  min-height: 480px;
}

.editor-panel,
.preview-panel {
  background: #f9fbff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-weight: 600;
  color: #374151;
}

.status {
  color: #6b7280;
  font-size: 12px;
}

.status.muted {
  color: #9ca3af;
}

.editor-body {
  flex: 1;
  display: flex;
  background: #111827;
  color: #e5e7eb;
  position: relative;
}

.line-numbers {
  width: 48px;
  padding: 14px 8px 14px 12px;
  box-sizing: border-box;
  text-align: right;
  background: #0f172a;
  color: #6b7280;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow: hidden;
  white-space: pre;
  user-select: none;
}

.editor-textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: #e5e7eb;
  padding: 14px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  overflow: auto;
}

.preview-body {
  flex: 1;
  overflow: auto;
  padding: 16px 18px;
}

.markdown-preview {
  max-width: 100%;
  margin: 0 auto;
  line-height: 1.8;
  color: #2c3e50;
}

.markdown-preview h1,
.markdown-preview h2,
.markdown-preview h3 {
  position: relative;
  font-weight: 700;
  margin-top: 1.2em;
  margin-bottom: 0.8em;
  color: #1a202c;
}

.markdown-preview h1 {
  font-size: 2.1em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-preview h2 {
  font-size: 1.7em;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.3em;
}

.markdown-preview h3 {
  font-size: 1.4em;
}

.markdown-preview pre {
  position: relative;
  background: #1e1e1e !important;
  border-radius: 12px;
  padding: 16px;
  margin: 1.2em 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: auto;
  color: #d4d4d4;
}

.markdown-preview code {
  font-family: "JetBrains Mono", "Fira Code", monospace;
}

.markdown-preview blockquote {
  margin: 1.2em 0;
  padding: 1em 1.2em;
  color: #4a5568;
  background-color: #f7fafc;
  border-left: 5px solid #5b88e1;
  border-radius: 0 8px 8px 0;
}

.markdown-preview table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 14px;
}

.markdown-preview table th,
.markdown-preview table td {
  border: 1px solid #e5e7eb;
  padding: 8px 10px;
  text-align: left;
}

.markdown-preview a {
  color: #5b88e1;
  text-decoration: none;
  border-bottom: 1px dashed #5b88e1;
}

.markdown-preview img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 1.2em 0;
}

.hidden-input {
  display: none;
}

@media (max-width: 1100px) {
  .editor-preview {
    grid-template-columns: 1fr;
    height: auto;
  }
  .workspace-card.fullscreen {
    position: fixed;
    top: 60px;
    left: 12px;
    right: 12px;
  }
}
</style>


