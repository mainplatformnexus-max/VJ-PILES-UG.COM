"use client"

import { Search, User } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import SearchBar from "./search-bar"
import AuthModal from "./auth-modal"

interface MobileHeaderProps {
  onSearch?: (query: string) => void
}

export default function MobileHeader({ onSearch }: MobileHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleUserClick = () => {
    if (user) {
      router.push("/settings")
    } else {
      setAuthModalOpen(true)
    }
  }

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 bg-[#141620] border-b border-[#2a2d3a] px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => router.push("/")} className="flex-shrink-0">
            <span className="text-white font-bold text-sm">VJ PILES UG MOVIES</span>
          </button>

          {/* Search and Account */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-[#9ca3af] hover:text-white transition"
            >
              <Search className="w-5 h-5" />
            </button>

            <button onClick={handleUserClick} className="p-2 text-[#9ca3af] hover:text-white transition">
              {user ? (
                <div className="w-7 h-7 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar Expansion */}
        {searchOpen && (
          <div className="mt-2 pb-1">
            <SearchBar />
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </>
  )
}
