<template>
  <section
    v-loading="loading"
    class="markdown-container"
    v-html="htmlContent"
    ref="containerRef"
  ></section>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from "vue";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css"; // 推荐使用深色主题配合 Mac 风格
import { useRoute } from "vue-router";

// 定义事件，通知父组件内容已加载
const emit = defineEmits(['loaded']);

const route = useRoute();
const loading = ref(true);
const containerRef = ref(null);
const htmlContent = ref("<p>加载中...</p>");

/**
 * 配置 Marked 解析器和 Highlight.js 代码高亮
 * 功能：
 * 1. 使用 marked-highlight 插件拦截代码块渲染
 * 2. 使用 highlight.js 对代码进行语法分析和着色
 * 3. 异常处理：如果语言未识别，尝试自动检测
 */
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
  breaks: true, // 允许回车换行
});

/**
 * 核心方法：获取并渲染文章
 * @param {string} category - 文章分类 (来自路由参数)
 * @param {string} title - 文章标题 (来自路由参数)
 * * 逻辑流程：
 * 1. 校验参数有效性
 * 2. 构建请求路径 (优先尝试 /md/ 路径)
 * 3. 发起 fetch 请求获取 .md 文件内容
 * 4. 如果首选路径失败，尝试备用路径 (兼容不同的 public 部署策略)
 * 5. 获取文本成功后调用 processContent 进行解析
 * 6. 捕获并处理网络或解析错误
 */
async function fetchAndRender(category, title) {
  if (!category || !title) {
    htmlContent.value = "<p>文章参数无效。</p>";
    return;
  }

  try {
    loading.value = true;
    
    // 兼容原有的 path 逻辑
    const fetchPath = `/md/${category}/${title}.md`; 
    
    const response = await fetch(fetchPath);
    if (!response.ok) {
      // 备用方案：尝试带 public 前缀（兼容不同服务器配置）
      const retryResponse = await fetch(`/public/md/${category}/${title}.md`);
      if(!retryResponse.ok) {
         throw new Error(`无法加载 Markdown：${response.status}`);
      }
      const text = await retryResponse.text();
      processContent(text);
      return;
    }
    
    const text = await response.text();
    processContent(text);

  } catch (error) {
    console.error(error);
    htmlContent.value = `<div class="error-box">
      <h3>加载失败</h3>
      <p>${error.message}</p>
      <p>请检查文件名是否正确，或文件是否存在。</p>
    </div>`;
    loading.value = false;
  }
}

/**
 * 处理 Markdown 文本内容
 * @param {string} text - 原始 Markdown 文本
 * * 功能：
 * 1. 使用 marked 库将 Markdown 转换为 HTML
 * 2. 更新 DOM 并关闭加载状态
 * 3. 等待 Vue DOM 更新完毕 (nextTick)
 * 4. 调用 enrichCodeBlocks 增强代码块样式
 * 5. 触发 'loaded' 事件通知父组件 (用于生成目录等)
 */
async function processContent(text) {
  htmlContent.value = marked.parse(text);
  loading.value = false;
  
  await nextTick();
  
  // 1. 增强代码块功能（复制按钮 + 语言标签）
  enrichCodeBlocks();
  
  // 2. 通知父组件生成目录
  emit('loaded');
}

/**
 * 增强代码块样式与交互 (DOM 操作)
 * 功能：
 * 1. 查找所有 pre 代码块
 * 2. 识别代码语言类型
 * 3. 动态插入“复制”按钮，并绑定剪贴板点击事件
 * 4. 动态插入语言标签 (如 JS, VUE)
 * 注意：由于 v-html 的内容是动态生成的，必须直接操作原生 DOM
 */
function enrichCodeBlocks() {
  if (!containerRef.value) return;
  
  const preBlocks = containerRef.value.querySelectorAll('pre');
  
  preBlocks.forEach((pre) => {
    // 获取语言类型
    const codeClass = pre.querySelector('code')?.className || '';
    const langMatch = codeClass.match(/language-(\w+)/);
    const lang = langMatch ? langMatch[1] : 'text';

    // 创建复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = `<span>复制</span>`; // 也可以用图标
    
    // 绑定复制逻辑
    copyBtn.onclick = () => {
      const codeText = pre.querySelector('code').innerText;
      navigator.clipboard.writeText(codeText).then(() => {
        copyBtn.innerHTML = `<span style="color:#4caf50">已复制!</span>`;
        setTimeout(() => {
          copyBtn.innerHTML = `<span>复制</span>`;
        }, 2000);
      }).catch(() => {
        copyBtn.innerText = '失败';
      });
    };

    // 创建语言标签
    const langTag = document.createElement('span');
    langTag.className = 'lang-tag';
    langTag.innerText = lang.toUpperCase();

    // 将按钮和标签追加到 pre 容器中
    pre.appendChild(copyBtn);
    pre.appendChild(langTag);
  });
}

// 监听路由变化，实现文章切换时的自动重新加载
watch(
  () => route.params,
  (newParams) => {
    fetchAndRender(newParams.category, newParams.title);
  },
  { immediate: true }
);
</script>

<style>
/* Markdown 容器基础 */
.markdown-container {
  max-width: 100%; /* 让父组件控制宽度 */
  margin: 0 auto;
  padding-bottom: 50px;
  line-height: 1.8;
  color: #2c3e50;
  font-size: 16px;
}

/* 标题优化 */
.markdown-container h1, 
.markdown-container h2, 
.markdown-container h3 {
  position: relative;
  font-weight: 700;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  color: #1a202c;
}

/* H1 / H2 下划线装饰 */
.markdown-container h1 { font-size: 2.2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
.markdown-container h2 { font-size: 1.8em; padding-bottom: 0.3em; border-bottom: 1px solid #f1f5f9; }
.markdown-container h3 { font-size: 1.5em; }

/* -------------------
   炫技核心：Mac 风格代码块
   ------------------- */
.markdown-container pre {
  position: relative;
  background: #1e1e1e !important; /* 深色背景 */
  border-radius: 12px; /* 圆角更大 */
  padding: 20px 20px 20px 20px; /* 顶部留出空间给红绿灯 */
  margin: 1.5em 0;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15); /* 阴影提升立体感 */
  overflow: hidden; /* 防止内容溢出 */
}

/* 复制按钮样式 */
.copy-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #a0a0a0;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 3;
}
.copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* 语言标签样式 */
.lang-tag {
  position: absolute;
  top: 22px;
  right: 70px; /* 放在复制按钮左边 */
  color: #666;
  font-size: 12px;
  font-family: sans-serif;
  font-weight: bold;
  user-select: none;
}

/* 代码滚动条美化 */
.markdown-container pre code {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace; /* 推荐用编程字体 */
  font-size: 14px;
  line-height: 1.6;
  display: block;
  overflow-x: auto; /* 横向滚动 */
  color: #d4d4d4;
}

/* 滚动条样式 */
.markdown-container pre::-webkit-scrollbar {
  height: 8px;
}
.markdown-container pre::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}
.markdown-container pre::-webkit-scrollbar-track {
  background: transparent;
}

/* 引用块美化 */
.markdown-container blockquote {
  margin: 1.5em 0;
  padding: 1em 1.5em;
  color: #4a5568;
  background-color: #f7fafc;
  border-left: 5px solid #5B88E1; /* 使用你的主色调 */
  border-radius: 0 8px 8px 0;
}

/* 图片自适应与阴影 */
.markdown-container img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin: 1.5em auto;
  display: block;
}

/* 链接样式 */
.markdown-container a {
  color: #5B88E1;
  text-decoration: none;
  border-bottom: 1px dashed #5B88E1;
  transition: all 0.2s;
}
.markdown-container a:hover {
  background-color: rgba(91, 136, 225, 0.1);
  border-bottom-style: solid;
}
</style>