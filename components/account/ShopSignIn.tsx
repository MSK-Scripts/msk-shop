'use client'

import { useState } from 'react'
import { CircleNotch, SignIn, SignOut } from '@/components/icons'
import { useLang } from '@/components/i18n/LangProvider'
import { Button } from '@/components/ui/Button'
import { accountTranslations } from '@/lib/i18n'
import { useCart } from '@/lib/useCart'
import { useHydrated } from '@/lib/useHydrated'
import { useCartStore } from '@/store/cart'

/**
 * The shop sign-in (CFX.re through Tebex) with its state, the same calls as
 * the account menu in the header: `loginAndAdd()` without a package creates
 * the basket and sends the visitor to Tebex' CFX.re sign-in, `clearBasket()`
 * signs out. The user name exists only in the browser, so it waits for
 * hydration.
 */
export function ShopSignIn() {
  const { lang } = useLang()
  const t = accountTranslations[lang]
  const { loginAndAdd } = useCart()
  const { username, clearBasket } = useCartStore()
  const hydrated = useHydrated()
  const [signingIn, setSigningIn] = useState(false)
  const name = hydrated ? username : null

  async function signIn() {
    setSigningIn(true)
    try { await loginAndAdd() } finally { setSigningIn(false) }
  }

  return (
    <div className="grid justify-items-start gap-3">
      <p className="text-[var(--color-muted-foreground)]">
        {name ? t.shop_signed_in.replace('{name}', name) : t.shop_signed_out}
      </p>
      {name ? (
        <Button variant="outline" onClick={clearBasket}>
          <SignOut className="h-4 w-4" />
          {t.shop_sign_out}
        </Button>
      ) : (
        <Button onClick={signIn} disabled={!hydrated || signingIn}>
          {signingIn ? <CircleNotch className="h-4 w-4 animate-spin" /> : <SignIn className="h-4 w-4" />}
          {t.shop_sign_in}
        </Button>
      )}
    </div>
  )
}
