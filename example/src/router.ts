import index from './controller/HomeController'
import * as Router from 'koa-router'

const router = new Router()
const routes = [
    {
        path: '/',
        method: 'get',
        action: index.hello,
    },
    {
        path: '/wechat',
        method: 'all',
        action: index.wechat,
    },
    {
        path: '/qrcode',
        method: 'get',
        action: index.qrcode,
    },
    {
        path: '/closeQrcode',
        method: 'get',
        action: index.closeQrcode,
    },
]

routes.forEach(route => router[route.method](route.path, route.action))
export default router
