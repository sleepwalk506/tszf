<template>
  <a-layout style="min-height: 100vh">
    <!-- 左侧 sider -->
    <a-layout-sider v-model:collapsed="collapsed" collapsible class="sidebar">
      <!-- Logo -->
      <div class="logo">天顺智防</div>

      <!-- 菜单 -->
      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
        <template v-for="item in NavDataInfo.NavData" :key="item.NavID">
          <a-menu-item @click="goPage(item.Path)">
            <component :is="item.icon" />
            <span>{{ item.Title }}</span>
          </a-menu-item>
        </template>
      </a-menu>
    </a-layout-sider>

    <!-- 右侧主内容区 -->
    <a-layout>
      <!-- <a-layout-content
        :style="{ margin: '24px 16px', padding: '24px', background: '#fff', minHeight: '280px' }"
      >
        <router-view />
      </a-layout-content> -->

      <a-layout-content
        :style="{ margin: '24px 16px', padding: '24px', background: '#fff', minHeight: '280px' }"
      >
        <router-view v-slot="{ Component }">
          <keep-alive>
            <div style="height: 100%; width: 100%">
              <component :is="Component" />
            </div>
          </keep-alive>
        </router-view>
      </a-layout-content>

      <a-layout-footer style="text-align: center">
        天顺智防 ©{{ new Date().getFullYear() }}
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
import {
  HomeOutlined,
  PieChartOutlined,
  DesktopOutlined,
  HistoryOutlined,
  GroupOutlined,
  FireOutlined,
  CompassOutlined,
} from '@ant-design/icons-vue'
import { ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ERouterName } from '../types/enum'

// 定义菜单数据类型（更严格的类型定义）
interface MenuItem {
  NavID: string
  icon?: typeof HomeOutlined // 明确图标类型
  Title: string
  Path: string // 改为必填项，确保有路径
  children?: MenuItem[]
}

const route = useRoute()
const router = useRouter()

const collapsed = ref<boolean>(false)
const selectedKeys = ref<string[]>([])

// 菜单数据 - 确保所有项都有Path
const NavDataInfo = reactive({
  NavData: [
    // {
    //   NavID: '0',
    //   icon: HomeOutlined,
    //   Title: '系统首页',
    //   Path: '/' + ERouterName.HOME,
    // },
    {
      NavID: '1',
      icon: DesktopOutlined,
      Title: '巡航监测',
      Path: '/' + ERouterName.MONITOR, // 父菜单路径，实际不会被点击
    },
    {
      NavID: '2',
      icon: PieChartOutlined,
      Title: '任务下发',
      Path: '/' + ERouterName.TASK_ASSIGN,
    },
    {
      NavID: '3',
      icon: HistoryOutlined,
      Title: '任务列表',
      Path: '/' + ERouterName.TASK_LIST,
    },
    {
      NavID: '4',
      icon: GroupOutlined,
      Title: '设备管理',
      Path: '/' + ERouterName.DEVICES,
    },
    // {
    //   NavID: '5',
    //   icon: FireOutlined,
    //   Title: '火情监测',
    //   Path: '/' + ERouterName.FIRE_MONITOR,
    // },
    // {
    //   NavID: '6',
    //   icon: CompassOutlined,
    //   Title: '三维建模',
    //   Path: '/' + ERouterName.ZHAN1017,
    // },
  ] as MenuItem[],
})

// 点击菜单跳转 - 路径类型确保为string
const goPage = (path: string) => {
  router.push(path)
}

// 路由变化时高亮菜单
watch(
  () => route.path,
  (newPath) => {
    const found = NavDataInfo.NavData.find((item) => item.Path === newPath)
    if (found) {
      selectedKeys.value = [found.NavID]
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.sidebar {
  position: relative;
}

.logo {
  height: 32px;
  margin: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  border-radius: 4px;
  width: calc(100% - 32px);
}

:deep(.ant-layout-sider-collapsed) .logo {
  width: auto;
  padding: 0 8px;
}
</style>
