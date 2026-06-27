"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { isAuthenticated } from "@/lib/auth"
import {
  savePreferences,
  getPreferences,
  type UserPreferences,
  type Person,
  type Genre
} from "@/lib/preferences"
import { getGenreList, searchPerson, type TMDBPerson } from "@/lib/tmdb"
import { Settings, Save, Edit, Search, User, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PreferencesPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  
  const [isEditing, setIsEditing] = useState(false)
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([])
  
  // Form State
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [dob, setDob] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([])
  const [selectedActors, setSelectedActors] = useState<Person[]>([])

  // Actor Search State
  const [actorSearchQuery, setActorSearchQuery] = useState("")
  const [actorSearchResults, setActorSearchResults] = useState<TMDBPerson[]>([])
  const [isSearchingActors, setIsSearchingActors] = useState(false)

  const todayStr = new Date().toISOString().slice(0, 10)
  const isDobValid = Boolean(dob) && dob <= todayStr

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    setMounted(true)

    // Load static genres
    getGenreList().then(setAvailableGenres)

    const savedPreferences = getPreferences()
    if (savedPreferences) {
      setFirstName(savedPreferences.firstName || "")
      setLastName(savedPreferences.lastName || "")
      setDob(savedPreferences.dob || "")
      setSelectedGenres(savedPreferences.favoriteGenres || [])
      setSelectedActors(savedPreferences.favoriteActors || [])
    } else {
      setIsEditing(true)
    }
  }, [router])

  // Real-time actor search
  useEffect(() => {
    if (!actorSearchQuery.trim() || actorSearchQuery.length < 2) {
      setActorSearchResults([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingActors(true)
      try {
        const res = await searchPerson(actorSearchQuery)
        const actors = res.results.filter(p => p.known_for_department === 'Acting').slice(0, 5)
        setActorSearchResults(actors)
      } catch (err) {
        console.error("Failed to search actor", err)
      } finally {
        setIsSearchingActors(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [actorSearchQuery])

  const handleGenreToggle = (genre: Genre) => {
    if (selectedGenres.some(g => g.id === genre.id)) {
      setSelectedGenres(selectedGenres.filter(g => g.id !== genre.id))
    } else {
      setSelectedGenres([...selectedGenres, genre])
    }
  }

  const handleAddActor = (person: TMDBPerson) => {
    if (!selectedActors.some(a => a.id === person.id)) {
      setSelectedActors([...selectedActors, { 
        id: person.id, 
        name: person.name, 
        profilePath: person.profile_path || undefined
      }])
    }
    setActorSearchQuery("")
    setActorSearchResults([])
  }

  const handleRemoveActor = (actorId: number) => {
    setSelectedActors(selectedActors.filter(a => a.id !== actorId))
  }

  const handleSave = () => {
    if (!firstName.trim() || !dob) {
      toast({
        title: "Error",
        description: "Please fill in your basic details like First Name and Date of Birth.",
        variant: "destructive",
      })
      return
    }

    if (!isDobValid) {
      toast({
        title: "Error",
        description: "Date of Birth cannot be in the future.",
        variant: "destructive",
      })
      return
    }

    const formData: UserPreferences = {
      firstName,
      lastName,
      dob,
      favoriteGenres: selectedGenres,
      favoriteActors: selectedActors
    }

    savePreferences(formData)
    setIsEditing(false)
    toast({
      title: "Success",
      description: "Your preferences have been saved successfully!",
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  if (!mounted) return null

  const hasExistingPreferences = getPreferences() !== null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold text-foreground">User Preferences</h1>
              </div>
              {hasExistingPreferences && !isEditing && (
                <Button onClick={handleEdit} variant="outline" className="gap-2 bg-transparent">
                  <Edit className="h-4 w-4" />
                  Edit Settings
                </Button>
              )}
            </div>
            <p className="text-muted-foreground">Modify your settings to improve your movie recommendations.</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <div className="space-y-8">
              
              {/* Basic Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Basic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditing}
                      className="bg-background border-border disabled:opacity-70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditing}
                      className="bg-background border-border disabled:opacity-70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-foreground">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dob}
                      max={todayStr}
                      onChange={(e) => setDob(e.target.value)}
                      disabled={!isEditing}
                      className="bg-background border-border disabled:opacity-70"
                    />
                  </div>
                </div>
              </div>

              {/* Favorite Genres */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Favorite Categories</h3>
                <div className="grid grid-cols-2 gap-3">
                  {availableGenres.map((genre) => (
                    <div key={genre.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`genre-${genre.id}`}
                        checked={selectedGenres.some(g => g.id === genre.id)}
                        onCheckedChange={() => handleGenreToggle(genre)}
                        disabled={!isEditing}
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <Label
                        htmlFor={`genre-${genre.id}`}
                        className={`text-sm font-normal cursor-pointer ${!isEditing ? "opacity-70" : ""}`}
                      >
                        {genre.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Favorite Actors */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Favorite Actors / Actresses</h3>
                
                {isEditing && (
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Add Hero / Heroine... (E.g. Tom Cruise)" 
                      value={actorSearchQuery}
                      onChange={e => setActorSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                    {isSearchingActors && (
                      <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-primary" />
                    )}
                    
                    {/* Search Results Dropdown */}
                    {actorSearchResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-card border border-border rounded-md shadow-lg mt-1 overflow-hidden">
                        {actorSearchResults.map(person => (
                          <div 
                            key={person.id} 
                            onClick={() => handleAddActor(person)}
                            className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer transition-colors"
                          >
                             <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                               {person.profile_path ? (
                                 <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} className="w-full h-full object-cover" />
                               ) : (
                                 <User className="w-4 h-4 m-2 text-muted-foreground" />
                               )}
                             </div>
                             <span className="font-medium text-sm">{person.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {selectedActors.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No actors selected.</p>
                  )}
                  {selectedActors.map(actor => (
                    <div key={actor.id} className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-full">
                       {actor.profilePath && (
                         <img src={`https://image.tmdb.org/t/p/w45${actor.profilePath}`} className="w-5 h-5 rounded-full object-cover" />
                       )}
                       <span className="font-semibold text-sm">{actor.name}</span>
                       {isEditing && (
                         <button onClick={() => handleRemoveActor(actor.id)} className="hover:bg-primary/30 rounded-full p-0.5 transition-colors">
                           <X className="w-3 h-3" />
                         </button>
                       )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="pt-4">
                  <Button onClick={handleSave} className="w-full gap-2">
                    <Save className="h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              )}
            </div>
          </div>

          {hasExistingPreferences && !isEditing && (
            <div className="mt-6 bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground text-center">
                Your settings are saved. Click "Edit Settings" to make changes.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
