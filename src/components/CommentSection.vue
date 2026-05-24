<template>
  <div class="comment-section">
    <!-- 评论输入框 -->
    <div v-if="canComment" class="comment-input">
      <div v-if="replyTo" class="reply-indicator">
        正在回复：{{ replyTo.senderUsername }}
        <el-button link @click="cancelReply">取消回复</el-button>
      </div>
      <div class="input-wrapper">
        <el-input
          v-model="newComment"
          type="textarea"
          :rows="3"
          placeholder="写下你的锐评..."
        />
        <el-button
          type="primary"
          @click="submitComment"
          :loading="submitting"
          class="submit-btn"
        >
          发送
        </el-button>
      </div>
    </div>

    <!-- 评论列表 -->
    <div class="comments-list">
      <template v-for="comment in topLevelComments" :key="comment.id">
        <!-- 一级评论 -->
        <div
          class="comment-item"
          @dblclick="handleReply(comment)"
        >
          <div class="comment-header">
            <span class="username">{{ comment.senderUsername }}</span>
            <span class="time">{{ comment.commentTime }}</span>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          <div class="comment-footer">
            <div class="likes">
              <el-button
                link
                @click="likeComment(comment.id)"
                :loading="likingComments[comment.id]"
              >
                <el-icon><Pointer /></el-icon>
                {{ comment.commentLikeNum }}
              </el-button>
            </div>
            <div v-if="canDelete(comment)" class="actions">
              <el-button
                link
                @click="handleDelete(comment.id)"
                class="delete-btn"
              >
                删除
              </el-button>
            </div>
          </div>

          <!-- 二级评论 -->
          <div class="replies">
            <div
              v-for="reply in getReplies(comment.id)"
              :key="reply.id"
              class="reply-item"
            >
              <div class="comment-header">
                <span class="username">{{ reply.senderUsername }}</span>
                <span class="time">{{ reply.commentTime }}</span>
              </div>
              <div class="comment-content">{{ reply.content }}</div>
              <div class="comment-footer">
                <div class="likes">
                  <el-button
                    type="text"
                    @click="likeComment(reply.id)"
                    :loading="likingComments[reply.id]"
                  >
                    <el-icon><Pointer /></el-icon>
                    {{ reply.commentLikeNum }}
                  </el-button>
                </div>
                <div v-if="canDelete(reply)" class="actions">
                  <el-button
                    type="text"
                    @click="handleDelete(reply.id)"
                    class="delete-btn"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Pointer } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { checkPermission, UserRole } from '@/utils/permission'
import type { CommentDTO } from '@/types/comment'
import * as commentApi from '@/api/comment'

const props = defineProps<{
  essayId: string
}>()

const userStore = useUserStore()
const comments = ref<CommentDTO[]>([])
const newComment = ref('')
const replyTo = ref<CommentDTO | null>(null)
const submitting = ref(false)
const likingComments = ref<Record<string, boolean>>({})

// 计算属性：一级评论
const topLevelComments = computed(() =>
  comments.value.filter(c => !c.replyCommentId)
    .sort((a, b) => new Date(b.commentTime).getTime() - new Date(a.commentTime).getTime())
)

// 获取某个评论的所有回复
const getReplies = (commentId: string) =>
  comments.value.filter(c => c.replyCommentId === commentId)
    .sort((a, b) => new Date(b.commentTime).getTime() - new Date(a.commentTime).getTime())

// 判断是否有评论权限
const canComment = computed(() =>
  userStore.userInfo && checkPermission(UserRole.FRIEND, userStore.userInfo.userRole)
)

// 判断是否可以删除评论
const canDelete = (comment: CommentDTO) => {
  // 检查是否为一级评论且有回复
  const hasReplies = !comment.replyCommentId &&
    comments.value.some(c => c.replyCommentId === comment.id)

  if (hasReplies) {
    return false
  }

  return userStore.userInfo && (
    checkPermission(UserRole.ADMIN, userStore.userInfo.userRole) ||
    comment.senderUserId === userStore.userInfo.userId
  )
}

// 加载评论
const loadComments = async () => {
  try {
    const result = await commentApi.getEssayComments(props.essayId)
    if (result.success && result.data) {
      comments.value = result.data
    }
  } catch (error) {
    ElMessage.error('加载评论失败')
  }
}

// 提交评论
const submitComment = async () => {
  if (!userStore.userInfo?.userId) {
    ElMessage.warning('请先登录')
    return
  }

  submitting.value = true
  try {
    const comment = {
      commentId: '',
      essayId: props.essayId,
      commentTime: "",
      userId: userStore.userInfo.userId,
      commentLikeNum: 0,
      commentVisible: '1',
      commentFatherId: replyTo.value?.id || null,
      content: newComment.value.trim()
    }

    const result = await commentApi.createComment(comment)
    if (result.success) {
      ElMessage.success('评论成功')
      newComment.value = ''
      replyTo.value = null
      await loadComments()
    }
  } catch (error) {
    ElMessage.error('评论失败')
  } finally {
    submitting.value = false
  }
}

// 点赞评论
const likeComment = async (commentId: string) => {
  likingComments.value[commentId] = true
  try {
    const result = await commentApi.likeComment(commentId)
    if (result.success) {
      await loadComments()
    }
  } catch (error) {
    ElMessage.error('点赞失败')
  } finally {
    likingComments.value[commentId] = false
  }
}

// 删除评论
const handleDelete = async (commentId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      type: 'warning'
    })

    const result = await commentApi.deleteComment(commentId)
    if (result.success) {
      ElMessage.success('删除成功')
      await loadComments()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 回复评论
const handleReply = (comment: CommentDTO) => {
  if (canComment.value && !comment.replyCommentId) {  // 只允许回复一级评论
    replyTo.value = comment
  }
}

// 取消回复
const cancelReply = () => {
  replyTo.value = null
}

onMounted(() => {
  loadComments()
})

// 监听 essayId 变化，切换文章时重新加载评论
watch(() => props.essayId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    loadComments()
  }
})
</script>

<style scoped>
.comment-section {
  margin-top: var(--space-8);
  padding: var(--space-5);
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.comment-input {
  margin-bottom: var(--space-6);
}

.reply-indicator {
  margin-bottom: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.comment-item {
  margin-bottom: var(--space-5);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  transition: box-shadow var(--duration-fast) var(--ease-out);
}

.comment-item:hover {
  box-shadow: var(--shadow-sm);
}

.comment-header {
  margin-bottom: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.username {
  font-weight: 600;
  color: var(--color-text-primary);
}

.time {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.comment-content {
  margin: var(--space-2) 0;
  color: var(--color-text-primary);
  line-height: var(--leading-normal);
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-2);
}

.replies {
  margin-left: var(--space-8);
  margin-top: var(--space-4);
}

.reply-item {
  margin-bottom: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-page);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.delete-btn {
  color: var(--el-color-danger);
  transition: color var(--duration-fast) var(--ease-out);
}

.delete-btn:hover {
  color: var(--el-color-danger-light-3);
}

.input-wrapper {
  position: relative;
  margin-top: var(--space-2);
}

.submit-btn {
  position: absolute;
  bottom: var(--space-2);
  right: var(--space-2);
}
</style>
