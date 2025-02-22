import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import UsersView from '@/views/UsersView.vue'
import AlbumsView from '@/views/AlbumsView.vue'
import MusicView from '@/views/MusicView.vue'
import ArticlesView from '@/views/ArticlesView.vue'
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
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: '/users',
    name: 'users',
    component: UsersView,
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/albums',
    name: 'albums',
    component: AlbumsView,
    meta: {
      requiresAuth: true,
      // 默认需要 GUEST 权限即可访问相册列表
      // 具体相册的权限会在组件内部判断
      requiresRole: 'GUEST'
    }
  },
  {
    path: '/music',
    name: 'music',
    component: MusicView,
    meta: {
      requiresAuth: true,
      // 默认需要 GUEST 权限即可访问音乐列表
      // 具体音乐的权限会在组件内部判断
      requiresRole: 'GUEST'
    }
  },
  {
    path: '/articles',
    name: 'articles',
    component: ArticlesView,
    meta: {
      requiresAuth: true,
      requiresRole: 'GUEST'
    }
  },
  {
    path: '/essay/:id',
    name: 'essay',
    component: () => import('@/views/EssayView.vue'),
    props: true
  },
  {
    path: '/essay/:id/edit',
    name: 'essayEdit',
    component: () => import('@/views/EssayEdit.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  }
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
  const currentEssay = JSON.parse(localStorage.getItem('currentEssay') || 'null');
  const currentTags = JSON.parse(localStorage.getItem('currentTags') || 'null');
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

  if (!currentEssay&&!currentTags && to.name === 'essayEdit') {
    // 如果没有 currentEssay，重定向到默认页面
    next({ name: 'articles' }); // 替换为你的默认页面路由名称
  } else {
    next();
  }

})

export default router
