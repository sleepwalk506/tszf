<template>
  <div class="damage-assessment-container">
    <!-- 灾损程度展示区域 -->
    <div class="damage-display-wrapper">
      <!-- 灾损列表表格 -->
      <div class="damage-list section-card" :class="{ 'card-enter': isLoaded }">
        <h3 class="section-title">
          <span class="title-icon">📊</span>
          灾损程度列表
        </h3>

        <!-- 原生表格 -->
        <div class="native-table-container">
          <table class="custom-table">
            <thead>
              <tr class="table-header">
                <th style="width: 180px">评估项目</th>
                <th style="width: 120px">严重程度</th>
                <th>详细描述</th>
                <th style="width: 180px">受灾程度</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in damageLevelData"
                :key="index"
                class="table-row"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >
                <td class="text-center item-name">
                  <span class="item-icon">{{ getItemIcon(item.item) }}</span>
                  {{ item.item }}
                </td>
                <td class="text-center">
                  <!-- 严重程度标签 -->
                  <span class="severity-tag" :class="getSeverityClass(item.level)">
                    <span class="severity-dot"></span>
                    {{ item.level }}
                  </span>
                </td>
                <td class="description-cell">{{ item.description }}</td>
                <td class="progress-cell">
                  <!-- 进度条 -->
                  <div class="progress-wrapper">
                    <div
                      class="progress-fill"
                      :class="getProgressClass(item.percentage)"
                      :style="{ width: animatedPercentages[index] + '%' }"
                    >
                      <span class="progress-shine"></span>
                    </div>
                  </div>
                  <div class="progress-percentage">{{ animatedPercentages[index] }}%</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 图形展示区域 -->
      <div class="damage-chart section-card" :class="{ 'card-enter': isLoaded }">
        <div class="chart-header">
          <h3 class="section-title">
            <span class="title-icon">📈</span>
            灾损程度分布
          </h3>
          <div class="chart-toggle">
            <a-button
              :type="chartType === 'bar' ? 'primary' : 'default'"
              size="small"
              @click="switchChartType('bar')"
              class="toggle-btn"
            >
              <span class="btn-icon">📊</span>
              条状图
            </a-button>
            <a-button
              :type="chartType === 'pie' ? 'primary' : 'default'"
              size="small"
              @click="switchChartType('pie')"
              class="toggle-btn"
            >
              <span class="btn-icon">🥧</span>
              饼状图
            </a-button>
          </div>
        </div>

        <!-- 图表容器 -->
        <div class="chart-content-wrapper">
          <!-- 条状图 -->
          <transition name="chart-fade">
            <div v-if="chartType === 'bar'" class="chart-container bar-chart">
              <div
                class="chart-item"
                v-for="(item, index) in damageLevelData"
                :key="item.item"
                :style="{ animationDelay: `${index * 0.15}s` }"
              >
                <div class="chart-label">
                  <span class="label-icon">{{ getItemIcon(item.item) }}</span>
                  {{ item.item }}
                </div>
                <div class="chart-bar">
                  <div
                    class="chart-fill"
                    :style="{
                      width: animatedPercentages[index] + '%',
                      backgroundColor: getChartColor(item.level),
                    }"
                  >
                    <span class="chart-shine"></span>
                    <span class="fill-percentage">{{ animatedPercentages[index] }}%</span>
                  </div>
                </div>
                <div class="chart-value">
                  <span class="value-label">损失:</span>
                  <span class="value-number">{{ item.damageValue }}</span>
                  <span class="value-unit">万元</span>
                </div>
              </div>
            </div>
          </transition>

          <!-- 饼状图 -->
          <transition name="chart-fade">
            <div v-if="chartType === 'pie'" class="chart-container pie-chart">
              <div class="pie-chart-wrapper">
                <div
                  class="pie-chart-inner"
                  :style="{ background: pieChartBackground }"
                  :class="{ 'pie-spin-in': isLoaded }"
                >
                  <div class="pie-center-text">
                    <div class="total-label">总损失</div>
                    <div class="total-value">
                      <span class="total-number">{{ animatedTotal }}</span>
                      <span class="total-unit">万元</span>
                    </div>
                  </div>
                  <div class="pie-glow"></div>
                </div>
              </div>
              <div class="pie-legend">
                <div
                  v-for="(item, index) in damageLevelData"
                  :key="item.item"
                  class="legend-item"
                  :style="{ animationDelay: `${index * 0.1}s` }"
                >
                  <div class="legend-color" :style="{ backgroundColor: getChartColor(item.level) }">
                    <span class="color-pulse"></span>
                  </div>
                  <span class="legend-label">
                    <span class="label-icon-small">{{ getItemIcon(item.item) }}</span>
                    {{ item.item }}
                  </span>
                  <span class="legend-value">
                    {{ item.percentage }}%
                    <span class="legend-amount">({{ item.damageValue }}万元)</span>
                  </span>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Button } from 'ant-design-vue'

// 1. 响应式数据
const chartType = ref('bar')
const isLoaded = ref(false)
const animatedPercentages = ref([0, 0, 0, 0])
const animatedTotal = ref(0)

// 2. 灾损评估数据
const damageLevelData = ref([
  {
    item: '建筑损毁',
    level: '严重',
    description: '建筑物结构受损严重，部分倒塌',
    damageValue: 350,
    percentage: 0,
  },
  {
    item: '人员伤亡',
    level: '中等',
    description: '有人员受伤，无死亡报告',
    damageValue: 50,
    percentage: 0,
  },
  {
    item: '经济损失',
    level: '极高',
    description: '直接经济损失超过500万元',
    damageValue: 500,
    percentage: 0,
  },
  {
    item: '环境影响',
    level: '轻微',
    description: '局部环境污染，可快速恢复',
    damageValue: 100,
    percentage: 0,
  },
])

// 3. 计算总损失
const totalDamage = computed(() => {
  return damageLevelData.value.reduce((sum, item) => sum + item.damageValue, 0)
})

// 4. 计算各项目损失百分比
const calculatePercentages = () => {
  const total = totalDamage.value
  if (total === 0) return

  damageLevelData.value.forEach((item) => {
    item.percentage = Math.round((item.damageValue / total) * 100)
  })
}
calculatePercentages()

// 5. 严重程度样式类
const getSeverityClass = (level) => {
  const classMap = {
    轻微: 'severity-minor',
    中等: 'severity-medium',
    严重: 'severity-severe',
    极高: 'severity-critical',
  }
  return classMap[level] || 'severity-default'
}

// 6. 进度条样式类
const getProgressClass = (percentage) => {
  if (percentage >= 80) return 'progress-critical'
  if (percentage >= 50) return 'progress-severe'
  return 'progress-minor'
}

// 7. 图表颜色映射
const getChartColor = (level) => {
  const colorMap = {
    轻微: '#52c41a',
    中等: '#faad14',
    严重: '#f5222d',
    极高: '#ff4d4f',
  }
  return colorMap[level] || '#909399'
}

// 8. 获取项目图标
const getItemIcon = (item) => {
  const iconMap = {
    建筑损毁: '🏗️',
    人员伤亡: '👥',
    经济损失: '💰',
    环境影响: '🌍',
  }
  return iconMap[item] || '📌'
}

// 9. 饼状图背景计算
const pieChartBackground = computed(() => {
  let gradient = ''
  let startAngle = 0

  damageLevelData.value.forEach((item) => {
    const endAngle = startAngle + item.percentage * 3.6
    gradient += `${getChartColor(item.level)} ${startAngle}deg ${endAngle}deg, `
    startAngle = endAngle
  })

  return `conic-gradient(${gradient.slice(0, -2)} , #f5f5f5 0deg)`
})

// 10. 切换图表类型
const switchChartType = (type) => {
  if (chartType.value !== type) {
    chartType.value = type
    // 重新触发动画
    animateValues()
  }
}

// 11. 动画效果
const animateValues = () => {
  // 重置动画值
  animatedPercentages.value = [0, 0, 0, 0]
  animatedTotal.value = 0

  // 动画进度条
  damageLevelData.value.forEach((item, index) => {
    const targetPercentage = item.percentage
    const duration = 1000
    const steps = 60
    const increment = targetPercentage / steps
    let currentStep = 0

    const timer = setInterval(() => {
      if (currentStep < steps) {
        animatedPercentages.value[index] = Math.min(
          Math.round(increment * currentStep),
          targetPercentage,
        )
        currentStep++
      } else {
        animatedPercentages.value[index] = targetPercentage
        clearInterval(timer)
      }
    }, duration / steps)
  })

  // 动画总损失
  const targetTotal = totalDamage.value
  const duration = 1500
  const steps = 60
  const increment = targetTotal / steps
  let currentStep = 0

  const totalTimer = setInterval(() => {
    if (currentStep < steps) {
      animatedTotal.value = Math.min(Math.round(increment * currentStep), targetTotal)
      currentStep++
    } else {
      animatedTotal.value = targetTotal
      clearInterval(totalTimer)
    }
  }, duration / steps)
}

// 12. 组件挂载时触发动画
onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
    animateValues()
  }, 100)
})
</script>

<style scoped>
/* ========== 全局样式 ========== */
@import '@/assets/images/styles/base.css';
@import '@/assets/images/styles/card.css';
@import '@/assets/images/styles/title.css';
@import '@/assets/images/styles/table.css';
@import '@/assets/images/styles/chart.css';
@import '@/assets/images/styles/responsive.css';
</style>
