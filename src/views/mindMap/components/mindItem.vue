<template>
  <div
    class="mindItem-box"
    :class="{ 'is-dragging': isDragging, 'is-editing': isEditing }"
    :style="{
      left: x + 'px',
      top: y + 'px',
    }"
    :data-id="id"
    @mousedown="startDrag"
    @dblclick="startEdit"
  >
    <!-- 显示模式：普通文本 -->
    <div v-if="!isEditing" class="mindItem-box-content">
      {{ content }}
    </div>

    <!-- 编辑模式：输入框 -->
    <textarea
      v-else
      ref="inputRef"
      v-model="localContent"
      class="mindItem-input"
      @blur="finishEdit"
      @keydown.enter.prevent="finishEdit"
      @mousedown.stop
    ></textarea>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  content: { type: String, required: true },
  color: { type: String, default: '#ffffff' },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  id: { type: [String, Number], required: true }
});

// 定义事件：位置更新、内容更新、开始连线
const emit = defineEmits(['update-position', 'update-content', 'start-connect']);

// --- 拖拽逻辑 ---
const isDragging = ref(false); // 是否处于拖拽中
let dragOffset = { x: 0, y: 0 }; // 鼠标点击位置相对于节点左上角的偏移量

/**
 * 开始拖拽处理 (MouseDown)
 * 功能：
 * 1. 如果正在编辑文本，则不执行拖拽。
 * 2. 关键判断：如果按住 Shift 键，则触发【连线】事件，不执行拖拽。
 * 3. 否则，开启拖拽状态，记录偏移量，并监听全局移动事件。
 */
const startDrag = (e) => {
  // 1. 编辑中不处理
  if (isEditing.value) return;

  // 2. 如果按住了 Shift 键，触发连线逻辑，而不是拖拽逻辑
  if (e.shiftKey) {
    e.preventDefault();
    emit('start-connect', { id: props.id, event: e });
    return;
  }
  
  // 3. 普通拖拽逻辑
  e.preventDefault();
  isDragging.value = true;
  dragOffset.x = e.clientX - props.x;
  dragOffset.y = e.clientY - props.y;
  
  // 绑定全局事件，防止拖出节点范围失效
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
};

/**
 * 拖拽移动 (MouseMove)
 * 功能：计算新的绝对位置，并 emit 给父组件更新数据
 */
const onDrag = (e) => {
  if (!isDragging.value) return;
  const newX = e.clientX - dragOffset.x;
  const newY = e.clientY - dragOffset.y;
  emit('update-position', { id: props.id, x: newX, y: newY });
};

/**
 * 结束拖拽 (MouseUp)
 * 功能：清除状态和全局事件监听
 */
const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
};

// --- 编辑逻辑 ---
const isEditing = ref(false);
const localContent = ref('');
const inputRef = ref(null);

/**
 * 开始编辑 (DoubleClick)
 * 功能：切换为 Textarea 模式，自动获取焦点
 */
const startEdit = () => {
  isEditing.value = true;
  localContent.value = props.content;
  
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });
};

/**
 * 结束编辑 (Blur / Enter)
 * 功能：退出编辑模式，如果内容有变化则通知父组件更新
 */
const finishEdit = () => {
  if (!isEditing.value) return;
  
  isEditing.value = false;
  if (localContent.value !== props.content) {
    emit('update-content', { id: props.id, content: localContent.value });
  }
};

onMounted(() => {
  // 设置 CSS 变量（如果需要支持自定义颜色）
  document.documentElement.style.setProperty('--main-theme-color', props.color);
});

onUnmounted(() => {
  // 组件销毁前清理事件监听，防止内存泄漏
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
.mindItem-box {
  position: absolute;
  width: 160px;
  min-height: 54px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #d1d5db;
  cursor: grab;
  user-select: none;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.mindItem-box:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-color: #9ca3af;
}

.mindItem-box.is-dragging {
  cursor: grabbing;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 20;
}

.mindItem-box.is-editing {
  cursor: text;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.mindItem-box-content {
  padding: 16px;
  color: #374151;
  text-align: center;
  width: 100%;
  word-break: break-all;
}

.mindItem-input {
  width: 100%;
  height: 100%;
  min-height: 52px;
  border: none;
  background: transparent;
  padding: 16px;
  text-align: center;
  font-family: inherit;
  font-size: inherit;
  color: #374151;
  resize: none;
  outline: none;
  border-radius: 8px;
  box-sizing: border-box;
  overflow: hidden;
}
</style>