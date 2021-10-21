import asp from '@4a/asp'
import axios, { AxiosRequestConfig } from 'axios'

export async function get(url: string, options?: AxiosRequestConfig<any>): Promise<any> {
    return axios.get(url, options).then(response => response.data)
}

export async function post(url: string, data?: any, options?: AxiosRequestConfig<any>): Promise<any> {
    return axios.post(url, data, options).then(response => response.data)
}

export async function http<T = any>(options: AxiosRequestConfig) {
    return axios(options).then(response => response.data) as Promise<T>
}


export async function wechatRequest<T = any>(options: AxiosRequestConfig) {
    return axios(options)
        .then(response => response.data)
        .then((data: any) => {
            if (data.errcode) {
                asp.error('GetWechatAPIError:', data, '\noptions:', options)
                throw new Error(`GetWechatAPIError: ${data.errcode} ${data.errmsg}`)
            }
            return data
        }) as Promise<T>
}

export async function wechatGet<T = any>(url: string, options: AxiosRequestConfig<any> = {}) {
    return wechatRequest<T>({ method: 'GET', url, ...options })
}

export async function wechatPost<T = any>(url: string, data?: any, options: AxiosRequestConfig<any> = {}) {
    return wechatRequest<T>({ method: 'POST', url, data, ...options })
}

export default http
