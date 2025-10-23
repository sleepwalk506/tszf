<script setup>
import { onMounted, ref, provide, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const map = ref(null)
const AMapInstance = ref(null)
const isMapLoaded = ref(false) // 加载状态标识
const mapContainerId = 'base-map-container' // 唯一容器ID

provide('mapInstance', map)
provide('AMapInstance', AMapInstance)
provide('isMapLoaded', isMapLoaded)

const router = useRouter()

// 地图销毁函数
const destroyBaseMap = () => {
  if (map.value) {
    map.value.destroy()
    map.value = null
    AMapInstance.value = null
    isMapLoaded.value = false
  }
  // 清理容器
  const container = document.getElementById(mapContainerId)
  if (container) {
    container.innerHTML = ''
  }
}

// 路由守卫
router.beforeEach((to, from, next) => {
  if (from.matched.some((record) => record.components.default.name === 'BaseMap')) {
    console.log('BaseMap 路由即将离开，销毁地图...')
    destroyBaseMap()
  }
  next()
})

// 组件卸载时确保销毁
onUnmounted(() => {
  console.log('BaseMap组件卸载，销毁地图...')
  destroyBaseMap()
})

onMounted(async () => {
  console.log('BaseMap组件开始加载地图...')
  // 防止重复加载
  if (isMapLoaded.value || map.value) return

  try {
    // 确保容器存在
    if (!document.getElementById(mapContainerId)) {
      console.error('BaseMap地图容器未找到')
      return
    }

    const { default: AMapLoader } = await import('@amap/amap-jsapi-loader')
    window._AMapSecurityConfig = {
      securityJsCode: 'f0940ffece4b11b4c2dc051ae426b753',
    }

    const AMap = await AMapLoader.load({
      key: '9dbe774f6416fa50ed53784db1335788',
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.MarkerClusterer', 'AMap.Weather'],
    })

    AMapInstance.value = AMap
    const satelliteLayer = new AMap.TileLayer.Satellite()
    const roadNetLayer = new AMap.TileLayer.RoadNet()

    map.value = new AMap.Map(mapContainerId, {
      viewMode: '3D',
      zoom: 14,
      center: [106.46, 26.02],
    })

    // 关键修改：等待地图完全加载完成
    map.value.on('complete', () => {
      console.log('✅ BaseMap地图complete事件触发')
      // 再延迟一小段时间，确保地图内部状态完全稳定
      setTimeout(() => {
        map.value.setFitView()
        isMapLoaded.value = true
        console.log('✅ BaseMap地图已完全就绪，isMapLoaded设为true')
      }, 200)
    })
  } catch (e) {
    console.error('BaseMap 地图加载失败:', e)
    isMapLoaded.value = false
  }
})

defineExpose({
  getMap: () => map.value,
  getAMap: () => AMapInstance.value,
})
</script>

<template>
  <div :id="mapContainerId" class="base-map-container">
    <slot></slot>
    <slot name="drone-panel"></slot>
    <slot name="weather-panel"></slot>
    <slot name="map-point"></slot>
  </div>
</template>

<style scoped>
.base-map-container {
  width: 100%;
  height: 60vh;
  position: relative;
  margin-left: 10px;
}
</style>
