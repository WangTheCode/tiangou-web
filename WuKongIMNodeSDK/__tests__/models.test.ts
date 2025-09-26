import {
  WKChannel,
  WKMessage,
  WKTextContent,
  WKImageContent,
  WKVoiceContent,
  WKSystemContent,
  WKCMDContent,
  WKUnknownContent
} from '../src/index';

describe('WKChannel', () => {
  test('应该能够创建个人频道', () => {
    const channel = WKChannel.personWithChannelID('user123');
    expect(channel.channelId).toBe('user123');
    expect(channel.channelType).toBe(1);
  });

  test('应该能够创建群组频道', () => {
    const channel = WKChannel.groupWithChannelID('group123');
    expect(channel.channelId).toBe('group123');
    expect(channel.channelType).toBe(2);
  });

  test('应该能够转换为Map和从Map创建', () => {
    const channel = new WKChannel('test', 1);
    const map = channel.toMap();

    expect(map.channelId).toBe('test');
    expect(map.channelType).toBe(1);

    const newChannel = WKChannel.fromMap(map);
    expect(newChannel.channelId).toBe(channel.channelId);
    expect(newChannel.channelType).toBe(channel.channelType);
  });

  test('应该能够比较频道', () => {
    const channel1 = new WKChannel('test', 1);
    const channel2 = new WKChannel('test', 1);
    const channel3 = new WKChannel('test', 2);

    expect(channel1.equals(channel2)).toBe(true);
    expect(channel1.equals(channel3)).toBe(false);
  });
});

describe('WKMessage', () => {
  test('应该能够创建消息', () => {
    const message = new WKMessage();
    expect(message.header).toBeDefined();
    expect(message.localTimestamp).toBeGreaterThan(0);
    expect(message.extra).toEqual({});
  });

  test('应该能够生成客户端消息编号', () => {
    const msgNo1 = WKMessage.generateClientMsgNo();
    const msgNo2 = WKMessage.generateClientMsgNo();

    expect(msgNo1).not.toBe(msgNo2);
    expect(msgNo1.length).toBeGreaterThan(0);
  });

  test('应该能够生成客户端序列号', () => {
    const seq1 = WKMessage.generateClientSeq();
    const seq2 = WKMessage.generateClientSeq();

    expect(seq1).not.toBe(seq2);
    expect(seq1).toBeGreaterThanOrEqual(0);
    expect(seq1).toBeLessThanOrEqual(4294967295);
  });
});

describe('WKMessageContent', () => {
  describe('WKTextContent', () => {
    test('应该正确编码和解码', () => {
      const content = new WKTextContent('Hello World');
      const encoded = content.encode();

      const newContent = new WKTextContent();
      newContent.decode(encoded);

      expect(newContent.text).toBe('Hello World');
      expect(newContent.digest()).toBe('Hello World');
      expect(newContent.contentType()).toBe(1);
    });

    test('应该处理空文本', () => {
      const content = new WKTextContent('');
      expect(content.text).toBe('');
      expect(content.digest()).toBe('');
    });
  });

  describe('WKImageContent', () => {
    test('应该正确编码和解码', () => {
      const content = new WKImageContent('https://example.com/image.jpg');
      content.width = 800;
      content.height = 600;
      content.size = 102400;

      const encoded = content.encode();
      const newContent = new WKImageContent();
      newContent.decode(encoded);

      expect(newContent.url).toBe('https://example.com/image.jpg');
      expect(newContent.width).toBe(800);
      expect(newContent.height).toBe(600);
      expect(newContent.size).toBe(102400);
      expect(newContent.contentType()).toBe(2);
      expect(newContent.digest()).toBe('[图片]');
    });
  });

  describe('WKVoiceContent', () => {
    test('应该正确编码和解码', () => {
      const content = new WKVoiceContent('https://example.com/voice.mp3', 30);
      content.size = 51200;
      content.waveform = [1, 2, 3, 4, 5];

      const encoded = content.encode();
      const newContent = new WKVoiceContent();
      newContent.decode(encoded);

      expect(newContent.url).toBe('https://example.com/voice.mp3');
      expect(newContent.duration).toBe(30);
      expect(newContent.size).toBe(51200);
      expect(newContent.waveform).toEqual([1, 2, 3, 4, 5]);
      expect(newContent.contentType()).toBe(3);
      expect(newContent.digest()).toBe('[语音] 30"');
    });
  });

  describe('WKSystemContent', () => {
    test('应该正确编码和解码', () => {
      const content = new WKSystemContent('系统通知');
      content.data = { type: 'notification', level: 'info' };

      const encoded = content.encode();
      const newContent = new WKSystemContent();
      newContent.decode(encoded);

      expect(newContent.content).toBe('系统通知');
      expect(newContent.data).toEqual({ type: 'notification', level: 'info' });
      expect(newContent.contentType()).toBe(1000);
      expect(newContent.digest()).toBe('系统通知');
    });
  });

  describe('WKCMDContent', () => {
    test('应该正确编码和解码', () => {
      const content = new WKCMDContent('user_online', { userId: '123', timestamp: 1234567890 });

      const encoded = content.encode();
      const newContent = new WKCMDContent();
      newContent.decode(encoded);

      expect(newContent.cmd).toBe('user_online');
      expect(newContent.param).toEqual({ userId: '123', timestamp: 1234567890 });
      expect(newContent.contentType()).toBe(99);
      expect(newContent.digest()).toBe('[命令]');
    });
  });

  describe('WKUnknownContent', () => {
    test('应该处理未知内容', () => {
      const content = new WKUnknownContent('unknown data');

      const encoded = content.encode();
      const newContent = new WKUnknownContent();
      newContent.decode(encoded);

      expect(newContent.data).toBe('unknown data');
      expect(newContent.contentType()).toBe(0);
      expect(newContent.digest()).toBe('[未知消息]');
    });
  });
});