<template>
  <div id="MapContainer" ref="mapContainerRef"></div>
  <div class="map-control bottom-right vertical-buttons">
    <a-button @click="switchLayer">{{ isSat ? '切换至标准图' : '切换至卫星图' }}</a-button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import uavImage from '../assets/images/uav.png'
import fireImage from '../assets/images/fire.png'
import errorImage from '../assets/images/error.png'

const router = useRouter()

const globalData = reactive({
  uavData: [
    {
      task: {
        task_type: 0,
        cycle_type: 0,
      },
      name: '无人机1',
      model: 'Matrice 4T',
      status: 0,
      action: 1,
      speed: 10,
      height: 100,
      battery: 80,
      lnglats: [106.46, 26.02],
    },
    {
      task: {
        task_type: 1,
        cycle_type: 1,
      },
      name: '无人机2',
      model: 'Matrice 4T',
      status: 1,
      action: 3,
      speed: 10,
      height: 150,
      battery: 60,
      lnglats: [106.48, 26.010123],
    },
    {
      task: {
        task_type: null,
        cycle_type: null,
      },
      name: '无人机3',
      model: 'Matrice 4T',
      status: 0,
      action: 0,
      speed: 40,
      height: 200,
      battery: 30,
      lnglats: [106.48, 26.02],
    },
    {
      task: {
        task_type: 0,
        cycle_type: 2,
      },
      name: '无人机4',
      model: 'Matrice 4T',
      status: 0,
      action: 2,
      speed: 50,
      height: 200,
      battery: 30,
      lnglats: [106.47, 26.03],
    },
  ],

  fireData: [
    {
      id: '20250916125943',
      direction: '东南方向',
      level: 2,
      lnglats: [106.47, 26.02],
      time: '2025-09-16 12:59:43',
    },
  ],
})

// 地图实例与相关资源管理
let map = null
let infoWindow = null
let uavIcon = null,
  fireIcon = null,
  errorIcon = null
const mapContainerRef = ref(null)
let satellite = null
let isSat = ref(false) // 初始化默认值为false

/**
 * 地图资源销毁函数
 * 确保所有地图相关实例和资源都被彻底清理
 */
const destroyMap = () => {
  console.log('Monitor: 开始销毁地图资源...')

  // 销毁地图实例
  if (map) {
    map.destroy()
    map = null
  }

  // 清理图层和窗口
  satellite = null
  if (infoWindow) {
    infoWindow.close()
    infoWindow = null
  }

  // 清理图标资源
  uavIcon = null
  fireIcon = null
  errorIcon = null

  // 清空地图容器
  if (mapContainerRef.value) {
    mapContainerRef.value.innerHTML = ''
  }

  console.log('Monitor: 地图资源销毁完成')
}

// 路由守卫：离开当前组件时销毁地图
router.beforeEach((to, from, next) => {
  if (from.matched.some((record) => record.components.default.name === 'Monitor')) {
    console.log('Monitor 路由即将离开，执行销毁...')
    destroyMap()
  }
  next()
})

onMounted(async () => {
  console.log('Monitor.vue 开始加载地图...')

  // 防止重复初始化
  if (map) {
    console.log('地图已初始化，无需重复加载')
    return
  }

  try {
    // 确保容器已挂载
    if (!mapContainerRef.value) {
      console.error('地图容器未找到，请检查DOM是否正确渲染')
      return
    }

    const { default: AMapLoader } = await import('@amap/amap-jsapi-loader')
    window._AMapSecurityConfig = {
      securityJsCode: 'f0940ffece4b11b4c2dc051ae426b753',
    }
    const AMap = await AMapLoader.load({
      key: '9dbe774f6416fa50ed53784db1335788',
      version: '2.0',
      plugins: [''],
    })

    map = new AMap.Map(mapContainerRef.value, {
      viewMode: '3D',
      zoom: 14,
      center: [106.46, 26.02],
      defaultCursor: 'pointer',
    })

    satellite = new AMap.TileLayer.Satellite()
    map.addLayer(satellite)
    isSat.value = false
    satellite.hide()

    uavIcon = new AMap.Icon({
      size: new AMap.Size(30, 30),
      image: uavImage,
      imageSize: new AMap.Size(30, 30),
    })

    fireIcon = new AMap.Icon({
      size: new AMap.Size(30, 30),
      image: fireImage,
      imageSize: new AMap.Size(30, 30),
    })

    errorIcon = new AMap.Icon({
      size: new AMap.Size(20, 20),
      image: errorImage,
      imageSize: new AMap.Size(20, 20),
    })

    infoWindow = new AMap.InfoWindow({
      isCustom: true,
      offset: new AMap.Pixel(0, -15),
    })

    generateUavInfoWindow(globalData.uavData)
    generateFireInfoWindow(globalData.fireData)

    closeInfoWindow()
  } catch (e) {
    console.error('地图初始化错误:', e)
  }
})

// 组件卸载时再次销毁地图，双重保险
onUnmounted(() => {
  console.log('Monitor组件卸载，执行销毁...')
  destroyMap()
})

function switchLayer() {
  if (isSat.value) {
    isSat.value = false
    satellite.hide()
  } else {
    isSat.value = true
    satellite.show()
  }
}

function generateFireInfoWindow(data) {
  for (const fire of data) {
    const marker = new AMap.Marker({
      position: new AMap.LngLat(fire.lnglats[0], fire.lnglats[1]), //点标记的位置
      icon: fireIcon, //添加 Icon 实例
      zooms: [2, 20], //点标记显示的层级范围，超过范围不显示
      offset: new AMap.Pixel(-15, -15),
    })

    marker.content = generateFireContent(fire)

    marker.on('click', markerClick)
    marker.emit('click', { target: marker })

    map.add(marker)
  }
}

function generateFireContent(fire) {
  const info = document.createElement('div')
  info.className = 'custom-info input-card content-window-card'
  info.style.width = '260px'

  // 顶部标题栏
  const top = document.createElement('div')
  top.className = 'info-top'

  const titleD = document.createElement('div')
  titleD.className = 'info-title'
  titleD.innerHTML = '火场信息'

  const closeX = document.createElement('img')
  closeX.src = 'https://webapi.amap.com/images/close2.gif'
  closeX.onclick = closeInfoWindow

  top.appendChild(titleD)
  top.appendChild(closeX)
  info.appendChild(top)

  const middle = document.createElement('div')
  middle.className = 'info-middle'
  middle.style.backgroundColor = '#fff'

  const status = document.createElement('div')
  status.className = 'info-tags'
  status.innerHTML = `<span class="tag tag-red">向${fire.direction}蔓延<span>`
  middle.appendChild(status)

  const time = document.createElement('div')
  time.className = 'info-section'
  time.innerHTML = `<span class = "label">发生时间</span>
                    ${fire.time}`
  middle.appendChild(time)

  const position = document.createElement('div')
  position.className = 'info-section'
  position.innerHTML = `<span class="label">火灾位置</span>${fire.lnglats}`
  middle.appendChild(position)

  const mission_link = document.createElement('div')
  mission_link.className = 'info-section'
  mission_link.innerHTML = `<a href="/fire_monitor" class="mission-link">前往火灾蔓延预测详情&gt;&gt;</a>`
  middle.appendChild(mission_link)

  info.appendChild(middle)

  return info
}

function generateUavInfoWindow(data) {
  for (const uav of data) {
    const marker = new AMap.Marker({
      position: new AMap.LngLat(uav.lnglats[0], uav.lnglats[1]), //点标记的位置
      icon: uavIcon, //添加 Icon 实例
      zooms: [2, 20], //点标记显示的层级范围，超过范围不显示
      offset: new AMap.Pixel(-15, -15),
    })

    marker.setTitle(uav.name)

    marker.setLabel({
      direction: 'bottom',
      offset: new AMap.Pixel(0, 0), //设置文本标注偏移量
      content: "<div class='info'>" + uav.name + '</div>', //设置文本标注内容
    })

    marker.content = generateUavContent(uav)

    marker.on('click', markerClick)
    marker.emit('click', { target: marker })

    map.add(marker)

    if (uav.status == 1) {
      //如果无人机异常，添加异常标记
      const error = new AMap.Marker({
        position: new AMap.LngLat(uav.lnglats[0], uav.lnglats[1]), //点标记的位置
        icon: errorIcon, //添加 Icon 实例
        zooms: [2, 20], //点标记显示的层级范围，超过范围不显示
        offset: new AMap.Pixel(5, -25),
      })

      map.add(error)
    }
  }
}

function generateUavContent(uav) {
  // 外层容器
  const info = document.createElement('div')
  info.className = 'custom-info input-card content-window-card'
  info.style.width = '260px'

  // 顶部标题栏
  const top = document.createElement('div')
  top.className = 'info-top'

  const titleD = document.createElement('div')
  titleD.className = 'info-title'
  titleD.innerHTML = uav.name

  const closeX = document.createElement('img')
  closeX.src = 'https://webapi.amap.com/images/close2.gif'
  closeX.onclick = closeInfoWindow

  top.appendChild(titleD)
  top.appendChild(closeX)
  info.appendChild(top)

  // 中间内容
  const middle = document.createElement('div')
  middle.className = 'info-middle'
  middle.style.backgroundColor = '#fff'

  // 状态标签
  const status = document.createElement('div')
  status.className = 'info-tags'
  let statusHtml = `
  <span class="tag ${getUavStatusClass(uav.status)}">
    ${getUavStatusText(uav.status)}
  </span>
  <span class="tag ${getUavActionClass(uav.action)}">
      ${getUavActionText(uav.action)}
  </span>
`

  // 空闲状态不显示任务周期类型
  if (uav.action != 0) {
    statusHtml += `
    <span class="tag ${getTaskCycleTypeClass(uav.task.cycle_type)}">
      ${getTaskCycleText(uav.task.cycle_type)}
    </span>

  `
  }
  status.innerHTML = statusHtml
  middle.appendChild(status)

  const mission = document.createElement('div')
  mission.className = 'info-section'
  mission.innerHTML = `<span class="label">任务类型</span>
                       ${getTaskTypeText(uav.task.task_type)}`
  if (uav.status != 2) middle.appendChild(mission)

  // 电量
  const battery = document.createElement('div')
  battery.className = 'info-section'
  battery.innerHTML = `<span class="label">🔋 电量</span>
                       <span class="battery">${uav.battery}%</span>`
  middle.appendChild(battery)

  // 飞行参数
  const flight = document.createElement('div')
  flight.className = 'info-section'
  flight.innerHTML = `<span class="label">飞行参数</span>
                      高度 ${uav.height}m<br>
                      速度 ${uav.speed}m/s`
  if (uav.action == 2) middle.appendChild(flight)

  const position = document.createElement('div')
  position.className = 'info-section'
  position.innerHTML = `<span class="label">${uav.status == 0 ? '当前位置' : '最后位置'}</span>${uav.lnglats}`
  middle.appendChild(position)

  // 任务链接
  const mission_link = document.createElement('div')
  mission_link.className = 'info-section'
  if(uav.task.task_type == 0){
    mission_link.innerHTML = `<a href="/fire_monitor" class="mission-link">前往任务详情&gt;&gt;</a>`
  }else if(uav.task.task_type == 1){
    mission_link.innerHTML = `<a href="/assessment" class="mission-link">前往任务详情&gt;&gt;</a>`
  }
  
  if (uav.action != 0) middle.appendChild(mission_link)

  info.appendChild(middle)

  return info
}

function getUavStatusClass(status) {
  switch (status) {
    case 0: // 正常
      return 'tag-green'
    case 1: // 异常
      return 'tag-red'
    default:
      return 'tag-transparent'
  }
}

function getUavStatusText(status) {
  switch (status) {
    case 0: // 正常
      return '正常'
    case 1: // 异常
      return '异常'
    default:
      return ''
  }
}

function getTaskCycleTypeClass(cycle_type) {
  switch (cycle_type) {
    case 0: // 周期任务
      return 'tag-blue'
    case 1: // 手动任务
      return 'tag-green'
    case 2: // 紧急任务
      return 'tag-red'
    default:
      return 'tag-transparent'
  }
}

function getTaskCycleText(cycle_type) {
  switch (cycle_type) {
    case 0: // 周期任务
      return '周期任务'
    case 1: // 手动任务
      return '手动任务'
    case 2: // 紧急任务
      return '紧急任务'
    default:
      return ''
  }
}

function getTaskTypeText(task_type) {
  switch (task_type) {
    case 0: // 火情监测
      return '火情监测'
    case 1:
      return '灾后评估'
    default:
      return ''
  }
}

function getUavActionClass(action) {
  switch (action) {
    case 0:
      return 'tag-blue'
    case 1:
      return 'tag-green'
    case 2:
      return 'tag-yellow'
    case 3:
      return 'tag-red'
    default:
      return 'tag-transparent'
  }
}

function getUavActionText(action) {
  switch (action) {
    case 0:
      return '空闲'
    case 1:
      return '待执行'
    case 2:
      return '执行中'
    case 3:
      return '执行异常'
    default:
      return ''
  }
}

function markerClick(e) {
  if (infoWindow && map) {
    infoWindow.setContent(e.target.content)
    infoWindow.open(map, e.target.getPosition())
  }
}

//关闭信息窗体
function closeInfoWindow() {
  if (map) {
    map.clearInfoWindow()
  }
}
</script>

<style>
#MapContainer {
  width: 100%;
  height: 800px;
}

.amap-marker-label {
  border: 0;
  background-color: transparent;
}

.info {
  position: relative;
  margin: 0;
  top: 0;
  right: 0;
  min-width: 0;
}

/* 外层信息窗体 */
.custom-info.content-window-card {
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

/* 顶部标题栏 */
.info-top {
  position: relative;
  background: #f9f9f9;
  border-bottom: 1px solid #ddd;
  border-radius: 6px 6px 0 0;
  padding: 6px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-title {
  font-weight: bold;
  font-size: 15px;
  color: #000000;
}

.info-top img {
  width: 14px;
  height: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.info-top img:hover {
  transform: scale(1.1);
}

.info-middle {
  padding: 10px;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  /* 垂直排列 */
  align-items: center;
  /* 水平居中 */
  text-align: center;
  /* 文本居中 */
}

/* 标签仍保持居中 */
.info-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
  justify-content: center;
}

.tag {
  display: inline-block;
  border-radius: 10px;
  font-size: 12px;
  padding: 2px 8px;
  color: #fff;
}

.tag-red {
  background: #f44336;
}

.tag-green {
  background: #4caf50;
}

.tag-blue {
  background: #68c6f2;
}

.tag-yellow {
  background: #ecb340;
}

.tag-transparent {
  background: transparent;
}

/* 各段落居中显示 */
.info-section {
  margin: 6px 0;
  display: flex;
  flex-direction: column;
  /* 纵向堆叠 */
  align-items: center;
  /* 水平居中 */
}

/* 标签去掉固定宽度 */
.label {
  font-weight: bold;
  margin-right: 0;
  width: auto;
  text-align: center;
}

/* 电量文字 */
.battery {
  color: #ff7f50;
  font-weight: bold;
}

/* 任务时间 */
.mission-time {
  font-size: 16px;
  font-weight: bold;
  color: #4caf50;
}

/* 链接样式 */
.mission-link {
  color: #00aaff;
  text-decoration: none;
  margin-left: 6px;
  font-size: 12px;
}

.mission-link:hover {
  text-decoration: underline;
}

/* 底部箭头 */
.info-bottom {
  text-align: center;
  margin-top: -1px;
}

.info-bottom img {
  display: block;
  margin: 0 auto;
}

.map-control {
  position: absolute;
  background: #fff;
  padding: 10px 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  z-index: 1000;
}

.map-control.bottom-right {
  bottom: 120px;
  right: 60px;
  width: 200px;
}

.vertical-buttons {
  display: flex;
  flex-direction: column;
  /* 垂直排列 */
  gap: 10px;
  /* 按钮间距 */
}
</style>
