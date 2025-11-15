import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

function parseMySQLDNS(url: string) {
  // Parse basic connection info
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?/)
  if (!match) {
    throw new Error('Invalid MySQL DNS format')
  }

  const baseConfig = {
    host: match[3],
    port: parseInt(match[4]),
    user: match[1],
    password: match[2],
    database: match[5],
  }

  // Parse query parameters for SSL
  const queryString = match[6] || ''
  const urlParams = new URLSearchParams(queryString.replace('?', ''))
  const sslParam = urlParams.get('ssl')
  const sslEnabled = sslParam === 'true' || sslParam === '1'

  return {
    ...baseConfig,
    ssl: sslEnabled ? {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    } : undefined
  }
}

// Create database connection pool
let pool: mysql.Pool | null = null

export function getDB() {
  if (!pool) {
    const config = parseMySQLDNS(process.env.MYSQL_DNS!)
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  }
  return pool
}

// Initialize database tables
export async function initializeDatabase() {
  const db = getDB()
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS api_stations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      name VARCHAR(200) NOT NULL,
      base_url VARCHAR(500) NOT NULL,
      api_key VARCHAR(500) NOT NULL,
      models_endpoint VARCHAR(200) DEFAULT '/v1/models',
      chat_endpoint VARCHAR(200) DEFAULT '/v1/chat/completions',
      default_test_question VARCHAR(500) DEFAULT 'who are u?',
      default_stream BOOLEAN DEFAULT TRUE,
      default_timeout INT DEFAULT 12,
      default_concurrency INT DEFAULT 3,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT UNIQUE NOT NULL,
      chat_apps JSON,
      models_endpoint VARCHAR(200) DEFAULT '/v1/models',
      chat_endpoint VARCHAR(200) DEFAULT '/v1/chat/completions',
      default_test_question VARCHAR(500) DEFAULT 'who are u?',
      default_stream BOOLEAN DEFAULT TRUE,
      default_timeout INT DEFAULT 12,
      default_concurrency INT DEFAULT 3,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  // Check if admin user exists
  const [rows] = await db.execute(
    'SELECT id FROM users WHERE username = ? AND is_admin = TRUE',
    ['admin']
  )

  // Create default admin user if not exists
  if ((rows as any[]).length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await db.execute(
      'INSERT INTO users (username, password, is_admin) VALUES (?, ?, TRUE)',
      ['admin', hashedPassword]
    )
  }

  // Initialize default system settings
  const defaultSettings = [
    { key: 'enable_registration', value: 'true' },
    { key: 'enable_login', value: 'true' },
    { key: 'enable_register_captcha', value: 'false' },
    { key: 'enable_login_captcha', value: 'false' },
    { key: 'system_name', value: 'AI API 中转站管理系统' },
    { key: 'announcement', value: '欢迎使用AI API管理系统' },
  ]

  for (const setting of defaultSettings) {
    await db.execute(
      'INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)',
      [setting.key, setting.value]
    )
  }
}
