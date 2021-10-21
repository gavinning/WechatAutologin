import asp from '@4a/asp'
import { ok } from 'assert'
import { Context } from 'koa'
import HomeService from '@/service/home'
import WechatService from '@/service/wechat'
import qrcode from '@/helper/qrcode'

class HomeController {
    private we = new WechatService()
    private service = new HomeService()

    hello = async (ctx: Context) => {
        ctx.body = await this.service.hello()
    }

    qrcode = async (ctx: Context) => {
        ctx.body = await qrcode.getFree()
    }

    closeQrcode = async (ctx: Context) => {
        const scene_id = ctx.query.scene_id as string
        ok(scene_id, 'loss scene_id')
        qrcode.close(scene_id)
        ctx.body = { code: 0, message: 'ok' }
    }

    wechat = async (ctx: Context) => {
        asp.debug(`Wechat Method: ${ctx.method}`)
        asp.debug('params:', ctx.query)
        asp.debug('body-----:', ctx.request.body)
        asp.debug('rawBody-----:', ctx.request.rawBody)
        ctx.body = await this.we.wechat(ctx)
    }
}

export default new HomeController()
