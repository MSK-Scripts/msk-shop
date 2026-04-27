export interface TebexPackage {
  id: number
  name: string
  slug: string
  description: string
  image?: string
  media: { type: string; name: string; url: string; primary: boolean }[]
  type: string
  category: { id: number; name: string }
  base_price: number
  sales_tax: number
  total_price: number
  currency: string
  discount: number
  disable_quantity: boolean
  disable_gifting: boolean
  expiration_date?: string | null
  user_limit?: number | null
  created_at: string
  updated_at: string
  order: number
}

export interface TebexCategory {
  id: number
  name: string
  description?: string
  packages: TebexPackage[]
}

export interface TebexBasket {
  ident: string
  complete: boolean
  id?: number
  email?: string
  username?: string | null
  username_id?: string | number | null
  coupons: TebexCoupon[]
  giftcards?: []
  cancel_url?: string
  complete_url?: string
  complete_auto_redirect?: boolean
  country?: string
  ip?: string
  base_price: number
  sales_tax: number
  total_price: number
  currency: string
  packages: TebexBasketPackage[]
  links: {
    payment?: string
    checkout?: string
  } | []
}

export interface TebexBasketPackage {
  id: number
  name: string
  quantity: number
  base_price: number
  sale_support?: boolean
  discount: number
  paid_price: number
  image?: string
  in_basket?: {
    quantity: number
    price: number
    gift_username_id?: string | null
    gift_username?: string | null
  }
}

export interface TebexCoupon {
  code?: string
  coupon_code?: string
}
