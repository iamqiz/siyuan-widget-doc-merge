## 思源页面合并助手

这是一个用于合并两个思源页面的思源挂件。

通过提供两个文档的id,将文档2的反链重新指向文档1(即文档2的反链合并到文档1里)

同时也会合并文档2的内容到文档1里,这样原先指向文档2内部块的内容块会变成指向文档1的内部块


### 使用方法

- 分别复制文档1和文档2的id到输入框
- 点击检查按钮,会显示id对应文档的路径,确保是打算合并的页面
- 点击合并按钮

合并后的文档依然是文档1, 而文档2会被删除

### 恢复
文档1和文档2的原始sy文件会被备份到相应目录里的txt文件中

若想恢复文档1和文档2, 把.txt后缀去掉覆盖现在的sy文件,然后重建索引即可

若要恢复文档2的反链, 目前需要点击挂件下方显示的反链位置手动修改回去