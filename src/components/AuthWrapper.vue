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
  // If authentication is required but the user is not logged in, no permission
  if (props.requireAuth && !userStore.token) {
    return false
  }

  // If no role requirements are specified, the user has permission
  if (!props.roles || props.roles.length === 0) {
    return true
  }

  // Check if the user's role is in the allowed role list
  const userInfo = userStore.userInfo;
  const userRole = userInfo? userInfo.userRole : undefined;
  return userRole? props.roles.includes(userRole) : false;
})
</script>
