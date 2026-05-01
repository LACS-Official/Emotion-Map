# 城市情绪地图 (City Emotion Map)

一个现代化的 Web 应用界面设计，基于地图的可视化产品演示。

## 核心特性
- **全屏地图**：集成腾讯地图 JavaScript API GL。
- **情绪热力图**：动态热力效果，支持快乐、压力、悲伤、平静四种维度。
- **毛玻璃 UI (Glassmorphism)**：符合现代审美（Apple, Notion 风格）。
- **实时数据面板**：展示今日情绪趋势（ECharts 驱动）及区域统计。
- **响应式交互**：平滑的动画过渡（Framer Motion 驱动）。

## 技术栈
- **框架**：React + Vite
- **地图**：腾讯地图 JavaScript API (GL)
- **图表**：ECharts
- **动画**：Framer Motion
- **样式**：Vanilla CSS (Glassmorphism Utilities)

## 运行与部署
1. 安装依赖：`npm install`
2. 启动开发服务器：`npm run dev`
3. 修改 API Key：在 `src/components/MapContainer.jsx` 中替换 `YOUR_TENCENT_MAP_KEY_HERE`。

## 界面布局
- **左上角**：情绪维度筛选按钮。
- **右侧面板**：情绪趋势折线图及核心指标统计。
- **底部**：心情发布浮动输入框。
