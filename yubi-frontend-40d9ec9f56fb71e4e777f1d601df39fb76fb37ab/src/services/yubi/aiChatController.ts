// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** aiChat POST /api/ai/chat */
export async function aiChatUsingPOST(body: API.AiChatRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseString_>('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** clearChatMemory POST /api/ai/chat/clear */
export async function clearChatMemoryUsingPOST(options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean_>('/api/ai/chat/clear', {
    method: 'POST',
    ...(options || {}),
  });
}
