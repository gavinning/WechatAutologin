import asp from '@4a/asp'
import { Context, Next } from 'koa'

export default () => {
    return async (ctx: Context, next: Next) => {
        try {
            await next()
        } catch (err) {
            asp.error('RequestError:', err)
            ctx.status = 403
            ctx.body = {
                code: -1,
                message: err.message,
            }
        }
    }
}
