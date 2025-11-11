## 输入中的内容

当输入了内容未发送，切换到其它会话时发送请求`https://tgdd-api.jx3kaihe.top/v1/conversations/338ecbb5a75b4aa4ac9b947c85e65b29/2/extra`
请求参数

```json
{
  "browse_to": 0,
  "keep_message_seq": 0,
  "keep_offset_y": 0,
  "draft": "@45645"
}
```

## 个人信息窗口（右侧抽屉）

## 通过个人信息“查找聊天记录”打开全局聊天搜索窗口，参考图

## 通过搜索点击跳转到指定会话及定位到指定消息

## 向下滚动加载聊天记录

通过搜索定位到某页的聊天消息，向下滚动加载下一页内容

参考代码：

```js
// 向上拉取消息
    async pullupMessages() {
        this.loading = true
        const maxMessage = this.getMessageMax()
        if (maxMessage == null || maxMessage.messageSeq <= 0) { // 没有消息直接return
            console.log("没有maxMessage")
            return
        }
        console.log("pullupMessages--->")

        const opts = new SyncMessageOptions()
        opts.limit = WKApp.config.pageSizeOfMessage
        opts.pullMode = PullMode.Up
        opts.startMessageSeq = maxMessage.messageSeq

        let remoteMessages = await WKApp.conversationProvider.syncMessages(this.channel, opts)
        const newMessages = new Array<Message>()
        if (remoteMessages && remoteMessages.length > 0) {
            remoteMessages.forEach(msg => {
                if (!msg.isDeleted) {
                    newMessages.push(msg)
                }
            });
        }
        if (remoteMessages.length < opts.limit) {
            this.pullupHasMore = false
            console.log("没有更多消息了")
        } else {
            this.pullupHasMore = true
            console.log("还有更多消息")
        }
        this.messagesOfOrigin = [...this.messagesOfOrigin, ...this.toMessageWraps(newMessages)]
        this.refreshAndLocateMessages(this.messagesOfOrigin, undefined, false, () => {
            this.loading = false
        })
    }

```

## 发起群聊，参考图

## 添加好友，参考图
