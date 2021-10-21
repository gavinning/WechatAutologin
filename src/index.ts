import asp from '@4a/asp'
import env from '@/helper/env'
import app from './middleware'
import { PORT } from './config'

app.listen(PORT)
asp.debug('App start on', PORT, env.env, env.isDev)
