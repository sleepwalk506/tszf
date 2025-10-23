// src/composables/useFireSocket.js
import { ref, reactive, onUnmounted } from 'vue'

export function useFireSocket(options = {}) {
  const {
    url = 'ws://10.112.247.164:8091/ws/1',
    reconnectDelay = 5000,
    onOsdUpdate,
    onFireUpdate,
    onSpreadUpdate,
  } = options

  let ws = null
  let reconnectTimer = null

  const connected = ref(false)
  const lastMessage = ref(null)

  // 建立连接
  function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) return

    ws = new WebSocket(url)

    ws.onopen = () => {
      console.log(`✅ WebSocket 已连接: ${url}`)
      connected.value = true
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        lastMessage.value = msg
        dispatchMessage(msg)
      } catch (e) {
        console.error('❌ WebSocket 消息解析失败', e)
      }
    }

    ws.onclose = () => {
      console.warn('⚠️ WebSocket 已关闭，准备重连...')
      connected.value = false
      scheduleReconnect()
    }

    ws.onerror = (err) => {
      console.error('🚨 WebSocket 发生错误', err)
      ws.close()
    }
  }

  // 分发消息
  function dispatchMessage(msg) {
    switch (msg.type) {
      case 'osd':
        onOsdUpdate && onOsdUpdate(msg)
        break
      case 'spread':
        onSpreadUpdate && onSpreadUpdate(msg.point)
        break
      case 'fire':
        onFireUpdate && onFireUpdate(msg.firePosition)
        break
      default:
        console.warn('收到未知消息类型:', msg.type)
    }
  }

  // 重连
  function scheduleReconnect() {
    if (reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, reconnectDelay)
  }

  // 主动关闭
  function close() {
    if (ws) {
      ws.close()
      ws = null
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  // 清理资源
  onUnmounted(() => {
    close()
  })

  // 发送消息（如果有需要）
  function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    } else {
      console.warn('⚠️ WebSocket 未连接，无法发送')
    }
  }

  return {
    connect,
    close,
    send,
    connected,
    lastMessage,
  }
}
