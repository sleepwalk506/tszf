<template>
  <div class="image-recognition-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-content">
        <div class="title-section">
          <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" class="drone-icon">
              <path d="M12 2L15 5H9L12 2Z" fill="currentColor" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <circle cx="6" cy="6" r="2" stroke="currentColor" stroke-width="2" fill="none" />
              <circle cx="18" cy="6" r="2" stroke="currentColor" stroke-width="2" fill="none" />
              <circle cx="6" cy="18" r="2" stroke="currentColor" stroke-width="2" fill="none" />
              <circle cx="18" cy="18" r="2" stroke="currentColor" stroke-width="2" fill="none" />
              <line x1="8" y1="8" x2="10" y2="10" stroke="currentColor" stroke-width="2" />
              <line x1="16" y1="8" x2="14" y2="10" stroke="currentColor" stroke-width="2" />
              <line x1="8" y1="16" x2="10" y2="14" stroke="currentColor" stroke-width="2" />
              <line x1="16" y1="16" x2="14" y2="14" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <div>
            <h1 class="system-title">智能图像识别</h1>
            <p class="system-subtitle">无人机巡查 · AI识别</p>
          </div>
        </div>
        <div class="status-badge">
          <span class="status-dot"></span>
          实时更新中
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 信息卡片 -->
      <div class="info-cards">
        <div class="info-card">
          <div class="card-icon progress-icon">📊</div>
          <div class="card-content">
            <div class="card-label">当前数量</div>
            <div class="card-value">{{ currentImageIndex + 1 }} / {{ totalImages }}</div>
          </div>
        </div>
        <div class="info-card">
          <div class="card-icon time-icon">🕐</div>
          <div class="card-content">
            <div class="card-label">拍摄时间</div>
            <div class="card-value">{{ imageTimestamp }}</div>
          </div>
        </div>
        <div class="info-card">
          <div class="card-icon location-icon">📍</div>
          <div class="card-content">
            <div class="card-label">位置坐标</div>
            <div class="card-value">{{ imageCoordinates }}</div>
          </div>
        </div>
      </div>

      <!-- 图像展示区域 -->
      <div class="image-section">
        <div class="image-container">
          <div class="image-wrapper">
            <transition name="fade" mode="out-in">
              <img
                v-if="!isLoading"
                :key="currentImageIndex"
                :src="currentImageUrl"
                alt="巡查图像"
                class="main-image"
              />
            </transition>
            <!-- 加载动画 -->
            <div v-if="isLoading" class="loading-overlay">
              <div class="spinner"></div>
              <p class="loading-text">图像加载中...</p>
            </div>
          </div>

          <!-- 图像导航指示器 -->
          <div class="image-indicators">
            <span
              v-for="index in totalImages"
              :key="index"
              class="indicator"
              :class="{ active: currentImageIndex === index - 1 }"
              @click="loadNewImage(index - 1)"
            ></span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="controls">
          <button
            class="control-btn prev-btn"
            @click="handlePrevImage"
            :disabled="currentImageIndex === 0"
          >
            <svg viewBox="0 0 24 24" fill="none" class="btn-icon">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>上一张</span>
          </button>

          <button class="control-btn primary-btn" @click="handleSaveImage">
            <svg viewBox="0 0 24 24" fill="none" class="btn-icon">
              <path
                d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M17 21V13H7V21"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7 3V8H15"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>保存图像</span>
          </button>

          <button
            class="control-btn next-btn"
            @click="handleNextImage"
            :disabled="currentImageIndex === totalImages - 1"
          >
            <span>下一张</span>
            <svg viewBox="0 0 24 24" fill="none" class="btn-icon">
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 图像相关状态
const currentImageIndex = ref(0)
const totalImages = ref(5)
const isLoading = ref(false)

// 模拟图像数据
const currentImageUrl = ref('https://picsum.photos/1200/800?random=1')
const imageTimestamp = ref('2024-10-19 14:30:22')
const imageCoordinates = ref('N30.1234°, E106.4600°')

// 上一张图像
const handlePrevImage = () => {
  if (currentImageIndex.value > 0) {
    loadNewImage(currentImageIndex.value - 1)
  }
}

// 下一张图像
const handleNextImage = () => {
  if (currentImageIndex.value < totalImages.value - 1) {
    loadNewImage(currentImageIndex.value + 1)
  }
}

// 保存图像
const handleSaveImage = () => {
  console.log('保存图像:', currentImageUrl.value)
  // 创建临时下载链接
  const link = document.createElement('a')
  link.href = currentImageUrl.value
  link.download = `image_${Date.now()}.jpg`
  link.click()
}

// 加载新图像
const loadNewImage = (index) => {
  if (index < 0 || index >= totalImages.value || isLoading.value) return

  isLoading.value = true
  setTimeout(() => {
    currentImageIndex.value = index
    currentImageUrl.value = `https://picsum.photos/1200/800?random=${index + 1}`
    imageTimestamp.value = new Date(
      Date.now() - (totalImages.value - index) * 120000,
    ).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    isLoading.value = false
  }, 400)
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.image-recognition-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #9c8f8f 0%, #241e1e 100%);
  background-attachment: fixed;
  padding: 20px;
}

/* 顶部导航 */
.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.drone-icon {
  width: 32px;
  height: 32px;
  color: white;
}

.system-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.2;
}

.system-subtitle {
  font-size: 13px;
  color: #666;
  margin: 4px 0 0 0;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(17, 153, 142, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

/* 主内容 */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* 信息卡片 */
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.info-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.card-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.progress-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.time-icon {
  background: linear-gradient(135deg, #d13636 0%, #fee140 100%);
}

.location-icon {
  background: linear-gradient(135deg, #30cfd0 0%, #fdfdfd 100%);
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.card-value {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

/* 图像区域 */
.image-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
}

.image-container {
  position: relative;
  margin-bottom: 32px;
}

.image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 3/2;
  background: #f5f5f5;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

/* 图像指示器 */
.image-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

.indicator {
  width: 32px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator:hover {
  background: #bbb;
}

.indicator.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 48px;
}

/* 控制按钮 */
.controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.control-btn:active:not(:disabled) {
  transform: translateY(0);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.primary-btn:hover:not(:disabled) {
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .image-recognition-container {
    padding: 12px;
  }

  .header {
    padding: 16px 20px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .title-section {
    flex-direction: column;
  }

  .system-title {
    font-size: 20px;
  }

  .info-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .image-section {
    padding: 20px;
  }

  .controls {
    gap: 12px;
  }

  .control-btn {
    padding: 12px 20px;
    font-size: 14px;
  }
}
</style>
