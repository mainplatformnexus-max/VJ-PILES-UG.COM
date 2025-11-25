"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { database } from "@/lib/firebase"
import { ref, onValue, get, set } from "firebase/database"
import { useAuth } from "@/lib/auth-context"

interface ContinueWatchingItem {
  id: string
  title: string
  image: string
  progress: number
  contentType: string
  contentId: string
  streamlink?: string
  lastWatched: number
}

interface ContinueWatchingProps {
  onPlayVideo: (video: { url: string; title: string; contentId: string; contentType: string }) => void
}

export default function ContinueWatching({ onPlayVideo }: ContinueWatchingProps) {
  const [items, setItems] = useState<ContinueWatchingItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const continueWatchingRef = ref(database, `continueWatching/${user.uid}`)
    const unsubscribe = onValue(continueWatchingRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const itemsArray = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }))
        itemsArray.sort((a, b) => b.lastWatched - a.lastWatched)
        setItems(itemsArray.slice(0, 1))
      } else {
        setItems([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const handleWatch = async (item: ContinueWatchingItem) => {
    try {
      const contentRef = ref(
        database,
        `${item.contentType === "series" ? "series" : item.contentType === "original" ? "originals" : "movies"}/${item.contentId}`,
      )
      const snapshot = await get(contentRef)

      if (snapshot.exists()) {
        const content = snapshot.val()
        const videoUrl =
          item.contentType === "series" && content.episodes?.[0]?.streamlink
            ? content.episodes[0].streamlink
            : content.streamlink

        if (videoUrl) {
          onPlayVideo({
            url: videoUrl,
            title: item.title,
            contentId: item.contentId,
            contentType: item.contentType,
          })

          if (user?.uid) {
            try {
              await set(ref(database, `continueWatching/${user.uid}/${item.id}`), {
                ...item,
                lastWatched: Date.now(),
              })
            } catch (error) {
              console.error("Error updating watch history:", error)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading video:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex-shrink-0 min-h-[80px]">
        <h2 className="text-[10px] font-bold text-foreground mb-1">Continue</h2>
        <p className="text-[8px] text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user || items.length === 0) {
    return (
      <div className="flex-shrink-0 min-h-[80px]">
        <h2 className="text-[10px] font-bold text-foreground mb-1">Continue</h2>
        <p className="text-[8px] text-muted-foreground">No items yet</p>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 min-h-[80px]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <h2 className="text-[10px] font-bold text-foreground">Continue</h2>
          <div className="flex items-center gap-0.5">
            <button className="p-0.5 hover:bg-muted rounded transition">
              <ChevronLeft className="w-2 h-2 text-foreground" />
            </button>
            <button className="p-0.5 hover:bg-muted rounded transition">
              <ChevronRight className="w-2 h-2 text-foreground" />
            </button>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground text-[8px] transition flex items-center gap-0.5">
          See More
          <ChevronRight className="w-2 h-2" />
        </button>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex gap-1.5">
            <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0">
              <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
              {item.progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/50">
                  <div className="h-full bg-[#e50914]" style={{ width: `${item.progress}%` }} />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between py-0.5">
              <div>
                <h3 className="text-foreground font-semibold text-[9px] mb-0.5 line-clamp-1">{item.title}</h3>
                <p className="text-muted-foreground text-[7px]">{Math.round(item.progress)}% watched</p>
              </div>
              <div className="flex gap-1">
                <button className="px-1.5 py-0.5 bg-secondary hover:bg-muted text-foreground rounded text-[7px] transition">
                  Drop
                </button>
                <button
                  onClick={() => handleWatch(item)}
                  className="px-1.5 py-0.5 bg-[#e50914] hover:bg-[#f6121d] text-white rounded text-[7px] font-semibold transition"
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
