<template>
  <div v-if="hasPermission">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  // 允许访问的角色列表
  roles?: string[]
  // 是否需要登录
  requireAuth?: boolean
}>()

const userStore = useUserStore()

const hasPermission = computed(() => {
  // 如果需要登录但未登录，则无权限
  if (props.requireAuth && !userStore.isLoggedIn) {
    return false
  }

  // 如果没有指定角色要求，则有权限
  if (!props.roles || props.roles.length === 0) {
    return true
  }

  // 检查用户角色是否在允许的角色列表中
  return props.roles.includes(userStore.userRole)
})
</script>
