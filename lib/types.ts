export interface User {
  id: number
  username: string
  password: string
  is_admin: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface APIStation {
  id: number
  user_id: number
  name: string
  base_url: string
  api_key: string
  models_endpoint: string
  chat_endpoint: string
  default_test_question: string
  default_stream: boolean
  default_timeout: number
  default_concurrency: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: number
  user_id: number
  chat_apps: ChatApp[]
  models_endpoint: string
  chat_endpoint: string
  default_test_question: string
  default_stream: boolean
  default_timeout: number
  default_concurrency: number
  created_at: string
  updated_at: string
}

export interface ChatApp {
  [name: string]: string
}

export interface SystemSettings {
  id: number
  setting_key: string
  setting_value: string
  created_at: string
  updated_at: string
}

export interface ModelInfo {
  id: string
  object: string
  created: number
  owned_by: string
}

export interface UsageInfo {
  code: boolean
  message: string
  data: {
    object: string
    name: string
    total_granted: number
    total_used: number
    total_available: number
    unlimited_quota: boolean
    model_limits: { [key: string]: boolean }
    model_limits_enabled: boolean
    expires_at: number
  }
}
