# 微信公众号关注并自动登录

* 生成微信公众号带参二维码
* 二维码自动缓存复用，突破每日10万限制
* 支持公众号其他通用消息处理

### 安装使用
```sh
npm i @4a/wechat
yarn add @4a/wechat
```
```ts
import Wechat from '@4a/wechat'
// Or
import { Wechat } from '@4a/wechat'

export new Wechat(opt: Options)
```
初始化参数 **Options**
```ts
/**
 * 初始化参数
 * @param appId 公众号appid
 * @param appSecret 公众号secret
 * @param appToken 公众号token
 * @param safemode 安全模式，默认为false，建议为false
 * @param encodingAesKey 安全模式下加密信息
 * @param debug debug模式会打印一些调试信息
 * @param redis ioredis实例
 * @param qrcodeTimeout 二维码有效期，默认22天，涉及到二维码复用缓存策略，如非必要不建议调整
 * @param accessTokenTimeout 公众号token缓存时间，默认100分钟
 * @param MsgAdapterFactory 公众号通用消息处理工厂函数，返回:tnwx.MsgAdapter
 */
export interface Options {
    appId: string;
    appSecret: string;
    appToken: string;
    msgAdapter: MsgAdapter;
    safemode?: boolean;
    encodingAesKey?: string;
    debug?: boolean;
    redis: Redis;
    qrcodeTimeout?: number;
    accessTokenTimeout?: number;
    MsgAdapterFactory: (wechat: Wechat) => MsgAdapter;
}
```
方法集合 **Methods**
```ts
export declare class Wechat {
    /**
     * 微信公众号消息聚合处理，包含认证和通用消息处理
     * 根据请求类型自动调用(authHandler | messageHandler)
     */
    wechatRequestHandler(ctx: Context): Promise<string>;
    /**
     * 处理微信公众号认证请求
     */
    authHandler(ctx: Context): string;
    /**
     * 微信公众号消息通用处理，仅处理消息，不处理认证
     */
    messageHandler(ctx: Context): Promise<string>;
    /**
     * 获取闲置微信公众号带参二维码
     */
    getFreeWechatQrcode(): Promise<{ scene_id: string; url: string; }>;
    /**
     * 清零二维码作业状态，重置为闲置状态
     */
    closeQrcodeWorking(scene_id: string): void;
    /**
     * 获取微信公众号AccessToken，缓存默认有效期100分钟
     * 优先从缓存获取，缓存失效则从微信获取，推荐使用此方法
     */
    getAccessToken(): Promise<import("./config").AccessTokenPayload>;
    /**
     * 注意！请勿频繁调用此方法，微信有调用数量限制
     * 从微信获取微信公众号AccessToken，不经过缓存，不处理缓存
     * 除非知道自己在做什么，否则推荐调用`getAccessToken`方法
     */
    getAccessTokenFromWechat(): Promise<import("./config").AccessTokenPayload>;
    /**
     * 从缓存中查询微信公众号带参二维码元数据
     * @param scene_id 场景id，Redis缓存key必须
     */
    getQrcodeFromRedis(scene_id: string): Promise<void | import("./config").QrcodePayload>;
}
```

### 缓存策略
* `Redis`内有两个二维码集合，一个Hash
    * `Free`集合：用于存放闲置二维码
    * `Loading`集合：用于存放作业二维码
    * `Hash`：用于存放二维码元数据
* 当前端请求二维码时，使用`SPOP`命令从`Free`集合中取出一个闲置二维码
    1. 当前端调用`closeQrcode`接口时，**作业二维码清零**
    2. 当检查到二维码完成当前作业时，**作业二维码清零**
* 每次请求二维码时检查集合过期时间，集合过期时间是二维码过期时间的一半 + 截止到当天晚上23点30分
* 如果集合过期，则清理所有集合和Hash，重建缓存逻辑（防止二维码大量过期导致前端服务异常）
<br />
<br />

> **作业二维码清零，重置为闲置二维码：**  
> 使用`SMOVE`命令把目标二维码从`Loading`集合移动到`Free`集合，完成清零操作

<br />

### 占用的 Redis Keys
```sh
# 微信公众号access_token Key
Mod:@4a/wechat:accessToken:{AppId}

    example:
        Mod:@4a/wechat:accessToken:wx1234


# 闲置二维码集合Key @Set
Mod:@4a/wechat:qrcodes:free

# 作业中二维码集合Key @Set
Mod:@4a/wechat:qrcodes:loading

# 二维码集合过期时间Key @String
Mod:@4a/wechat:qrcodes:cleanKey

# 二维码元数据存储 @Hash
Mod:@4a/wechat:qrcodes:hash

    Key: SceneId
    example: HGET Mod:@4a/wechat:qrcodes:hash {SceneId}

```

### 鸣谢
感谢开源优秀作品[`tnwx`](https://gitee.com/javen205/TNWX)提供支持
