<template>
  <div class="mindMap-container" @mousemove="handleConnectMove" @mouseup="handleConnectEnd">
    
    <!-- === 侧边栏工具箱 === -->
    <div class="sidebar-panel">
      <div class="sidebar-header">思维导图工具箱</div>

      <!-- 1. 档案管理区 -->
      <div class="control-section">
        <div class="section-title">当前导图</div>
        <div class="control-group">
          <input 
            v-model="currentMapName" 
            type="text" 
            placeholder="未命名导图" 
            class="sidebar-input"
          />
          <div class="btn-row">
            <button class="sidebar-btn success" @click="saveMap">
              💾 保存
            </button>
            <button class="sidebar-btn warning" @click="createNewMap">
              📄 新建
            </button>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 2. 已保存列表 -->
      <div class="control-section flex-grow">
        <div class="section-title">
          我的列表 ({{ savedMaps.length }})
        </div>
        <div class="saved-list">
          <div 
            v-for="map in savedMaps" 
            :key="map.id"
            class="saved-item"
            :class="{ active: currentMapId === map.id }"
            @click="loadMap(map.id)"
          >
            <span class="saved-name">{{ map.name }}</span>
            <span class="delete-btn" @click.stop="deleteMap(map.id)">×</span>
          </div>
          <div v-if="savedMaps.length === 0" class="empty-tip">
            暂无保存记录
          </div>
        </div>
      </div>

      <div class="divider"></div>
      
      <!-- 3. 添加节点控制区 -->
      <div class="control-section">
        <div class="section-title">快速操作</div>
        <div class="control-group">
          <input 
            v-model="newNodeText" 
            type="text" 
            placeholder="输入节点内容..." 
            class="sidebar-input"
            @keyup.enter="addNode"
          />
          <button class="sidebar-btn primary" @click="addNode">
            + 添加节点
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 4. 操作说明 -->
      <div class="instruction-list">
        <div class="instruction-item">
          <span class="key-tag">Shift + 拖拽</span>
          <span>连线</span>
        </div>
        <div class="instruction-item">
          <span class="key-tag">右键连线</span>
          <span>删除</span>
        </div>
      </div>
    </div>

    <!-- SVG 连线层 -->
    <svg class="svg-container">
      <!-- 临时正在拖拽出的虚线 -->
      <path
        v-if="isConnecting && tempLine"
        :d="generateTempPath()"
        stroke="#94a3b8"
        stroke-width="2"
        stroke-dasharray="5,5"
        fill="none"
      />
      <!-- 实际存在的连线 -->
      <path
        v-for="(link, index) in links"
        :key="`${link.source.id}-${link.target.id}`"
        class="connection-path"
        :d="generatePath(link)"
        stroke="#cbd5e1"
        stroke-width="2"
        fill="none"
        @contextmenu.prevent="deleteConnection(index)"
      >
        <title>右键点击删除连线</title>
      </path>
    </svg>

    <!-- 节点层 -->
    <mindItem
      v-for="node in nodes"
      :key="node.id"
      :id="node.id"
      :content="node.content"
      :x="node.x"
      :y="node.y"
      @update-position="handleUpdatePosition"
      @update-content="handleUpdateContent"
      @start-connect="handleStartConnect"
    ></mindItem>

    <!-- 保存成功提示 -->
    <div v-if="toastMessage" class="toast-message">
      {{ toastMessage }}
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import mindItem from './components/mindItem.vue';

// --- 数据定义 ---
const nodes = ref([]);
const connections = ref([]);

// --- 存储相关状态 ---
const STORAGE_INDEX_KEY = 'mindmap_index_v1';
const currentMapId = ref(null);      // 当前编辑的图表ID，null表示新图
const currentMapName = ref('我的思维导图'); // 当前图表名称
const savedMaps = ref([]);           // 已保存的图表列表
const toastMessage = ref('');        // 提示消息

/**
 * 生命周期钩子：初始化
 * 功能：组件加载时读取本地存储列表，如果没有记录则自动创建一个新导图
 */
onMounted(() => {
  refreshSavedList();
  // 默认加载第一个，如果没有则初始化一个空的
  if (savedMaps.value.length > 0) {
    loadMap(savedMaps.value[0].id);
  } else {
    createNewMap(); // 初始化默认数据
  }
});

// --- 档案管理逻辑 ---

/**
 * 刷新保存列表
 * 功能：从 localStorage 读取导图索引列表，更新到 savedMaps 响应式变量
 */
const refreshSavedList = () => {
  try {
    const indexData = localStorage.getItem(STORAGE_INDEX_KEY);
    savedMaps.value = indexData ? JSON.parse(indexData) : [];
  } catch (e) {
    console.error('读取列表失败', e);
    savedMaps.value = [];
  }
};

/**
 * 保存当前导图
 * 功能：
 * 1. 检查是新建还是更新（currentMapId）
 * 2. 将节点(nodes)和连线(connections)打包
 * 3. 分别保存数据文件和更新索引列表到 localStorage
 */
const saveMap = () => {
  // 1. 确定 ID
  if (!currentMapId.value) {
    currentMapId.value = Date.now(); // 如果是新图，生成新ID
  }

  const id = currentMapId.value;
  const name = currentMapName.value || '未命名导图';

  // 2. 准备数据
  const mapData = {
    nodes: nodes.value,
    connections: connections.value,
    updateTime: Date.now()
  };

  // 3. 保存内容数据
  try {
    // 存储具体数据
    localStorage.setItem(`mindmap_data_${id}`, JSON.stringify(mapData));

    // 4. 更新索引列表
    const existingIndex = savedMaps.value.findIndex(m => m.id === id);
    if (existingIndex !== -1) {
      // 更新现有记录名称
      savedMaps.value[existingIndex].name = name;
      savedMaps.value[existingIndex].updateTime = Date.now();
    } else {
      // 添加新记录
      savedMaps.value.unshift({ id, name, updateTime: Date.now() });
    }
    
    // 保存索引到 localStorage
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(savedMaps.value));
    
    showToast('保存成功！');
  } catch (e) {
    showToast('保存失败：存储空间不足');
    console.error(e);
  }
};

/**
 * 读取导图
 * 功能：根据 ID 从 localStorage 获取具体的节点和连线数据，并渲染到画布
 * @param {Number} id - 导图 ID
 */
const loadMap = (id) => {
  try {
    const dataStr = localStorage.getItem(`mindmap_data_${id}`);
    if (dataStr) {
      const data = JSON.parse(dataStr);
      nodes.value = data.nodes || [];
      connections.value = data.connections || [];
      
      currentMapId.value = id;
      const mapInfo = savedMaps.value.find(m => m.id === id);
      currentMapName.value = mapInfo ? mapInfo.name : '未命名导图';
      
      showToast(`已加载: ${currentMapName.value}`);
    } else {
      showToast('数据文件丢失');
    }
  } catch (e) {
    console.error('加载失败', e);
    showToast('文件损坏无法加载');
  }
};

/**
 * 新建导图
 * 功能：清空当前画布，重置 ID 和名称，创建一个默认的中心节点
 */
const createNewMap = () => {
  currentMapId.value = null;
  currentMapName.value = '新建导图 ' + new Date().toLocaleTimeString().slice(0,5);
  // 初始化默认节点
  nodes.value = [
    { id: Date.now(), content: '中心主题', x: 300, y: 300 }
  ];
  connections.value = [];
  showToast('已创建新画布');
};

/**
 * 删除导图
 * 功能：删除指定的索引记录和对应的数据文件
 * @param {Number} id - 要删除的导图 ID
 */
const deleteMap = (id) => {
  if (!confirm('确定要删除这个导图吗？')) return;

  // 1. 删除索引
  savedMaps.value = savedMaps.value.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(savedMaps.value));

  // 2. 删除数据
  localStorage.removeItem(`mindmap_data_${id}`);

  // 3. 如果删除的是当前正在编辑的，重置画布
  if (currentMapId.value === id) {
    createNewMap();
  }
};

/**
 * 显示提示消息
 * 功能：显示一个临时的 Toast 消息，2秒后自动消失
 * @param {String} msg - 提示内容
 */
const showToast = (msg) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 2000);
};


// --- 节点操作逻辑 ---
const newNodeText = ref('');

/**
 * 添加节点
 * 功能：根据输入框内容在画布随机位置创建一个新节点
 */
const addNode = () => {
  const newId = Date.now();
  const content = newNodeText.value.trim() || '新节点';
  const startX = 350 + Math.random() * 50; 
  const startY = 250 + Math.random() * 50;
  nodes.value.push({ id: newId, content, x: startX, y: startY });
  newNodeText.value = '';
};

// --- 连线计算逻辑 ---

/**
 * 计算属性：处理连线数据
 * 功能：将存储的 ID 关系 (sourceId, targetId) 转换为实际的节点对象引用，供 SVG 渲染使用
 */
const links = computed(() => {
  return connections.value.map(conn => {
    const source = nodes.value.find(n => n.id === conn.sourceId);
    const target = nodes.value.find(n => n.id === conn.targetId);
    if (!source || !target) return null;
    return { source, target };
  }).filter(Boolean);
});

// --- 交互处理逻辑 ---

/**
 * 更新节点位置
 * 触发：当子组件拖拽结束时
 */
const handleUpdatePosition = ({ id, x, y }) => {
  const node = nodes.value.find(n => n.id === id);
  if (node) { node.x = x; node.y = y; }
};

/**
 * 更新节点内容
 * 触发：当子组件编辑文本结束时
 */
const handleUpdateContent = ({ id, content }) => {
  const node = nodes.value.find(n => n.id === id);
  if (node) { node.content = content; }
};

const isConnecting = ref(false); // 是否正在连线中
const connectingSourceId = ref(null); // 连线的起始节点ID
const mousePos = ref({ x: 0, y: 0 }); // 鼠标实时位置
const tempLine = computed(() => isConnecting.value && connectingSourceId.value); // 是否显示临时连线

/**
 * 开始连线
 * 触发：用户按住 Shift 拖拽节点时
 */
const handleStartConnect = ({ id }) => {
  isConnecting.value = true;
  connectingSourceId.value = id;
};

/**
 * 连线中鼠标移动
 * 功能：更新鼠标坐标，让临时连线跟随鼠标
 */
const handleConnectMove = (e) => {
  if (!isConnecting.value) return;
  mousePos.value = { x: e.clientX, y: e.clientY };
};

/**
 * 结束连线
 * 功能：鼠标松开时，如果落在另一个节点上，则创建连线
 */
const handleConnectEnd = (e) => {
  if (!isConnecting.value) return;
  // 获取鼠标位置下方的 mindItem 元素
  const targetEl = document.elementFromPoint(e.clientX, e.clientY)?.closest('.mindItem-box');
  if (targetEl) {
    const targetId = Number(targetEl.dataset.id);
    const sourceId = connectingSourceId.value;
    // 确保不是连自己，且没有重复连线
    if (targetId && targetId !== sourceId) {
      const exists = connections.value.some(
        c => (c.sourceId === sourceId && c.targetId === targetId)
      );
      if (!exists) connections.value.push({ sourceId, targetId });
    }
  }
  isConnecting.value = false;
  connectingSourceId.value = null;
};

/**
 * 删除连线
 * 触发：右键点击 SVG 连线
 */
const deleteConnection = (index) => {
  connections.value.splice(index, 1);
};

// --- SVG 路径生成算法 ---
const NODE_WIDTH = 160;
const NODE_HEIGHT = 54;
const BEZIER_OFFSET = 60; // 贝塞尔曲线控制点偏移量

/**
 * 生成贝塞尔曲线路径
 * 功能：根据起始和结束节点的位置，计算平滑的 SVG 路径字符串 (M...C...)
 * 逻辑：自动判断左右或上下连接，调整控制点以获得最佳视觉效果
 */
const generatePath = (link) => {
  const { source, target } = link;
  const sx_center = source.x + NODE_WIDTH / 2;
  const sy_center = source.y + NODE_HEIGHT / 2;
  const tx_center = target.x + NODE_WIDTH / 2;
  const ty_center = target.y + NODE_HEIGHT / 2;
  const dx = tx_center - sx_center;
  const dy = ty_center - sy_center;
  
  let startPt = {}, endPt = {}, cp1 = {}, cp2 = {};
  
  // 简单布局判断：横向距离大则左右连，纵向距离大则上下连
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx > 0) { // 目标在右
      startPt = { x: source.x + NODE_WIDTH, y: sy_center };
      endPt = { x: target.x, y: ty_center };
      cp1 = { x: startPt.x + BEZIER_OFFSET, y: startPt.y };
      cp2 = { x: endPt.x - BEZIER_OFFSET, y: endPt.y };
    } else { // 目标在左
      startPt = { x: source.x, y: sy_center };
      endPt = { x: target.x + NODE_WIDTH, y: ty_center };
      cp1 = { x: startPt.x - BEZIER_OFFSET, y: startPt.y };
      cp2 = { x: endPt.x + BEZIER_OFFSET, y: endPt.y };
    }
  } else {
    // 上下连线
    if (dy > 0) {
      startPt = { x: sx_center, y: source.y + NODE_HEIGHT };
      endPt = { x: tx_center, y: target.y };
      cp1 = { x: startPt.x, y: startPt.y + BEZIER_OFFSET };
      cp2 = { x: endPt.x, y: endPt.y - BEZIER_OFFSET };
    } else {
      startPt = { x: sx_center, y: source.y };
      endPt = { x: tx_center, y: target.y + NODE_HEIGHT };
      cp1 = { x: startPt.x, y: startPt.y - BEZIER_OFFSET };
      cp2 = { x: endPt.x, y: endPt.y + BEZIER_OFFSET };
    }
  }
  return `M ${startPt.x} ${startPt.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${endPt.x} ${endPt.y}`;
};

/**
 * 生成临时连线路径
 * 功能：生成从起始节点中心到当前鼠标位置的直线路径
 */
const generateTempPath = () => {
  const sourceNode = nodes.value.find(n => n.id === connectingSourceId.value);
  if (!sourceNode) return '';
  const sx_center = sourceNode.x + NODE_WIDTH / 2;
  const sy_center = sourceNode.y + NODE_HEIGHT / 2;
  return `M ${sx_center} ${sy_center} L ${mousePos.value.x} ${mousePos.value.y}`;
};
</script>

<style scoped>
.mindMap-container {
  width: 100%;
  height: 100vh;
  position: relative;
  background-color: #f3f4f6;
  background-image: linear-gradient(#e5e7eb 1px, transparent 1px),
    linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
  background-size: 20px 20px;
  overflow: hidden;
  user-select: none;
}

.svg-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.connection-path {
  pointer-events: visibleStroke;
  cursor: pointer;
  transition: stroke 0.2s, stroke-width 0.2s;
}
.connection-path:hover { stroke: #3b82f6; stroke-width: 4px; }

/* === 侧边栏样式优化 === */
.sidebar-panel {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 260px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 16px;
  z-index: 100;
  border: 1px solid #e5e7eb;
  max-height: 85vh; /* 防止太长溢出 */
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f3f4f6;
}

.control-section {
  margin-bottom: 12px;
}
.control-section.flex-grow {
  flex-grow: 1;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 内部滚动 */
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-row {
  display: flex;
  gap: 8px;
}

.sidebar-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}
.sidebar-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.sidebar-btn {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: white;
}
.sidebar-btn:hover { opacity: 0.9; }
.sidebar-btn.primary { background-color: #3b82f6; }
.sidebar-btn.success { background-color: #10b981; }
.sidebar-btn.warning { background-color: #f59e0b; }

.divider {
  height: 1px;
  background-color: #f3f4f6;
  margin: 12px 0;
  flex-shrink: 0;
}

/* === 保存列表样式 === */
.saved-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
  background: #f9fafb;
}

.saved-item {
  padding: 10px 12px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.saved-item:hover { background: #e5e7eb; }
.saved-item.active {
  background: #eff6ff;
  color: #2563eb;
  border-left: 3px solid #2563eb;
}

.saved-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.delete-btn {
  color: #9ca3af;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
}
.delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.empty-tip {
  padding: 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.instruction-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.instruction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}
.key-tag {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  border: 1px solid #e5e7eb;
}

/* === 提示框 === */
.toast-message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 200;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
</style>