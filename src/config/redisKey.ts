
// 闲置二维码集合Key
export const freeKey = 'app:wechat:qrcodes:free'

// 作业中二维码集合Key
export const loadingKey = 'app:wechat:qrcodes:loading'

// 二维码集合请求标记Key
export const cleanKey = 'app:wechat:qrcodes:cleanKey'



// 微信带参二维码缓存Key
export const qrcodeKeyFactory = (scene_id: string) => {
    return `app:wechat:qrcode:${scene_id}`
}

// 微信公众号accessToken缓存Key
export const accessTokenKeyFactory = (appId: string) => {
    return `app:wechat:accessToken:${appId}`
}
