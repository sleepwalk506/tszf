<template>
  <div class="task-manager">
    <!-- 头部和表格部分保持不变 -->
    <div class="header">
      <div class="controls">
        <button class="btn btn-primary" @click="addTask">
          <i class="fas fa-plus"></i> 添加任务
        </button>
        <div class="search-box">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索任务..."
            @input="onSearchInput"
          />
          <i class="fas fa-search"></i>
          <button v-if="searchQuery" class="clear-search" @click="clearSearch" title="清除搜索">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <!-- 添加搜索统计信息 -->
        <div v-if="searchQuery" class="search-info">
          找到 {{ filteredTasks.length }} 个匹配的任务
        </div>
      </div>
    </div>

    <div class="task-table-container">
      <table class="task-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" :class="column.key">
              {{ column.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filteredTasks" :key="task.id">
            <td class="task-id">{{ task.id }}</td>
            <td class="task-name">{{ task.name }}</td>
            <td class="task-type">{{ getTaskTypeText(task.type) }}</td>
            <td class="start-time">{{ formatDateTime(task.startTime) }}</td>
            <td class="end-time">{{ formatDateTime(task.endTime) }}</td>
            <td class="task-status">
              <span :class="['status-badge', task.status]">{{ getStatusText(task.status) }}</span>
            </td>
            <td class="actions">
              <button class="btn btn-info btn-sm" @click="viewDetails(task)">
                <i class="fas fa-info-circle"></i> 详情
              </button>
              <button
                class="btn btn-warning btn-sm"
                @click="viewPlayback(task)"
                v-if="task.status !== 'processing'"
              >
                <i class="fas fa-play-circle"></i> 回放
              </button>
              <button class="btn btn-danger btn-sm" @click="deleteTask(task)">
                <i class="fas fa-trash-alt"></i> 删除
              </button>
            </td>
          </tr>
          <!-- 添加无搜索结果提示 -->
          <tr v-if="searchQuery && filteredTasks.length === 0">
            <td colspan="7" class="no-results">
              <i class="fas fa-search"></i>
              没有找到匹配 "{{ searchQuery }}" 的任务
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 详情模态框保持不变 -->
    <div v-if="selectedTask" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>任务详情</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-item">
            <label>任务ID:</label>
            <span>{{ selectedTask.id }}</span>
          </div>
          <div class="detail-item">
            <label>任务名称:</label>
            <span>{{ selectedTask.name }}</span>
          </div>
          <div class="detail-item">
            <label>任务类型:</label>
            <span>{{ selectedTask.type }}</span>
          </div>
          <div class="detail-item">
            <label>周期类型:</label>
            <span>{{ selectedTask.cycleType }}</span>
          </div>
          <div class="detail-item">
            <label>开始时间:</label>
            <span>{{ formatDateTime(selectedTask.startTime) }}</span>
          </div>
          <div class="detail-item">
            <label>截止时间:</label>
            <span>{{ formatDateTime(selectedTask.endTime) }}</span>
          </div>
          <div class="detail-item">
            <label>任务状态:</label>
            <span :class="['status-badge', selectedTask.status]">{{
              getStatusText(selectedTask.status)
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频回放模态框 - 已实现视频播放功能 -->
    <div v-if="playbackTask" class="modal" @click.self="closePlaybackModal">
      <div class="modal-content playback-modal">
        <div class="modal-header">
          <h2>视频回放 - {{ playbackTask.name }}</h2>
          <button class="close-btn" @click="closePlaybackModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="video-info">
            <div class="detail-item">
              <label>视频路径:</label>
              <span class="video-path">{{ videoPath }}</span>
            </div>
            <div class="detail-item">
              <label>任务ID:</label>
              <span>{{ playbackTask.id }}</span>
            </div>
            <div class="detail-item">
              <label>任务名称:</label>
              <span>{{ playbackTask.name }}</span>
            </div>
          </div>

          <div class="video-player-container">
            <!-- 真实的视频播放器 -->
            <video
              ref="videoPlayer"
              :src="videoPath"
              class="video-player"
              @timeupdate="updateProgress"
              @loadedmetadata="onVideoLoaded"
            >
              您的浏览器不支持 HTML5 视频播放。
            </video>

            <!-- 自定义播放器控件 -->
            <div class="custom-controls">
              <div class="progress-container">
                <div class="progress-bar" @click="seekVideo">
                  <div class="progress" :style="{ width: progressPercentage + '%' }"></div>
                </div>
                <span class="time-display"
                  >{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span
                >
              </div>

              <div class="control-buttons">
                <button class="control-btn" @click="togglePlay">
                  <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
                </button>
                <button class="control-btn" @click="restartVideo">
                  <i class="fas fa-redo"></i>
                </button>
                <button class="control-btn volume-btn" @click="toggleMute">
                  <i :class="isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up'"></i>
                </button>
                <input
                  type="range"
                  class="volume-slider"
                  min="0"
                  max="1"
                  step="0.1"
                  v-model="volume"
                  @input="updateVolume"
                />
                <button class="control-btn fullscreen-btn" @click="toggleFullscreen">
                  <i class="fas fa-expand"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="playback-controls">
            <button class="btn btn-primary" @click="togglePlay">
              <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
              {{ isPlaying ? '暂停' : '播放' }}
            </button>
            <button class="btn btn-info" @click="restartVideo">
              <i class="fas fa-redo"></i> 重播
            </button>
            <button class="btn btn-secondary" @click="downloadVideo">
              <i class="fas fa-download"></i> 下载视频
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ERouterName } from '../types/enum'
import axios from 'axios'

import video20250411102450 from './video/20250411102450.mp4'
import video20250419210344 from './video/20250419210344.mp4'

const router = useRouter()
// 表头定义
const columns = ref([
  { key: 'task-id', title: '任务ID' },
  { key: 'task-name', title: '任务名称' },
  { key: 'task-type', title: '任务类型' },
  { key: 'start-time', title: '开始时间' },
  { key: 'end-time', title: '截止时间' },
  { key: 'task-status', title: '任务状态' },
  { key: 'actions', title: '操作' },
])

const videoMap = {
  20250411102450: video20250411102450,
  20250419210344: video20250419210344,
}

// 任务数据
const tasks = ref([])
const searchQuery = ref('')
const selectedTask = ref(null)
const playbackTask = ref(null)
const videoPath = ref('')

// 视频播放相关状态
const videoPlayer = ref(null)
const isPlaying = ref(false)
const isMuted = ref(false)
const volume = ref(1)
const currentTime = ref(0)
const duration = ref(0)
const progressPercentage = ref(0)

// 过滤后的任务列表 - 优化搜索逻辑
const filteredTasks = computed(() => {
  if (!searchQuery.value.trim()) return tasks.value

  const query = searchQuery.value.toLowerCase().trim()
  return tasks.value.filter(
    (task) =>
      task.name.toLowerCase().includes(query) ||
      getTaskTypeText(task.type).toLowerCase().includes(query) ||
      task.id.toString().includes(query) ||
      getStatusText(task.status).toLowerCase().includes(query),
  )
})

// 搜索输入处理
const onSearchInput = () => {
  // 可以在这里添加防抖逻辑，如果需要的话
  console.log('搜索:', searchQuery.value)
}

// 清除搜索
const clearSearch = () => {
  searchQuery.value = ''
}

// 日期时间格式化
const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 格式化时间显示 (MM:SS)
const formatTime = (timeInSeconds) => {
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const getTaskTypeText = (task_type) => {
  switch (task_type) {
    case 0: // 火情监测
      return '火情监测'
    case 1:
      return '灾后评估'
    default:
      return ''
  }
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    processing: '执行中',
    completed: '已完成',
    failed: '执行异常',
  }
  return statusMap[status] || status
}

// 查看详情 - 修改后的逻辑
const viewDetails = (task) => {
  // 判断如果是灾损任务（type为1）且未完成（status不是'completed'）
  // if (task.type === 1 && task.status !== 'completed') {
  //   // 跳转到/monitor页面
  //   router.push('/monitor');
  // } else {
  //   // 其他情况跳转到原来的页面
  //   console.log('准备跳转')
  //   router.push({ name: ERouterName.ASSESSMENT_TOPBAR });
  // }

  if (task.type === 1) {
    router.push({
      name: ERouterName.ASSESSMENT_TOPBAR,
      params: { id: task.id },
    })
  } else if (task.type === 0) {
    // 其他情况跳转到原来的页面
    // console.log('准备跳转')
    router.push({
      name: ERouterName.TOPBAR_FORFIRE,
      params: { id: task.id },
    })
  }
}

// 查看回放
const viewPlayback = async (task) => {
  // 根据任务ID获取视频路径
  //videoPath.value = `/video/${task.id}.mp4`;
  //videoPath.value = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4'
  videoPath.value = videoMap[task.id] || ''
  playbackTask.value = task

  // 重置播放状态
  isPlaying.value = false
  currentTime.value = 0
  progressPercentage.value = 0

  // 打印视频路径到控制台
  console.log('视频路径:', videoPath.value)
  console.log('任务信息:', task)

  // 等待DOM更新后初始化视频
  await nextTick()
  if (videoPlayer.value) {
    videoPlayer.value.load()
  }
}

// 关闭回放模态框
const closePlaybackModal = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
  playbackTask.value = null
  videoPath.value = ''
  isPlaying.value = false
}

// 切换播放/暂停
const togglePlay = () => {
  if (!videoPlayer.value) return

  if (videoPlayer.value.paused) {
    videoPlayer.value.play()
    isPlaying.value = true
  } else {
    videoPlayer.value.pause()
    isPlaying.value = false
  }
}

// 重新开始播放
const restartVideo = () => {
  if (!videoPlayer.value) return

  videoPlayer.value.currentTime = 0
  videoPlayer.value.play()
  isPlaying.value = true
}

// 切换静音
const toggleMute = () => {
  if (!videoPlayer.value) return

  videoPlayer.value.muted = !videoPlayer.value.muted
  isMuted.value = videoPlayer.value.muted
}

// 更新音量
const updateVolume = () => {
  if (!videoPlayer.value) return

  videoPlayer.value.volume = volume.value
  isMuted.value = volume.value === 0
}

// 更新播放进度
const updateProgress = () => {
  if (!videoPlayer.value) return

  currentTime.value = videoPlayer.value.currentTime
  progressPercentage.value = (videoPlayer.value.currentTime / videoPlayer.value.duration) * 100
}

// 视频加载完成
const onVideoLoaded = () => {
  if (!videoPlayer.value) return

  duration.value = videoPlayer.value.duration
}

// 点击进度条跳转
const seekVideo = (event) => {
  if (!videoPlayer.value) return

  const progressBar = event.currentTarget
  const clickPosition = event.offsetX
  const progressBarWidth = progressBar.offsetWidth
  const seekTime = (clickPosition / progressBarWidth) * videoPlayer.value.duration

  videoPlayer.value.currentTime = seekTime
}

// 切换全屏
const toggleFullscreen = () => {
  if (!videoPlayer.value) return

  if (!document.fullscreenElement) {
    if (videoPlayer.value.requestFullscreen) {
      videoPlayer.value.requestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}

// 下载视频
const downloadVideo = () => {
  if (!videoPath.value) return

  const link = document.createElement('a')
  link.href = videoPath.value
  link.download = `${playbackTask.value.name}.mp4`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 删除任务
const deleteTask = (task) => {
  if (confirm(`确定要删除任务 "${task.name}" 吗？`)) {
    tasks.value = tasks.value.filter((t) => t.id !== task.id)
  }
}

// 添加任务
const addTask = () => {
  router.push({ name: ERouterName.TASK_ASSIGN })
}

// 关闭模态框
const closeModal = () => {
  selectedTask.value = null
}

// 初始化示例数据
onMounted(() => {
  axios.get(`http://10.112.247.164:8090/admin/task`).then((res) => {
    const processedData = res.data.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      startTime: item.startDate,
      endTime: item.endDate,
      status:
        item.status === 0
          ? 'processing'
          : item.status === 1
            ? 'completed'
            : item.status === 2
              ? 'failed'
              : 'unknown',
    }))
    tasks.value = processedData
  })
  // tasks.value = [
  //   {
  //     id: 20250411102450,
  //     name: '4月11 火场侦查',
  //     type: 0,
  //     startTime: '2025-04-11T10:24:50',
  //     endTime: '2025-04-11T11:21:24',
  //     status: 'completed',
  //   }
  // ]
})
</script>

<style scoped>
.task-manager {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.header h1 {
  color: #2c3e50;
  font-weight: 600;
}

.controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box input {
  padding: 8px 35px 8px 35px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 250px;
  transition: border-color 0.2s;
}

.search-box input:focus {
  border-color: #3498db;
  outline: none;
}

.search-box i.fa-search {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #888;
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transition: background-color 0.2s;
}

.clear-search:hover {
  background-color: #f0f0f0;
  color: #666;
}

.search-info {
  font-size: 14px;
  color: #666;
  margin-left: 10px;
  white-space: nowrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.task-table-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

.task-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.task-table th {
  background-color: #f8f9fa;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
}

.task-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #e9ecef;
}

.task-table tr:last-child td {
  border-bottom: none;
}

.task-table tr:hover {
  background-color: #f8f9fa;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.processing {
  background-color: #cce5ff;
  color: #004085;
}

.status-badge.completed {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.failed {
  background-color: #f8d7da;
  color: #721c24;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-style: italic;
}

.no-results i {
  margin-right: 8px;
  color: #999;
}

/* 模态框样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 20px;
}

.detail-item {
  display: flex;
  margin-bottom: 15px;
}

.detail-item label {
  font-weight: 600;
  min-width: 100px;
  color: #495057;
}

.detail-item span {
  color: #6c757d;
}

/* 视频回放模态框样式 */
.playback-modal {
  width: 700px;
  max-width: 95%;
}

.video-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.video-path {
  font-family: monospace;
  background-color: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  word-break: break-all;
}

.video-player-container {
  margin: 20px 0;
  position: relative;
}

.video-player {
  width: 100%;
  max-width: 100%;
  border-radius: 4px;
  background-color: #000;
  display: block;
}

/* 自定义播放器控件 */
.custom-controls {
  background-color: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 0 0 4px 4px;
  margin-top: -4px; /* 消除与视频之间的间隙 */
}

.progress-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.progress-bar {
  flex-grow: 1;
  height: 6px;
  background-color: #555;
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  margin-right: 10px;
}

.progress {
  height: 100%;
  background-color: #3498db;
  border-radius: 3px;
  transition: width 0.1s;
}

.time-display {
  color: white;
  font-size: 12px;
  min-width: 90px;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 5px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.volume-slider {
  width: 80px;
  cursor: pointer;
}

.playback-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-box {
    width: 100%;
  }

  .search-box input {
    width: 100%;
  }

  .search-info {
    margin-left: 0;
    margin-top: 10px;
  }

  .actions {
    flex-direction: column;
  }

  .playback-modal {
    width: 95%;
  }

  .playback-controls {
    flex-direction: column;
  }

  .control-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
