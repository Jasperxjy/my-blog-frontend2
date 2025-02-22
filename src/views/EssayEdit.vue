<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue';
import type { Essay, EssayTag, Collection } from '@/types/essay'
import {
  getEssayTags,
  getAllTags,
  addTag,
  removeTagFromEssayAPI,
  addTagsToEssay,
  getCollections,
  updateEssay,
  startEditEssay,
  endEditEssay
} from '@/api/essay'
import ArticleEditor from '@/components/ArticleEditor.vue'



const currentEssay = ref<Essay | null>(null)
const essayTags = ref<EssayTag[]>([])
const allTags = ref<EssayTag[]>([])
const collections = ref<Collection[]>([])
const showTagDialog = ref(false)
const isTagDeleting = ref(false)
const newTagName = ref('')
const selectedTags = ref<string[]>([])
const autoSaveTimeout = ref<number | null>(null)
const lastSavedContent = ref('')
const userStore = useUserStore()

// 获取所有可用标签
const fetchAllTags = async () => {
  try {
    const result = await getAllTags()
    if (result.success && result.data) {
      allTags.value = result.data
    }
  } catch (error) {
    ElMessage.error('获取标签列表失败')
  }
}

// 获取所有合集
const fetchCollections = async () => {
  try {
    const result = await getCollections()
    if (result.success && result.data) {
      collections.value = result.data
    }
  } catch (error) {
    ElMessage.error('获取合集列表失败')
  }
}

// 创建新标签
const createNewTag = async () => {
  if (!newTagName.value.trim()) {
    ElMessage.warning('请输入标签名称')
    return
  }

  try {
    const result = await addTag({
      essayTagName: newTagName.value.trim()
    })

    if (result.success && result.data) {
      allTags.value.push(result.data)
      selectedTags.value.push(result.data.essayTagId)
      newTagName.value = ''
      ElMessage.success('创建标签成功')
    }
  } catch (error) {
    ElMessage.error('创建标签失败')
  }
}

// 为文章添加选中的标签
const addTags = async () => {
  try {
    const result = await addTagsToEssay({
      essayId: currentEssay.value!.essayId,
      tagIds: selectedTags.value
    });
    if (result.success) {
      ElMessage.success('添加标签成功');
      showTagDialog.value = false;
      try {
        const result = await getEssayTags(currentEssay.value!.essayId)
        if (result.success && result.data) {
          essayTags.value = result.data
        }
      } catch (error) {
        ElMessage.error('获取当前标签列表失败')
      }
    }
  } catch (error) {
    ElMessage.error('添加标签失败');
  }
}

// 计算可选标签列表（排除已有标签）
const availableTags = computed(() => {
  return allTags.value.filter(tag =>
    !essayTags.value.some(et => et.essayTagId === tag.essayTagId)
  )
})

// 内容自动保存处理函数
const handleContentChange = async (content: string) => {
  // 立即更新当前文章内容
  if (currentEssay.value) {
    currentEssay.value.essayContext = content;
  }
  // 清除旧定时器
  if (autoSaveTimeout.value) clearTimeout(autoSaveTimeout.value)

  // 设置新定时器
  autoSaveTimeout.value = window.setTimeout(async () => {
    if (currentEssay.value && lastSavedContent.value !== content) {
      try {
        const essayData = {
          ...currentEssay.value,
          essayContext: content
        };
        await updateEssay(currentEssay.value.essayId, essayData)
        lastSavedContent.value = content
        ElMessage.success('内容保存成功')
      } catch {
        ElMessage.error('内容保存失败')
      }
    }
  }, 3000)
}

// 标题和合集自动保存处理函数
const handleOtherChange = async () => {
  if (autoSaveTimeout.value) clearTimeout(autoSaveTimeout.value)

  autoSaveTimeout.value = window.setTimeout(async () => {
    if (currentEssay.value) {
      try {
        const essayData = currentEssay.value

        await updateEssay(currentEssay.value.essayId, essayData)

        ElMessage.success('自动保存成功')
      } catch {
        ElMessage.error('自动保存失败')
      }
    }
  }, 3000)
}



// 组件卸载时清理定时器和本地存储
onBeforeUnmount(() => {
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }
  localStorage.removeItem('currentEssay');
  localStorage.removeItem('currentTags');
})

// 初始化
onMounted(() => {
  // 从 localStorage 中读取当前文章对象和标签列表
  const essayData = localStorage.getItem('currentEssay');
  const tagsData = localStorage.getItem('currentTags');
  if (essayData) {
    currentEssay.value = JSON.parse(essayData);
    if (userStore.userInfo && currentEssay.value) {
      currentEssay.value.userId = userStore.userInfo.userId || '';
    }
  }
  if (tagsData) {
    essayTags.value = JSON.parse(tagsData);
  }

  //如果文章状态不是1，新建的文章状态一定是1，表明是从已有文章中进入的，就调用编辑文章给文章加锁
  if (currentEssay.value?.status != 1) {
    startEditEssay(currentEssay.value!.essayId, userStore.userInfo?.userId || '')
  }
  fetchAllTags()
  fetchCollections()

})


// 新增结束编辑处理方法
const handleEndEdit = async () => {
  try {
    // 立即保存所有内容
    if (currentEssay.value) {
      await updateEssay(currentEssay.value.essayId, currentEssay.value)
    }

    // 调用解锁接口
    const result = await endEditEssay(
      currentEssay.value!.essayId,
      userStore.userInfo?.userId || ''
    )

    if (result.success) {
      ElMessage.success('文章已解锁并保存')
      window.close() // 关闭当前窗口
    }
  } catch (error) {
    ElMessage.error('结束编辑失败')
  }
}

// 修复标签删除方法
const removeTagFromEssay = async (tagId: string) => {
  try {
    await removeTagFromEssayAPI({
      essayId: currentEssay.value!.essayId, // [!code ++]
      essayTagId: tagId
    })
    essayTags.value = essayTags.value.filter(t => t.essayTagId !== tagId)
  } catch {
    ElMessage.error('删除标签失败')
  }
}

// 计算属性
const currentEssayTitle = computed({
  get: () => currentEssay.value?.essayTitle || '',
  set: (value) => {
    if (currentEssay.value) {
      currentEssay.value.essayTitle = value;
    }
  }
});

const currentEssayType = computed({
  get: () => currentEssay.value?.essayType || '',
  set: (value) => {
    if (currentEssay.value) {
      currentEssay.value.essayType = value;
    }
  }
});
const currentEssayContext = computed({
  get: () => currentEssay.value?.essayContext || '',
  set: (value) => {
    if (currentEssay.value) {
      currentEssay.value.essayContext = value;
    }
  }
});

const currentEssayClassId = computed({
  get: () => currentEssay.value?.classId || '',
  set: (value) => {
    if (currentEssay.value) {
      currentEssay.value.classId = value;
    }
  }
});
</script>

<template>
  <div class="essay-edit" style="max-width: 70rem; margin: 40px auto 0;">
    <div class="header-actions">
      <el-input v-model="currentEssayTitle" placeholder="请输入标题" class="title-input"
        @update:model-value="handleOtherChange" style="width: 100%; height: 50px;" />
      <div class="action-buttons">
        <el-button type="warning" size="default" @click="handleEndEdit" style="margin-left: 20px; height: 40px;">
          <el-icon>
            <Check />
          </el-icon>
          结束编辑
        </el-button>
      </div>
    </div>

    <el-input v-model="currentEssayType" placeholder="请输入文章类型" class="type-input"
      @update:model-value="handleOtherChange" />
    <el-select v-model="currentEssayClassId" placeholder="选择合集" @update:model-value="handleOtherChange" @change="(val: string) => {
      if (currentEssay) {
        currentEssay.classId = val || '';
      }
    }">
      <el-option label="无合集" :value="''" />
      <el-option v-for="collection in collections" :key="collection.collectionId" :label="collection.collectionName"
        :value="collection.collectionId" />
    </el-select>
    <div class="tags-management">
      <div class="tags-row">
        <el-tag v-for="tag in essayTags" :key="tag.essayTagId" class="essay-tag" :closable="isTagDeleting"
          @close="removeTagFromEssay(tag.essayTagId)">
          {{ tag.essayTagName }}
        </el-tag>
      </div>
      <div class="tag-actions">
        <el-button type="primary" size="small" @click="showTagDialog = true">
          <el-icon>
            <Plus />
          </el-icon>
          添加标签
        </el-button>
        <el-button type="danger" size="small" @click="isTagDeleting = !isTagDeleting">
          <el-icon>
            <Delete />
          </el-icon>
          {{ isTagDeleting ? '完成' : '删除标签' }}
        </el-button>



      </div>
    </div>
    <article-editor ref="articleEditorRef" :model-value="currentEssayContext" :editable="true"
      style="min-height: 66cap;" @update:model-value="handleContentChange" />
    <el-dialog v-model="showTagDialog" title="添加标签" width="30%">
      <div class="new-tag-input">
        <el-input v-model="newTagName" placeholder="输入新标签名称">
          <template #append>
            <el-button @click="createNewTag">新增标签</el-button>
          </template>
        </el-input>
      </div>
      <el-select v-model="selectedTags" multiple placeholder="选择要添加的标签" style="width: 100%">
        <el-option v-for="tag in availableTags" :key="tag.essayTagId" :label="tag.essayTagName"
          :value="tag.essayTagId" />
      </el-select>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTagDialog = false">取消</el-button>
          <el-button type="primary" @click="addTags">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.essay-edit {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.essay-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title-input {
  margin-bottom: 1rem;
}

.type-input {
  margin-bottom: 1rem;
}

.tags-management {
  margin-top: 1rem;
}

.tag-actions {
  margin-top: 0.5rem;
}

.new-tag-input {
  margin-bottom: 1rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 1rem;
}

.action-buttons {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: 50px;
  margin-bottom: 1rem;
}

</style>
