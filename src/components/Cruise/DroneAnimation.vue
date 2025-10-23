<script setup>
import { onMounted, onUnmounted, ref, inject, watch } from 'vue'

// 注入地图实例和加载状态
const map = inject('mapInstance')
const AMap = inject('AMapInstance')
const isMapLoaded = inject('isMapLoaded')

// 单个无人机信息
const droneInfo = ref({
  id: 1,
  name: '巡查无人机-01',
  battery: 85,
  altitude: 120,
  workingTime: '2小时15分',
  status: '飞行中',
})

// 组件属性
const props = defineProps({
  show: {
    type: Boolean,
    default: true,
  },
  showTrail: {
    type: Boolean,
    default: true,
  },
})

// 核心状态
let animationFrameId = null
const drone = ref(null)
const pathLine = ref(null)
const droneColor = '#00a8ff'

// 飞行路径（修正坐标，匹配地图中心 106.46, 26.02）
const flightPath = [
  [106.462, 26.02], // 正东方
  [106.462, 26.022], // 东北方
  [106.46, 26.022], // 正北方
  [106.458, 26.022], // 西北方
  [106.458, 26.02], // 正西方
  [106.458, 26.018], // 西南方
  [106.46, 26.018], // 正南方
  [106.462, 26.018], // 东南方
  [106.462, 26.02], // 闭合点（回到起点）
]

// 创建增强版无人机图标
const createDroneIcon = (angle = 0) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const size = 40
  const center = size / 2

  canvas.width = size
  canvas.height = size

  ctx.save()
  ctx.translate(center, center)
  ctx.rotate((angle * Math.PI) / 180)
  ctx.translate(-center, -center)

  // 绘制四个螺旋桨臂
  ctx.strokeStyle = '#2c3e50'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  // 绘制X形机臂
  const armLength = 14
  const positions = [
    { x: center - armLength, y: center - armLength },
    { x: center + armLength, y: center + armLength },
  ]
  const positions2 = [
    { x: center + armLength, y: center - armLength },
    { x: center - armLength, y: center + armLength },
  ]

  ctx.beginPath()
  ctx.moveTo(positions[0].x, positions[0].y)
  ctx.lineTo(positions[1].x, positions[1].y)
  ctx.moveTo(positions2[0].x, positions2[0].y)
  ctx.lineTo(positions2[1].x, positions2[1].y)
  ctx.stroke()

  // 绘制四个螺旋桨
  const propRadius = 4
  const propPositions = [
    { x: center - armLength, y: center - armLength },
    { x: center + armLength, y: center - armLength },
    { x: center - armLength, y: center + armLength },
    { x: center + armLength, y: center + armLength },
  ]

  propPositions.forEach((pos) => {
    // 螺旋桨外圈
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, propRadius, 0, Math.PI * 2)
    ctx.fillStyle = droneColor
    ctx.fill()
    ctx.strokeStyle = '#2c3e50'
    ctx.lineWidth = 1
    ctx.stroke()

    // 螺旋桨中心点
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI * 2)
    ctx.fillStyle = '#2c3e50'
    ctx.fill()
  })

  // 绘制中心机身
  ctx.beginPath()
  ctx.arc(center, center, 6, 0, Math.PI * 2)
  ctx.fillStyle = droneColor
  ctx.fill()
  ctx.strokeStyle = '#2c3e50'
  ctx.lineWidth = 2
  ctx.stroke()

  // 绘制方向指示器（前方标记）
  ctx.beginPath()
  ctx.moveTo(center, center - 6)
  ctx.lineTo(center, center - 10)
  ctx.strokeStyle = '#e74c3c'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.stroke()

  ctx.restore()
  return canvas
}

// 计算两点之间的角度
const calculateAngle = (from, to) => {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

// 创建方向箭头
const createDirectionArrow = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  canvas.width = 24
  canvas.height = 24

  ctx.fillStyle = droneColor
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(24, 12)
  ctx.lineTo(0, 24)
  ctx.closePath()
  ctx.fill()

  return canvas
}

// 创建飞行路径线
const createPathLine = () => {
  if (!AMap.value || !map.value) {
    console.log('❌ AMap或map实例不可用，无法创建路径线')
    return
  }

  // 检查地图是否真的可用（通过调用一个方法测试）
  try {
    const zoom = map.value.getZoom()
    console.log('📍 当前地图缩放级别:', zoom)
  } catch (e) {
    console.error('❌ 地图实例无效:', e)
    return
  }

  try {
    // 先清理已存在的路径线
    clearPathLine()

    const polyline = new AMap.value.Polyline({
      path: flightPath,
      showDir: true,
      dirImg: createDirectionArrow(),
      strokeColor: droneColor,
      strokeWeight: 6,
      zIndex: 10000,
    })

    if (props.showTrail) {
      map.value.add(polyline)
    }

    pathLine.value = polyline
    console.log('✅ 飞行路径线已创建并添加到地图，显示状态:', props.showTrail)
  } catch (error) {
    console.error('❌ 创建飞行路径线失败:', error)
    throw error
  }
}

// 清理路径线
const clearPathLine = () => {
  try {
    if (pathLine.value && map.value) {
      map.value.remove(pathLine.value)
      pathLine.value = null
    }
  } catch (error) {
    console.error('清理路径线时出错:', error)
    pathLine.value = null
  }
}

// 启动无人机动画（使用 requestAnimationFrame 提升性能）
const startDroneAnimation = () => {
  if (!isMapLoaded.value || !AMap.value || !map.value) {
    console.log('❌ 地图未就绪，无法启动动画')
    return
  }

  // 验证地图实例有效性
  try {
    map.value.getZoom()
  } catch (e) {
    console.error('❌ 地图实例无效，无法启动动画:', e)
    return
  }

  try {
    // 清理已存在的无人机
    if (drone.value?.marker) {
      drone.value.marker.setMap(null)
      drone.value = null
    }

    // 初始化无人机
    const droneMarker = new AMap.value.Marker({
      position: flightPath[0],
      content: createDroneIcon(),
      anchor: 'center',
      zIndex: 10000,
    })

    if (props.showTrail) {
      droneMarker.setMap(map.value)
    }

    drone.value = {
      marker: droneMarker,
      currentIndex: 0,
      progress: 0,
      speed: 0.02, // 移动速度
    }

    // 使用 requestAnimationFrame 实现平滑动画
    let lastTime = performance.now()
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime

      // 控制刷新率约60fps
      if (deltaTime > 16) {
        lastTime = currentTime
        updateDronePosition()
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)
    console.log('✅ 无人机标记已创建并添加到地图，动画已启动，显示状态:', props.showTrail)
  } catch (error) {
    console.error('❌ 启动无人机动画失败:', error)
    throw error
  }
}

// 更新无人机位置
const updateDronePosition = () => {
  if (!drone.value) return

  const { marker, currentIndex, progress, speed } = drone.value
  const currentPoint = flightPath[currentIndex]
  const nextIndex = (currentIndex + 1) % flightPath.length
  const nextPoint = flightPath[nextIndex]

  let newProgress = progress + speed

  // 到达下一个点
  if (newProgress >= 1) {
    newProgress = 0
    drone.value.currentIndex = nextIndex
  }

  // 插值计算当前位置
  const currentPos = [
    currentPoint[0] + (nextPoint[0] - currentPoint[0]) * newProgress,
    currentPoint[1] + (nextPoint[1] - currentPoint[1]) * newProgress,
  ]

  // 计算飞行方向
  const angle = calculateAngle(currentPoint, nextPoint)

  // 更新无人机
  marker.setPosition(currentPos)
  marker.setContent(createDroneIcon(angle))

  drone.value.progress = newProgress
}

// 停止无人机动画
const stopDroneAnimation = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// 切换轨迹显示
const toggleTrail = (show) => {
  if (pathLine.value) {
    show ? map.value.add(pathLine.value) : map.value.remove(pathLine.value)
  }
  if (drone.value?.marker) {
    show ? drone.value.marker.setMap(map.value) : drone.value.marker.setMap(null)
  }
}

// 监听轨迹显示状态
watch(
  () => props.showTrail,
  (newVal) => {
    toggleTrail(newVal)
  },
)

// 安全初始化无人机系统
const initDroneSystem = () => {
  // 严格检查地图实例的完整性
  if (!map.value || !AMap.value || !isMapLoaded.value) {
    console.log('🔄 地图实例未就绪，跳过初始化', {
      hasMap: !!map.value,
      hasAMap: !!AMap.value,
      isLoaded: isMapLoaded.value,
    })
    return
  }

  console.log('🚀 开始初始化无人机系统...')

  // 延迟执行，确保地图完全稳定
  setTimeout(() => {
    try {
      // 再次检查地图是否有效
      if (!map.value || !map.value.getZoom) {
        console.log('⚠️ 地图实例无效，延迟重试...')
        setTimeout(() => initDroneSystem(), 500)
        return
      }

      createPathLine()
      startDroneAnimation()
    } catch (error) {
      console.error('❌ 无人机系统初始化失败:', error)
      // 如果失败，500ms后重试一次
      setTimeout(() => {
        try {
          console.log('🔄 重试初始化无人机系统...')
          createPathLine()
          startDroneAnimation()
        } catch (retryError) {
          console.error('❌ 无人机系统重试初始化仍然失败:', retryError)
        }
      }, 500)
    }
  }, 300)
}

// 监听地图加载状态
watch(isMapLoaded, (loaded) => {
  console.log('📡 地图加载状态变化:', loaded, '组件显示状态:', props.show)
  if (loaded && props.show) {
    console.log('✨ 条件满足，触发初始化无人机系统')
    initDroneSystem()
  }
})

// 组件挂载
onMounted(() => {
  console.log('🛸 DroneAnimation组件已挂载', {
    hasMap: !!map.value,
    hasAMap: !!AMap.value,
    isMapLoaded: isMapLoaded.value,
    showProp: props.show,
  })

  if (isMapLoaded.value) {
    console.log('📍 地图已标记为加载完成，准备初始化...')
    initDroneSystem()
  } else {
    console.log('⏳ 地图尚未加载完成，等待watch触发...')
  }
})

// 组件卸载
onUnmounted(() => {
  console.log('DroneAnimation组件开始卸载...')

  try {
    stopDroneAnimation()

    if (drone.value?.marker) {
      drone.value.marker.setMap(null)
      drone.value = null
    }

    clearPathLine()

    console.log('✅ DroneAnimation组件卸载完成')
  } catch (error) {
    console.error('❌ 组件卸载时出错:', error)
  }
})

// 暴露方法和数据
defineExpose({
  droneInfo,
  startDroneAnimation,
  stopDroneAnimation,
})
</script>

<template>
  <div v-if="show" class="drone-panel">
    <h3 class="panel-title">🚁 无人机状态</h3>

    <div class="drone-info">
      <div class="info-item">
        <span class="label">名称:</span>
        <span class="value">{{ droneInfo.name }}</span>
      </div>
      <div class="info-item">
        <span class="label">电量:</span>
        <span class="value" :class="{ 'low-battery': droneInfo.battery < 20 }">
          {{ droneInfo.battery }}%
        </span>
      </div>
      <div class="info-item">
        <span class="label">飞行高度:</span>
        <span class="value">{{ droneInfo.altitude }}米</span>
      </div>
      <div class="info-item">
        <span class="label">工作时间:</span>
        <span class="value">{{ droneInfo.workingTime }}</span>
      </div>
      <div class="info-item">
        <span class="label">状态:</span>
        <span
          class="value status"
          :class="{
            'status-flying': droneInfo.status === '飞行中',
            'status-landed': droneInfo.status === '已降落',
            'status-warning': droneInfo.status === '警告',
          }"
        >
          {{ droneInfo.status }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drone-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  font-family: Arial, sans-serif;
  min-width: 220px;
  z-index: 1000;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.panel-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.drone-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  line-height: 1.4;
}

.label {
  color: #6b7280;
  font-weight: 500;
}

.value {
  color: #374151;
  font-weight: 600;
}

.low-battery {
  color: #ef4444 !important;
  font-weight: 700;
}

.status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.status-flying {
  background-color: #10b981;
  color: white;
}

.status-landed {
  background-color: #6b7280;
  color: white;
}

.status-warning {
  background-color: #f59e0b;
  color: white;
}
</style>
