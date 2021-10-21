import { format } from 'url'
import { AppId, AppSecret } from '@/config'
import { AxiosRequestConfig } from 'axios'


export interface CreateQrcodePayload {
    url: string
    ticket: string
    expire_seconds: number
}

// 缓存在Redis中的qrcode
export interface QrcodePayload extends CreateQrcodePayload {
    scene_id: string
}

export interface AccessTokenPayload {
    access_token: string
    expires_in: number
}

// 微信公众号接口公共参数
export interface WechatPublicParams {
    signature: string
    timestamp: string
    nonce: string
    echostr: string
}

// Redis中AccessToken有效期
export const accessTokenTimeout = 100 * 60 //秒

// Redis中`微信带参二维码`有效期
export const qrcodeTimeout = 1 * 24 * 3600 // 秒


// Access token key in redis
export const ATKey = () => {
    return `app:wechat:accessToken:${AppId}`
}

export const wechatApi = {
    accessToken() {
        return format({
            host: 'https://api.weixin.qq.com/cgi-bin/token',
            query: {
                grant_type: 'client_credential',
                appid: AppId,
                secret: AppSecret,
            },
        })
    },

    getQrcode(ticket: string) {
        return format({
            host: 'https://mp.weixin.qq.com/cgi-bin/showqrcode',
            query: { ticket },
        })
    },

    createQrcode(access_token: string, scene_str: string): AxiosRequestConfig {
        return {
            method: 'POST',
            url: format({
                host: 'https://api.weixin.qq.com/cgi-bin/qrcode/create',
                query: { access_token },
            }),
            data: {
                expire_seconds: qrcodeTimeout,
                action_name: 'QR_STR_SCENE',
                action_info: {
                    scene: { scene_str },
                },
            },
        }
    },
}
