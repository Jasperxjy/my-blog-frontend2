import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EssayEdit from '../views/EssayEdit.vue'
import LoginView from '../views/LoginView.vue'
import { useUserStore } from '@/stores/user'
// 路由配置数组
const routes: RouteRecordRaw[] = [

  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true },
  },
  {
    path: '/edit',
    name: 'edit',
    component: EssayEdit,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // 检查用户是否已登录
  const isAuthenticated = useUserStore().token

  // 需要登录但未登录，跳转到登录页
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  }
  // 已登录用户访问登录页，跳转到首页
  else if (to.path === '/login' && isAuthenticated) {
    next('/home')
  }
  // 其他情况正常跳转
  else {
    next()
  }
})

export default router
