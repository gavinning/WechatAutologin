import asp from '@4a/asp'
import axios, { AxiosRequestConfig } from 'axios'


export async function get<T = any>(url: string, options: AxiosRequestConfig<any> = {}) {
    return request<T>({ method: 'GET', url, ...options })
}

export async function post<T = any>(url: string, data?: any, options: AxiosRequestConfig<any> = {}) {
    return request<T>({ method: 'POST', url, data, ...options })
}

export async function request<T = any>(options: AxiosRequestConfig) {
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

request.get = get
request.post = post

export default request
