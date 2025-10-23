<template>
  <div class="fire-monitor">
    <!-- 顶部栏 -->
    <div class="fire-header">
      <span class="title">长顺县火情实时监测</span>
      <span class="update-time">最新更新时间：{{ lastUpdateTime }}</span>
    </div>

    <!-- 环境信息浮窗 -->
    <div class="env-info">
      <p>距离：{{ envInfo.distance }}%</p>
      <p>温度：{{ envInfo.temperature }} ℃</p>
      <p>风向：{{ envInfo.windDirection }}</p>
      <p>风速：{{ envInfo.windSpeed }} m/s</p>
    </div>

    <!-- 地图区域 -->
    <div ref="mapContainer" class="map" id="map-container"></div>

    <!-- 火点信息悬浮弹窗 -->
    <div v-if="selectedFirePoint" class="fire-info-floating">
      <h3>火点详情</h3>
      <p><strong>位置：</strong>{{ selectedFirePoint.position }}</p>
      <p><strong>发现时间：</strong>{{ selectedFirePoint.findTime }}</p>
      <!-- <p><strong>蔓延趋势：</strong>{{ selectedFirePoint.trend }}</p> -->
    </div>

    <!-- 左下角信息面板 -->
    <div class="left-bottom-panel">
      <div class="info-card drone-card">
        <h4>无人机状态</h4>
        <p><strong>编号：</strong>{{ drone.id }}</p>
        <p><strong>电量：</strong>{{ drone.battery }}%</p>
        <p><strong>高度：</strong>{{ drone.height }} m</p>
        <p><strong>速度：</strong>{{ drone.speed }} m/s</p>
      </div>
      <div class="info-card task-card">
        <h4>任务信息</h4>
        <p><strong>任务名称：</strong>{{ task.name }}</p>
        <p><strong>开始时间：</strong>{{ task.startTime }}</p>
        <p><strong>截止时间：</strong>{{ task.endTime }}</p>
        <p><strong>起飞点：</strong>{{ task.startPoint.join(', ') }}</p>
        <p><strong>终止点：</strong>{{ task.endPoint.join(', ') }}</p>
      </div>
    </div>

    <!-- 直播画面悬浮 -->
    <div class="video-floating">
      <video id="video" muted autoplay loop controls width="400" height="260"></video>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, onUnmounted } from 'vue'
import { useFireSocket } from '@/composables/useFireSocket'

// 地图相关
const mapContainer = ref(null)
let map = null
let AMapRef = null
const markerList = []
const trendPolygons = []

// 顶部 & 环境信息
const lastUpdateTime = ref(new Date().toLocaleString())
const envInfo = reactive({
  distance: 0,
  temperature: 0,
  windDirection: '',
  windSpeed: 0,
})

// 无人机信息
const drone = reactive({
  id: 'UAV001',
  battery: 0,
  height: 0,
  speed: 0,
})

const task = reactive({
  name: '火情监测任务',
  startTime: '2025-10-14 08:00',
  endTime: '2025-10-14 10:00',
  startPoint: [106.45, 26.02],
  endPoint: [106.48, 26.03],
})

// 火点信息
const selectedFirePoint = ref(null)

// WebSocket
const { connect, close } = useFireSocket({
  onOsdUpdate: (data) => {
    envInfo.distance = data.home_distance
    envInfo.temperature = data.temperature
    envInfo.windDirection = data.wind_direction
    envInfo.windSpeed = data.wind_speed

    drone.battery = data.capacity_percent
    drone.height = data.height
    drone.speed = data.speed
    // Object.assign(envInfo, data)
    lastUpdateTime.value = new Date().toLocaleString()
  },
  onFireUpdate: (fireList) => {
    updateFireMarkers(fireList)
  },
  onSpreadUpdate: (spreadList) => {
    updateSpread(spreadList)
  },
})

// 更新火点标记
function updateFireMarkers(fireList) {
  markerList.forEach((m) => map.remove(m))
  markerList.length = 0

  fireList.forEach((fire) => drawFire(fire))
}
//更新蔓延趋势
function updateSpread(spreadList) {
  trendPolygons.forEach((p) => map.remove(p))
  trendPolygons.length = 0

  drawSpread(spreadList)
}

// 绘制火点
function drawFire(fire) {
  const marker = new AMapRef.Marker({
    position: [fire.fireLongitude, fire.fireLatitude],
    title: `发现时间：${fire.findTime}℃`,
  })
  map.add(marker)
  markerList.push(marker)

  marker.on('click', () => {
    selectedFirePoint.value = {
      position: [fire.fireLongitude, fire.fireLatitude].join(','),
      findTime: fire.findTime.toLocaleString(),
      // trend: fire.trend,
    }
  })
}

//绘制蔓延
function drawSpread(spread) {
  const pointArray = spread.map((item) => [item.pointLongitude, item.pointLatitude])
  const polygon = new AMapRef.Polygon({
    path: pointArray,
    strokeColor: '#ff0000',
    strokeWeight: 2,
    fillColor: '#ff0000',
    fillOpacity: 0.25,
  })
  map.add(polygon)
  trendPolygons.push(polygon)
}
// 初始化地图
onMounted(async () => {
  const { default: AMapLoader } = await import('@amap/amap-jsapi-loader')
  window._AMapSecurityConfig = {
    securityJsCode: 'f0940ffece4b11b4c2dc051ae426b753',
  }
  AMapRef = await AMapLoader.load({
    key: '9dbe774f6416fa50ed53784db1335788',
    version: '2.0',
  })

  map = new AMapRef.Map('map-container', {
    viewMode: '2D',
    zoom: 14,
    center: [106.478794, 26.02060078],
  })

  // 建立 WebSocket 连接
  connect()

  // 初始化视频流
  webRtcServer = new WebRtcStreamer('video', location.protocol + '//127.0.0.1:8000')
  webRtcServer.connect('rtsp://rtspstream:jNq6GaTTSNlv8N6G_-Xfs@zephyr.rtsp.stream/movie')
})

let webRtcServer = null
onUnmounted(() => {
  close()
  if (webRtcServer) {
    webRtcServer.disconnect()
    webRtcServer = null
  }
})
</script>

<style scoped>
.fire-monitor {
  width: 100%;
  height: 100vh;
  position: relative;
  font-family: Arial, sans-serif;
}

.fire-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #50d32fa5;
  color: white;
  padding: 12px 20px;
  font-size: 20px;
  font-weight: bold;
}

.env-info {
  position: absolute;
  top: 60px;
  left: 16px;
  background: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  padding: 16px 20px;
  border-radius: 10px;
  font-size: 16px;
  z-index: 1000;
  font-weight: 600;
}

.map {
  width: 100%;
  height: 100%;
}

.fire-info-floating {
  position: absolute;
  top: 120px;
  right: 20px;
  width: 260px;
  background: white;
  padding: 18px;
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  font-size: 15px;
  font-weight: 500;
}

.left-bottom-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
}

.info-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 16px;
  border-radius: 10px;
  min-width: 200px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.info-card h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: bold;
}

.info-card p {
  margin: 4px 0;
  font-size: 14px;
}

.video-floating {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: black;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  z-index: 1000;
}
</style>
