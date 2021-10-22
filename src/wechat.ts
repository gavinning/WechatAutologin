import asp from '@4a/asp'
import { uid } from 'uid'
import { request } from './helper/http'
import { Redis } from 'ioredis'
import { Rmdb, Factory } from 'rmdb'
import { wechatApi, Options, QrcodePayload, CreateQrcodePayload, AccessTokenPayload } from './config'
import * as RedisKey from './config/redis'

export class WechatService {
    private readonly opt: Options
    private readonly RMDB: Rmdb
    private readonly redis: Redis
    private readonly DEBUG = false // 仅用于QPS测试，测试完成及时重置为：false

    constructor(opt: Options) {
        this.opt = opt
        this.redis = opt.redis
        this.RMDB = Factory(opt.redis)
    }

    /**
     * 获取微信公众号AccessToken  
     * 优先从缓存获取，缓存失效则从微信获取，推荐使用此方法
     */
    getAccessToken(): Promise<AccessTokenPayload> {
        const key = RedisKey.accessTokenKeyFactory(this.opt.appId)
        return this.RMDB.src(key)
            .keep(this.opt.accessTokenTimeout!, this.opt.accessTokenTimeout)
            .from(this.getAccessTokenFromWechat.bind(this))
            .get()
    }

    /**
     * 获取微信公众号带参二维码，并缓存
     * @param scene_id 场景id，可选，不填则创建新的二维码
     */
    async getQrcode(): Promise<QrcodePayload> {
        const scene_id = this.generateSceneId()
        const qrcode = await this.createQrcodeFromWechat(scene_id)
        // 存入RedisHash中
        await this.redis.hset(RedisKey.hashKey, scene_id, JSON.stringify(qrcode))
        return qrcode
    }

    /**
     * 从缓存中查询微信公众号带参二维码
     * @param scene_id 场景id，Redis缓存key必须
     */
    async getQrcodeFromRedis(scene_id: string): Promise<QrcodePayload | void> {
        const qrcode = await this.redis.hget(RedisKey.hashKey, scene_id)
        if (qrcode) {
            try {
                return JSON.parse(qrcode)
            } catch (err) {}
        }
    }

    generateSceneId() {
        return uid()
    }

    /**
     * 从微信获取微信公众号AccessToken，不经过缓存，不处理缓存
     */
    async getAccessTokenFromWechat(): Promise<AccessTokenPayload> {
        this.opt.debug && asp.debug('Called getAccessTokenFromWechat')
        return request.get(wechatApi.accessToken(this.opt.appId, this.opt.appSecret))
    }

    /**
     * 从微信创建带参二维码，不经过缓存，不处理缓存
     * @param scene_id 二维码参数：场景id，
     */
    async createQrcodeFromWechat(scene_id: string): Promise<QrcodePayload> {
        this.opt.debug && asp.debug('Called createQrcodeFromWechat')
        const { access_token } = await this.getAccessToken()
        const qrcode = await this.createQrcodeWithDebug(access_token, scene_id)
        const expired_at = this.expiredAt(qrcode.expire_seconds)
        return { scene_id, expired_at, ...qrcode }
    }

    private async createQrcodeWithDebug(access_token: string, scene_id: string) {
        return this.DEBUG
            ? { ticket: 'test', expire_seconds: 1000, url: 'test' }
            : request<CreateQrcodePayload>(wechatApi.createQrcode(access_token, scene_id))
    }

    /**
     * 计算过期时间点
     * @param expireTime 有效时长，单位秒
     * @param offset 向前偏移，防止卡点过期，单位秒，默认1小时
     * @returns 到期时间戳
     */
    private expiredAt(expireTime: number, offset: number = 3600) {
        return Math.floor(Date.now() / 1000) + expireTime - offset
    }
}
