<script setup></script>

<template>
  <div class="allContainer">
    <router-view></router-view>
  </div>
</template>

<style>
/* --- 方式 A：引入在线字体 (作为临时替代) --- */
/* Manrope 是一款和 Mori 风格很像的几何无衬线字体 */
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&display=swap');

@font-face {
  font-family: 'Mori';
  src: url('@/assets/fonts/PPMori-Regular.woff2') format('woff2');
  font-weight: 400; /* 常规字重 */
  font-style: normal;
}

@font-face {
  font-family: 'Mori';
  src: url('@/assets/fonts/PPMori-ExtraBold.woff2') format('woff2');
  font-weight: 800; /* 粗体字重 */
  font-style: normal;
}
*/

/* 全局基础设置 */
body {
  margin: 0;
  padding: 0;
  /* 优先使用 Mori，如果没有找到(没文件)，就回退使用 Manrope */
  font-family: 'Mori', 'Manrope', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>

<style scoped>
.allContainer{
  width: 100%;
  height: 100%;
  background-color: #ffffff; /* 确保背景统一为白 */
}
</style>