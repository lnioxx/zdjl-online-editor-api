import axios, { AxiosError } from 'axios'
import { readFileSync } from 'fs'

export const config = {
  baseurl: 'http://120.77.173.114:8080/zdjl/onlineEdit',
  updateUrl: '/setContent',
  fetchUrl: '/getContent',
}

const onlineEditClient = axios.create({ baseURL: config.baseurl })

onlineEditClient.interceptors.response.use(
  function (response) {
    if (response.data && response.data?.suc === false) {
      throw new AxiosError(
        response.data['msg'],
        response.data.suc,
        response.config,
        response.request,
        response
      )
    }

    return response
  }
)

export function codeOf(onlineEditUrl: string) {
  const capture = onlineEditUrl.match(/code=([^&]+)/)
  if (capture) {
    return capture[1]
  } else {
    throw new Error('无法解析 code')
  }
}

// 互斥类型，严格二选一
type Input = { filepath: string, content?: never } | { content: string, filepath?: never }

export interface ResponseSuccessUpdate { suc: true, obj: { lastModified: number, size: number } }
export interface ResponseSuccessFetch { suc: true, obj: { content: string } }
export interface FailureResponse { suc: false, msg: string }

export async function update(code: string, input: Input) {
  // 如果使用 fetch post, 还需要 encodeURIComponent 编码一下 content, 而 axios 会自动完成
  const content = input.content ?? readFileSync(input.filepath).toString()
  return onlineEditClient.post<ResponseSuccessUpdate | FailureResponse>(
    config.updateUrl, { code, content }, { headers: { 'content-type': 'application/x-www-form-urlencoded' } }
  )
}

export async function fetch(code: string) {
  return onlineEditClient.get<ResponseSuccessFetch | FailureResponse>(
    config.fetchUrl, { params: { code } }
  )
}

export default {
  codeOf,
  update,
  fetch,
  config,
}






