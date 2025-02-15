// 从 Vue 中导入 ref 和 computed 函数
// ref 用于创建响应式数据
// computed 用于创建计算属性
import { ref, computed } from 'vue'
// 从 Pinia 中导入 defineStore 函数，用于创建状态管理存储
import { defineStore } from 'pinia'

// 创建并导出一个名为 counter 的 store
// 使用组合式 API 风格定义 store
export const useCounterStore = defineStore('counter', () => {
  // 创建一个响应式的数值，初始值为 0
  const count = ref(0)
  // 创建一个计算属性，返回 count 的两倍
  const doubleCount = computed(() => count.value * 2)
  // 定义一个方法用于增加 count 的值
  function increment() {
    count.value++
  }

  // 返回需要暴露的状态和方法
  return { count, doubleCount, increment }
})
