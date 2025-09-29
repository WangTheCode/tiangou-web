import { Channel, ChannelInfo, ConversationExtra, Message, Subscriber } from "wukongimjssdk";

export class DataSource {
    constructor() {
        this.channelDataSource = null
        this.commonDataSource = null
        // ---------- 联系人数据 ----------
        this.contactsList = []
        this.contactsChangeListeners = []
    }

    async contactsSync() {
        const maxVersion = this.contactsMaxSyncVersion()
        const results = await this.commonDataSource.contactsSync(maxVersion)
        if (results && results.length > 0) {
            const newContactsList = new Array()
            for (let index = 0; index < this.contactsList.length; index++) {
                const oldContacts = this.contactsList[index];
                var exist = false
                for (const newContacts of results) {
                    if (oldContacts.uid === newContacts.uid) {
                        exist = true
                        break
                    }
                }
                if (!exist) {
                    newContactsList.push(oldContacts)
                }
            }
            newContactsList.push(...results)

            this.contactsList = newContactsList
            this.notifyContactsChange()
        }
    }

    contactsMaxSyncVersion() {
        if (this.contactsList && this.contactsList.length > 0) {
            const lastContacts = this.contactsList[this.contactsList.length - 1]
            return lastContacts.version
        }
        return ""
    }

    addContactsChangeListener(listener) {
        this.contactsChangeListeners.push(listener)
    }
    removeContactsChangeListener(listener) {
        const len = this.contactsChangeListeners.length;
        for (let i = 0; i < len; i++) {
            if (listener === this.contactsChangeListeners[i]) {
                this.contactsChangeListeners.splice(i, 1)
                return
            }
        }
    }

    notifyContactsChange() {
        if (this.contactsChangeListeners) {
            this.contactsChangeListeners.forEach((listener) => {
                if (listener) {
                    listener();
                }
            });
        }
    }
}

export const ContactsStatus = {
    Blacklist: 2 // 黑明单
}

export class Contacts {
    constructor() {
        this.uid = ''
        this.name = ''
        this.mute = false
        this.top = false
        this.sex = 0
        this.online = false
        this.receipt = false
        this.robot = false
        this.lastOffline = 0
        this.category = ''
        this.follow = 0
        this.remark = ''
        this.chatPwdOn = false
        this.status = null
        this.shortNo = ''
        this.sourceDesc = ''
        this.vercode = ''
        this.screenshot = false
        this.revokeRemind = false
        this.beBlacklist = false
        this.beDeleted = false
        this.version = ''
        this.avatar = ''
    }
}

/**
 * ICommonDataSource 接口
 * 通用数据源接口，定义了通用的数据操作方法
 * 
 * 方法列表：
 * - imConnectAddr(): Promise<string> // im的连接地址
 * - imConnectAddrs(): Promise<string[]> // im的连接地址
 * - contactsSync(version: string): Promise<Contacts[]> // 联系人同步
 * - getImageURL(path: string, opts?: { width: number, height: number }): string // 获取图片完整地址
 * - getFileURL(path: string): string // 获取文件地址
 * - friendSure(token: string): Promise<void> // 确认好友申请
 * - friendApply(req: { uid: string, remark: string, vercode: string }): Promise<void> // 好友申请
 * - qrcodeMy(): Promise<any> // 我的二维码
 * - searchUser(keyword: string): Promise<any> // 搜索用户
 * - userStickerCategory(): Promise<any> // 用户贴图类别
 * - getStickers(category: string): Promise<any> // 通过类别获取表情
 * - getFavoritesAll(): Promise<any> // 获取所有收藏
 * - favorities(message: Message): Promise<void> // 收藏消息
 * - favoritiesDelete(id: string): Promise<void> // 删除收藏
 * - searchFriends(keyword?: string): Promise<ChannelInfo[]> // 搜索好友
 * - deleteFriend(uid: string): Promise<void> // 删除好友
 * - userRemark(uid: string, remark: string): Promise<void> // 用户备注
 * - blacklistAdd(uid: string): Promise<void> // 黑名单添加
 * - blacklistRemove(uid: string): Promise<void> // 黑名单移除
 */


export class ChannelField {
    static channelName = "name"
    static notice = "notice"
}

/**
 * IChannelDataSource 接口
 * 频道数据源接口，定义了频道相关的数据操作方法
 * 
 * 方法列表：
 * - updateField(channel: Channel, field: string, value: string): Promise<void> // 修改频道属性
 * - qrcode(channel: Channel): Promise<ChannelQrcodeResp> // 获取频道二维码
 * - removeSubscribers(channel: Channel, uids: string[]): Promise<void> // 移除订阅者
 * - addSubscribers(channel: Channel, uids: string[]): Promise<void> // 添加订阅者
 * - subscribers(channel: Channel, req: {keyword?: string, limit?: number, page?: number}): Promise<Subscriber[]> // 获取订阅者
 * - updateSetting(setting: any, channel: Channel): Promise<void> // 更新频道设置
 * - groupSaveList(): Promise<ChannelInfo[]> // 获取保存的群聊
 * - createChannel(uids: string[]): Promise<any> // 创建频道
 * - subscriberAttrUpdate(channel: Channel, subscriberUID: string, attr: any): Promise<any> // 更新订阅者的属性
 * - exitChannel(channel: Channel): Promise<void> // 退出频道
 * - channelTransferOwner(channel: Channel, toUID: string): Promise<void> // 频道拥有者转移
 * - managerRemove(channel: Channel, uids: string[]): Promise<void> // 移除管理者
 * - managerAdd(channel: Channel, uids: string[]): Promise<void> // 添加管理员
 * - blacklistAdd(channel: Channel, uids: string[]): Promise<void> // 黑名单添加
 * - blacklistRemove(channel: Channel, uids: string[]): Promise<void> // 黑名单移除
 * - conversationExtraUpdate(conversationExtra: ConversationExtra): Promise<void> // 更新扩展
 */

export class ChannelQrcodeResp {
    constructor() {
        this.qrcode = ''
        this.expire = ''
    }
    
    fill(data) {
        this.qrcode = data.qrcode
        this.expire = data.expire
    }
}