import asp from '@4a/asp'
import { Context } from 'koa'
import { BaseOptions, defaultOptions } from './config'
import { QrcodeService } from './qrcode'
import { WechatService } from './wechat'
import { WeChat, ApiConfigKit, ApiConfig, MsgAdapter } from 'tnwx'

export * from 'tnwx'
export * from './config'
export * from './config/redis'

/**
 * @param MsgAdapterFactory 公众号通用消息处理工厂函数，返回:tnwx.MsgAdapter
 */
export interface Options extends BaseOptions {
    MsgAdapterFactory: (wechat: Wechat) => MsgAdapter
}

export class Wechat {
    private readonly opt: Options
    private readonly qrcode: QrcodeService
    private readonly wechat: WechatService

    constructor(opt: Options) {
        this.opt = this.merge(opt)
        this.qrcode = new QrcodeService(this.opt)
        this.wechat = new WechatService(this.opt)
        this.tnwxInit()
    }

    // 合并初始化参数
    private merge(opt: Options): Options {
        return Object.assign(defaultOptions, opt)
    }

    // tnwx初始化
    private tnwxInit() {
        const apiConfig = this.getAPIConfig()
        ApiConfigKit.devMode = this.opt.debug || false
        ApiConfigKit.putApiConfig(apiConfig)
    }

    /**
     * 微信公众号消息聚合处理，包含认证和通用消息处理
     * 根据请求类型自动调用(authHandler | messageHandler)
     */
    async wechatRequestHandler(ctx: Context) {
        return this.isAuthRequest(ctx) ? this.authHandler(ctx) : this.messageHandler(ctx)
    }

    /**
     * 处理微信公众号认证请求
     */
    authHandler(ctx: Context) {
        const { signature, timestamp, nonce, echostr } = this.getAuthParams(ctx)
        return WeChat.checkSignature(signature, timestamp, nonce, echostr)
    }

    /**
     * 微信公众号消息通用处理，仅处理消息，不处理认证
     */
    async messageHandler(ctx: Context) {
        ctx.set('Content-Type', 'text/xml')
        const { signature, timestamp, nonce } = this.getAuthParams(ctx)
        return WeChat.handleMsg(this.opt.MsgAdapterFactory.bind(this)(this), ctx.request.rawBody, signature, timestamp, nonce)
    }

    /**
     * 获取闲置微信公众号带参二维码
     */
    async getFreeWechatQrcode() {
        return this.qrcode.getFree()
    }

    /**
     * 清零二维码作业状态，重置为闲置状态
     */
    async closeQrcodeWorking(scene_id: string) {
        return this.qrcode.close(scene_id)
    }

    /**
     * 获取微信公众号AccessToken，缓存默认有效期100分钟  
     * 优先从缓存获取，缓存失效则从微信获取，推荐使用此方法  
     */
    async getAccessToken() {
        return this.wechat.getAccessToken()
    }

    /**
     * 注意！请勿频繁调用此方法，微信有调用数量限制  
     * 从微信获取微信公众号AccessToken，不经过缓存，不处理缓存  
     * 除非知道自己在做什么，否则推荐调用`getAccessToken`方法
     */
    async getAccessTokenFromWechat() {
        return this.wechat.getAccessTokenFromWechat()
    }

    /**
     * 从缓存中查询微信公众号带参二维码元数据
     * @param scene_id 场景id，Redis缓存key必须
     */
    async getQrcodeFromRedis(scene_id: string) {
        return this.wechat.getQrcodeFromRedis(scene_id)
    }

    // 检查公众号消息类型
    private isAuthRequest(ctx: Context) {
        return 'GET' === ctx.method.toUpperCase()
    }

    // 创建tnwx配置
    private getAPIConfig() {
        const { appId, appSecret, appToken, safemode, encodingAesKey } = this.opt
        return new ApiConfig(appId, appSecret, appToken, safemode, encodingAesKey)
    }

    // 获取微信公众号请求公共参数
    private getAuthParams(ctx: Context) {
        const params = {
            signature: ctx.query.signature as string,
            timestamp: ctx.query.timestamp as string,
            nonce: ctx.query.nonce as string,
            echostr: ctx.query.echostr as string,
        }
        if (this.opt.debug) {
            asp.debug('WechatPublicParams:', params)
        }
        return params
    }
}

export default Wechat
