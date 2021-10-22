关注微信公众号并自动登录
---

* 关注微信号自动登录
* Redis缓存策略循环利用未过期二维码，突破每日10万限制


### Redis Keys
```sh
# 微信公众号access_token Key
app:wechat:accessToken:{AppId}

    example:
        app:wechat:accessToken:wx1234


# 闲置二维码集合Key
app:wechat:qrcodes:free

# 作业中二维码集合Key
app:wechat:qrcodes:loading

# 二维码集合过期时间Key
app:wechat:qrcodes:cleanKey

# 单个二维码数据存储
app:wechat:qrcode:{scene_id}

    example:
        app:wechat:qrcode:c298e9b6632

```
