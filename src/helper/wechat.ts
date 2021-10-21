import asp from '@4a/asp'
import RMDB from '@/helper/rmdb'
import { uid } from 'uid'
import { AppId } from '@/config'
import { wechatGet, wechatRequest } from '@/helper/http'
import {
    wechatApi,
    QrcodePayload,
    CreateQrcodePayload,
    AccessTokenPayload,
    qrcodeTimeout,
    accessTokenTimeout,
} from '@/config/wechat'
import redis from './redis'
import * as RedisKey from '@/config/redisKey'

class Wechat {
    /**
     * 获取微信公众号AccessToken
     */
    getAccessToken(): Promise<AccessTokenPayload> {
        const key = RedisKey.accessTokenKeyFactory(AppId)
        return RMDB.src(key).keep(accessTokenTimeout, accessTokenTimeout).from(this.getAccessTokenFromWechat).get()
    }

    /**
     * 获取微信公众号带参二维码
     * @param scene_id 场景id，可选，不填则创建新的二维码
     */
    async getQrcode(): Promise<QrcodePayload> {
        const scene_id = this.generateSceneId()
        const key = RedisKey.qrcodeKeyFactory(scene_id)
        const qrcode = await this.createQrcodeFromWechat(scene_id)
        await redis.set(key, JSON.stringify(qrcode), 'EX', qrcodeTimeout)
        return qrcode
    }

    /**
     * 从缓存中查询微信公众号带参二维码
     * @param scene_id 场景id，Redis缓存key必须
     */
    async getQrcodeFromRedis(scene_id: string): Promise<QrcodePayload | void> {
        const qrcode = await redis.get(RedisKey.qrcodeKeyFactory(scene_id))
        if (qrcode) {
            try {
                return JSON.parse(qrcode)
            } catch (err) {}
        }
    }

    private generateSceneId() {
        return uid()
    }

    private async getAccessTokenFromWechat() {
        asp.debug('Called getAccessTokenFromWechat')
        return wechatGet(wechatApi.accessToken())
    }

    private async createQrcodeFromWechat(scene_id: string): Promise<QrcodePayload> {
        asp.debug('Called createQrcodeFromWechat')
        const { access_token } = await this.getAccessToken()
        const qrcode = await wechatRequest<CreateQrcodePayload>(wechatApi.createQrcode(access_token, scene_id))
        return { scene_id, ...qrcode }
    }
}

export default new Wechat()
