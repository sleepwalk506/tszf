<script setup>
import { onMounted, onUnmounted, inject, watch, ref } from 'vue'

// 注入地图实例
const map = inject('mapInstance')
const AMap = inject('AMapInstance')

// 支持通过props控制显示
const props = defineProps({
  show: {
    type: Boolean,
    default: true,
  },
})

// 发射关闭事件
const emit = defineEmits(['close'])

// 响应式天气数据
const weatherData = ref({
  temperature: '加载中...',
  windPower: '加载中...',
  humidity: '加载中...',
  weather: '加载中...',
  fireRisk: '加载中...',
  vegetation: '加载中...',
  fireRiskColor: '#52c41a',
})

let weatherUpdateInterval = null

// 更新天气信息
const updateWeatherInfo = () => {
  if (!AMap.value || !map.value) return

  const weather = new AMap.value.Weather()

  // 获取地图中心坐标，并验证有效性
  let center = map.value.getCenter()

  // 检查坐标是否有效（防止NaN值）
  if (!center || isNaN(center.lng) || isNaN(center.lat)) {
    // 使用默认坐标（北京天安门）
    center = new AMap.value.LngLat(116.397428, 39.90923)
  }

  // 获取实时天气信息
  weather.getLive(center, (err, data) => {
    if (!err && data) {
      displayWeatherInfo(data)
    } else {
      // 如果API调用失败，使用模拟数据
      displayWeatherInfo({
        temperature: '25°C',
        windPower: '3级',
        humidity: '65%',
        weather: '晴',
      })
    }
  })
}

// 显示天气信息
const displayWeatherInfo = (data) => {
  const temp = data.temperature || '25°C'
  const wind = data.windPower || '3级'
  const humidity = data.humidity || '65%'
  const weatherCondition = data.weather || '晴'

  // 根据天气条件计算火险等级
  let fireRisk = '低'
  let vegetation = '良好'
  let fireRiskColor = '#52c41a' // 绿色

  if (weatherCondition.includes('晴') && parseInt(temp) > 30) {
    fireRisk = '高'
    vegetation = '干燥，需注意防火'
    fireRiskColor = '#ff4d4f' // 红色
  } else if (weatherCondition.includes('雨')) {
    fireRisk = '低'
    vegetation = '湿润，防火压力小'
    fireRiskColor = '#52c41a' // 绿色
  } else {
    fireRisk = '中'
    vegetation = '一般，需保持警惕'
    fireRiskColor = '#faad14' // 黄色
  }

  weatherData.value = {
    temperature: temp,
    windPower: wind,
    humidity: humidity,
    weather: weatherCondition,
    fireRisk: fireRisk,
    vegetation: vegetation,
    fireRiskColor: fireRiskColor,
  }
}

// 清理定时器
const destroyPanel = () => {
  if (weatherUpdateInterval) {
    clearInterval(weatherUpdateInterval)
  }
}

// 监听显示状态变化
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      updateWeatherInfo()
      // 每隔5分钟更新一次天气信息
      weatherUpdateInterval = setInterval(() => {
        updateWeatherInfo()
      }, 300000) // 5分钟
    } else {
      destroyPanel()
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (map.value && AMap.value && props.show) {
    updateWeatherInfo()
    // 每隔5分钟更新一次天气信息
    weatherUpdateInterval = setInterval(() => {
      updateWeatherInfo()
    }, 300000) // 5分钟
  }
})

onUnmounted(() => {
  // 清理定时器
  if (weatherUpdateInterval) {
    clearInterval(weatherUpdateInterval)
  }
})

// 暴露方法供外部使用
defineExpose({
  updateWeather: updateWeatherInfo,
  destroyPanel: destroyPanel,
})
</script>

<template>
  <div v-if="show" class="weather-panel">
    <h3 class="panel-title">🌤️ 天气信息 - 森林防火监测</h3>
    <div class="weather-info">
      <div class="info-item">🌡️ 温度: {{ weatherData.temperature }}</div>
      <div class="info-item">💨 风速: {{ weatherData.windPower }}</div>
      <div class="info-item">💧 湿度: {{ weatherData.humidity }}</div>
      <div class="info-item">🌤️ 天气: {{ weatherData.weather }}</div>
      <div class="info-item" :style="{ color: weatherData.fireRiskColor }">
        🔥 火险等级: {{ weatherData.fireRisk }}
      </div>
      <div class="info-item">🌳 植被状况: {{ weatherData.vegetation }}</div>
    </div>
  </div>
</template>

<style scoped>
.weather-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  font-family: Arial, sans-serif;
  min-width: 200px;
  z-index: 1000;
}

.panel-title {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
}

.weather-info {
  font-size: 12px;
  line-height: 1.6;
}

.info-item {
  margin-bottom: 4px;
}
</style>
