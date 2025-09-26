import { WKSDK, WKChannel, WKTextContent, WKConnectStatus } from '../src/index';

describe('WKSDK', () => {
  let sdk: WKSDK;

  beforeEach(() => {
    // 重置SDK状态
    WKSDK['_instance'] = undefined as any;
    sdk = WKSDK.shared();
  });

  afterEach(() => {
    sdk.reset();
  });

  test('应该创建单例实例', () => {
    const sdk1 = WKSDK.shared();
    const sdk2 = WKSDK.shared();
    expect(sdk1).toBe(sdk2);
  });

  test('应该有正确的版本号', () => {
    expect(sdk.sdkVersion).toBe('1.0.0');
  });

  test('应该能够设置连接URL', () => {
    const testURL = 'ws://localhost:5001?uid=test&token=123';
    sdk.connectURL = testURL;

    expect(sdk.connectURL).toBe(testURL);
    expect(sdk.options.host).toBe('localhost');
    expect(sdk.options.port).toBe(5001);
    expect(sdk.options.connectInfo?.uid).toBe('test');
    expect(sdk.options.connectInfo?.token).toBe('123');
  });

  test('应该能够注册和获取消息内容类型', () => {
    class TestContent extends WKTextContent {
      contentType(): number {
        return 9999;
      }
    }

    sdk.registerMessageContent(TestContent, 9999);
    const ContentClass = sdk.getMessageContent(9999);
    const instance = new ContentClass();

    expect(instance).toBeInstanceOf(TestContent);
    expect(instance.contentType()).toBe(9999);
  });

  test('应该识别系统消息', () => {
    expect(sdk.isSystemMessage(1000)).toBe(true);
    expect(sdk.isSystemMessage(1500)).toBe(true);
    expect(sdk.isSystemMessage(2000)).toBe(true);
    expect(sdk.isSystemMessage(999)).toBe(false);
    expect(sdk.isSystemMessage(2001)).toBe(false);
  });

  test('应该能够创建消息内容实例', () => {
    const textContent = sdk.createMessageContent(1);
    expect(textContent).toBeInstanceOf(WKTextContent);

    const systemContent = sdk.createMessageContent(1000);
    expect(systemContent.contentType()).toBeGreaterThanOrEqual(1000);
  });

  test('应该能够设置离线消息提供者', () => {
    const mockPull = jest.fn();
    const mockAck = jest.fn();

    sdk.setOfflineMessageProvider(mockPull, mockAck);

    expect(sdk.offlineMessagePull).toBe(mockPull);
    expect(sdk.offlineMessageAck).toBe(mockAck);
  });

  test('应该能够验证配置', () => {
    // 无效配置
    const errors = sdk.options.validate();
    expect(errors.length).toBeGreaterThan(0);

    // 设置有效配置
    sdk.options.host = 'localhost';
    sdk.options.port = 5001;
    sdk.options.connectInfo = {
      uid: 'test',
      token: 'test_token'
    };

    const validErrors = sdk.options.validate();
    expect(validErrors.length).toBe(0);
  });

  test('应该能够获取状态信息', () => {
    const status = sdk.getStatus();

    expect(status).toHaveProperty('version');
    expect(status).toHaveProperty('connectStatus');
    expect(status).toHaveProperty('isDebug');
    expect(status).toHaveProperty('registeredContentTypes');
    expect(status).toHaveProperty('cacheStats');

    expect(Array.isArray(status.registeredContentTypes)).toBe(true);
    expect(status.registeredContentTypes.length).toBeGreaterThan(0);
  });

  test('应该能够导出和加载配置', () => {
    sdk.options.host = 'test.com';
    sdk.options.port = 8080;
    sdk.options.isDebug = true;

    const config = sdk.exportConfig();
    expect(config.host).toBe('test.com');
    expect(config.port).toBe(8080);
    expect(config.isDebug).toBe(true);

    // 重置并加载配置
    sdk.reset();
    sdk.loadOptionsFromConfig(config);

    expect(sdk.options.host).toBe('test.com');
    expect(sdk.options.port).toBe(8080);
    expect(sdk.options.isDebug).toBe(true);
  });
});