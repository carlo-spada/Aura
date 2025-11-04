export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'plus' | 'premium'
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          monthly_job_matches_used: number
          monthly_job_matches_limit: number
          monthly_reset_date: string | null
          subscription_ends_at: string | null
          onboarding_completed: boolean
          onboarding_step: number
          resume_url: string | null
          job_search_status: string | null
          preferences: Json
          qualifications: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'plus' | 'premium'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          monthly_job_matches_used?: number
          monthly_job_matches_limit?: number
          monthly_reset_date?: string | null
          subscription_ends_at?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          resume_url?: string | null
          job_search_status?: string | null
          preferences?: Json
          qualifications?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'plus' | 'premium'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          monthly_job_matches_used?: number
          monthly_job_matches_limit?: number
          monthly_reset_date?: string | null
          subscription_ends_at?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          resume_url?: string | null
          job_search_status?: string | null
          preferences?: Json
          qualifications?: Json
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          title: string
          company: string
          location: string | null
          salary_min: number | null
          salary_max: number | null
          job_type: string | null
          match_score: number
          key_matches: string[] | null
          description: string | null
          url: string | null
          posted_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          company: string
          location?: string | null
          salary_min?: number | null
          salary_max?: number | null
          job_type?: string | null
          match_score: number
          key_matches?: string[] | null
          description?: string | null
          url?: string | null
          posted_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          company?: string
          location?: string | null
          salary_min?: number | null
          salary_max?: number | null
          job_type?: string | null
          match_score?: number
          key_matches?: string[] | null
          description?: string | null
          url?: string | null
          posted_date?: string | null
          created_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          user_id: string
          job_id: string
          status: string
          applied_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          status: string
          applied_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          status?: string
          applied_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_onboarding_progress: {
        Args: {
          user_id: string
          step: number
          completed?: boolean
        }
        Returns: void
      }
      sync_user_subscription_from_stripe: {
        Args: {
          user_id: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}