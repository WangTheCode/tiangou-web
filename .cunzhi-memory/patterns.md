# 常用模式和最佳实践

- Electron聊天记录同步方案：采用按页完整性判断策略（方案A-KISS原则），通过message_seq连续性检查判断本地数据是否完整，完整则返回本地，否则请求API并存储。核心算法：检查数量===limit && (max_seq - min_seq + 1 === count)。数据去重使用message_id唯一索引+INSERT OR IGNORE。性能优化：批量插入事务、已有message_seq索引。待实现模块：messageSyncService.js、messageSync.js控制器、sqlitedb.js扩展方法、chat.js前端适配。详细方案已写入README.md第228-500行。
