<template>
  <div class="about-page">
    <NavBar />
    <main class="content">
      <h1>网站使用指南</h1>
      <!-- 核心功能模块 -->
      <div class="guide-section">
        <el-row :gutter="24">
          <!-- 文章系统 -->
          <el-col :md="8" :sm="24">
            <el-card class="feature-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>文章系统</span>
                </div>
              </template>
              <ul class="feature-list">
                <li>多级权限文章合集浏览</li>
                <li>左侧导航栏浏览文章列表</li>
                <li>支持批注功能（需密友登录）</li>
                <li>点击文章想要批注的位置后，输入任意字符直到新建批注按钮亮起后新建批注</li>
                <li>文章统计信息实时更新</li>
              </ul>
            </el-card>
          </el-col>

          <!-- 相册管理 -->
          <el-col :md="8" :sm="24">
            <el-card class="feature-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Picture /></el-icon>
                  <span>相册管理</span>
                </div>
              </template>
              <ul class="feature-list">
                <li>多级权限相册浏览</li>
                <li>支持图片上传/删除（管理员）</li>
                <li>点击图片查看大图及元信息</li>
                <li>支持相册合并操作</li>
              </ul>
            </el-card>
          </el-col>

          <!-- 音乐管理 -->
          <el-col :md="8" :sm="24">
            <el-card class="feature-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Picture /></el-icon>
                  <span>音乐管理</span>
                </div>
              </template>
              <ul class="feature-list">
                <li>多级权限音乐播放</li>
                <li>支持音乐上传/删除（管理员）</li>
                <li>点击“i”查看音乐信息和介绍</li>
                <li>点击耳机图标打开播放器播放</li>
                <li>播放器支持跨页面保留和后台播放</li>
              </ul>
            </el-card>
          </el-col>

          <!-- 评论系统 -->
          <el-col :md="8" :sm="24">
            <el-card class="feature-card">
              <template #header>
                <div class="card-header">
                  <el-icon><ChatLineRound /></el-icon>
                  <span>互动功能</span>
                </div>
              </template>
              <ul class="feature-list">
                <li>文章底部参与评论（需要好友以上登录）</li>
                <li>双击一级评论输入回复，不能回复二级评论</li>
                <li>emoji表情符号支持</li>
                <li>实时更新评论列表</li>
              </ul>
            </el-card>
          </el-col>
        </el-row>

        <!-- 权限说明 -->
        <div class="permission-section">
          <h2>权限说明</h2>
          <el-alert type="info" :closable="false">
            <template #title>
              系统采用基于角色的访问控制（RBAC），权限级别包括：
              <el-tag type="danger">管理员</el-tag>
              <el-tag type="warning">密友（亲人）</el-tag>
              <el-tag type="success">好友</el-tag>
              <el-tag>游客（无需注册）</el-tag>
            </template>
          </el-alert>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 保持原有布局样式不变 */
.content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* 新增样式 */
.guide-section {
  margin-top: 2rem;
}

.feature-card {
  margin-bottom: 1.5rem;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 500;
}

.feature-list {
  line-height: 1.8;
  padding-left: 1.2rem;
}

.feature-list li {
  margin: 0.8rem 0;
}

.permission-section {
  margin-top: 3rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

</style>
