<template>
  <div class="trail-view">
    <!-- 新增：控制按钮栏 -->
    <div class="control-bar">
      <div class="control-group">
        <label class="control-label">显示无人机面板</label>
        <button
          class="control-btn"
          :class="{ active: showDronePanel }"
          @click="showDronePanel = !showDronePanel"
        >
          {{ showDronePanel ? '隐藏' : '显示' }}
        </button>
      </div>

      <div class="control-group">
        <label class="control-label">显示无人机和轨迹</label>
        <button class="control-btn" :class="{ active: showTrail }" @click="showTrail = !showTrail">
          {{ showTrail ? '隐藏' : '显示' }}
        </button>
      </div>

      <div class="control-group">
        <label class="control-label">显示天气信息</label>
        <button
          class="control-btn"
          :class="{ active: showWeatherPanel }"
          @click="showWeatherPanel = !showWeatherPanel"
        >
          {{ showWeatherPanel ? '隐藏' : '显示' }}
        </button>
      </div>
    </div>

    <!-- 地图组件 -->
    <BaseMap>
      <!-- 无人机动画组件 -->
      <template #drone-panel>
        <DroneAnimation :show="showDronePanel" :show-trail="showTrail" />
      </template>

      <template #weather-panel>
        <WeatherPanel :show="showWeatherPanel" />
      </template>
    </BaseMap>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseMap from '@/components/Cruise/BaseMap.vue' // 根据实际路径调整
import DroneAnimation from '@/components/Cruise/DroneAnimation.vue' // 根据实际路径调整
import WeatherPanel from '@/components/Cruise/WeatherPanel.vue'

// 控制无人机面板显示状态
const showDronePanel = ref(true)

// 新增：控制轨迹显示状态
const showTrail = ref(true)

// 新增：控制天气面板显示状态
const showWeatherPanel = ref(true)
</script>

<style scoped>
.trail-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 控制按钮栏样式 */
.control-bar {
  display: flex;
  gap: 20px;
  padding: 12px 20px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  z-index: 1000; /* 确保在地图上方显示 */
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-label {
  color: #334155;
  font-size: 14px;
  font-weight: 500;
}

.control-btn {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  background-color: white;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  border-color: #94a3b8;
}

.control-btn.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* 确保地图占满剩余空间 */
:deep(.base-map-container) {
  flex: 1;
}
</style>
