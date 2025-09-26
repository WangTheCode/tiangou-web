// Jest 测试环境设置文件

// 设置测试超时时间
jest.setTimeout(10000);

// 模拟 WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  readyState: 1, // OPEN
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
}));

// 抑制 console 输出（可选）
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}

// 全局测试工具函数
global.createMockChannel = (channelId: string = 'test', channelType: number = 1) => ({
  channelId,
  channelType,
  equals: jest.fn(),
  toMap: jest.fn(() => ({ channelId, channelType })),
  toString: jest.fn(() => `Channel(${channelId}, ${channelType})`),
});

global.createMockMessage = (overrides: any = {}) => ({
  header: { showUnread: false, noPersist: false, syncOnce: false },
  clientSeq: Math.floor(Math.random() * 10000),
  clientMsgNo: `test_${Date.now()}`,
  messageId: 0,
  messageSeq: 0,
  orderSeq: 0,
  timestamp: Math.floor(Date.now() / 1000),
  localTimestamp: Date.now(),
  fromUid: 'test_user',
  channel: global.createMockChannel(),
  contentType: 1,
  status: 0,
  voiceReaded: false,
  extra: {},
  isDeleted: false,
  ...overrides,
});

// 测试前后的清理
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.resetModules();
});