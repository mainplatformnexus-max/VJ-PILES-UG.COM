"use client"

import { Home, Film, Tv, Globe, Music, Star, Settings, Moon, Sun, CreditCard, Shield } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useTheme } from 'next-themes'
import Link from 'next/link'

interface SidebarProps {
  onFilterChange?: (filter: string) => void
  activeFilter?: string
}

export default function Sidebar({ onFilterChange, activeFilter = 'home' }: SidebarProps) {
  const { user, isAdmin } = useAuth()
  const { theme, setTheme } = useTheme()

  const menuItems = [
    { icon: Home, label: 'Home', filter: 'home' },
    { icon: Film, label: 'Movies', filter: 'movies' },
    { icon: Tv, label: 'Series', filter: 'series' },
    { icon: Globe, label: 'Nigerian', filter: 'nigerian' },
    { icon: Music, label: 'Music', filter: 'music' },
    { icon: Star, label: 'Top Rated', filter: 'top-rated' },
    { icon: CreditCard, label: 'Subscription', filter: 'subscription' },
    { icon: Settings, label: 'Settings', filter: 'settings' },
  ]

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-48 bg-card border-r border-border flex flex-col z-50 overflow-hidden transition-colors">
      <div className="p-3 flex-shrink-0">
        <div className="text-primary text-sm font-black leading-none tracking-tight">
          VJ PILES UG MOVIES
        </div>
      </div>

      {/* Menu Section */}
      <div className="px-2 flex-1 overflow-y-auto scrollbar-hide">
        <div className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeFilter === item.filter
            return (
              <button
                key={item.filter}
                onClick={() => onFilterChange?.(item.filter)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}

          {isAdmin && (
            <Link href="/admin" className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Admin Panel</span>
            </Link>
          )}
        </div>
      </div>

      {/* Theme Switcher */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
          {theme === "light" ? (
            <>
              <Moon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Light Mode</span>
            </>
          )}
        </button>
        {user && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition mt-1"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Log Out</span>
          </button>
        )}
      </div>
    </aside>
  )
}
