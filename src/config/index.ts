import * as dotenv from 'dotenv'

dotenv.config()

export const {
    PORT,
    AppId,
    AppSecret,
    AppToken,
    EncodingAesKey
} = process.env
