import asp from '@4a/asp'
import { ok } from 'assert'
import { Context } from 'koa'
import HomeService from '@/service/home'
import { wechat } from '@/service/wechat'

class HomeController {
    private service = new HomeService()

    hello = async (ctx: Context) => {
        ctx.body = await this.service.hello()
    }

    qrcode = async (ctx: Context) => {
        ctx.body = await wechat.getFreeWechatQrcode()
    }

    closeQrcode = async (ctx: Context) => {
        const scene_id = ctx.query.scene_id as string
        ok(scene_id, 'loss scene_id')
        wechat.closeQrcodeWorking(scene_id)
        ctx.body = { code: 0, message: 'ok' }
    }

    wechat = async (ctx: Context) => {
        asp.debug(`Wechat Method: ${ctx.method}`)
        asp.debug('params:', ctx.query)
        asp.debug('body-----:', ctx.request.body)
        asp.debug('rawBody-----:', ctx.request.rawBody)
        ctx.body = await wechat.wechatRequestHandler(ctx)
    }
}

export default new HomeController()
