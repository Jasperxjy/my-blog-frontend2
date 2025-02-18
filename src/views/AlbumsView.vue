<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useNotification } from '@/composables/notification'
import * as albumApi from '@/api/album'
import * as imageApi from '@/api/image'
import * as permissionApi from '@/api/permission'
import type { Album } from '@/types/album'
import type { Image } from '@/types/image'
import { IMAGE_BASE_URL } from '@/utils/constants'
import { Plus, Upload, Edit, Delete, Position } from '@element-plus/icons-vue'
import { UserRole } from '@/utils/permission'
import { ElMessageBox } from 'element-plus'
import type { UploadFile } from 'element-plus'

const userStore = useUserStore()
const { showSuccess, showError } = useNotification()

const albums = ref<Album[]>([])
const selectedAlbum = ref<Album | null>(null)
const images = ref<Image[]>([])
const showImageDialog = ref(false)
const selectedImage = ref<Image | null>(null)
const isEditing = ref(false)
const editingImage = ref<Partial<Image> | null>(null)
const isCreating = ref(false)
const newAlbum = ref<Partial<Album>>({
  title: '',
  description: ''
})
const selectedPermission = ref<string>(UserRole.GUEST) // 默认为访客权限

// 权限选项
const permissionOptions = [
  { label: '访客', value: UserRole.GUEST },
  { label: '好友', value: UserRole.FRIEND },
  { label: '密友', value: UserRole.CLOSE_FRIEND }
]

// 上传相关
const uploadDialogVisible = ref(false)
const uploadForm = ref({
  file: null as File | null,
  fileName: '',
  description: ''
})

// 编辑相册相关
const editAlbumDialogVisible = ref(false)
const editingAlbum = ref<Album | null>(null)

// 合并相册相关
const mergeDialogVisible = ref(false)
const targetAlbumId = ref('')
const otherAlbums = computed(() =>
  albums.value.filter(a => a.albumId !== selectedAlbum.value?.albumId)
)

// 获取所有相册
const fetchAlbums = async () => {
  try {
    const result = await albumApi.getAllAlbums()
    console.log('获取相册结果:', result)
    if (result.success && result.data) {
      const allAlbums = result.data as Album[]
      const filteredAlbums: Album[] = []

      for (const album of allAlbums) {
        // 管理员可以看到所有相册
        if (userStore.isAdmin) {
          filteredAlbums.push(album)
          continue
        }

        // 确保 userInfo 不为 null
        const userId = userStore.userInfo?.userId
        if (!userId) {
          showError('用户信息未加载')
          return
        }

        const permissionResult = await permissionApi.hasPermission(userId, album.albumId)
        console.log('相册权限:', album.title, permissionResult)
        if (permissionResult.success && permissionResult.data) {
          filteredAlbums.push(album)
        }
      }
      console.log('过滤后的相册:', filteredAlbums)
      albums.value = filteredAlbums
    }
  } catch (error) {
    console.error('获取相册失败:', error)
    showError('获取相册列表失败')
  }
}

// 选择相册
const selectAlbum = async (album: Album) => {
  selectedAlbum.value = album
  try {
    const result = await imageApi.getImagesByAlbum(album.albumId)
    if (result.success && result.data) {
      images.value = result.data as Image[]
    }
  } catch {
    showError('获取图片列表失败')
  }
}

// 保存图片编辑
const saveEdit = async () => {
  if (!editingImage.value?.imageId) return

  try {
    const updatePayload: Partial<Omit<Image, 'imageId' | 'updateTime'>> = {
      fileName: editingImage.value.fileName || '',
      filePath: editingImage.value.filePath || '',
      essayId: editingImage.value.essayId,
      albumId: editingImage.value.albumId || '',
      description: editingImage.value.description || '',
      previewPath: editingImage.value.previewPath || ''
    }

    const result = await imageApi.updateImage(
      editingImage.value.imageId,
      updatePayload
    )

    if (result.success && result.data) {
      showSuccess('更新成功')
      const updatedImage = result.data as Image
      const index = images.value.findIndex(img => img.imageId === editingImage.value?.imageId)
      if (index !== -1) {
        images.value[index] = updatedImage
      }
      isEditing.value = false
      editingImage.value = null
    }
  } catch (error) {
    showError('更新失败')
  }
}

// 删除图片
const deleteImage = async (imageId: string) => {
  try {
    const result = await imageApi.deleteImage(imageId)
    if (result.success) {
      showSuccess('删除成功')
      images.value = images.value.filter(img => img.imageId !== imageId)
      showImageDialog.value = false
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : '删除失败')
  }
}

// 查看图片详情
const viewImage = (image: Image) => {
  selectedImage.value = image
  showImageDialog.value = true
}

// 编辑图片
const startEdit = (image: Image) => {
  editingImage.value = { ...image }
  isEditing.value = true
}

// 处理图片URL的计算属性
const getImageUrl = (path: string) => {
  if (!path) return ''
  // 如果已经是完整URL则直接返回
  if (path.startsWith('http')) return path
  // 否则拼接基础URL
  return `${IMAGE_BASE_URL}${path}`
}

// 开始创建新相册
const startCreateAlbum = () => {
  console.log('点击新建相册按钮')  // 添加调试日志
  isCreating.value = true
}

// 保存新相册
const saveNewAlbum = async () => {
  if (!newAlbum.value.title) {
    showError('请输入相册名称')
    return
  }

  try {
    const result = await albumApi.createAlbum({
      title: newAlbum.value.title!,
      description: newAlbum.value.description || '',
      albumId: '', // 由后端生成
      updatetime: '', // 由后端生成
      createtime: '' // 由后端生成
    })

    if (result.success && result.data) {
      const album = result.data as Album
      const permissionResult = await permissionApi.setPermission(
        album.albumId,
        selectedPermission.value
      )

      if (permissionResult.success) {
        showSuccess('创建相册成功')
        isCreating.value = false
        await fetchAlbums()
      } else {
        showError('设置权限失败')
      }
    }
  } catch (error) {
    showError('创建相册失败')
  }
}

// 取消创建
const cancelCreate = () => {
  isCreating.value = false
  newAlbum.value = {
    title: '',
    description: ''
  }
  selectedPermission.value = UserRole.GUEST // 重置权限选择
}

// 上传图片
const handleFileChange = (file: UploadFile) => {
  if (file.raw) {
    uploadForm.value.file = file.raw
  }
}

const uploadImage = async () => {
  if (!uploadForm.value.file || !uploadForm.value.fileName) {
    showError('请选择文件并输入图片名称')
    return
  }

  try {
    const result = await imageApi.uploadImage(
      uploadForm.value.file,
      selectedAlbum.value?.albumId,
      uploadForm.value.description
    )

    if (result.success) {
      showSuccess('上传成功')
      uploadDialogVisible.value = false
      // 重新加载图片列表
      if (selectedAlbum.value) {
        await selectAlbum(selectedAlbum.value)
      }
    }
  } catch (error) {
    showError('上传失败')
  }
}

// 编辑相册
const startEditAlbum = () => {
  if (selectedAlbum.value) {
    editingAlbum.value = { ...selectedAlbum.value }
    editAlbumDialogVisible.value = true
  }
}

const saveAlbumEdit = async () => {
  if (!editingAlbum.value) return

  try {
    const result = await albumApi.updateAlbum(
      editingAlbum.value.albumId,
      editingAlbum.value
    )

    if (result.success) {
      showSuccess('更新成功')
      editAlbumDialogVisible.value = false
      await fetchAlbums()
    }
  } catch (error) {
    showError('更新失败')
  }
}

// 删除相册
const deleteAlbum = async () => {
  if (!selectedAlbum.value) return

  try {
    const confirmed = await ElMessageBox.confirm(
      '确定要删除这个相册吗？此操作不可恢复。',
      '警告',
      { type: 'warning' }
    )

    if (confirmed) {
      const result = await albumApi.deleteAlbum(selectedAlbum.value.albumId)
      if (result.success) {
        showSuccess('删除成功')
        selectedAlbum.value = null
        await fetchAlbums()
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      showError('删除失败')
    }
  }
}

// 合并相册
const mergeAlbum = async () => {
  if (!selectedAlbum.value || !targetAlbumId.value) {
    showError('请选择目标相册')
    return
  }

  try {
    const result = await albumApi.mergeAlbums(
      selectedAlbum.value.albumId, // sourceId
      targetAlbumId.value // targetId
    )

    if (result.success) {
      showSuccess('合并成功')
      mergeDialogVisible.value = false
      selectedAlbum.value = null
      await fetchAlbums()
    } else {
      showError(result.errorMsg || '合并失败')
    }
  } catch (error) {
    showError('合并失败')
  }
}

// 确保在组件挂载时调用获取相册的方法
onMounted(() => {
  fetchAlbums()
})
</script>

<template>
  <div class="albums-container">
    <!-- 左侧相册导航 -->
    <div class="album-nav">
      <!-- 管理员添加相册按钮 -->
      <el-button
        v-if="userStore.isAdmin"
        type="primary"
        class="add-album-button"
        @click="startCreateAlbum">
        <el-icon :size="20">
          <Plus />
        </el-icon>
        <span style="margin-left: 8px">新建相册</span>
      </el-button>

      <!-- 现有相册列表 -->
      <div v-if="albums.length === 0" class="no-albums">
        暂无相册
      </div>

      <div v-else>
        <div
          v-for="album in albums"
          :key="album.albumId"
          class="album-item"
          :class="{ active: selectedAlbum && selectedAlbum.albumId === album.albumId }"
          @click="selectAlbum(album)">
          <div class="album-title">{{ album.title }}</div>
          <div class="album-desc">{{ album.description }}</div>
        </div>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="album-content">
      <!-- 管理按钮组 -->
      <div v-if="selectedAlbum && userStore.isAdmin" class="album-actions">
        <el-button-group>
          <el-button type="primary" @click="uploadDialogVisible = true">
            <el-icon><Upload /></el-icon>上传图片
          </el-button>
          <el-button type="warning" @click="startEditAlbum">
            <el-icon><Edit /></el-icon>编辑相册
          </el-button>
          <el-button type="danger" @click="deleteAlbum">
            <el-icon><Delete /></el-icon>删除相册
          </el-button>
          <el-button type="info" @click="mergeDialogVisible = true">
            <el-icon><Position /></el-icon>合并相册
          </el-button>
        </el-button-group>
      </div>

      <!-- 其他内容 -->
      <div v-if="!selectedAlbum" class="no-selection">
        <div class="empty-message">
        <p class="primary-text">光影是时光的切片，相框是生活的定格</p>
        <p class="secondary-text">请选择一个相册</p>
      </div>
      </div>
      <!-- 相册详情 -->
      <div v-if="selectedAlbum" class="album-detail">
        <h2>{{ selectedAlbum.title }}</h2>
        <p>{{ selectedAlbum.description }}</p>
        <p class="time-info">
          创建时间：{{ selectedAlbum.createtime }}
          <br>
          更新时间：{{ selectedAlbum.updatetime }}
        </p>
      </div>

      <!-- 图片网格 -->
      <div class="image-grid">
        <div v-for="image in images"
             :key="image.imageId"
             class="image-item"
             @click="viewImage(image)">
          <img :src="getImageUrl(image.previewPath)" :alt="image.fileName">
          <div class="image-name">{{ image.fileName }}</div>
        </div>
      </div>
    </div>

    <!-- 图片详情弹窗 -->
    <el-dialog v-model="showImageDialog"
               title="图片详情"
               width="80%"
               destroy-on-close>
      <div class="image-dialog-content">
        <div class="image-preview">
          <img :src="getImageUrl(selectedImage?.filePath || '')" :alt="selectedImage?.fileName">
        </div>
        <div class="image-info">
          <template v-if="!isEditing">
            <h3>{{ selectedImage?.fileName }}</h3>
            <p>上传时间：{{ selectedImage?.updateTime }}</p>
            <p>描述：{{ selectedImage?.description }}</p>
            <div v-if="userStore.isAdmin" class="admin-actions">
              <el-button type="primary" @click="startEdit(selectedImage!)">编辑</el-button>
              <el-button type="danger" @click="deleteImage(selectedImage!.imageId)">删除</el-button>
            </div>
          </template>
          <template v-else>
            <el-form>
              <el-form-item label="图片名称">
                <el-input v-model="editingImage!.fileName" />
              </el-form-item>
              <el-form-item label="图片描述">
                <el-input type="textarea" v-model="editingImage!.description" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveEdit">保存</el-button>
                <el-button @click="isEditing = false">取消</el-button>
              </el-form-item>
            </el-form>
          </template>
        </div>
      </div>
    </el-dialog>

    <!-- 新建相册弹窗 -->
    <el-dialog
      v-model="isCreating"
      title="新建相册"
      width="30%"
      :close-on-click-modal="false"
      @close="cancelCreate"
    >
      <el-form :model="newAlbum" label-width="80px">
        <el-form-item label="相册名称" required>
          <el-input
            v-model="newAlbum.title"
            placeholder="请输入相册名称"
          />
        </el-form-item>
        <el-form-item label="相册描述">
          <el-input
            v-model="newAlbum.description"
            type="textarea"
            :rows="4"
            placeholder="请输入相册描述"
          />
        </el-form-item>
        <el-form-item label="访问权限" required>
          <el-select v-model="selectedPermission" placeholder="请选择访问权限">
            <el-option
              v-for="option in permissionOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelCreate">取消</el-button>
          <el-button type="primary" @click="saveNewAlbum">
            创建
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 上传图片对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传图片">
      <el-form :model="uploadForm">
        <el-form-item label="选择图片" required>
          <el-upload
            accept="image/*"
            :auto-upload="false"
            :on-change="handleFileChange">
            <el-button type="primary">选择文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="图片名称" required>
          <el-input v-model="uploadForm.fileName" />
        </el-form-item>
        <el-form-item label="图片描述">
          <el-input type="textarea" v-model="uploadForm.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="uploadImage">上传</el-button>
      </template>
    </el-dialog>

    <!-- 编辑相册对话框 -->
    <el-dialog v-model="editAlbumDialogVisible" title="编辑相册">
      <el-form v-if="editingAlbum" :model="editingAlbum">
        <el-form-item label="相册名称" required>
          <el-input v-model="editingAlbum.title" />
        </el-form-item>
        <el-form-item label="相册描述">
          <el-input type="textarea" v-model="editingAlbum.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editAlbumDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAlbumEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 合并相册对话框 -->
    <el-dialog
      v-model="mergeDialogVisible"
      title="合并相册"
      width="30%"
    >
      <div class="merge-warning">
        <el-alert
          title="警告"
          type="warning"
          description="合并操作将把当前相册的所有图片移动到目标相册中，且不可撤销"
          :closable="false"
          show-icon
        />
      </div>
      <el-form>
        <el-form-item label="当前相册">
          <el-input :value="selectedAlbum?.title" disabled />
        </el-form-item>
        <el-form-item label="目标相册" required>
          <el-select
            v-model="targetAlbumId"
            placeholder="请选择要合并到的相册"
          >
            <el-option
              v-for="album in otherAlbums"
              :key="album.albumId"
              :label="album.title"
              :value="album.albumId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mergeDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="mergeAlbum">确认合并</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.albums-container {
  display: flex;
  height: calc(100vh - 60px);
  background-color: #fff;
}

.album-nav {
  width: 250px;
  padding: 20px;
  border-right: 1px solid #eee;
  overflow-y: auto;
}

.no-albums {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.album-item {
  height: 100px;  /* 固定高度 */
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.album-item:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
}

.album-item.active {
  background-color: #e3f2fd;
  border-left: 4px solid #1976d2;
}

.album-title {
  font-weight: 600;
  margin-bottom: 5px;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-desc {
  font-size: 0.9em;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;  /* 限制两行 */
  -webkit-box-orient: vertical;
  line-clamp: 2; /* 添加标准属性 */
  flex: 1;
}

.no-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
  font-size: 1.2em;
}

.album-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  position: relative; /* 添加相对定位 */
}

.album-detail {
  margin-bottom: 24px;
  padding: 20px;
}

.album-detail h2 {
  font-size: 36px;  /* 增大标题尺寸 */
  color: #303133;
  margin-bottom: 16px;
}

.album-detail p {
  color: #606266;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 12px;
}

.time-info {
  color: #909399;
  font-size: 14px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.image-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.image-item:hover {
  transform: scale(1.05);
}

.image-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.image-name {
  margin-top: 8px;
  font-size: 14px;
  text-align: center;
}

.image-dialog-content {
  display: flex;
  gap: 20px;
}

.image-preview {
  flex: 2;
}

.image-preview img {
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
}

.image-info {
  flex: 1;
  padding: 20px;
}

.admin-actions {
  margin-top: 20px;
}

.add-album-button {
  width: 100%;
  margin-bottom: 15px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-album-button :deep(.el-icon) {
  font-size: 20px;
  vertical-align: middle;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.album-actions {
  position: sticky;
  top: 0;
  right: 0;
  z-index: 10;
  padding: 16px;
  background-color: white;
  display: flex;
  justify-content: flex-end;
}

.album-actions .el-button-group {
  margin-left: auto;
}

.merge-warning {
  margin-bottom: 20px;
}

.empty-message {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.primary-text {
  font-size: 1.8rem;
  color: #606266;
  font-weight: 300;
  margin: 0;
  opacity: 0.8;
}

.secondary-text {
  font-size: 1.2rem;
  color: #909399;
  margin: 0;
  opacity: 0.7;
}

</style>
