<template>
  <div class="topbar">
    <!-- 顶部导航菜单 -->
    <a-menu v-model:selectedKeys="selectedKeys" theme="light" mode="horizontal" class="nav-menu">
      <a-menu-item
        v-for="item in NavDataInfo.AssessmentNavData"
        :key="item.NavID"
        @click="goPage(item.Path)"
      >
        <span>{{ item.Title }}</span>
      </a-menu-item>
    </a-menu>

    <!-- 右侧返回按钮 -->
    <a-button type="text" @click="goBack" class="back-btn">
      <ArrowLeftOutlined />
    </a-button>
  </div>

  <router-view />
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ERouterName } from '../../types/enum'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

const selectedKeys = ref<string[]>([])
const NavDataInfo = reactive({
  AssessmentNavData: [
    {
      NavID: '0',
      Title: '火场蔓延',
      Path: '/' + ERouterName.FIRE_MONITOR,
    },
    {
      NavID: '1',
      Title: '人员识别',
      Path: '/' + ERouterName.PEOPLE_IDENTIFY,
    },
    {
      NavID: '2',
      Title: '无人机画面',
      Path: '/' + ERouterName.STREAM,
    },
  ],
})

// 路由变化时高亮菜单
watch(
  () => route.path,
  (newPath) => {
    const found = NavDataInfo.AssessmentNavData.find((item) => item.Path === newPath)
    if (found) {
      selectedKeys.value = [found.NavID]
    }
  },
  { immediate: true },
)
// 点击菜单跳转
const goPage = (path: string) => {
  router.push(path)
}

// 返回按钮
const goBack = () => {
  //   router.push('/' + ERouterName.TASK_LIST)
  router.back()
}
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 16px;
}

.nav-menu {
  flex: 1;
  border-bottom: none;
}

.back-btn {
  font-size: 18px;
  color: #000;
}

.back-btn:hover {
  color: #1890ff;
}
</style>
