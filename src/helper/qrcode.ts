import asp from '@4a/asp'
import date from '@/helper/date'
import redis from '@/helper/redis'
import wechat from '@/helper/wechat'
import * as RedisKey from '@/config/redisKey'
import { wechatApi, QrcodePayload } from '@/config/wechat'

// 缓存管理Wechat参数二维码
// 防止超过每日次数上限=10万次
class Qrcode {
    freeKey = RedisKey.freeKey
    loadingKey = RedisKey.loadingKey
    cleanKey = RedisKey.cleanKey
    cleanTimeout = date.endToday(30 * 60)

    /**
     * 获取闲置二维码
     * 1.优先从Free集合中查找闲置二维码
     * 2.当没有闲置二维码时，从微信生成二维码并缓存到Loading集合
     */
    async getFree() {
        await this.assertClean()
        const qrcode = (await this.getQrcodeFromRedis()) || (await this.getQrcodeFromWechat())
        return this.decodeQrcode(qrcode)
    }

    /**
     * 关闭二维码作业状态，二维码回归闲置集合
     */
    async close(scene_id: string) {
        const qrcode = await wechat.getQrcodeFromRedis(scene_id)
        if (qrcode) {
            this.closeByQrcodeString(this.encodeQrcode(qrcode))
        }
    }

    // 从缓存中查询二维码
    private async getQrcodeFromRedis() {
        const qrcode = await redis.spop(this.freeKey)
        if (qrcode) {
            await this.appendToLoading(qrcode)
            return qrcode
        }
    }

    /**
     * 当Free集合为空时从数据源请求二维码
     */
    private async getQrcodeFromWechat() {
        const qrcode = await wechat.getQrcode()
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
        await redis.smove(this.loadingKey, this.freeKey, qrcode)
    }

    /**
     * 把指定二维码添加到Loading集合
     */
    private async appendToLoading(qrcode: string) {
        await redis.sadd(this.loadingKey, qrcode)
    }

    // 仅用于测试并发场景下闲置二维码是否会冲突使用
    private async incrQrcode(qrcode: string) {
        const times = await redis.incr(qrcode)
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
        await redis.del(this.freeKey)
        await redis.del(this.loadingKey)
        // Reset
        await redis.incr(this.cleanKey)
        await redis.expire(this.cleanKey, this.cleanTimeout)
    }

    private async hasKey(setKey: string) {
        return (await redis.exists(setKey)) === 1
    }

    private encodeQrcode(qrcode: QrcodePayload) {
        return [qrcode.scene_id, qrcode.ticket].join('_')
    }

    private decodeQrcode(qrcode: string) {
        const [scene_id, ticket] = qrcode.split('_')
        return { scene_id, url: wechatApi.getQrcode(ticket) }
    }
}

export default new Qrcode()
