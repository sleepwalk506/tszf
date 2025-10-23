<template>
  <div class="drone-management">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <a-input
        v-model:value="searchKeyword"
        placeholder="搜索无人机名称或型号"
        style="width: 300px; margin-right: 10px"
        allow-clear
      />
      <a-button type="primary" @click="onSearch">搜索</a-button>
      <a-button @click="resetSearch" style="margin-left: 8px">重置</a-button>
    </div>

    <!-- 表格 -->
    <a-table
      :columns="columns"
      :data-source="filteredData"
      :pagination="{ pageSize: 7 }"
      row-key="id"
      bordered
    >
      <!-- 状态标签 -->
      <template #status="{ text }">
        <a-tag :color="text === '执行任务中' ? 'green' : 'volcano'">{{ text }}</a-tag>
      </template>

      <!-- 电量进度条 -->
      <template #battery="{ text }">
        <a-progress
          :percent="text"
          :status="text < 20 ? 'exception' : 'active'"
          :stroke-color="text < 20 ? 'red' : '#52c41a'"
          size="small"
        />
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TableColumnType } from 'ant-design-vue'

interface DroneInfo {
  id: number
  name: string
  model: string
  battery: number
  status: string
  lastMaintenance: string
}

const searchKeyword = ref('')
const droneData = ref<DroneInfo[]>([
  {
    id: 1,
    name: '无人机1',
    model: 'Matrice 4T',
    battery: 80,
    status: '执行火情监测任务',
    lastMaintenance: '2025-09-10',
  },
  {
    id: 2,
    name: '无人机2',
    model: 'Matrice 4T',
    battery: 45,
    status: '执行灾损评估任务',
    lastMaintenance: '2025-08-22',
  },
  {
    id: 3,
    name: '无人机3',
    model: 'Matrice 4T',
    battery: 15,
    status: '空闲',
    lastMaintenance: '2025-07-30',
  },
  {
    id: 4,
    name: '无人机4',
    model: 'Matrice 4T',
    battery: 92,
    status: '执行火情监测任务',
    lastMaintenance: '2025-10-01',
  },
])

// 表格列配置
const columns: TableColumnType[] = [
  {
    title: '无人机名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '型号',
    dataIndex: 'model',
    key: 'model',
  },
  {
    title: '电量',
    dataIndex: 'battery',
    key: 'battery',
    slots: { customRender: 'battery' },
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    slots: { customRender: 'status' },
  },
  {
    title: '上次检修时间',
    dataIndex: 'lastMaintenance',
    key: 'lastMaintenance',
  },
]

// 搜索过滤
const filteredData = computed(() => {
  if (!searchKeyword.value) return droneData.value
  return droneData.value.filter(
    (item) =>
      item.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.model.toLowerCase().includes(searchKeyword.value.toLowerCase()),
  )
})

const onSearch = () => {
  // 这里直接用 computed 过滤，无需额外操作
}

const resetSearch = () => {
  searchKeyword.value = ''
}
</script>

<style scoped>
.drone-management {
  padding: 16px;
  background: #fff;
  min-height: calc(100vh - 60px);
}
.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
</style>
