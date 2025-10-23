import { createRouter, createWebHistory } from 'vue-router'
import { ERouterName } from '../types/enum'

import Layout from '../components/SideBar.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Layout,
      // redirect: '/' + ERouterName.HOME,
      redirect: '/' + ERouterName.MONITOR,
      children: [
        {
          path: '/' + ERouterName.HOME,
          name: ERouterName.HOME,
          component: () => import('../components/Home.vue'),
        },
        {
          path: '/' + ERouterName.MONITOR, // /monitor
          name: ERouterName.MONITOR,
          component: () => import('../components/Monitor.vue'),
        },

        {
          path: '/' + ERouterName.TASK_ASSIGN, // /task-assign
          name: ERouterName.TASK_ASSIGN,
          component: () => import('../components/TaskAssignment.vue'),
        },
        {
          path: '/' + ERouterName.TASK_LIST, // /task-list
          name: ERouterName.TASK_LIST,
          component: () => import('../components/TaskList.vue'),
        },
        {
          path: '/' + ERouterName.DEVICES, // /devices
          name: ERouterName.DEVICES,
          component: () => import('../components/Devices.vue'),
        },
        {
          path: '/' + ERouterName.WAYLINE,
          name: ERouterName.WAYLINE,
          component: () => import('../components/Wayline.vue'),
        },
        {
          path: '/' + ERouterName.ASSESSMENT_TOPBAR + '/:id?',
          name: ERouterName.ASSESSMENT_TOPBAR,
          // redirect: '/' + ERouterName.ASSESSMENT,
          component: () => import('../components/Assessment/TopBar.vue'),
          props: true,
          children: [
            {
              path: '/' + ERouterName.RECONSTRUCT + '/:id?',
              name: ERouterName.RECONSTRUCT,
              component: () => import('../components/Assessment/Reconstruct.vue'),
              props: true,
            },
            {
              path: '/' + ERouterName.ASSESSMENT + '/:id?',
              name: ERouterName.ASSESSMENT,
              component: () => import('../components/Assessment/Assessment.vue'),
            },
            {
              path: '/' + ERouterName.ASSESSMENT_DETAIL + '/:id?',
              name: ERouterName.ASSESSMENT_DETAIL,
              component: () => import('../components/Assessment/Detail.vue'),
            },
            // 新增无人机轨迹路由
            {
              path: '/' + ERouterName.DRONE_TRAIL + '/:id?', // 与侧边栏子菜单路径对应
              name: ERouterName.DRONE_TRAIL,  // 路由名称
              component: () => import('../components/Cruise/TrailView.vue'), // 无人机轨迹组件
            },
            //新增评估任务时的可疑人员识别
            {
              path: '/' + ERouterName.PEOPLE_IDENTIFY, // 与侧边栏子菜单路径对应
              name: ERouterName.PEOPLE_IDENTIFY,  // 路由名称
              component: () => import('../components/Assessment/Identify.vue'),
            },
          ]
        },
        {
          path: '/' + ERouterName.TOPBAR_FORFIRE,
          name: ERouterName.TOPBAR_FORFIRE,
          redirect: '/' + ERouterName.FIRE_MONITOR,
          component: () => import('../components/Assessment/TopBarForFire.vue'),
          children: [
            {
              path: '/' + ERouterName.FIRE_MONITOR, // 与侧边栏子菜单路径对应
              name: ERouterName.FIRE_MONITOR,  // 路由名称
              component: () => import('../components/FireMonitor.vue'),
            },
            {
              path: '/' + ERouterName.PEOPLE_IDENTIFY, // 与侧边栏子菜单路径对应
              name: ERouterName.PEOPLE_IDENTIFY,  // 路由名称
              component: () => import('../components/Assessment/Identify.vue'),
            },
            {
              path: '/' + ERouterName.STREAM, // 与侧边栏子菜单路径对应
              name: ERouterName.STREAM,  // 路由名称
              component: () => import('../components/Stream.vue'),
            },
          ]
        }
        //火情监测界面
        // {
        //   path: '/' + ERouterName.FIRE_MONITOR, // 与侧边栏子菜单路径对应
        //   name: ERouterName.FIRE_MONITOR,  // 路由名称
        //   component: () => import('../components/FireMonitor.vue'),
        // },
        // {
        //   path: '/' + ERouterName.ZHAN1017, // 与侧边栏子菜单路径对应
        //   name: ERouterName.ZHAN1017,  // 路由名称
        //   component: () => import('../components/Zhan1017.vue'),
        // }
      ],
    },

  ],
})

export default router
