# 内容管理指南

## 添加电子书

1. 在 `src/content/wiki/` 下建文件夹（英文小写+横杠）
2. 添加 `_meta.yaml`：`title`, `description`, `tags`, `order`
3. 添加章节 `01-xxx.md`，frontmatter 需要 `title`, `wiki`（=文件夹名）, `order`

## 添加文章

在 `src/content/articles/` 下建 `.md` 文件，frontmatter：`title`, `description`, `publishDate`, `tags`, `author`

## 添加帮助文档

在 `src/content/help/` 下建 `.md` 文件，frontmatter：`title`, `description`, `category`, `order`

## 添加学员故事

在 `src/content/stories/` 下建 `.md` 文件，frontmatter：`title`, `description`, `name`, `role`, `company`, `course`, `tags`, `publishDate`, `highlight`

## 发布

Push 到 main 分支 → GitHub Actions 自动构建部署。
