"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Film, User, Search, Loader2, ArrowRight, ArrowLeft, CheckCircle2, X } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"
import { savePreferences, hasPreferences, type UserPreferences, type Person, type Genre } from "@/lib/preferences"
import { getGenreList, searchPerson, type TMDBGenre, type TMDBPerson } from "@/lib/tmdb"

export default function OnboardingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(1)
  
  // Data
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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }
    
    // If they already have preferences, don't show the wizard
    if (hasPreferences()) {
      router.push("/home")
      return
    }

    setMounted(true)
    
    // Load genres
    getGenreList().then(genres => {
      setAvailableGenres(genres)
    })
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
        // Filter out people who aren't primarily actors/actresses
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

  if (!mounted) return null

  const todayStr = new Date().toISOString().slice(0, 10)
  const isDobValid = Boolean(dob) && dob <= todayStr

  const handleNext = () => setStep(prev => prev + 1)
  const handlePrev = () => setStep(prev => prev - 1)

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

  const handleFinish = () => {
    if (!isDobValid) return
    const prefs: UserPreferences = {
      firstName,
      lastName,
      dob,
      favoriteGenres: selectedGenres,
      favoriteActors: selectedActors
    }
    savePreferences(prefs)
    router.push("/home")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <Card className="w-full max-w-2xl bg-card border-border shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-2">
              <Film className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-foreground tracking-wide">CineStream Setup</span>
            </div>
          </div>
          
          {/* Progress Indicators */}
          <div className="flex justify-center items-center gap-2 py-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === i ? "bg-primary text-primary-foreground" : step > i ? "bg-primary/50 text-foreground" : "bg-muted text-muted-foreground"}`}>
                  {step > i ? <CheckCircle2 className="h-5 w-5" /> : i}
                </div>
                {i < 3 && <div className={`w-12 h-1 ${step > i ? "bg-primary/50" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          <CardTitle className="text-3xl text-foreground">
            {step === 1 && "Welcome! Let's get to know you"}
            {step === 2 && "What types of movies do you like?"}
            {step === 3 && "Who are your favorite actors?"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-lg">
            {step === 1 && "Enter your basic details to personalize your experience."}
            {step === 2 && "Select the categories you enjoy watching the most."}
            {step === 3 && "Search and add your favorite heroes and heroines."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="min-h-[400px]">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6 max-w-md mx-auto mt-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-md">First Name</Label>
                <Input id="firstName" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-md">Last Name</Label>
                <Input id="lastName" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-md">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  max={todayStr}
                  onChange={e => setDob(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableGenres.map((genre) => {
                  const isSelected = selectedGenres.some(g => g.id === genre.id)
                  return (
                    <div 
                      key={genre.id} 
                      onClick={() => handleGenreToggle(genre)}
                      className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${isSelected ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/50"}`}
                    >
                      <Checkbox 
                        checked={isSelected} 
                        className="mr-3 pointer-events-none data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                      />
                      <span className="font-semibold">{genre.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-8 mt-4 max-w-lg mx-auto">
              <div className="space-y-4">
                <Label className="text-md">Search Actors / Actresses</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="E.g. Leonardo DiCaprio, Shah Rukh Khan..." 
                    value={actorSearchQuery}
                    onChange={e => setActorSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                  {isSearchingActors && (
                    <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-primary" />
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {actorSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full max-w-lg bg-card border border-border rounded-md shadow-2xl mt-1 overflow-hidden">
                    {actorSearchResults.map(person => (
                      <div 
                        key={person.id} 
                        onClick={() => handleAddActor(person)}
                        className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors"
                      >
                         <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                           {person.profile_path ? (
                             <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} className="w-full h-full object-cover" alt={person.name} />
                           ) : (
                             <User className="w-6 h-6 m-2 text-muted-foreground" />
                           )}
                         </div>
                         <span className="font-semibold">{person.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Actors Pills */}
              <div className="space-y-3">
                <Label className="text-md text-muted-foreground">Your Favorites:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedActors.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">None selected yet. Search above!</p>
                  )}
                  {selectedActors.map(actor => (
                    <div key={actor.id} className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-full">
                       {actor.profilePath && (
                         <img src={`https://image.tmdb.org/t/p/w45${actor.profilePath}`} className="w-5 h-5 rounded-full object-cover" alt={actor.name} />
                       )}
                       <span className="font-semibold text-sm">{actor.name}</span>
                       <button onClick={() => handleRemoveActor(actor.id)} className="hover:bg-primary/30 rounded-full p-0.5 transition-colors">
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between pt-6 border-t border-border mt-4">
          <Button variant="outline" onClick={handlePrev} disabled={step === 1} className="gap-2 font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          
          {step < 3 ? (
            <Button onClick={handleNext} disabled={step === 1 && (!firstName || !isDobValid)} className="gap-2 font-semibold px-8">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="gap-2 font-semibold bg-green-600 hover:bg-green-700 text-white px-8">
              Finish Setup <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
