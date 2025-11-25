"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { database } from "@/lib/firebase"
import { ref, onValue } from "firebase/database"
import { Play } from "lucide-react"
import { useRouter } from "next/navigation"

interface CarouselItem {
  id: string
  title: string
  subtitle: string
  image: string
  contentType?: string
  contentId?: string
  createdAt?: string
}

export default function FeaturedCarousel() {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const carouselRef = ref(database, "carousel")
    const unsubscribe = onValue(carouselRef, (snapshot) => {
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

  const handlePlayClick = (item: CarouselItem, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (item.contentId) {
      const type = item.contentType || "movie"
      router.push(`/watch/${item.contentId}?type=${type}`)
    }
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 h-40 sm:h-44 md:h-48 lg:h-56 flex items-center justify-center">
        <div className="text-white">Loading carousel...</div>
      </div>
    )
  }

  if (carouselItems.length === 0) {
    return (
      <div className="px-4 sm:px-6 h-40 sm:h-44 md:h-48 lg:h-56 flex items-center justify-center bg-slate-800 rounded-lg">
        <div className="text-slate-400 text-center">
          <p>No carousel content uploaded yet</p>
          <p className="text-sm">Admin can add content from the admin panel</p>
        </div>
      </div>
    )
  }

  const itemsToDisplay = carouselItems.length === 1 ? Array(6).fill(carouselItems[0]) : carouselItems
  const displayArray = [...itemsToDisplay, ...itemsToDisplay, ...itemsToDisplay]

  return (
    <div className="px-4 sm:px-6 overflow-hidden">
      <style>{`
        @keyframes seamlessScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-${100 / 3}%));
          }
        }
        
        .carousel-track {
          display: flex;
          animation: seamlessScroll ${carouselItems.length === 1 ? "40s" : "120s"} linear infinite;
          width: fit-content;
        }
        
        .carousel-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="carousel-track gap-3 sm:gap-4 lg:gap-6">
        {displayArray.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex-shrink-0 w-80 md:w-96 lg:w-[450px] relative h-40 sm:h-44 md:h-48 lg:h-56 rounded-xl sm:rounded-2xl overflow-hidden group"
          >
            <img
              src={item.image || "/placeholder.svg"}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-end justify-end p-3 sm:p-4 pointer-events-none">
              <div className="bg-black/50 backdrop-blur-sm p-2 sm:p-3 rounded-lg max-w-[180px] sm:max-w-[220px] pointer-events-auto">
                <h2 className="text-sm sm:text-base font-bold mb-1 leading-tight line-clamp-2 text-white">
                  {item.title}
                </h2>
                {item.subtitle && <p className="text-xs opacity-90 mb-2 line-clamp-1 text-white/90">{item.subtitle}</p>}
                {item.contentId && (
                  <button
                    onClick={(e) => handlePlayClick(item, e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 rounded-full text-white text-xs font-semibold transition-all duration-300 hover:scale-105 shadow-lg cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Watch Now</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
