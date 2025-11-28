<template>
  <div class="layout-wrapper">
    <!-- 1. 顶栏：改为固定定位，并添加 Element Plus 风格透明特效 -->
    <div class="layout-headerContainer">
      <div class="layout-headerItemContainer">
        <router-link class="layout-headerItem" v-for="item in categoryList" :key="item.id" :to=item.to :class="{ 'router-link-active': isTopNavActive(item) }">
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
const categoryStore = useCategoryStore();
const categoryList = categoryStore.categoryList;
const route = useRoute();
const isTopNavActive = (item) => {
  // 检查 '首页' 或其他非文章类链接
  if (!item.to.startsWith("/article/")) {
    return route.path === item.to;
  }

  // 检查文章类链接 (如 "高数")
  // 核心：检查当前路由的 category 参数是否等于 item 的 categoryKey
  return route.params.category === item.categoryKey;
};
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

  /* 2. 点阵纹理 (关键)：
     创建一个 "中间透明(transparent 1px)，周围白色(#ffffff 1px)" 的径向渐变。
     这就像给白色背景打了无数个微小的孔。
     当文字滑过下方时，只能通过这些透明小孔透出来，从而形成“点点轮廓”的效果。
  */
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

.layout-headerItemContainer {
  height: 100%;
  width: 100%;
  max-width: 1260px;
  display: flex;
  align-items: center;
  justify-content: center
}

.layout-headerItem {
  width: 100px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475B6D;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.layout-headerItem:hover,
.layout-headerItem.router-link-active {
  color: #5B88E1;
}

.layout-mainContainer{
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    
    /* 关键：增加顶部内边距 */
    /* 60px(顶栏高度) + 25px(原有的间距) = 85px */
}

</style>