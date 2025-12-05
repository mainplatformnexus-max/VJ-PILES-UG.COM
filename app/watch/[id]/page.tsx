"use client"

import { useEffect, useState } from "react"
import { database } from "@/lib/firebase"
import { ref, get } from "firebase/database"
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Share2, Heart, Download, Play } from 'lucide-react'
import Link from "next/link"
import { SubscriptionGuard } from "@/components/subscription-guard"

interface Movie {
  id: string
  title: string
  image: string
  rating: number
  year: number
  category: string
  streamlink: string
  isTrending: boolean
}

interface Episode {
  episodeNumber: number
  title: string
  streamlink: string
}

interface Series {
  id: string
  title: string
  image: string
  rating: number
  year: number
  category: string
  episodes: Episode[]
  isTrending?: boolean
}

function WatchPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const contentId = params.id as string
  const contentType = searchParams.get("type") || "movie"

  const [movie, setMovie] = useState<Movie | null>(null)
  const [series, setSeries] = useState<Series | null>(null)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const loadContent = async () => {
      try {
        if (contentType === "series") {
          const seriesRef = ref(database, `series/${contentId}`)
          const snapshot = await get(seriesRef)
          if (snapshot.exists()) {
            const seriesData = {
              id: contentId,
              ...snapshot.val(),
            }
            setSeries(seriesData)
            // Set first episode as default
            if (seriesData.episodes && seriesData.episodes.length > 0) {
              setCurrentEpisode(seriesData.episodes[0])
            }
          } else {
            router.push("/series")
          }
        } else {
          const movieRef = ref(database, `movies/${contentId}`)
          const snapshot = await get(movieRef)
          if (snapshot.exists()) {
            setMovie({
              id: contentId,
              ...snapshot.val(),
            })
          } else {
            router.push("/")
          }
        }
      } catch (error) {
        console.error("Error loading content:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    if (contentId) {
      loadContent()
    }
  }, [contentId, contentType, router])

  const getEmbedUrl = (url: string) => {
    // Check if it's a Google Drive link
    if (url.includes("drive.google.com")) {
      // Extract file ID from various Google Drive URL formats
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/)
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
      }
    }
    return url
  }

  const getDownloadUrl = (url: string) => {
    // Check if it's a Google Drive link
    if (url.includes("drive.google.com")) {
      // Extract file ID from various Google Drive URL formats
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/)
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
      }
    }
    return url
  }

  const handleDownload = async () => {
    const streamLink = series ? currentEpisode?.streamlink : movie?.streamlink
    const title = series ? `${series.title}_Episode_${currentEpisode?.episodeNumber}` : movie?.title

    if (!streamLink || !title) return

    try {
      setIsDownloading(true)

      const downloadUrl = getDownloadUrl(streamLink)

      // Create a temporary anchor element to trigger download
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `${title.replace(/[^a-z0-9]/gi, "_")}.mp4`
      link.target = "_blank"

      // Trigger the download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Reset downloading state after a delay
      setTimeout(() => {
        setIsDownloading(false)
      }, 2000)
    } catch (error) {
      console.error("Download error:", error)
      setIsDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-400 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  const content = series || movie
  if (!content) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Content not found</p>
      </div>
    )
  }

  const currentStreamLink = series ? currentEpisode?.streamlink : movie?.streamlink

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header with back button */}
      <div className="sticky top-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 sm:p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-slate-300 transition">
          <ArrowLeft className="w-6 h-6" />
          <span className="text-lg font-semibold">Back</span>
        </Link>
        <div className="text-white text-center flex-1">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{content.title}</h1>
          {series && currentEpisode && (
            <p className="text-sm text-slate-300">
              Episode {currentEpisode.episodeNumber}: {currentEpisode.title}
            </p>
          )}
        </div>
        <div className="w-12" />
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="hidden md:flex md:flex-col md:w-20 lg:w-24 bg-slate-950 border-r border-slate-800 justify-center items-center p-2 md:order-1">
          <button
            onClick={handleDownload}
            disabled={isDownloading || !currentStreamLink}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-b from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={series ? "Download Episode" : "Download Movie"}
          >
            <Download className={`w-6 h-6 ${isDownloading ? "animate-bounce" : ""}`} />
            <span className="text-[10px] text-center leading-tight">
              {isDownloading ? "..." : "Download"}
            </span>
          </button>
        </div>

        {currentStreamLink && (
          <div className="flex-1 bg-black md:order-2">
            <div
              className="relative w-full bg-black"
              style={{
                paddingBottom: "56.25%",
              }}
            >
              <iframe
                src={getEmbedUrl(currentStreamLink)}
                className="absolute top-0 left-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                style={{
                  border: "none",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Download Button - Mobile Only (Below Player) */}
      <div className="md:hidden bg-slate-900 p-4 border-b border-slate-800">
        <button
          onClick={handleDownload}
          disabled={isDownloading || !currentStreamLink}
          className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          <Download className={`w-5 h-5 ${isDownloading ? "animate-bounce" : ""}`} />
          <span>{isDownloading ? "Starting Download..." : series ? "Download Episode" : "Download Movie"}</span>
        </button>
      </div>

      {/* Content Info */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Title and Rating */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{content.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-slate-300">
                  <span className="text-lg font-semibold">{content.year}</span>
                  <div className="flex items-center gap-1 bg-slate-800/50 px-3 py-1 rounded-full">
                    <span className="text-yellow-400 font-bold">★ {content.rating}</span>
                  </div>
                  <span className="bg-slate-800/50 px-3 py-1 rounded-full text-sm">{content.category}</span>
                  {series && (
                    <span className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 text-cyan-400 px-3 py-1 rounded-full text-sm font-semibold border border-cyan-500/30">
                      {series.episodes.length} Episodes
                    </span>
                  )}
                  {content.isTrending && (
                    <span className="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-sm font-semibold">
                      Trending
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-3 rounded-full transition ${
                    isLiked ? "bg-red-600 text-white hover:bg-red-700" : "bg-slate-700 text-white hover:bg-slate-600"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-white" : ""}`} />
                </button>
                <button className="p-3 bg-slate-700 text-white rounded-full hover:bg-slate-600 transition">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {series && series.episodes && series.episodes.length > 0 && (
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50 mb-6">
              <h2 className="text-lg font-bold text-white mb-3">Episodes</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {series.episodes.map((episode) => (
                  <button
                    key={episode.episodeNumber}
                    onClick={() => setCurrentEpisode(episode)}
                    className={`p-2 rounded-lg border transition text-left ${
                      currentEpisode?.episodeNumber === episode.episodeNumber
                        ? "bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border-cyan-500/50"
                        : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                          currentEpisode?.episodeNumber === episode.episodeNumber
                            ? "bg-gradient-to-r from-cyan-500 to-purple-600"
                            : "bg-slate-700"
                        }`}
                      >
                        {currentEpisode?.episodeNumber === episode.episodeNumber ? (
                          <Play className="w-4 h-4 text-white fill-white" />
                        ) : (
                          <span className="text-white font-bold text-xs">{episode.episodeNumber}</span>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold text-xs">EP {episode.episodeNumber}</p>
                        <p className="text-slate-400 text-[10px] truncate">{episode.title}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description section */}
          <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700/50 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">About This {series ? "Series" : "Movie"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-2">Category</p>
                <p className="text-white font-semibold">{content.category}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Rating</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <span className="text-yellow-400">★</span> {content.rating} / 10
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-2">Release Year</p>
                <p className="text-white font-semibold">{content.year}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push("/")}
              className="px-8 py-4 border-2 border-slate-600 hover:border-slate-500 text-white rounded-lg font-semibold transition text-base"
            >
              Browse More
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WatchPage() {
  return (
    <SubscriptionGuard>
      <WatchPageContent />
    </SubscriptionGuard>
  )
}
