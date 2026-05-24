<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useNotification } from '@/composables/notification'
import * as musicApi from '@/api/music'
import * as permissionApi from '@/api/permission'
import type { Music } from '@/types/music'
import { usePlayerStore } from '@/stores/player'
import { ElMessageBox } from 'element-plus'
import { Upload, Edit, Delete, Headset, InfoFilled } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'

const userStore = useUserStore()
const { showError, showSuccess } = useNotification()
const playerStore = usePlayerStore()

const allMusic = ref<Music[]>([])

// 上传相关
const uploadDialogVisible = ref(false)
const uploadForm = ref({
  file: null as File | null,
  fileName: '',
  description: ''
})

// 编辑相关
const editDialogVisible = ref(false)
const editingMusic = ref<Music | null>(null)
const permissionLevel = ref("GUEST")

// 详情相关
const detailDialogVisible = ref(false)
const selectedMusic = ref<Music | null>(null)

// 获取并过滤音乐列表
const fetchMusic = async () => {
  try {
    const result = await musicApi.getAllMusic()
    if (result.success && result.data) {
      const musicList = result.data

      // 管理员可以看到所有音乐
      if (userStore.isAdmin) {
        allMusic.value = musicList.sort((a, b) =>
          a.fileName.localeCompare(b.fileName)
        )
        return
      }

      // 确保 userInfo 不为 null
      const userId = userStore.userInfo?.userId
      if (!userId) {
        showError('用户信息未加载')
        return
      }

      const permissionResults = await Promise.all(
        musicList.map(music => permissionApi.hasPermission(userId, music.musicId))
      )

      const filteredMusic = musicList.filter((_, index) =>
        permissionResults[index].success && permissionResults[index].data
      )

      // 按音乐名称排序
      allMusic.value = filteredMusic.sort((a, b) =>
        a.fileName.localeCompare(b.fileName)
      )
    }
  } catch (error) {
    showError('获取音乐列表失败')
  }
}

// 播放音乐
const playMusic = (music: Music) => {
  playerStore.play(music)
}

// 处理文件上传
const handleFileChange = (file: UploadFile) => {
  if (file.raw) {
    uploadForm.value.file = file.raw
    uploadForm.value.fileName = file.name.replace(/\.[^/.]+$/, "")
  }
}

// 上传音乐
const uploadMusic = async () => {
  if (!uploadForm.value.file || !uploadForm.value.fileName) {
    showError('请选择文件并输入音乐名称')
    return
  }

  try {
    const result = await musicApi.uploadMusic(
      uploadForm.value.file,
      uploadForm.value.fileName,
      uploadForm.value.description
    )

    if (result.success) {
      showSuccess('上传成功')
      uploadDialogVisible.value = false
      uploadForm.value = {
        file: null,
        fileName: '',
        description: ''
      }
      await fetchMusic()
    }
  } catch (error) {
    showError('上传失败')
  }
}

// 开始编辑音乐
const startEdit = (music: Music) => {
  editingMusic.value = { ...music }
  permissionLevel.value = "GUEST" // 重置权限等级
  editDialogVisible.value = true
}

// 保存编辑
const saveEdit = async () => {
  if (!editingMusic.value) return

  try {
    const result = await musicApi.updateMusic(
      editingMusic.value.musicId,
      {
        fileName: editingMusic.value.fileName,
        description: editingMusic.value.description
      }
    )

    if (result.success) {
      showSuccess('更新成功')
      editDialogVisible.value = false
      await fetchMusic()
    }
  } catch (error) {
    showError('更新失败')
  }
}

// 设置权限
const setMusicPermission = async () => {
  if (!editingMusic.value) return

  try {
    const permissionResult = await permissionApi.setPermission(
      editingMusic.value.musicId,
      permissionLevel.value
    )

    if (permissionResult.success) {
      showSuccess('权限设置成功')
      await fetchMusic()
    } else {
      showError('权限设置失败')
    }
  } catch (error) {
    showError('权限设置失败')
  }
}

// 删除音乐
const deleteMusic = async (music: Music) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个音乐吗？此操作不可恢复。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await musicApi.deleteMusic(music.musicId)
    if (result.success) {
      showSuccess('删除成功')
      await fetchMusic()
    }
  } catch (error) {
    if (error !== 'cancel') {
      showError('删除失败')
    }
  }
}

// 显示详情
const showDetail = (music: Music) => {
  selectedMusic.value = music
  detailDialogVisible.value = true
}

onMounted(() => {
  fetchMusic()
  playerStore.toggleVisible(true)
})
</script>

<template>
  <div class="music-container">
    <div class="music-header">
      <h2 class="title">音乐收藏</h2>
      <p class="description">在这里，你可以找到我收藏的精选音乐作品（也有一些构式Bushi）。</p>
      <p class="guide">
        操作指南：点击音乐图标然后点击播放器播放按钮播放，点击信息图标查看详情里面有我关于此音乐的介绍和个人感受。你可以切出页面，但是音乐会继续播放。enjoy~
      </p>
    </div>

    <!-- 管理员上传按钮 -->
    <div v-if="userStore.isAdmin" class="upload-section">
      <el-button type="primary" @click="uploadDialogVisible = true">
        <el-icon><Upload /></el-icon>
        上传音乐
      </el-button>
    </div>

    <!-- 音乐卡片网格 -->
    <div class="music-grid">
      <el-card
        v-for="music in allMusic"
        :key="music.musicId"
        class="music-card"
      >
        <div class="music-content">
          <div class="music-icon" @click="playMusic(music)">
            <el-icon :size="40"><Headset /></el-icon>
          </div>
          <h3 class="music-title">{{ music.fileName }}</h3>
          <p class="music-desc">{{ music.description }}</p>
          <div class="music-actions">
            <el-button-group>
              <el-button
                type="info"
                :icon="InfoFilled"
                @click.stop="showDetail(music)"
              />
              <template v-if="userStore.isAdmin">
                <el-button
                  type="primary"
                  :icon="Edit"
                  @click.stop="startEdit(music)"
                />
                <el-button
                  type="danger"
                  :icon="Delete"
                  @click.stop="deleteMusic(music)"
                />
              </template>
            </el-button-group>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 上传音乐对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传音乐"
      width="30%"
    >
      <el-form :model="uploadForm">
        <el-form-item label="选择文件" required>
          <el-upload
            accept="audio/*"
            :auto-upload="false"
            :limit="1"
            :on-change="(file: UploadFile) => handleFileChange(file)"
            :before-upload="(file: File) => {
              const maxSize = 10 * 1024 * 1024 // 10MB
              if (file.size > maxSize) {
                showError('文件大小不能超过5MB')
                return false
              }
              return true
            }"
          >
            <el-button type="primary">选择音乐文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持的音频文件，大小不超过5MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="音乐名称" required>
          <el-input v-model="uploadForm.fileName" />
        </el-form-item>
        <el-form-item label="音乐描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="uploadMusic">上传</el-button>
      </template>
    </el-dialog>

    <!-- 编辑音乐对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑音乐"
      width="30%"
    >
      <el-form v-if="editingMusic" :model="editingMusic">
        <el-form-item label="音乐名称" required>
          <el-input v-model="editingMusic.fileName" />
        </el-form-item>
        <el-form-item label="音乐描述">
          <el-input
            v-model="editingMusic.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="权限等级">
          <div class="permission-control">
            <el-select v-model="permissionLevel" style="width: 120px">
              <el-option value="GUEST" label="公开" />
              <el-option value="FRIEND" label="好友及以上可见" />
              <el-option value="CLOSE_FRIEND" label="亲友及以上可见" />
              <el-option value="ADMIN" label="仅管理员" />
            </el-select>
            <el-button
              type="primary"
              @click="setMusicPermission"
            >
              设置权限
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="音乐详情"
      width="30%"
    >
      <div v-if="selectedMusic" class="music-detail">
        <h3>{{ selectedMusic.fileName }}</h3>
        <p class="detail-desc">{{ selectedMusic.description }}</p>
      </div>
    </el-dialog>

  </div>
</template>

<style scoped>

.music-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-8);
}

.music-header {
  margin-bottom: var(--space-8);
  text-align: center;
}

.title {
  font-family: var(--font-display);
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
  font-size: var(--text-4xl);
  font-weight: 700;
}

.description {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
  font-size: var(--text-base);
}

.guide {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

.music-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--space-5);
  margin: 0 auto;
}

.music-card {
  height: 220px;
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
}

.music-card:hover {
  transform: translateY(-4px);
}

.music-card :deep(.el-card__body) {
  height: 100%;
  padding: 0;
}

.music-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-4);
}

.music-icon {
  display: flex;
  justify-content: center;
  margin: var(--space-3) 0;
  color: var(--color-accent);
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out);
}

.music-icon:hover {
  transform: scale(1.1);
}

.music-icon .el-icon {
  font-size: 32px;
}

.music-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-base);
  font-weight: 600;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  color: var(--color-text-primary);
}

.music-desc {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  width: 100%;
}

.music-actions {
  margin-top: auto;
  padding: var(--space-2) 0;
  display: flex;
  justify-content: center;
  width: 100%;
  gap: var(--space-1);
}

.music-actions :deep(.el-button) {
  --el-button-size: 32px;
  padding: 6px;
}

.music-actions :deep(.el-button .el-icon) {
  font-size: 16px;
}

.music-detail {
  padding: var(--space-5);
}

.detail-desc {
  margin-top: var(--space-4);
  color: var(--color-text-secondary);
  line-height: var(--leading-relaxed);
  white-space: pre-wrap;
}

.upload-section {
  margin: var(--space-5) 0;
  display: flex;
  justify-content: flex-end;
}

.upload-section :deep(.el-button) {
  box-shadow: var(--shadow-sm);
}

.upload-section :deep(.el-button:hover) {
  box-shadow: var(--shadow-md);
}

.permission-control {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

@media (max-width: 768px) {
  .music-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .music-card {
    height: auto;
    min-height: 180px;
  }
}
</style>
