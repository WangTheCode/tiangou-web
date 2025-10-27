class EndpointID {
  static loginWidget = 'loginWidget' // login widget
  static homeWidget = 'homeWidget' // 主页
  static routePrefix = 'route:' // 路由sid前缀
  static menusPrefix = 'menus:' // 菜单前缀
  static conversationListItem = 'conversationList.item' // 最近会话列表的item
  static showConversation = 'showConversation' // 显示会话页面
  static clearChannelMessages = 'clearChannelMessages' // 清空某个频道消息
  static emojiService = 'emojiService' // emoji服务
}

class EndpointCategory {
  static routes = 'routes' // 路由
  static menus = 'menus' // 菜单
  static channelSetting = 'channelSetting' // 频道设置
  static userInfo = 'userInfo' // 用户信息
  static channelManage = 'channelManage' // 频道管理
  static contactsHeader = 'contactsHeader'
  static messageContextMenus = 'messageContextMenus' // 消息上下文菜单
  static friendApplyDataChange = 'friendApplyDataChange' // 好友申请数据改变
  static chatMenusPopover = 'chatMenusPopover' // 聊天菜单气泡
  static chatToolbars = 'chatToolbars' // 聊天工具栏
  static channelHeaderRightItems = 'channelHeaderRightItems' // 频道头部右侧items
  static organizational = 'organizational' // 组织架构
  static organizationalLayer = 'organizationalLayer' // 组织架构弹框
}

class GroupRole {
  static normal = 0 // 普通
  static owner = 1 // 群主
  static manager = 2 // 管理员
}

class SubscriberStatus {
  static unknown = 0 // 未知
  static normal = 1 // 正常
  static blacklist = 2 // 黑名单
}

class MessageContentTypeConst {
  static text = 1 // 文本消息
  static historySplit = -3 // 历史风格线
  static typing = -2 // 输入中
  static time = -1 // 时间消息
  static image = 2 // 图片消息
  static gif = 3 // gif消息
  static voice = 4 // 语音消息
  static smallVideo = 5 // 小视频
  static location = 6 // 位置信息
  static card = 7 // 名片
  static file = 8 // 文件
  static mergeForward = 11 // 合并转发
  static lottieSticker = 12 // lottie贴图
  static lottieEmojiSticker = 13 // lottie emoji 贴图
  static joinOrganization = 16 // 加入组织
  static addMembers = 1002 // 添加群成员
  static removeMembers = 1003 // 删除群成员
  static channelUpdate = 1005 // 频道更新
  static newGroupOwner = 1008 // 新的管理员
  static approveGroupMember = 1009 // 审批群成员
  static screenshot = 20 // 截屏消息

  // 音频通话消息号段 9900 - 9999
  static rtcResult = 9989 // 音视频通话结果
  static rtcSwitchToVideo = 9990 // 切换到视频通话
  static rtcSwitchToVideoReply = 9991 // 切换到视频回复
  static rtcCancel = 9992 // 取消通话
  static rtcSwitchToAudio = 9993 // 音视频切换（未接通时）
  static rtcData = 9994 // rtc信令数据类型
  static rtcMissed = 9995 //  未接听
  static rtcReceived = 9996 //  收到通话
  static rtcRefue = 9997 // 拒绝通话
  static rtcAccept = 9998 // 接受通话
  static rtcHangup = 9999 // 挂断通话
}

// 用户关系
class UserRelation {
  static stranger = 0 // 陌生人
  static friend = 1 // 好友
  static blacklist = 2 // 拉黑
}

// 网页端暂不支持的消息
const unsupportMessageTypes = []

// MessageReasonCode 枚举
class MessageReasonCode {
  // ReasonUnknown 未知错误
  static reasonUnknown = 0
  // ReasonSuccess 成功
  static reasonSuccess = 1
  // ReasonAuthFail 认证失败
  static reasonAuthFail = 2
  // ReasonSubscriberNotExist 订阅者在频道内不存在
  static reasonSubscriberNotExist = 3
  // ReasonInBlacklist 在黑名单列表里
  static reasonInBlacklist = 4
  // ReasonChannelNotExist 频道不存在
  static reasonChannelNotExist = 5
  // ReasonUserNotOnNode 用户没在节点上
  static reasonUserNotOnNode = 6
  // ReasonSenderOffline // 发送者离线了，这条消息将发不成功
  static reasonSenderOffline = 7
  // ReasonMsgKeyError 消息key错误 说明消息不合法
  static reasonMsgKeyError = 8
  // ReasonPayloadDecodeError payload解码失败
  static reasonPayloadDecodeError = 9
  // ReasonForwardSendPacketError 转发发送包失败
  static reasonForwardSendPacketError = 10
  // ReasonNotAllowSend 不允许发送消息
  static reasonNotAllowSend = 11
  // ReasonConnectKick 连接被踢
  static reasonConnectKick = 12
  // ReasonNotInWhitelist 没在白名单内
  static reasonNotInWhitelist = 13
  // 查询用户token错误
  static reasonQueryTokenError = 14
  // 系统错误
  static reasonSystemError = 15
}

const OrderFactor = 10000 // 排序因子

const ChannelTypeCustomerService = 3 // 客服频道

// 消息气泡位置
const BubblePosition = {
  unknown: 0,
  first: 1, // 第一个
  middle: 2, // 中间
  last: 3, // 最后一个
  single: 4, // 单独
}

module.exports = {
  EndpointID,
  EndpointCategory,
  GroupRole,
  SubscriberStatus,
  MessageContentTypeConst,
  UserRelation,
  unsupportMessageTypes,
  MessageReasonCode,
  OrderFactor,
  ChannelTypeCustomerService,
  BubblePosition,
}
