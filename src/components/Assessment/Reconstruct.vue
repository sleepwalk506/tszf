<!-- <template>
  <div class="map-container" style="height: 60vh">
    <Dmap></Dmap>
  </div>
</template>

<script setup>
import Dmap from '@/components/Assessment/3Dmap.vue'
</script> -->

<!-- 灾后重建地图部分，直接把三维地图放这了 -->

<template>
  <div ref="rendererContainer"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'

const route = useRoute()
const rendererContainer = ref(null)
let gui = null
// let url = null

const props = defineProps({
  id: {
    type: [String, Number],
    default: '',
  },
})

onMounted(() => {
  // console.log(`http://10.112.247.164:8090/admin/map/3d/${route.params.id}`)
  console.log(route.params.id)
  axios.get(`http://10.112.247.164:8090/admin/map/3d/${props.id}`).then((res) => {
    console.log('map', res.data)
    const url = res.data.mapUrl
    console.log('url:' + url)
    loadModel(url)
  })
  //把下面这一块解掉注释即可加载3d地图
  // loadModel('https://zxh-mapfile.oss-cn-beijing.aliyuncs.com/mapfile/dataset10.ply')
  // loadModel('http://10.112.247.164:9001/tszf3dmodel/dataset10.ply')
})

onBeforeUnmount(() => {
  if (gui) gui.destroy()
})

function loadModel(url) {
  // Create scene
  const scene = new THREE.Scene()
  scene.add(new THREE.AxesHelper(5))

  // Create lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
  scene.add(ambientLight)

  const spotLight = new THREE.SpotLight(0xffffff)
  spotLight.position.set(50, 50, 50)
  spotLight.castShadow = true
  scene.add(spotLight)

  // Create camera
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.y = 10

  // Create renderer
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false, // 关闭抗锯齿
    powerPreference: 'high-performance', // 优先使用高性能模式
    precision: 'mediump', // 使用中等精度
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  rendererContainer.value.appendChild(renderer.domElement)

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  gui = new GUI()
  const loader = new PLYLoader()

  // Scale model to fit the view
  function setScaleToFitSize(object) {
    const box = new THREE.Box3().setFromObject(object)
    const mdlen = box.max.x - box.min.x
    const mdwid = box.max.z - box.min.z
    const mdhei = box.max.y - box.min.y
    const x1 = box.min.x + mdlen / 2
    const y1 = box.min.y + mdhei / 2
    const z1 = box.min.z + mdwid / 2
    const diagonal = Math.sqrt(mdlen ** 2 + mdwid ** 2 + mdhei ** 2)
    controls.object.position.set(
      box.max.x + diagonal / 2,
      (diagonal * 2) / Math.tan((Math.PI / 180) * 45) + Math.abs(box.max.y),
      box.max.z + diagonal / 2,
    )
    controls.target.set(x1, y1, z1)
    controls.update()
  }

  const params = { uniformScale: 1 }

  loader.load(
    url,
    (geometry) => {
      geometry.computeVertexNormals()
      geometry.computeBoundingBox()

      geometry.center()
      const material = new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.001,
      })
      const points = new THREE.Points(geometry, material)
      setScaleToFitSize(points)
      points.rotateX(Math.PI / 2)

      scene.add(points)

      const folder = gui.addFolder('Map Position')
      folder.add(points.position, 'x', -10, 10, 1).name('Position X')
      folder.add(points.position, 'y', -10, 10, 1).name('Position Y')
      folder.add(points.position, 'z', -10, 10, 1).name('Position Z')

      gui
        .add(params, 'uniformScale', 1, 20)
        .name('Scale All')
        .onChange((value) => {
          points.scale.set(value, value, value)
        })
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
      console.error(error)
    },
  )

  window.addEventListener('resize', onWindowResize, false)

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  const stats = new Stats()
  rendererContainer.value.appendChild(stats.dom)
  stats.dom.style.position = 'absolute'
  stats.dom.style.top = '100px'

  const sidebar = document.querySelector('aside')
  if (sidebar) {
    const resizeObserver = new ResizeObserver(() => {
      adjustStatsPosition()
    })
    resizeObserver.observe(sidebar)
  }

  function adjustStatsPosition() {
    const sidebarWidth = sidebar ? sidebar.offsetWidth : 0
    stats.dom.style.left = `${sidebarWidth + 30}px`
  }

  const lil_gui = document.querySelector('.lil-gui.autoPlace')
  lil_gui.style.top = '100px'
  lil_gui.style.right = '30px'
  function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
    stats.update()
  }

  animate()
}
</script>

<style scoped>
#rendererContainer {
  width: 100vw;
  height: 100vh;
}
</style>
