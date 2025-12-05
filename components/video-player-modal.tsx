"use client"

import { X, Download } from 'lucide-react'
import { useState } from 'react'

interface VideoPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  title: string
  contentId: string
  contentType: string
}

export default function VideoPlayerModal({
  isOpen,
  onClose,
  videoUrl,
  title,
  contentId,
  contentType
}: VideoPlayerModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  if (!isOpen) return null

  const getEmbedUrl = (url: string) => {
    if (url.includes("drive.google.com")) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/)
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
      }
    }
    return url
  }

  const getDownloadUrl = (url: string) => {
    if (url.includes("drive.google.com")) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/)
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`
      }
    }
    return url
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      const downloadUrl = getDownloadUrl(videoUrl)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `${title.replace(/[^a-z0-9]/gi, "_")}.mp4`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => setIsDownloading(false), 2000)
    } catch (error) {
      console.error("Download error:", error)
      setIsDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <div className="relative w-full max-w-6xl mx-4">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-red-500 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={getEmbedUrl(videoUrl)}
            className="absolute top-0 left-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ border: "none" }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1 px-2 py-1 bg-[#e50914] hover:bg-[#f6121d] rounded text-white text-[10px] font-semibold transition disabled:opacity-50"
          >
            <Download className={`w-3 h-3 ${isDownloading ? "animate-bounce" : ""}`} />
            {isDownloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  )
}
