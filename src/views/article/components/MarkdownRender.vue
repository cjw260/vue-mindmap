<template>
  <section
    v-loading="loading"
    class="markdown-container"
    v-html="htmlContent"
    ref="containerRef"
  ></section>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted, inject } from "vue"; // 1. 引入 inject
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css"; 
import { useRoute } from "vue-router";

// 定义事件
const emit = defineEmits(['loaded']);

// 2. 注入 Loading 控制器 (如果父组件没提供，给个空函数防止报错)
const loadingBar = inject('loadingBar', { start: () => {}, finish: () => {} });

const route = useRoute();
const loading = ref(true);
const containerRef = ref(null);
const htmlContent = ref("<p>加载中...</p>");

marked.use(markedKatex({
  throwOnError: false
}));

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

/**
 * 核心方法：获取并渲染文章
 */
async function fetchAndRender(category, title) {
  if (!category || !title) {
    htmlContent.value = "<p>文章参数无效。</p>";
    return;
  }

  try {
    loading.value = true;
    
    // 3. 开始顶部进度条动画
    loadingBar.start();

    const base = import.meta.env.BASE_URL;
    const fetchPath = `${base}md/${category}/${title}.md`; 
    
    const response = await fetch(fetchPath);
    if (!response.ok) {
      const retryResponse = await fetch(`${base}md/${category}/${title}.md`);
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
    
    // 即使失败，也要结束进度条，否则会一直挂在顶部
    loadingBar.finish();
  }
}

/**
 * 处理 Markdown 文本内容
 */
async function processContent(text) {
  // 解析 Markdown (耗时操作)
  htmlContent.value = marked.parse(text);
  
  loading.value = false;
  
  await nextTick();
  
  enrichCodeBlocks();
  
  // 4. 全部渲染完成后，进度条跑完
  loadingBar.finish();
  
  emit('loaded');
}

/**
 * 增强代码块样式与交互
 */
function enrichCodeBlocks() {
  if (!containerRef.value) return;
  
  const preBlocks = containerRef.value.querySelectorAll('pre');
  
  preBlocks.forEach((pre) => {
    const codeClass = pre.querySelector('code')?.className || '';
    const langMatch = codeClass.match(/language-(\w+)/);
    const lang = langMatch ? langMatch[1] : 'text';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = `<span>复制</span>`; 
    
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

    const langTag = document.createElement('span');
    langTag.className = 'lang-tag';
    langTag.innerText = lang.toUpperCase();

    pre.appendChild(copyBtn);
    pre.appendChild(langTag);
  });
}
//监听路由参数变化，重新获取文章
watch(
  () => route.params,
  (newParams) => {
    fetchAndRender(newParams.category, newParams.title);
  },
  { immediate: true }
);
</script>

<style>
/* ... 保持原有 CSS 不变 ... */
.markdown-container {
  max-width: 100%;
  margin: 0 auto;
  padding-bottom: 50px;
  line-height: 1.8;
  color: #2c3e50;
  font-size: 16px;
}
.katex {
  font-size: 1.1em !important; 
}
.katex-display {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.5em 0;
}
.markdown-container h1, 
.markdown-container h2, 
.markdown-container h3 {
  position: relative;
  font-weight: 700;
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  color: #1a202c;
}
.markdown-container h1 { font-size: 2.2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
.markdown-container h2 { font-size: 1.8em; padding-bottom: 0.3em; border-bottom: 1px solid #f1f5f9; }
.markdown-container h3 { font-size: 1.5em; }

.markdown-container pre {
  position: relative;
  background: #1e1e1e !important; 
  border-radius: 12px; 
  padding: 20px 20px 20px 20px; 
  margin: 1.5em 0;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15); 
  overflow: hidden; 
}
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
.lang-tag {
  position: absolute;
  top: 22px;
  right: 70px;
  color: #666;
  font-size: 12px;
  font-family: sans-serif;
  font-weight: bold;
  user-select: none;
}
.markdown-container pre code {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  display: block;
  overflow-x: auto; 
  color: #d4d4d4;
}
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
.markdown-container blockquote {
  margin: 1.5em 0;
  padding: 1em 1.5em;
  color: #4a5568;
  background-color: #f7fafc;
  border-left: 5px solid #5B88E1; 
  border-radius: 0 8px 8px 0;
}
.markdown-container img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin: 1.5em auto;
  display: block;
}
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