"use client"

import { useEffect, useState, useRef } from "react"
import { database } from "@/lib/firebase"
import { ref, onValue, get, set } from "firebase/database"
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useSubscription } from "@/lib/subscription-context"

interface CarouselItem {
  id: string
  title: string
  subtitle?: string
  image: string
  contentType?: string
  contentId?: string
  createdAt?: string
}

interface HeroCarouselProps {
  playingVideo: { url: string; title: string; contentId: string; contentType: string } | null
  onPlayVideo: (video: { url: string; title: string; contentId: string; contentType: string } | null) => void
  onShowSubscription: () => void
  onRequireAuth?: () => void
}

const convertToEmbedUrl = (url: string): string => {
  // Google Drive: https://drive.google.com/file/d/FILE_ID/view -> https://drive.google.com/file/d/FILE_ID/preview
  if (url.includes("drive.google.com")) {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (fileIdMatch) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
    }
  }

  // YouTube: convert watch URLs to embed
  if (url.includes("youtube.com/watch")) {
    const videoIdMatch = url.match(/[?&]v=([^&]+)/)
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}`
    }
  }

  if (url.includes("youtu.be/")) {
    const videoId = url.split("youtu.be/")[1]?.split("?")[0]
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`
    }
  }

  // Return original URL if no conversion needed
  return url
}

export default function HeroCarousel({
  playingVideo,
  onPlayVideo,
  onShowSubscription,
  onRequireAuth,
}: HeroCarouselProps) {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user, isAdmin } = useAuth()
  const { hasActiveSubscription } = useSubscription()
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const carouselRefFromDb = ref(database, "carousel")
    const unsubscribe = onValue(carouselRefFromDb, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const items = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }))
        items.sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
        setCarouselItems(items)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (carouselItems.length > 1 && !playingVideo) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev === carouselItems.length - 1 ? 0 : prev + 1))
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [carouselItems.length, playingVideo])

  useEffect(() => {
    if (playingVideo && carouselRef.current) {
      carouselRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [playingVideo])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === carouselItems.length - 1 ? 0 : prev + 1))
  }

  const handleWatchNow = async () => {
    if (!user) {
      onRequireAuth?.()
      return
    }

    if (!hasActiveSubscription && !isAdmin) {
      onShowSubscription()
      return
    }

    const item = carouselItems[currentIndex]
    if (item?.contentId) {
      try {
        const type = item.contentType || "movie"
        const contentRef = ref(
          database,
          `${type === "series" ? "series" : type === "original" ? "originals" : "movies"}/${item.contentId}`,
        )
        const snapshot = await get(contentRef)

        if (snapshot.exists()) {
          const content = snapshot.val()
          const videoUrl =
            type === "series" && content.episodes?.[0]?.streamlink ? content.episodes[0].streamlink : content.streamlink

          if (videoUrl) {
            onPlayVideo({
              url: convertToEmbedUrl(videoUrl),
              title: item.title,
              contentId: item.contentId,
              contentType: type,
            })

            if (user?.uid) {
              try {
                await set(ref(database, `users/${user.uid}/continueWatching/${item.contentId}`), {
                  id: item.contentId,
                  title: item.title,
                  image: item.image,
                  progress: 0,
                  contentType: type,
                  contentId: item.contentId,
                  streamlink: videoUrl,
                  lastWatched: Date.now(),
                })
              } catch (error) {
                console.error("Error saving to watch history:", error)
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading video:", error)
      }
    }
  }

  const handleDownload = () => {
    if (!hasActiveSubscription && !isAdmin) {
      onShowSubscription()
      return
    }

    if (playingVideo?.url) {
      const fileIdMatch = playingVideo.url.match(/\/d\/([a-zA-Z0-9_-]+)/)
      if (fileIdMatch) {
        const fileId = fileIdMatch[1]
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
        window.open(downloadUrl, "_blank")
      } else {
        window.open(playingVideo.url, "_blank")
      }
    }
  }

  const handlePosterClick = async () => {
    if (!user) {
      onRequireAuth?.()
      return
    }

    if (!hasActiveSubscription && !isAdmin) {
      onShowSubscription()
      return
    }

    await handleWatchNow()
  }

  if (loading || carouselItems.length === 0) {
    return (
      <div className="relative h-[280px] bg-[#1f2230] rounded-lg flex items-center justify-center">
        <p className="text-[#6b7280]">Loading...</p>
      </div>
    )
  }

  const currentItem = carouselItems[currentIndex]

  if (playingVideo) {
    return (
      <div
        ref={carouselRef}
        className="relative h-[180px] md:h-[300px] lg:h-[400px] rounded-lg overflow-hidden bg-black"
      >
        <iframe
          key={playingVideo.url}
          src={playingVideo.url}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <button
          onClick={() => onPlayVideo(null)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center transition z-10"
        >
          <X className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={handleDownload}
          className="absolute top-2 left-2 px-3 py-1.5 rounded-lg bg-[#e50914] hover:bg-[#f6121d] flex items-center gap-1.5 transition z-10"
          title="Download"
        >
          <Download className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
          <span className="text-white text-[10px] md:text-xs font-semibold">Download</span>
        </button>
      </div>
    )
  }

  return (
    <div
      ref={carouselRef}
      className="relative h-[180px] md:h-[300px] lg:h-[400px] rounded-lg overflow-hidden group cursor-pointer"
      onClick={handlePosterClick}
    >
      {/* Background Image */}
      <img
        src={currentItem.image || "/placeholder.svg"}
        alt={currentItem.title}
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ objectFit: "cover" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* Navigation Arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          handlePrev()
        }}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition z-10"
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleNext()
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition z-10"
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </button>

      {/* Content */}
      <div className="absolute left-3 md:left-6 bottom-3 md:bottom-6 max-w-xl z-10">
        <h1 className="text-lg md:text-3xl font-bold text-white mb-1 md:mb-2">{currentItem.title}</h1>
        {currentItem.subtitle && (
          <p className="text-xs md:text-sm text-white/90 mb-2 md:mb-3 line-clamp-2">{currentItem.subtitle}</p>
        )}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleWatchNow()
            }}
            className="px-3 md:px-4 py-1 md:py-1.5 bg-[#e50914] hover:bg-[#f6121d] rounded-lg text-white text-xs md:text-sm font-bold transition"
          >
            Watch Now
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentIndex(index)
            }}
            className={`h-1 rounded-full transition-all ${
              index === currentIndex ? "w-4 bg-[#e50914]" : "w-1 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
