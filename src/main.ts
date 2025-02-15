import './assets/main.css'
import 'element-plus/dist/index.css'

import { createApp } from 'vue'
//导入pinia
import { createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import App from './App.vue'
import router from './router'
//创建app实例
const app = createApp(App)
//使用pinia
app.use(createPinia())
//使用路由
app.use(router)

//挂载app实例
app.mount('#app')
//加载用户信息
const userStore = useUserStore()
const token = localStorage.getItem('token')
const userInfoStr = localStorage.getItem('userInfo')

if (token) {
  userStore.setToken(token)
}

try {
  if (userInfoStr) {
    const userInfo = JSON.parse(userInfoStr)
    userStore.setUserInfo(userInfo)
  }
} catch (error) {
  console.error('Failed to parse user info:', error)
  
}
