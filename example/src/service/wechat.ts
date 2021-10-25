import { Wechat } from '@4a/wechat'
import { AppId, AppSecret, AppToken } from '@/config'
import redis from '@/helper/redis'
import WechatAdapter from './WechatAdapter'

export const wechat = new Wechat({
    appId: AppId,
    appSecret: AppSecret,
    appToken: AppToken,
    redis,
    debug: true,
    MsgAdapterFactory: (wechat) => new WechatAdapter(wechat)
})
