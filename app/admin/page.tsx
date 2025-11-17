"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import TopHeader from "@/components/top-header"
import AdminNav from "@/components/admin-nav"
import { Card } from "@/components/ui/card"
import { database } from "@/lib/firebase"
import { ref as dbRef, get } from "firebase/database"

export default function AdminDashboard() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({ users: 0, movies: 0, carousel: 0, series: 0, originals: 0, music: 0 })

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/login")
    }
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      loadStats()
    }
  }, [isAdmin])

  const loadStats = async () => {
    try {
      const [moviesSnap, carouselSnap, seriesSnap, originalsSnap, usersSnap] = await Promise.all([
        get(dbRef(database, "movies")),
        get(dbRef(database, "carousel")),
        get(dbRef(database, "series")),
        get(dbRef(database, "originals")),
        get(dbRef(database, "users")),
      ])
      
      let musicCount = 0
      if (moviesSnap.exists()) {
        const moviesData = moviesSnap.val()
        musicCount = Object.values(moviesData).filter((item: any) => item.category?.toLowerCase() === 'music').length
      }
      
      setStats({
        users: usersSnap.exists() ? Object.keys(usersSnap.val()).length : 0,
        movies: moviesSnap.exists() ? Object.keys(moviesSnap.val()).length : 0,
        carousel: carouselSnap.exists() ? Object.keys(carouselSnap.val()).length : 0,
        series: seriesSnap.exists() ? Object.keys(seriesSnap.val()).length : 0,
        originals: originalsSnap.exists() ? Object.keys(originalsSnap.val()).length : 0,
        music: musicCount,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const handleFilterChange = (filter: string) => {
    if (filter === 'settings') {
      router.push('/settings')
    } else {
      router.push(`/?filter=${filter}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <Sidebar onFilterChange={handleFilterChange} activeFilter="settings" />

      <div className="flex-1 ml-48 flex flex-col h-screen overflow-hidden">
        <TopHeader />
        <AdminNav />

        <main className="flex-1 pt-24 overflow-y-auto p-6">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground mb-8">Welcome back, {user?.email}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <Card className="bg-card border-border p-6">
              <div className="text-muted-foreground text-sm mb-2">Total Users</div>
              <div className="text-4xl font-bold text-foreground">{stats.users}</div>
            </Card>

            <Card className="bg-card border-border p-6">
              <div className="text-muted-foreground text-sm mb-2">Total Movies</div>
              <div className="text-4xl font-bold text-foreground">{stats.movies}</div>
            </Card>

            <Card className="bg-card border-border p-6">
              <div className="text-muted-foreground text-sm mb-2">Total Series</div>
              <div className="text-4xl font-bold text-foreground">{stats.series}</div>
            </Card>

            <Card className="bg-card border-border p-6">
              <div className="text-muted-foreground text-sm mb-2">Total Originals</div>
              <div className="text-4xl font-bold text-foreground">{stats.originals}</div>
            </Card>

            <Card className="bg-card border-border p-6">
              <div className="text-muted-foreground text-sm mb-2">Music Videos</div>
              <div className="text-4xl font-bold text-foreground">{stats.music}</div>
            </Card>

            <Card className="bg-card border-border p-6">
              <div className="text-muted-foreground text-sm mb-2">Carousel Items</div>
              <div className="text-4xl font-bold text-foreground">{stats.carousel}</div>
            </Card>
          </div>

          <Card className="bg-card border-border p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground mb-2">📽️ Manage Movies</p>
                <p className="text-sm">Add, edit, or delete movie content and metadata</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">📺 Manage Series</p>
                <p className="text-sm">Add series with episodes and manage them</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">⭐ Manage Originals</p>
                <p className="text-sm">Upload exclusive original content</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">🎵 Manage Music</p>
                <p className="text-sm">Upload and manage music videos</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">🎠 Manage Carousel</p>
                <p className="text-sm">Update featured carousel items and banners</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">👥 Manage Users</p>
                <p className="text-sm">View registered users and their activity</p>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
