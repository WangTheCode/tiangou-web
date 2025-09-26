import { EventEmitter } from 'events';
import { WKChannel } from '../models/WKChannel';
import { WKChannelInfo } from '../models/WKChannelInfo';

export interface WKChannelManagerDelegate {
  onChannelInfoUpdate?: (channelInfo: WKChannelInfo) => void;
  onChannelInfoDeleted?: (channel: WKChannel) => void;
}

export class WKChannelManager extends EventEmitter {
  private delegates: Set<WKChannelManagerDelegate> = new Set();
  private channelInfoCache: Map<string, WKChannelInfo> = new Map();

  // 数据提供者
  public channelInfoProvider?: (channel: WKChannel) => Promise<WKChannelInfo | null>;

  constructor() {
    super();
  }

  // 获取频道信息
  async getChannelInfo(channel: WKChannel): Promise<WKChannelInfo | null> {
    const cacheKey = this.getChannelCacheKey(channel);

    // 先从缓存获取
    const cachedInfo = this.channelInfoCache.get(cacheKey);
    if (cachedInfo) {
      return cachedInfo;
    }

    // 从数据提供者获取
    if (this.channelInfoProvider) {
      const channelInfo = await this.channelInfoProvider(channel);
      if (channelInfo) {
        this.channelInfoCache.set(cacheKey, channelInfo);
        return channelInfo;
      }
    }

    return null;
  }

  // 添加或更新频道信息
  addOrUpdateChannelInfo(channelInfo: WKChannelInfo): void {
    const cacheKey = this.getChannelInfoCacheKey(channelInfo);
    this.channelInfoCache.set(cacheKey, channelInfo);

    // 通知委托
    this.delegates.forEach(delegate => {
      delegate.onChannelInfoUpdate?.(channelInfo);
    });
  }

  // 批量添加或更新频道信息
  addOrUpdateChannelInfos(channelInfos: WKChannelInfo[]): void {
    channelInfos.forEach(info => {
      const cacheKey = this.getChannelInfoCacheKey(info);
      this.channelInfoCache.set(cacheKey, info);
    });

    // 批量通知委托
    channelInfos.forEach(info => {
      this.delegates.forEach(delegate => {
        delegate.onChannelInfoUpdate?.(info);
      });
    });
  }

  // 删除频道信息
  deleteChannelInfo(channel: WKChannel): void {
    const cacheKey = this.getChannelCacheKey(channel);
    this.channelInfoCache.delete(cacheKey);

    // 通知委托
    this.delegates.forEach(delegate => {
      delegate.onChannelInfoDeleted?.(channel);
    });
  }

  // 清空所有频道信息
  clearAllChannelInfo(): void {
    this.channelInfoCache.clear();
  }

  // 获取所有缓存的频道信息
  getAllCachedChannelInfos(): WKChannelInfo[] {
    return Array.from(this.channelInfoCache.values());
  }

  // 检查频道信息是否存在
  hasChannelInfo(channel: WKChannel): boolean {
    const cacheKey = this.getChannelCacheKey(channel);
    return this.channelInfoCache.has(cacheKey);
  }

  // 刷新频道信息（强制从服务器获取）
  async refreshChannelInfo(channel: WKChannel): Promise<WKChannelInfo | null> {
    const cacheKey = this.getChannelCacheKey(channel);

    // 清除缓存
    this.channelInfoCache.delete(cacheKey);

    // 重新获取
    return await this.getChannelInfo(channel);
  }

  // 预加载频道信息
  async preloadChannelInfos(channels: WKChannel[]): Promise<void> {
    const promises = channels.map(channel => this.getChannelInfo(channel));
    await Promise.all(promises);
  }

  // 搜索频道信息
  searchChannelInfos(keyword: string): WKChannelInfo[] {
    const results: WKChannelInfo[] = [];

    for (const channelInfo of this.channelInfoCache.values()) {
      if (this.matchesKeyword(channelInfo, keyword)) {
        results.push(channelInfo);
      }
    }

    return results;
  }

  private matchesKeyword(channelInfo: WKChannelInfo, keyword: string): boolean {
    const lowerKeyword = keyword.toLowerCase();
    return (
      channelInfo.name.toLowerCase().includes(lowerKeyword) ||
      channelInfo.channelId.toLowerCase().includes(lowerKeyword) ||
      (channelInfo.remark?.toLowerCase().includes(lowerKeyword) ?? false)
    );
  }

  // 根据频道类型获取频道信息列表
  getChannelInfosByType(channelType: number): WKChannelInfo[] {
    const results: WKChannelInfo[] = [];

    for (const channelInfo of this.channelInfoCache.values()) {
      if (channelInfo.channelType === channelType) {
        results.push(channelInfo);
      }
    }

    return results;
  }

  // 添加委托
  addDelegate(delegate: WKChannelManagerDelegate): void {
    this.delegates.add(delegate);
  }

  // 移除委托
  removeDelegate(delegate: WKChannelManagerDelegate): void {
    this.delegates.delete(delegate);
  }

  // 生成频道缓存键
  private getChannelCacheKey(channel: WKChannel): string {
    return `${channel.channelId}_${channel.channelType}`;
  }

  // 生成频道信息缓存键
  private getChannelInfoCacheKey(channelInfo: WKChannelInfo): string {
    return `${channelInfo.channelId}_${channelInfo.channelType}`;
  }

  // 获取缓存统计信息
  getCacheStats(): { total: number; byType: { [key: number]: number } } {
    const stats = {
      total: this.channelInfoCache.size,
      byType: {} as { [key: number]: number }
    };

    for (const channelInfo of this.channelInfoCache.values()) {
      const type = channelInfo.channelType;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    return stats;
  }

  // 清理过期缓存（如果有时间戳信息的话）
  clearExpiredCache(expireTime: number = 24 * 60 * 60 * 1000): void {
    // 这里可以根据实际需求实现过期清理逻辑
    // 目前没有在ChannelInfo中加入时间戳，所以这里是空实现
  }
}