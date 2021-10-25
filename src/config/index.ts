import { format } from 'url'
import { Redis } from 'ioredis'
import { AxiosRequestConfig } from 'axios'


// 初始化默认值
export const defaultOptions = {
    debug: false,
    safemode: false,
    qrcodeTimeout: 22 * 24 * 3600,  // 秒：22天
    accessTokenTimeout: 100 * 60,   // 秒：100分钟
}

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
 */
export interface BaseOptions {
    appId: string
    appSecret: string
    appToken: string
    safemode?: boolean
    encodingAesKey?: string
    debug?: boolean
    redis: Redis
    qrcodeTimeout?: number
    accessTokenTimeout?: number
}

/**
 * 微信带参二维码响应
 */
export interface CreateQrcodePayload {
    url: string
    ticket: string
    expire_seconds: number
}

/**
 * 缓存在Redis中的Qrcode信息
 */
export interface QrcodePayload extends CreateQrcodePayload {
    scene_id: string
    expired_at: number
}

/**
 * 微信AccessToken响应
 */
export interface AccessTokenPayload {
    access_token: string
    expires_in: number
}

/**
 * 微信公众号接口公共参数
 */
export interface WechatPublicParams {
    signature: string
    timestamp: string
    nonce: string
    echostr: string
}

// 部分微信接口
export const wechatApi = {
    accessToken(appid: string, secret: string) {
        return format({
            host: 'https://api.weixin.qq.com/cgi-bin/token',
            query: {
                grant_type: 'client_credential',
                appid,
                secret,
            },
        })
    },

    getQrcodeURL(ticket: string) {
        return format({
            host: 'https://mp.weixin.qq.com/cgi-bin/showqrcode',
            query: { ticket },
        })
    },

    createQrcode(access_token: string, scene_str: string, timeout?: number): AxiosRequestConfig {
        return {
            method: 'POST',
            url: format({
                host: 'https://api.weixin.qq.com/cgi-bin/qrcode/create',
                query: { access_token },
            }),
            data: {
                expire_seconds: timeout || defaultOptions.qrcodeTimeout,
                action_name: 'QR_STR_SCENE',
                action_info: {
                    scene: { scene_str },
                },
            },
        }
    },
}
