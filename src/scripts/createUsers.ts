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

interface ActivitySeed {
  moduleId: number
  assessmentText: string | null
  assessmentScore: number | null
  completedAt: Date | null
}

// Sample activities for users
const sampleActivities: ActivitySeed[] = [
  {
    moduleId: 1, // Feedback Fundamentals
    assessmentText: "I would start by acknowledging their technical skills and then express concern about the missing test coverage. I'd explain the importance of tests for code reliability and team confidence, then offer to pair program on writing tests for the next feature.",
    assessmentScore: 85,
    completedAt: new Date('2024-01-15')
  },
  {
    moduleId: 2, // Handling Defensive Responses
    assessmentText: "I understand you feel others interrupt more frequently. Let's look at specific instances and discuss how we can improve the overall meeting dynamics for everyone.",
    assessmentScore: 90,
    completedAt: new Date('2024-01-16')
  },
  {
    moduleId: 4, // Meeting Structure module
    assessmentText: null,
    assessmentScore: null,
    completedAt: null // In progress
  },
  {
    moduleId: 7, // Preparing for Reviews
    assessmentText: "I would gather specific examples of both technical excellence and mentoring challenges. For the technical aspects, I'd highlight their strengths in system design and code quality. For mentoring, I'd provide concrete examples where junior team members could have benefited from more guidance.",
    assessmentScore: 95,
    completedAt: new Date('2024-01-20')
  }
]

async function createActivitiesForUser(userId: string) {
  for (const activity of sampleActivities) {
    try {
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          user_id: userId,
          module_id: activity.moduleId,
          assessment_text: activity.assessmentText,
          assessment_score: activity.assessmentScore,
          completed_at: activity.completedAt,
          started_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Random start date within last week
        })

      if (activityError) throw activityError
    } catch (error) {
      console.error(`Error creating activity for user ${userId}:`, error)
    }
  }
}

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

      // Create activities for member and manager users
      if (user.role === 'member' || user.role === 'manager') {
        await createActivitiesForUser(authData.user.id)
      }

      console.log(`Created user: ${user.email} with role: ${user.role} and sample activities`)
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error)
    }
  }
}

createTestUsers()
  .then(() => console.log('Test users creation completed'))
  .catch((error) => console.error('Error in test users creation:', error))
  .finally(() => process.exit())
