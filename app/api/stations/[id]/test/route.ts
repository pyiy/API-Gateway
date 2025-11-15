import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { getSession } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, message: '未授权' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const { models, question, stream, timeout, concurrency } = await request.json()

    const db = getDB()
    const [stations] = await db.execute(
      'SELECT * FROM api_stations WHERE id = ? AND user_id = ?',
      [id, session.userId]
    ) as any[]

    if (stations.length === 0) {
      return NextResponse.json(
        { success: false, message: 'API站点不存在' },
        { status: 404 }
      )
    }

    const station = stations[0]
    const chatUrl = `${station.base_url}${station.chat_endpoint}`

    // Test models in batches
    const results: any[] = []
    const batchSize = concurrency || station.default_concurrency

    for (let i = 0; i < models.length; i += batchSize) {
      const batch = models.slice(i, i + batchSize)
      const promises = batch.map(async (model: string) => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), (timeout || station.default_timeout) * 1000)

          const isStream = stream !== undefined ? stream : station.default_stream

          const response = await fetch(chatUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${station.api_key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'user',
                  content: question || station.default_test_question,
                }
              ],
              stream: isStream,
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            return {
              model,
              success: false,
              message: `HTTP ${response.status}`,
            }
          }

          if (isStream) {
            let content = ''
            let reasoningContent = ''
            
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
              throw new Error('No response body')
            }

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              const lines = chunk.split('\n').filter(line => line.trim() !== '')

              for (const line of lines) {
                if (line === 'data: [DONE]') {
                  break
                }

                if (line.startsWith('data: ')) {
                  try {
                    const jsonData = JSON.parse(line.slice(6))
                    const delta = jsonData.choices?.[0]?.delta
                    
                    if (delta?.content) {
                      content += delta.content
                    }
                    if (delta?.reasoning_content) {
                      reasoningContent += delta.reasoning_content
                    }
                  } catch (e) {
                    // Skip invalid JSON chunks
                  }
                }
              }
            }

            return {
              model,
              success: true,
              content: content || reasoningContent || '(空响应)',
              streaming: true,
            }
          } else {
            // Non-streaming response
            const data = await response.json()
            const message = data.choices?.[0]?.message
            const content = message?.content || message?.reasoning_content || ''

            return {
              model,
              success: true,
              content,
              streaming: false,
            }
          }
        } catch (error: any) {
          return {
            model,
            success: false,
            message: error.message || '测试失败',
          }
        }
      })

      const batchResults = await Promise.all(promises)
      results.push(...batchResults)
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error: any) {
    console.error('Test models error:', error)
    return NextResponse.json(
      { success: false, message: '测试失败', error: error.message },
      { status: 500 }
    )
  }
}
