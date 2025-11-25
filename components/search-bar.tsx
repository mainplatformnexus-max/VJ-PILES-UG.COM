"use client"

import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, get } from "firebase/database"
import Link from "next/link"

interface SearchResult {
  id: string
  title: string
  type: "movie" | "series" | "original"
  image: string
  category?: string
}

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      return
    }

    const searchContent = async () => {
      setLoading(true)
      try {
        const query = searchQuery.toLowerCase()
        const allResults: SearchResult[] = []

        const moviesRef = ref(database, "movies")
        const seriesRef = ref(database, "series")
        const originalsRef = ref(database, "originals")

        const [moviesSnap, seriesSnap, originalsSnap] = await Promise.all([
          get(moviesRef),
          get(seriesRef),
          get(originalsRef),
        ])

        if (moviesSnap.exists()) {
          Object.entries(moviesSnap.val()).forEach(([id, movie]: any) => {
            if (movie.title.toLowerCase().includes(query)) {
              allResults.push({
                id,
                title: movie.title,
                type: "movie",
                image: movie.image,
                category: movie.category,
              })
            }
          })
        }

        if (seriesSnap.exists()) {
          Object.entries(seriesSnap.val()).forEach(([id, series]: any) => {
            if (series.title.toLowerCase().includes(query)) {
              allResults.push({
                id,
                title: series.title,
                type: "series",
                image: series.image,
                category: series.category,
              })
            }
          })
        }

        if (originalsSnap.exists()) {
          Object.entries(originalsSnap.val()).forEach(([id, original]: any) => {
            if (original.title.toLowerCase().includes(query)) {
              allResults.push({
                id,
                title: original.title,
                type: "original",
                image: original.image,
                category: original.category,
              })
            }
          })
        }

        setResults(allResults.slice(0, 8))
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    searchContent()
  }, [searchQuery])

  return (
    <div className="relative w-full md:flex-1 md:max-w-md">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 rounded-lg border border-slate-700 focus-within:border-blue-500 transition">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search movies, series..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="bg-transparent text-white placeholder-slate-400 outline-none flex-1 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("")
              setResults([])
            }}
            className="p-1 hover:bg-slate-700 rounded transition"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || searchQuery) && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            {loading && <div className="p-4 text-center text-slate-400">Searching...</div>}
            {!loading && results.length === 0 && searchQuery && (
              <div className="p-4 text-center text-slate-400">No results found</div>
            )}
            {!loading && results.length > 0 && (
              <div className="divide-y divide-slate-700">
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={`/watch/${result.id}?type=${result.type}`}
                    onClick={() => {
                      setIsOpen(false)
                      setSearchQuery("")
                    }}
                  >
                    <div className="p-3 hover:bg-slate-700/50 transition flex items-center gap-3 cursor-pointer">
                      <img
                        src={result.image || "/placeholder.svg"}
                        alt={result.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{result.title}</p>
                        <p className="text-xs text-slate-400 capitalize">{result.type}</p>
                        {result.category && <p className="text-xs text-slate-500">{result.category}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
