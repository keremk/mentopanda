import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface TestUser {
  email: string
  password: string
  role: 'admin' | 'manager' | 'member'
}

const testUsers: TestUser[] = [
  { email: 'TestMember@example.com', password: 'TestMember123!', role: 'member' },
  { email: 'TestManager@example.com', password: 'TestManager123!', role: 'manager' },
  { email: 'TestAdmin@example.com', password: 'TestAdmin123!', role: 'admin' }
]

async function createTestUsers() {
  for (const user of testUsers) {
    try {
      // Create user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      if (authError) throw authError

      if (!authData.user) {
        console.error(`Failed to create user: ${user.email}`)
        continue
      }

      // Update user role if it's not 'member'
      if (user.role !== 'member') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id: authData.user.id, role: user.role })

        if (roleError) throw roleError
      }

      console.log(`Created user: ${user.email} with role: ${user.role}`)
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error)
    }
  }
}

createTestUsers()
  .then(() => console.log('Test users creation completed'))
  .catch((error) => console.error('Error in test users creation:', error))
  .finally(() => process.exit())
