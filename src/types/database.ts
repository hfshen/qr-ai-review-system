export interface User {
  id: string
  auth_id: string
  email: string
  display_name: string
  role: 'user' | 'agency_owner' | 'admin'
  created_at: string
  updated_at: string
}

export interface Agency {
  id: string
  owner_id: string
  name: string
  description?: string
  logo_url?: string
  created_at: string
}

export interface Branch {
  id: string
  agency_id: string
  name: string
  address?: string
  phone?: string
  description?: string
  industry?: string
  qr_code?: string
  created_at: string
}

export interface Platform {
  id: number
  code: string
  name: string
  description?: string
  default_reward: number
}

export interface AgencyPlatform {
  id: string
  agency_id: string
  platform_id: number
  connected: boolean
  api_token?: string
  reward_per_review: number
  commission_rate: number
}

export interface UserPlatform {
  id: string
  user_id: string
  platform_id: number
  connected: boolean
  account_identifier?: string
}

export interface ReviewKeyword {
  id: number
  rating: number
  keyword: string
}

export interface Review {
  id: string
  user_id: string
  branch_id: string
  platform_id?: number
  rating: number
  selected_keyword_id?: number
  ai_content?: string
  final_content?: string
  status: 'draft' | 'published' | 'failed'
  published_at?: string
  created_at: string
  updated_at: string
}

export interface ReviewMedia {
  id: string
  review_id: string
  file_path: string
  media_type: 'image' | 'video'
  created_at: string
}

export interface PointTransaction {
  id: string
  user_id?: string
  agency_id?: string
  review_id?: string
  platform_id?: number
  points: number
  transaction_type: 'reward' | 'purchase' | 'agency_deposit' | 'admin_adjust'
  memo?: string
  created_at: string
}

export interface AgencyBalance {
  agency_id: string
  points_balance: number
  updated_at: string
}

export interface AgencyDeposit {
  id: string
  agency_id: string
  deposit_amount: number
  base_points: number
  bonus_points: number
  total_points: number
  created_at: string
}

export interface BranchStatistics {
  branch_id: string
  total_reviews: number
  rating_1: number
  rating_2: number
  rating_3: number
  rating_4: number
  rating_5: number
  updated_at: string
}

export interface UserPoints {
  user_id: string
  points: number
  updated_at: string
}

export interface MarketplaceProduct {
  id: string
  name: string
  description?: string
  points_cost: number
  image_url?: string
  category: 'general' | 'coupon' | 'giftcard' | 'service'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductPurchase {
  id: string
  user_id: string
  product_id: string
  points_spent: number
  purchase_date: string
  status: 'pending' | 'completed' | 'cancelled'
  redemption_code?: string
  notes?: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      agencies: {
        Row: Agency
        Insert: Omit<Agency, 'id' | 'created_at'>
        Update: Partial<Omit<Agency, 'id' | 'created_at'>>
      }
      branches: {
        Row: Branch
        Insert: Omit<Branch, 'id' | 'created_at'>
        Update: Partial<Omit<Branch, 'id' | 'created_at'>>
      }
      platforms: {
        Row: Platform
        Insert: Omit<Platform, 'id'>
        Update: Partial<Omit<Platform, 'id'>>
      }
      agency_platforms: {
        Row: AgencyPlatform
        Insert: Omit<AgencyPlatform, 'id'>
        Update: Partial<Omit<AgencyPlatform, 'id'>>
      }
      user_platforms: {
        Row: UserPlatform
        Insert: Omit<UserPlatform, 'id'>
        Update: Partial<Omit<UserPlatform, 'id'>>
      }
      review_keywords: {
        Row: ReviewKeyword
        Insert: Omit<ReviewKeyword, 'id'>
        Update: Partial<Omit<ReviewKeyword, 'id'>>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Review, 'id' | 'created_at' | 'updated_at'>>
      }
      review_media: {
        Row: ReviewMedia
        Insert: Omit<ReviewMedia, 'id' | 'created_at'>
        Update: Partial<Omit<ReviewMedia, 'id' | 'created_at'>>
      }
      point_transactions: {
        Row: PointTransaction
        Insert: Omit<PointTransaction, 'id' | 'created_at'>
        Update: Partial<Omit<PointTransaction, 'id' | 'created_at'>>
      }
      agency_balances: {
        Row: AgencyBalance
        Insert: Omit<AgencyBalance, 'updated_at'>
        Update: Partial<Omit<AgencyBalance, 'updated_at'>>
      }
      agency_deposits: {
        Row: AgencyDeposit
        Insert: Omit<AgencyDeposit, 'id' | 'created_at'>
        Update: Partial<Omit<AgencyDeposit, 'id' | 'created_at'>>
      }
      branch_statistics: {
        Row: BranchStatistics
        Insert: Omit<BranchStatistics, 'updated_at'>
        Update: Partial<Omit<BranchStatistics, 'updated_at'>>
      }
      user_points: {
        Row: UserPoints
        Insert: Omit<UserPoints, 'updated_at'>
        Update: Partial<Omit<UserPoints, 'updated_at'>>
      }
      marketplace_products: {
        Row: MarketplaceProduct
        Insert: Omit<MarketplaceProduct, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MarketplaceProduct, 'id' | 'created_at' | 'updated_at'>>
      }
      product_purchases: {
        Row: ProductPurchase
        Insert: Omit<ProductPurchase, 'id'>
        Update: Partial<Omit<ProductPurchase, 'id'>>
      }
    }
  }
}
