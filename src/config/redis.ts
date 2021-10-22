const MOD = 'Mod'
const APP = '@4a/wechat'
const COL = 'qrcodes'
const QRCODE = 'qrcode'
const AccessToken = 'accessToken'


// 闲置二维码集合Key
export const freeKey = getCol('free')

// 作业中二维码集合Key
export const loadingKey = getCol('loading')

// 二维码集合请求标记Key
export const cleanKey = getCol('cleanKey')

// 二维码元数据存储Hash
export const hashKey = getCol('hash')


// 微信带参二维码缓存Key
export const qrcodeKeyFactory = (scene_id: string) => getKey(MOD, APP, QRCODE, scene_id)

// 微信公众号accessToken缓存Key
export const accessTokenKeyFactory = (appId: string) => getKey(MOD, APP, AccessToken, appId)

function getKey(...args: string[]) {
    return args.join(':')
}

function getCol(name: string) {
    return getKey(MOD, APP, COL, name)
}
