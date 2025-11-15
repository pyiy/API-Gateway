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

// Track initialization status to prevent multiple initializations
let isInitialized = false

// Initialize database tables
export async function initializeDatabase() {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log('Database already initialized, skipping...')
    return
  }

  const db = getDB()
  
  try {
    // Start transaction to ensure all operations succeed or fail together
    const connection = await db.getConnection()
    await connection.beginTransaction()

    try {
      await connection.execute(`
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

      await connection.execute(`
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

      await connection.execute(`
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

      await connection.execute(`
        CREATE TABLE IF NOT EXISTS system_settings (
          id INT PRIMARY KEY AUTO_INCREMENT,
          setting_key VARCHAR(100) UNIQUE NOT NULL,
          setting_value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)

      // Create default admin user with environment variable support
      const adminUsername = process.env.ADMIN_USERNAME || 'admin'
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

      // Check if admin user exists using INSERT IGNORE to avoid duplicates
      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      
      // Use INSERT IGNORE to handle duplicate usernames gracefully
      const [result] = await connection.execute(
        `INSERT IGNORE INTO users (username, password, is_admin) 
         VALUES (?, ?, TRUE)`,
        [adminUsername, hashedPassword]
      )

      const insertResult = result as any
      if (insertResult.affectedRows > 0) {
        console.log(`Admin user '${adminUsername}' created successfully`)
      } else {
        console.log(`Admin user '${adminUsername}' already exists, skipping creation`)
      }

      // Initialize default system settings using INSERT IGNORE
      const defaultSettings = [
        { key: 'enable_registration', value: 'true' },
        { key: 'enable_login', value: 'true' },
        { key: 'enable_register_captcha', value: 'false' },
        { key: 'enable_login_captcha', value: 'false' },
        { key: 'system_name', value: 'AI API 中转站管理系统' },
        { key: 'announcement', value: '欢迎使用AI API管理系统' },
      ]

      for (const setting of defaultSettings) {
        await connection.execute(
          'INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)',
          [setting.key, setting.value]
        )
      }

      // Create a table to track initialization status (optional)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS system_initialization (
          id INT PRIMARY KEY AUTO_INCREMENT,
          initialized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          version VARCHAR(50) DEFAULT '1.0'
        )
      `)

      // Record initialization
      await connection.execute(
        'INSERT INTO system_initialization (initialized_at) VALUES (CURRENT_TIMESTAMP)'
      )

      await connection.commit()
      isInitialized = true
      console.log('Database initialization completed successfully')

    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Database initialization failed:', error)
    throw error
  }
}

// Reset initialization status (useful for testing)
export function resetInitialization() {
  isInitialized = false
}
