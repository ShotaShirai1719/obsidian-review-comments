# reed 的 Review Comments 定制版

这是 Obsidian 插件 Review Comments 的个人 fork，只给 reed 自己用，**不给原作者提 PR**。

- 原版：`upstream` = <https://github.com/ShotaShirai1719/obsidian-review-comments>
- 我的 fork：`origin` = <https://github.com/hemengke1997/obsidian-review-comments>
- 工作分支：`fix/click-to-edit`。所有定制都是这个分支上、在 `upstream/main` 之后的提交

## 定制清单

每条写「效果」和「为什么」。同步原版时如果有冲突，或者原版已经改了相关代码，**按效果重做**，不要照搬旧代码。

| # | 效果 | 为什么 | 主要位置 |
| --- | --- | --- | --- |
| 1 | 实时预览里点高亮的文字，光标落进文字里，不弹出评论 | 原版点高亮就弹窗，没法直接改字 | `src/rendering.ts` |
| 2 | 表格单元格没聚焦时，里面的评论也照常渲染 | 原版表格里的评论显示成原始标记 | `src/rendering.ts` |
| 3 | 高亮文字渲染在编辑器外（如表格）时保留原有格式 | 原版会丢掉加粗等格式 | `src/rendering.ts` |
| 4 | 编辑被高亮的文字时隐藏评论标记；表格里的弹出框位置正确 | 标记挡字、弹出框错位 | `src/rendering.ts`、`src/floating-bar.ts`、`src/ui/comment-bubble.ts`、`styles.css` |
| 5 | 评论弹出框里的文字可以选中复制 | 原版选不中 | `styles.css` |
| 6 | 弹出框所有按钮都有悬停反馈 | 原版部分按钮悬停没反应 | `styles.css` |
| 7 | 评论输入框：**Enter 提交，Shift + Enter 换行**，Cmd/Ctrl + Enter 也提交；输入法选字时按 Enter 只上屏、不提交。新建评论的弹窗和侧边栏编辑框都这样，提示文字八种语言同步 | reed 的习惯，和 Notion 评论一致；中文输入法下必须防误提交 | `src/keys.ts`、`src/modal.ts`、`src/view.ts`、`src/i18n.ts` 的 `panel.editHint` |
| 8 | `npm run deploy`：构建后复制到所有装了本插件的 vault | 多个 vault 一次装好 | `scripts/deploy.mjs`、`package.json` |

加新定制时：做成独立的提交，并在上表加一行。

## 同步原版

reed 说「Review Comments 原版更新了」或「同步原版」时：

```bash
git fetch upstream
git rebase upstream/main          # 定制提交会自动重新叠上去
npm run build && npx tsc --noEmit -skipLibCheck
npm run deploy
```

- 有冲突：读上表那条定制的「效果」，在新代码上按效果重做，再 `git rebase --continue`
- 原版已经实现了某条定制的效果：删掉那个提交，并删掉上表那一行
- 部署后在 Obsidian 里重新加载插件，按上表逐条手试一遍
- rebase 后推到 `origin` 需要强推，先问 reed

## 部署

`npm run deploy` 会读 Obsidian 的 vault 登记（`~/Library/Application Support/obsidian/obsidian.json`），把 `main.js`、`manifest.json`、`styles.css` 复制到每个装了本插件的 vault。之后在 Obsidian 里重新加载插件：

```bash
obsidian vault="<vault 名>" eval code="(async()=>{await app.plugins.disablePlugin('review-comments');await app.plugins.enablePlugin('review-comments')})()"
```

## 注意

- 本 fork 和原版插件 ID 相同（`review-comments`）。在 Obsidian 里点这个插件的「更新」会装上原版、**覆盖掉全部定制**；不小心点了，在本仓库运行 `npm run deploy` 装回来
- `main.js` 不进 git，每次构建生成
