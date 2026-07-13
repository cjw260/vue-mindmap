<template>
  <div class="layout-wrapper">
    <!-- 1. 顶栏：绑定动态样式变量，控制伪元素进度条 -->
    <div 
      class="layout-headerContainer"
      :style="{ 
        '--loading-w': loadingWidth + '%', 
        '--loading-o': loadingOpacity 
      }"
    >
      <div class="layout-headerItemContainer">
        <router-link
          class="layout-headerItem"
          v-for="item in categoryList"
          :key="item.id"
          :to="item.to"
          :class="{ 'router-link-active': isTopNavActive(item) }"
        >
          {{ item.name }}
        </router-link>
      </div>
    </div>

    <!-- 2. 内容区域：并列放置，增加 padding 防止被顶栏遮挡 -->
    <div class="layout-mainContainer">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import { useCategoryStore } from "@/stores/category";
import { useRoute } from "vue-router";
import { ref, provide, onUnmounted } from "vue";

const categoryStore = useCategoryStore();
const categoryList = categoryStore.categoryList;
const route = useRoute();

const isTopNavActive = (item) => {
  if (!item.to.startsWith("/article/")) {
    return route.path === item.to;
  }
  return route.params.category === item.categoryKey;
};

// --- 核心逻辑：进度条控制 ---
const loadingWidth = ref(0);
const loadingOpacity = ref(0);
let loadTimer = null;

const startLoading = () => {
  // 重置状态
  if (loadTimer) clearInterval(loadTimer);
  loadingWidth.value = 0;
  loadingOpacity.value = 1; // 出现

  // 启动定时器模拟进度
  loadTimer = setInterval(() => {
    // 阶段1: 0% -> 70% 匀速较快增长
    if (loadingWidth.value < 70) {
      // 每次加随机一点点，模拟网络波动，但也比较匀速
      loadingWidth.value += Math.random() * 2 + 1; 
    } 
    // 阶段2: 70% -> 95% 龟速爬行 (丝滑缓慢)
    // 只要没调用 finish，它就会永远卡在这里慢慢走，给用户一种"马上就好"的感觉
    else if (loadingWidth.value < 95) {
      loadingWidth.value += 0.1; 
    }
  }, 20); // 20ms 刷新一次，非常丝滑
};

const finishLoading = () => {
  if (loadTimer) clearInterval(loadTimer);
  
  // 阶段3: 瞬间拉满到 100%
  loadingWidth.value = 100;

  // 阶段4: 延迟一点点后，渐隐消失
  setTimeout(() => {
    loadingOpacity.value = 0;
    
    // 动画结束后重置宽度（为了下一次不穿帮）
    setTimeout(() => {
      loadingWidth.value = 0;
    }, 400); // 对应 CSS transition 的 opacity 时间
  }, 300); // 在 100% 停留 300ms 让用户看到
};

// 将控制方法提供给子组件 (MarkdownRender)
provide('loadingBar', {
  start: startLoading,
  finish: finishLoading
});

// 组件卸载时清理定时器，防止内存泄漏和卡死
onUnmounted(() => {
  if (loadTimer) {
    clearInterval(loadTimer);
    loadTimer = null;
  }
});
</script>

<style scoped>
/* 新增：外层包裹容器 */
.layout-wrapper {
  width: 100%;
  min-height: 100vh;
  position: relative;
}

.layout-headerContainer {
  height: 60px;
  width: 100%;
  padding: 0 20px;

  /* --- 核心修改：透明点阵顶栏 --- */
  position: fixed; /* 固定在顶部 */
  top: 0;
  left: 0;
  z-index: 2000; /* 确保在最上层 */

  /* 1. 背景色：半透明白色底色 */
  background-color: rgba(255, 255, 255, 0.7);

  /* 2. 点阵纹理 */
  background-image: radial-gradient(transparent 1px, #ffffff 1px);
  background-size: 4px 4px; /* 控制点阵的密度 */

  /* 3. 毛玻璃效果：模糊背景 */
  backdrop-filter: saturate(50%) blur(4px);

  /* 4. 边框：用淡色边框替代阴影，更清爽 */
  border-bottom: 1px solid #dcdfe6;
  box-shadow: none;

  /* 布局：让内部容器居中 */
  display: flex;
  justify-content: center;
}

/* --- 进度条伪元素 --- */
.layout-headerContainer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  
  /* 核心改动：使用 CSS 变量控制宽度和透明度 */
  width: var(--loading-w, 0%);
  opacity: var(--loading-o, 0);
  
  height: 4px; /* 进度条高度 */
  background-color: #468FFB; /* 进度条颜色 */
  z-index: 2001;
  
  /* 关键：添加 transition 实现丝滑过渡 */
  /* width 用 ease-out 让它在每一帧变化时都带点惯性，看起来更连贯 */
  /* opacity 用 ease 即可 */
  transition: width 0.2s ease-out, opacity 0.4s ease;
  
  border-bottom-right-radius: 4px; /* 右边加个圆角，进度条头看起来圆润点 */
}

.layout-headerItemContainer {
  height: 100%;
  width: 100%;
  max-width: 1260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layout-headerItem {
  width: 100px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475b6d;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.layout-headerItem:hover,
.layout-headerItem.router-link-active {
  color: #5b88e1;
}

.layout-mainContainer {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
</style>