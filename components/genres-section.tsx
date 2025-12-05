"use client"

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { database } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'

interface GenresProps {
  onFilterChange: (filter: string) => void
}

export default function GenresSection({ onFilterChange }: GenresProps) {
  const [genres, setGenres] = useState<{id: string, name: string, image: string, count: number}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const genreMap = new Map<string, {image: string, count: number}>()

    const fetchGenres = async () => {
      const paths = ['movies', 'series', 'originals', 'animation', 'music']
      
      const unsubscribers = paths.map(path => {
        const contentRef = ref(database, path)
        return onValue(contentRef, (snapshot) => {
          const data = snapshot.val()
          if (data) {
            Object.values(data).forEach((item: any) => {
              if (item.category) {
                const existing = genreMap.get(item.category)
                if (existing) {
                  existing.count++
                } else {
                  genreMap.set(item.category, {
                    image: item.poster || item.image || '/placeholder.svg',
                    count: 1
                  })
                }
              }
            })
          }
          
          const genresArray = Array.from(genreMap.entries()).map(([name, data]) => ({
            id: name.toLowerCase(),
            name,
            image: data.image,
            count: data.count
          }))
          genresArray.sort((a, b) => b.count - a.count)
          setGenres(genresArray.slice(0, 6))
          setLoading(false)
        })
      })

      return () => unsubscribers.forEach(unsub => unsub())
    }

    fetchGenres()
  }, [])

  if (loading) {
    return (
      <div className="flex-shrink-0">
        <h2 className="text-[10px] font-bold text-foreground mb-1">Genres</h2>
        <p className="text-[8px] text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <h2 className="text-[10px] font-bold text-foreground">Genres</h2>
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

      <div className="grid grid-cols-2 gap-1">
        {genres.map((genre) => (
          <button
            key={genre.id}
            onClick={() => onFilterChange(genre.name.toLowerCase())}
            className="relative h-10 rounded overflow-hidden group hover:scale-105 transition-transform"
          >
            <Image src={genre.image || "/placeholder.svg"} alt={genre.name} fill className="object-cover brightness-75" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0.5 left-1">
              <span className="text-white font-bold text-[8px]">{genre.name}</span>
              <span className="text-white/70 text-[6px] ml-1">({genre.count})</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
