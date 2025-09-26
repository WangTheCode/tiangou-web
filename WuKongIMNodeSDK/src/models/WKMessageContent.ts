export abstract class WKMessageContent {
  public abstract contentType(): number;

  // 编码消息内容为字符串
  public abstract encode(): string;

  // 从字符串解码消息内容
  public abstract decode(content: string): void;

  // 获取消息摘要（用于显示在会话列表）
  public abstract digest(): string;
}

// 文本消息内容
export class WKTextContent extends WKMessageContent {
  public text: string;

  constructor(text: string = '') {
    super();
    this.text = text;
  }

  contentType(): number {
    return 1; // 文本消息类型为1
  }

  encode(): string {
    return JSON.stringify({ text: this.text });
  }

  decode(content: string): void {
    try {
      const data = JSON.parse(content);
      this.text = data.text || '';
    } catch (error) {
      this.text = content; // 如果解析失败，直接使用原内容
    }
  }

  digest(): string {
    return this.text;
  }
}

// 图片消息内容
export class WKImageContent extends WKMessageContent {
  public url: string = '';         // 图片URL
  public localPath?: string;       // 本地路径
  public width: number = 0;        // 宽度
  public height: number = 0;       // 高度
  public size: number = 0;         // 文件大小

  constructor(url?: string) {
    super();
    if (url) {
      this.url = url;
    }
  }

  contentType(): number {
    return 2; // 图片消息类型为2
  }

  encode(): string {
    return JSON.stringify({
      url: this.url,
      localPath: this.localPath,
      width: this.width,
      height: this.height,
      size: this.size,
    });
  }

  decode(content: string): void {
    try {
      const data = JSON.parse(content);
      this.url = data.url || '';
      this.localPath = data.localPath;
      this.width = data.width || 0;
      this.height = data.height || 0;
      this.size = data.size || 0;
    } catch (error) {
      // 解析失败时的默认处理
    }
  }

  digest(): string {
    return '[图片]';
  }
}

// 语音消息内容
export class WKVoiceContent extends WKMessageContent {
  public url: string = '';         // 语音URL
  public localPath?: string;       // 本地路径
  public duration: number = 0;     // 时长（秒）
  public size: number = 0;         // 文件大小
  public waveform?: number[];      // 波形数据

  constructor(url?: string, duration?: number) {
    super();
    if (url) {
      this.url = url;
    }
    if (duration) {
      this.duration = duration;
    }
  }

  contentType(): number {
    return 3; // 语音消息类型为3
  }

  encode(): string {
    return JSON.stringify({
      url: this.url,
      localPath: this.localPath,
      duration: this.duration,
      size: this.size,
      waveform: this.waveform,
    });
  }

  decode(content: string): void {
    try {
      const data = JSON.parse(content);
      this.url = data.url || '';
      this.localPath = data.localPath;
      this.duration = data.duration || 0;
      this.size = data.size || 0;
      this.waveform = data.waveform;
    } catch (error) {
      // 解析失败时的默认处理
    }
  }

  digest(): string {
    return `[语音] ${this.duration}"`;
  }
}

// 系统消息内容
export class WKSystemContent extends WKMessageContent {
  public content: string = '';
  public data?: { [key: string]: any };

  constructor(content?: string) {
    super();
    if (content) {
      this.content = content;
    }
  }

  contentType(): number {
    return 1000; // 系统消息类型起始于1000
  }

  encode(): string {
    return JSON.stringify({
      content: this.content,
      data: this.data,
    });
  }

  decode(content: string): void {
    try {
      const data = JSON.parse(content);
      this.content = data.content || '';
      this.data = data.data;
    } catch (error) {
      this.content = content;
    }
  }

  digest(): string {
    return this.content;
  }
}

// CMD消息内容（命令消息）
export class WKCMDContent extends WKMessageContent {
  public cmd: string = '';
  public param?: { [key: string]: any };

  constructor(cmd?: string, param?: { [key: string]: any }) {
    super();
    if (cmd) {
      this.cmd = cmd;
    }
    if (param) {
      this.param = param;
    }
  }

  contentType(): number {
    return 99; // CMD消息类型为99
  }

  encode(): string {
    return JSON.stringify({
      cmd: this.cmd,
      param: this.param,
    });
  }

  decode(content: string): void {
    try {
      const data = JSON.parse(content);
      this.cmd = data.cmd || '';
      this.param = data.param;
    } catch (error) {
      // 解析失败时的默认处理
    }
  }

  digest(): string {
    return `[命令]`;
  }
}

// 未知消息内容
export class WKUnknownContent extends WKMessageContent {
  public data: string = '';

  constructor(data?: string) {
    super();
    if (data) {
      this.data = data;
    }
  }

  contentType(): number {
    return 0; // 未知消息类型为0
  }

  encode(): string {
    return this.data;
  }

  decode(content: string): void {
    this.data = content;
  }

  digest(): string {
    return '[未知消息]';
  }
}