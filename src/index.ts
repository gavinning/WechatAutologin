import asp from '@4a/asp'
import { Context } from 'koa'
import { Options, defaultOptions } from './config'
import { QrcodeService } from './qrcode'
import { WechatService } from './wechat'
import { WeChat, ApiConfigKit, ApiConfig } from 'tnwx'

export * from 'tnwx'
export * from './config'
export * from './config/redis'

export class Wechat {
    private readonly opt: Options
    qrcode: QrcodeService
    wechat: WechatService

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
     * 获取闲置微信公众号带参二维码
     */
    getFreeWechatQrcode() {
        return this.qrcode.getFree()
    }

    /**
     * 清零二维码作业状态，重置为闲置状态
     */
    closeQrcodeWorking(scene_id: string) {
        this.qrcode.close(scene_id)
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
        return WeChat.handleMsg(this.opt.msgAdapter, ctx.request.rawBody, signature, timestamp, nonce)
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

export default WeChat
