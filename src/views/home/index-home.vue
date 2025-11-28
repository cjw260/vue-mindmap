<template>
  <div class="home-mainContainer">
    <div class="home-heroSection">
      <h1 class="home-titleText">
        <span class="title-line line-left">
          <!-- 
            给每个 span 加上 'letter' 类
            L 的 ref 保留，但旧的翻转入场动画由整体 stagger 接管
          -->
          <span ref="lRef" class="flipping-l letter">L</span>
          <span class="letter">e</span>
          <span class="letter">a</span>
          <span class="letter">r</span>
          <span class="letter">n</span>
          <!-- i 保持原有 ref 和 class -->
          <span ref="iRef" class="flipping-i letter">i</span>
          <span class="letter">n</span>
          <span class="letter">g</span></span
        >
        <span class="title-line line-right">
          <span class="letter">a</span>
          <span class="letter">n</span>
          <span class="letter">y</span>
          <span class="letter">t</span>
          <span class="letter">h</span>
          <span class="letter">i</span>
          <!-- 
             n (风车) 也要加 letter 类参与进场
          -->
          <span class="windmill-n letter">
            n
            <!-- SVG 风车 -->
            <svg class="windmill-icon" width="200" height="200" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 50 L0 0 A50 50 0 0 1 50 50 Z" fill="#468FFB" />
              <path d="M50 100 L0 100 A50 50 0 0 1 50 50 Z" fill="#468FFB" />
              <path d="M100 50 L100 100 A50 50 0 0 1 50 50 Z" fill="#468FFB" />
              <path d="M50 0 L100 0 A50 50 0 0 1 50 50 Z" fill="#468FFB" />
            </svg>
          </span>
          <span class="letter">g</span></span
        >
      </h1>
      <div class="home-cta-container">
        <!-- 
          修改点 1: 
          添加 :class 绑定。只有当 isInteractive 为 true 时，才应用过渡效果。
          这避免了入场动画时 CSS transition 与 GSAP 冲突导致的“下滑消失”bug。
        -->
        <router-link 
          to="/article/math/1.1 函数" 
          class="home-cta-button" 
          :class="{ 'interactive': isInteractive }"
        >
          start learning
          <span class="icon-arrow">↓</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import gsap from 'gsap';

const iRef = ref(null);
const lRef = ref(null);

// 控制按钮是否可以进行 CSS 交互（hover效果）
// 初始为 false，防止在 GSAP 进场动画执行时，CSS transition 干扰动画位置
const isInteractive = ref(false);

/**
 * 页面挂载后的动画逻辑
 * 主要包含三部分动画：
 * 1. 字母阶梯式进场 (stagger)
 * 2. 按钮进场与交互状态激活
 * 3. 装饰性动画 (风车旋转、字母 i 翻转)
 */
onMounted(() => {
  // 1. 创建 GSAP 主时间轴，用于编排进场序列
  const masterTl = gsap.timeline();

  // 2. 字母依次进入视口 (进场动画)
  // 选取所有 .letter 类，从下往上浮现
  masterTl.from(".letter", {
    y: 100,             // 初始 Y 轴偏移
    opacity: 0,         // 初始透明度
    duration: 0.8,      // 动画持续时间
    stagger: 0.05,      // 每个元素动画间隔 0.05s (阶梯效果)
    ease: "back.out(1.7)" // 回弹缓动效果
  })
  // 3. 按钮最后进入视窗
  // 使用 "-=0.4" 让按钮在字母动画快结束时提前开始，衔接更自然
  .from(".home-cta-button", {
    y: 50,              
    opacity: 0,         
    duration: 0.8,       
    ease: "power3.out",
    // 关键回调：动画结束后，将 isInteractive 设为 true
    // 此时 DOM 才会获得 interactive 类，启用 CSS 的 transition 属性
    onComplete: () => {
      isInteractive.value = true;
    }
  }, "-=0.4");

  // --- 4. 独立装饰动画 (不依赖主时间轴) ---

  // 风车无限旋转动画
  gsap.to(".windmill-icon", {
    rotation: 360,
    duration: 4,      
    ease: "none",     // 匀速旋转
    repeat: -1,       // 无限循环
    transformOrigin: "50% 50%" 
  });

  // 字母 'i' 的定时翻转动画
  if (iRef.value) {
    const tl = gsap.timeline({ repeat: -1 }); // 无限循环的时间轴
    
    tl.to(iRef.value, {
      rotationX: 540,      // 翻转 1.5 圈
      duration: 2.5,
      ease: "power2.inOut",
      delay: 3             // 停留 3 秒
    })
    .to(iRef.value, {
      rotationX: 1080,     // 再翻转 1.5 圈回到 0 (360的倍数)
      duration: 2.5,
      ease: "power2.inOut",
      delay: 4             // 停留 4 秒
    })
    .set(iRef.value, { rotationX: 0 }); // 重置角度防止数值过大
  }
});
</script>

<style scoped>
/* 1. 主容器 */
.home-mainContainer {
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
  color: #1a202c;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Mori", "Manrope", sans-serif;
  overflow: hidden;
}

/* 2. 内容区域布局 */
.home-heroSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24px;
  max-width: 1400px;
  width: 100%;
  transform: translateY(-5%);
}

/* 3. 大标题排版 */
.home-titleText {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: clamp(5rem, 14vw, 11rem);
  font-weight: 800;
  line-height: 0.9;
  color: #1a202c;
  margin: 0 0 80px 0;
  letter-spacing: -0.04em;
  gap: 40px;
}

/* 单独控制每一行 */
.title-line {
  display: block;
  white-space: nowrap;
  transition: transform 0.3s ease;
  perspective: 1000px;
}

.title-line .letter {
  display: inline-block;
  transform-origin: center center;
}

.line-left {
  transform: translateX(-30%);
}

.line-right {
  transform: translateX(30%);
  color: #468FFB;
}

/* Style for the 'i' */
.flipping-i {
  color: #468FFB;
  text-shadow: 0 0 15px rgba(23, 135, 248, 0.6);
}

/* Style for the 'L' */
.flipping-l {
  transform-origin: center bottom; 
}

/* --- 风车相关样式 --- */
.windmill-n {
  position: relative; 
}

.windmill-icon {
  position: absolute;
  width: 0.6em;  
  height: 0.6em;
  bottom: 85%;   
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  overflow: visible; 
}

/* 4. 按钮容器 */
.home-cta-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 5. 按钮样式 */
.home-cta-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 40px;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: 18px;
  background-color: #468FFB;
  color: #ffffff;
  border: none;
  box-shadow: 0 4px 12px rgba(91, 136, 225, 0.3);
  
  /* 修改点 4: 
    移除了默认的 transition: all ... 
    这样 GSAP 初始化位置时不会触发 CSS 过渡动画
  */
}

/* 只有当 JS 添加了 interactive 类后，才启用过渡 
  确保 hover 效果在入场动画结束后才生效
*/
.home-cta-button.interactive {
  transition: all 0.3s ease;
}

.home-cta-button:hover {
  background-color: #4a75d1;
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(91, 136, 225, 0.4);
}

.icon-arrow {
  font-size: 1.1em;
  transition: transform 0.3s ease;
}

.home-cta-button:hover .icon-arrow {
  transform: rotate(-45deg);
}
</style>