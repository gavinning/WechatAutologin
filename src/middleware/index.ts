import * as Koa from 'koa'
import * as logger from 'koa-logger'
import * as bodyParser from 'koa-bodyparser'
import bodyParserConfig from '@/config/bodyParser'
import router from '@/router'
import onerror from './onerror'

const app = new Koa()

app.use(onerror())
app.use(logger())
app.use(bodyParser(bodyParserConfig))
app.use(router.routes())
app.use(router.allowedMethods())

export default app
