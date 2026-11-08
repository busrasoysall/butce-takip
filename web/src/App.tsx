import { AnimatePresence } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { Calculator } from '@/components/Calculator'
import { Logo } from '@/components/Logo'
import { Notes } from '@/components/Notes'
import { BottomNav, Drawer, Fab, Header, Orbs } from '@/components/Shell'
import { Page, UIHost } from '@/components/kit'
import { bootAuth } from '@/lib/auth'
import { ntick } from '@/lib/misc'
import { setS, useApp } from '@/lib/store'
import { applyTheme } from '@/lib/themes'
import type { Tab } from '@/lib/types'
import { Cards, Invest } from '@/pages/Assets'
import { Daily, Fixed, Income } from '@/pages/Flow'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Calendar, Charts, Goals, Notifs, Transactions } from '@/pages/More'
import { Settings } from '@/pages/Settings'

const PAGES: Record<Tab, () => ReactNode> = {
  home: Home,
  inc: Income,
  fx: Fixed,
  dly: Daily,
  inv: Invest,
  crd: Cards,
  cal: Calendar,
  cht: Charts,
  not: Notifs,
  tx: Transactions,
  gol: Goals,
  set: Settings,
}

export default function App() {
  const s = useApp()

  useEffect(() => {
    applyTheme()
    bootAuth()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onScheme = () => {
      applyTheme()
      setS({ prefs: Date.now() })
    }
    mq.addEventListener('change', onScheme)
    const id = setInterval(ntick, 60000)
    return () => {
      mq.removeEventListener('change', onScheme)
      clearInterval(id)
    }
  }, [])

  if (s.phase === 'boot')
    return (
      <div className="lg" style={{ justifyContent: 'center' }}>
        <Logo size={96} />
      </div>
    )
  if (s.phase === 'auth')
    return (
      <>
        <Login />
        <UIHost />
      </>
    )

  const Cur = PAGES[s.tab]
  return (
    <>
      <div className="w">
        <Drawer />
        <Header />
        <AnimatePresence mode="wait" initial={false}>
          <Page key={s.tab} k={s.tab}>
            <Cur />
          </Page>
        </AnimatePresence>
      </div>
      <Orbs />
      <Fab />
      <BottomNav />
      <AnimatePresence>{s.sheet === 'calc' && <Calculator key="calc" onClose={() => setS({ sheet: null })} />}</AnimatePresence>
      <AnimatePresence>{s.sheet === 'notes' && <Notes key="notes" onClose={() => setS({ sheet: null })} />}</AnimatePresence>
      <UIHost />
    </>
  )
}
