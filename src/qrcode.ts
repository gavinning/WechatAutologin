import asp from '@4a/asp'
import { date } from '@4a/helper'
import { Redis } from 'ioredis'
import { WechatService } from './wechat'
import { wechatApi, BaseOptions, QrcodePayload } from './config'
import * as RedisKey from './config/redis'


// 缓存管理Wechat参数二维码
// 防止超过每日次数上限=10万次
export class QrcodeService {
    private readonly opt: BaseOptions
    private readonly redis: Redis
    private readonly wechat: WechatService
    private readonly cleanTimeout: number
    private readonly freeKey = RedisKey.freeKey
    private readonly loadingKey = RedisKey.loadingKey
    private readonly cleanKey = RedisKey.cleanKey
    private readonly hashKey = RedisKey.hashKey
    private readonly DEBUG = false // 仅用于QPS测试，测试完成及时重置为：false

    constructor(opt: BaseOptions) {
        this.opt = opt
        this.redis = opt.redis
        this.wechat = new WechatService(this.opt)
        this.cleanTimeout = this.getCleanTimeout(opt.qrcodeTimeout!)
    }

    /**
     * 获取闲置二维码
     * 1.优先从Free集合中查找闲置二维码
     * 2.当没有闲置二维码时，从微信生成二维码并缓存到Loading集合
     */
    async getFree() {
        await this.assertClean()
        const qrcode = (await this.getQrcodeFromRedis()) || (await this.getQrcodeFromWechat())
        this.DEBUG === false || await this.incrQrcode(qrcode)
        return this.decodeQrcode(qrcode)
    }

    /**
     * 关闭二维码作业状态，二维码回归闲置集合
     */
    async close(scene_id: string) {
        try {
            const qrcode = await this.wechat.getQrcodeFromRedis(scene_id)
            if (qrcode) {
                this.closeByQrcodeString(this.encodeQrcode(qrcode))
            }
            return true
        }
        catch(err) {
            asp.warn('CloseQrcodeWorking:', err instanceof Error ? err.message : err)
            return false
        }
    }

    // 从缓存中查询二维码
    private async getQrcodeFromRedis(): Promise<string | void> {
        const qrcode = await this.redis.spop(this.freeKey)
        if (qrcode) {
            await this.appendToLoading(qrcode)
            return qrcode
        }
    }

    /**
     * 当Free集合为空时从数据源请求二维码
     */
    private async getQrcodeFromWechat() {
        const qrcode = await this.wechat.getQrcode()
        this.opt.debug && asp.debug('getQrcodeFromWechat:', qrcode)
        const qrcodeString = this.encodeQrcode(qrcode)
        await this.appendToLoading(qrcodeString)
        return qrcodeString
    }

    /**
     * 关闭二维码作业状态，二维码回归闲置集合
     */
    private async closeByQrcodeString(qrcode: string) {
        await this.moveLoading2Free(qrcode)
    }

    /**
     * 把指定二维码从Loading集合移动到Free集合
     */
    private async moveLoading2Free(qrcode: string) {
        await this.redis.smove(this.loadingKey, this.freeKey, qrcode)
    }

    /**
     * 把指定二维码添加到Loading集合
     */
    private async appendToLoading(qrcode: string) {
        await this.redis.sadd(this.loadingKey, qrcode)
    }

    // 仅用于测试并发场景下闲置二维码是否会冲突使用
    private async incrQrcode(qrcode: string) {
        const times = await this.redis.incr(qrcode)
        asp.warn(qrcode, '--------------------times', times)
    }

    /**
     * 检查是否需要清理二维码集合
     * 建议：二维码有效期默认20天，二维码集合缓存10天重置一次
     */
    private async assertClean() {
        if (await this.hasKey(this.cleanKey)) {
            return
        }
        // Clean
        await this.redis.del(this.freeKey)
        await this.redis.del(this.loadingKey)
        await this.redis.del(this.hashKey)
        // Reset
        await this.redis.incr(this.cleanKey)
        await this.redis.expire(this.cleanKey, this.cleanTimeout)
    }

    private async hasKey(setKey: string) {
        return (await this.redis.exists(setKey)) === 1
    }

    private encodeQrcode(qrcode: QrcodePayload) {
        return [qrcode.scene_id, qrcode.ticket].join('_')
    }

    private decodeQrcode(qrcode: string) {
        const [scene_id] = qrcode.split('_')
        return { scene_id, url: wechatApi.getQrcodeURL(qrcode.slice(scene_id.length + 1)) }
    }

    private getCleanTimeout(qrcodeTimeout: number) {
        return qrcodeTimeout / 2 + date.endToday(30 * 60)
    }
}
