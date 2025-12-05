"use client"

import { ChevronRight, Plus } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { database } from "@/lib/firebase"
import { ref, get } from "firebase/database"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/lib/subscription-context"

interface ContentItem {
  id: string
  title: string
  rating?: number
  image: string
  type: string
  streamlink: string
  genre?: string
  episodes?: any[]
}

interface TopRatedSectionProps {
  onPlayVideo?: (video: { url: string; title: string; contentId: string; contentType: string }) => void
  onRequireAuth?: () => void
}

export default function TopRatedSection({ onPlayVideo, onRequireAuth }: TopRatedSectionProps) {
  const [topRatedItems, setTopRatedItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user, isAdmin } = useAuth()
  const { hasActiveSubscription } = useSubscription()

  useEffect(() => {
    const fetchTopRated = async () => {
      try {
        const [moviesSnap, seriesSnap, originalsSnap] = await Promise.all([
          get(ref(database, "movies")),
          get(ref(database, "series")),
          get(ref(database, "originals")),
        ])

        const allContent: ContentItem[] = []

        if (moviesSnap.exists()) {
          Object.entries(moviesSnap.val()).forEach(([id, data]: [string, any]) => {
            allContent.push({ id, ...data, type: "movie" })
          })
        }

        if (seriesSnap.exists()) {
          Object.entries(seriesSnap.val()).forEach(([id, data]: [string, any]) => {
            allContent.push({ id, ...data, type: "series" })
          })
        }

        if (originalsSnap.exists()) {
          Object.entries(originalsSnap.val()).forEach(([id, data]: [string, any]) => {
            allContent.push({ id, ...data, type: "original" })
          })
        }

        // Sort by rating and get top 2
        const sorted = allContent
          .filter((item) => item.rating && item.rating > 0)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 2)

        setTopRatedItems(sorted)
      } catch (error) {
        console.error("Error fetching top rated:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopRated()
  }, [])

  const handleWatch = (item: ContentItem) => {
    if (!user) {
      onRequireAuth?.()
      return
    }

    if (!hasActiveSubscription && !isAdmin) {
      onRequireAuth?.()
      return
    }

    if (onPlayVideo) {
      const videoUrl =
        item.type === "series" && item.episodes?.[0]?.streamlink ? item.episodes[0].streamlink : item.streamlink

      onPlayVideo({
        url: videoUrl,
        title: item.title,
        contentId: item.id,
        contentType: item.type,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex-shrink-0 min-h-[140px]">
        <div className="text-[10px] text-muted-foreground">Loading top rated...</div>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 min-h-[140px]">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[10px] font-bold text-foreground">Top Rated</h2>
        <button className="text-muted-foreground hover:text-foreground text-[8px] transition flex items-center gap-0.5">
          See More
          <ChevronRight className="w-2 h-2" />
        </button>
      </div>

      <div className="space-y-1">
        {topRatedItems.map((item) => (
          <div key={item.id} className="relative rounded overflow-hidden group">
            <div className="relative h-16 w-full">
              <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-1">
              <h3 className="text-white font-bold text-[9px] mb-0.5">{item.title}</h3>
              <div className="flex items-center justify-between text-[7px] text-gray-300 mb-0.5">
                <span>⭐ {item.rating?.toFixed(1)}</span>
                <span>{item.genre || item.type}</span>
              </div>
              <div className="flex gap-0.5">
                <button className="flex-shrink-0 w-4 h-4 bg-[#2a2d3a] hover:bg-[#3a3d47] rounded flex items-center justify-center transition">
                  <Plus className="w-2 h-2 text-white" />
                </button>
                <button
                  onClick={() => handleWatch(item)}
                  className="flex-1 py-0.5 bg-[#e50914] hover:bg-[#f6121d] text-white rounded text-[7px] font-semibold transition"
                >
                  Watch
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
