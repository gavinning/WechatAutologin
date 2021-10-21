import env from '@/helper/env'
import { Context } from 'koa'
import { WeChat, ApiConfigKit, ApiConfig } from 'tnwx'
import { AppId, AppSecret, AppToken, EncodingAesKey } from '@/config'
import WechatAdapter from './WechatAdapter'

export default class WechatService {

    constructor() {
        const apiConfig = this.getAPIConfig()
        ApiConfigKit.devMode = env.isDev
        ApiConfigKit.putApiConfig(apiConfig)
        ApiConfigKit.setCurrentAppId(AppId)
    }

    async wechat(ctx: Context) {
        return this.isAuthRequest(ctx) ? this.auth(ctx) : this.message(ctx)
    }

    auth(ctx: Context) {
        const { signature, timestamp, nonce, echostr } = this.getAuthParams(ctx)
        return WeChat.checkSignature(signature, timestamp, nonce, echostr)
    }

    private isAuthRequest(ctx: Context) {
        return 'GET' === ctx.method.toUpperCase()
    }

    private async message(ctx: Context) {
        ctx.set('Content-Type', 'text/xml')
        const { signature, timestamp, nonce } = this.getAuthParams(ctx)
        return WeChat.handleMsg(new WechatAdapter(), ctx.request.rawBody, signature, timestamp, nonce)
    }

    private getAPIConfig() {
        return env.isDev
            ? new ApiConfig(AppId, AppSecret, AppToken, false)
            : new ApiConfig(AppId, AppSecret, AppToken, false, EncodingAesKey)
    }

    private getAuthParams(ctx: Context) {
        return {
            signature: ctx.query.signature as string,
            timestamp: ctx.query.timestamp as string,
            nonce: ctx.query.nonce as string,
            echostr: ctx.query.echostr as string,
        }
    }
}
