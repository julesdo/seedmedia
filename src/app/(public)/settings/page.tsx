"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { LanguageSelectorCompact } from "@/components/translation/LanguageSelectorCompact";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

// ✅ Composant pour sélectionner les centres d'intérêts
function InterestsSelector({ 
  user, 
  updateProfile,
  t 
}: { 
  user: any; 
  updateProfile: any;
  t: any;
}) {
  const availableInterests = [
    "Climat",
    "Technologie",
    "Diplomatie",
    "Économie",
    "Santé",
    "Éducation",
    "Sécurité",
    "Culture",
    "Environnement",
    "Innovation",
    "Politique",
    "Social",
  ];

  const [localInterests, setLocalInterests] = useState<string[]>(user?.interests || []);
  
  useEffect(() => {
    if (user?.interests) {
      setLocalInterests(user.interests);
    }
  }, [user?.interests]);

  const handleInterestToggle = async (interest: string) => {
    const newInterests = localInterests.includes(interest)
      ? localInterests.filter((i: string) => i !== interest)
      : [...localInterests, interest];
    
    setLocalInterests(newInterests);
    
    try {
      await updateProfile({ interests: newInterests });
      toast.success("Centres d'intérêts mis à jour");
    } catch (error) {
      console.error("Error updating interests:", error);
      setLocalInterests(user?.interests || []);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {availableInterests.map((interest) => {
        const isSelected = localInterests.includes(interest);
        return (
          <Button
            key={interest}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => handleInterestToggle(interest)}
            className={cn(
              "cursor-pointer transition-all",
              isSelected && "bg-primary text-primary-foreground"
            )}
          >
            {interest}
          </Button>
        );
      })}
    </div>
  );
}

// ✅ Composant pour sélectionner les filtres par défaut
function DefaultFiltersSelector({ 
  user, 
  updateProfile,
  t 
}: { 
  user: any; 
  updateProfile: any;
  t: any;
}) {
  const impactLabels = {
    1: { label: "Local", icon: "map-point-bold" },
    2: { label: "National", icon: "flag-bold" },
    3: { label: "Régional", icon: "global-bold" },
    4: { label: "International", icon: "planet-bold" },
    5: { label: "Global", icon: "earth-bold" },
  };

  const sentimentLabels = {
    positive: "Positif",
    negative: "Négatif",
    neutral: "Neutre",
  };

  const defaultFiltersFromUser = user?.defaultFilters || {
    impactLevels: [1, 2, 3, 4, 5],
    sentiments: ["positive", "negative", "neutral"],
    regions: [],
    deciderTypes: [],
    types: [],
  };

  const [localFilters, setLocalFilters] = useState(defaultFiltersFromUser);
  
  useEffect(() => {
    if (user?.defaultFilters) {
      setLocalFilters(user.defaultFilters);
    } else {
      setLocalFilters({
        impactLevels: [1, 2, 3, 4, 5],
        sentiments: ["positive", "negative", "neutral"],
        regions: [],
        deciderTypes: [],
        types: [],
      });
    }
  }, [user?.defaultFilters]);

  const toggleImpactLevel = async (level: number) => {
    const currentLevels = localFilters.impactLevels || [1, 2, 3, 4, 5];
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter((l: number) => l !== level)
      : [...currentLevels, level];
    
    const updatedFilters = {
      ...localFilters,
      impactLevels: newLevels.length > 0 ? newLevels : [1, 2, 3, 4, 5]
    };
    setLocalFilters(updatedFilters);
    
    try {
      await updateProfile({ 
        defaultFilters: updatedFilters
      });
      toast.success("Filtre mis à jour");
    } catch (error) {
      console.error("Error updating filter:", error);
      setLocalFilters(defaultFiltersFromUser);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const toggleSentiment = async (sentiment: "positive" | "negative" | "neutral") => {
    const currentSentiments = localFilters.sentiments || ["positive", "negative", "neutral"];
    const newSentiments = currentSentiments.includes(sentiment)
      ? currentSentiments.filter((s: string) => s !== sentiment)
      : [...currentSentiments, sentiment];
    
    const updatedFilters = {
      ...localFilters,
      sentiments: newSentiments.length > 0 ? newSentiments : ["positive", "negative", "neutral"]
    };
    setLocalFilters(updatedFilters);
    
    try {
      await updateProfile({ 
        defaultFilters: updatedFilters
      });
      toast.success("Filtre mis à jour");
    } catch (error) {
      console.error("Error updating filter:", error);
      setLocalFilters(defaultFiltersFromUser);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2">Niveaux d'impact</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((level) => {
            const impact = impactLabels[level as keyof typeof impactLabels];
            const isSelected = (localFilters.impactLevels || []).includes(level);
            return (
              <Button
                key={level}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleImpactLevel(level)}
                className={cn(
                  "cursor-pointer transition-all",
                  isSelected && "bg-primary text-primary-foreground"
                )}
              >
                <SolarIcon icon={impact.icon} className="size-3 mr-1" />
                {impact.label}
              </Button>
            );
          })}
        </div>
      </div>
      
      <Separator />
      
      <div>
        <Label className="mb-2">Sentiment</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {(["positive", "negative", "neutral"] as const).map((sentiment) => {
            const isSelected = (localFilters.sentiments || []).includes(sentiment);
            return (
              <Button
                key={sentiment}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSentiment(sentiment)}
                className={cn(
                  "cursor-pointer transition-all",
                  isSelected && "bg-primary text-primary-foreground"
                )}
              >
                {sentimentLabels[sentiment]}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SettingsContent() {
  const { user, isAuthenticated } = useUser();
  const router = useRouter();
  const updateProfile = useMutation(api.users.updateUserProfile);
  const t = useTranslations('settings');
  
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const BIO_MAX_LENGTH = 500;
  const USERNAME_MIN_LENGTH = 3;
  const USERNAME_MAX_LENGTH = 30;
  
  const debouncedUsername = useDebounce(username, 500);
  const usernameAvailability = useQuery(
    api.users.isUsernameAvailable,
    isEditingUsername && debouncedUsername.length >= USERNAME_MIN_LENGTH && debouncedUsername !== user?.username
      ? { username: debouncedUsername }
      : "skip"
  );
  
  const usernameSuggestions = useMemo(() => {
    if (!username || username.length < USERNAME_MIN_LENGTH) return [];
    const base = username.slice(0, USERNAME_MAX_LENGTH - 5);
    const year = new Date().getFullYear();
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return [
      `${base}_${year}`,
      `${base}${(hash % 100).toString().padStart(2, '0')}`,
      `${base}_${(hash % 1000).toString().padStart(3, '0')}`,
    ].filter(s => s.length <= USERNAME_MAX_LENGTH);
  }, [username]);
  
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
    }
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <SolarIcon icon="settings-bold" className="size-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('notAuthenticated.title')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('notAuthenticated.description')}
          </p>
          <Button onClick={() => router.push("/sign-in")}>
            {t('notAuthenticated.signIn')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-4">
      <div className="max-w-2xl mx-auto w-full px-4 pt-6 pb-4">
        {/* Header simple */}
        <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

        <div className="space-y-6">
          {/* Section Compte */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t('account.title')}</h2>
            
            {/* Email - Lecture seule */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">{t('account.email')}</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted/50"
              />
            </div>
            
            <Separator />
            
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm">{t('account.username')}</Label>
              {isEditingUsername ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => {
                          const value = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, "");
                          if (value.length <= USERNAME_MAX_LENGTH) {
                            setUsername(value);
                          }
                        }}
                        placeholder="nom_utilisateur"
                        className={cn(
                          "font-mono",
                          username.length >= USERNAME_MIN_LENGTH && username !== user?.username && usernameAvailability !== undefined && (
                            usernameAvailability.available
                              ? "border-green-500 focus-visible:ring-green-500"
                              : "border-destructive focus-visible:ring-destructive"
                          )
                        )}
                      />
                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {username.length}/{USERNAME_MAX_LENGTH} {t('account.charactersDescription')}
                          {username.length > 0 && username.length < USERNAME_MIN_LENGTH && (
                            <span className="text-destructive ml-2">
                              {t('account.minimumCharacters', { count: USERNAME_MIN_LENGTH })}
                            </span>
                          )}
                        </p>
                        {username.length >= USERNAME_MIN_LENGTH && username !== user?.username && (
                          <>
                            {usernameAvailability === undefined ? (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="animate-spin">⏳</span>
                                {t('account.checking')}
                              </p>
                            ) : usernameAvailability.available ? (
                              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <SolarIcon icon="check-circle-bold" className="size-3" />
                                {t('account.usernameAvailable')}
                              </p>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-xs text-destructive flex items-center gap-1">
                                  <SolarIcon icon="close-circle-bold" className="size-3" />
                                  {t('account.usernameTakenMessage')}
                                </p>
                                <div className="text-xs text-muted-foreground">
                                  <p className="mb-1">{t('account.suggestions')}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {usernameSuggestions.map((suggestion, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => setUsername(suggestion)}
                                        className="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs font-mono border border-border hover:border-foreground/20 transition-colors"
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            if (username.length < USERNAME_MIN_LENGTH) {
                              toast.error(t('account.usernameTooShort'));
                              return;
                            }
                            if (username !== user?.username && usernameAvailability && !usernameAvailability.available) {
                              toast.error(t('account.usernameTaken'));
                              return;
                            }
                            await updateProfile({ 
                              username: username.trim() || undefined 
                            });
                            setIsEditingUsername(false);
                            toast.success(t('account.updated'), {
                              description: t('account.usernameUpdated'),
                            });
                          } catch (error) {
                            console.error("Error updating username:", error);
                            toast.error(t('account.error'));
                          }
                        }}
                        disabled={username.length >= USERNAME_MIN_LENGTH && username !== user?.username && usernameAvailability !== undefined && !usernameAvailability.available}
                      >
                        {t('account.save')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUsername(user?.username || "");
                          setIsEditingUsername(false);
                        }}
                      >
                        {t('account.cancel')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="username"
                    value={username ? `@${username}` : t('account.notDefined')}
                    disabled
                    className="bg-muted/50 font-mono flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingUsername(true)}
                  >
                    {t('account.edit')}
                  </Button>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">{t('account.name')}</Label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('account.name')}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await updateProfile({ 
                          name: name.trim() || undefined 
                        });
                        setIsEditingName(false);
                        toast.success(t('account.updated'), {
                          description: t('account.nameUpdated'),
                        });
                      } catch (error) {
                        console.error("Error updating name:", error);
                        toast.error(t('account.error'));
                      }
                    }}
                  >
                    {t('account.save')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setName(user?.name || "");
                      setIsEditingName(false);
                    }}
                  >
                    {t('account.cancel')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="name"
                    value={name || t('account.notDefined')}
                    disabled
                    className="bg-muted/50 flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingName(true)}
                  >
                    {t('account.edit')}
                  </Button>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm">{t('account.bio')}</Label>
              {isEditingBio ? (
                <div className="space-y-2">
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= BIO_MAX_LENGTH) {
                        setBio(value);
                      }
                    }}
                    placeholder={t('account.bioDescription')}
                    className="min-h-[100px] resize-none"
                    maxLength={BIO_MAX_LENGTH}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {bio.length}/{BIO_MAX_LENGTH} {t('account.characters')}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await updateProfile({ 
                              bio: bio.trim() || undefined 
                            });
                            setIsEditingBio(false);
                            toast.success(t('account.updated'), {
                              description: t('account.bioUpdated'),
                            });
                          } catch (error) {
                            console.error("Error updating bio:", error);
                            toast.error(t('account.error'));
                          }
                        }}
                      >
                        {t('account.save')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBio(user?.bio || "");
                          setIsEditingBio(false);
                        }}
                      >
                        {t('account.cancel')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    id="bio"
                    value={bio || t('account.noBio')}
                    disabled
                    className="bg-muted/50 min-h-[60px] resize-none"
                    readOnly
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingBio(true)}
                    >
                      {t('account.edit')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Section Préférences */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t('preferences.title')}</h2>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <div className="font-medium text-sm">{t('preferences.language')}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t('preferences.languageDescription')}</div>
              </div>
              <LanguageSelectorCompact variant="outline" />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <div className="font-medium text-sm">{t('preferences.publicProfile')}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t('preferences.publicProfileDescription')}
                </div>
              </div>
              <Switch
                checked={user?.isPublic || false}
                onCheckedChange={async (checked) => {
                  try {
                    await updateProfile({ isPublic: checked });
                    toast.success(t('preferences.profileUpdated'), {
                      description: checked 
                        ? t('preferences.profilePublic') 
                        : t('preferences.profilePrivate'),
                    });
                  } catch (error) {
                    console.error("Error updating profile visibility:", error);
                    toast.error(t('errors.generic'));
                  }
                }}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <div className="font-medium text-sm">{t('preferences.breakingNews')}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t('preferences.breakingNewsDescription')}
                </div>
              </div>
              <Switch
                checked={user?.showBreakingNews !== false}
                onCheckedChange={async (checked) => {
                  try {
                    await updateProfile({ showBreakingNews: checked });
                    toast.success(t('preferences.preferenceUpdated'));
                  } catch (error) {
                    console.error("Error updating breaking news preference:", error);
                    toast.error(t('errors.generic'));
                  }
                }}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <div className="font-medium text-sm">{t('preferences.notifications')}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t('preferences.notificationsDescription')}</div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </div>

          <Separator className="my-6" />

          {/* Section Municipales 2026 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">🗳️ Municipales 2026</h2>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm mb-2 block">Votre région</Label>
                <Select
                  value={user?.municipales2026?.selectedRegion || ""}
                  onValueChange={async (value) => {
                    try {
                      await updateProfile({ municipales2026Region: value || undefined });
                      toast.success("Région mise à jour", {
                        description: value 
                          ? `Vous avez rejoint Team ${value} !` 
                          : "Région désélectionnée",
                      });
                    } catch (error) {
                      console.error("Error updating region:", error);
                      toast.error("Erreur", {
                        description: "Impossible de mettre à jour la région",
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une région" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune région</SelectItem>
                    <SelectItem value="Auvergne-Rhône-Alpes">Auvergne-Rhône-Alpes</SelectItem>
                    <SelectItem value="Bourgogne-Franche-Comté">Bourgogne-Franche-Comté</SelectItem>
                    <SelectItem value="Bretagne">Bretagne</SelectItem>
                    <SelectItem value="Centre-Val de Loire">Centre-Val de Loire</SelectItem>
                    <SelectItem value="Corse">Corse</SelectItem>
                    <SelectItem value="Grand Est">Grand Est</SelectItem>
                    <SelectItem value="Hauts-de-France">Hauts-de-France</SelectItem>
                    <SelectItem value="Île-de-France">Île-de-France</SelectItem>
                    <SelectItem value="Normandie">Normandie</SelectItem>
                    <SelectItem value="Nouvelle-Aquitaine">Nouvelle-Aquitaine</SelectItem>
                    <SelectItem value="Occitanie">Occitanie</SelectItem>
                    <SelectItem value="Pays de la Loire">Pays de la Loire</SelectItem>
                    <SelectItem value="Provence-Alpes-Côte d'Azur">Provence-Alpes-Côte d'Azur</SelectItem>
                    <SelectItem value="Guadeloupe">Guadeloupe</SelectItem>
                    <SelectItem value="Martinique">Martinique</SelectItem>
                    <SelectItem value="Guyane">Guyane</SelectItem>
                    <SelectItem value="La Réunion">La Réunion</SelectItem>
                    <SelectItem value="Mayotte">Mayotte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {user?.municipales2026?.selectedRegion && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">
                      🏆 Team {user.municipales2026.selectedRegion}
                    </div>
                    <Link 
                      href="/municipales"
                      className="text-xs text-primary hover:underline"
                    >
                      Classement →
                    </Link>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Prédictions : {user.municipales2026.correctPredictions || 0} / {user.municipales2026.totalPredictions || 0}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Section Centres d'intérêts */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Centres d'intérêts</h2>
            <InterestsSelector 
              user={user} 
              updateProfile={updateProfile}
              t={t}
            />
          </div>

          <Separator className="my-6" />

          {/* Section Filtres par défaut */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Filtres par défaut</h2>
            <DefaultFiltersSelector 
              user={user} 
              updateProfile={updateProfile}
              t={t}
            />
          </div>

          <Separator className="my-6" />

          {/* Section Statistiques */}
          {user && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{t('stats.title')}</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{t('stats.level')}</span>
                  <span className="font-semibold">{user.level || 1}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{t('stats.seeds')}</span>
                  <span className="font-semibold">{user.seedsBalance || 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{t('stats.credibility')}</span>
                  <span className="font-semibold">{user.credibilityScore || 0}</span>
                </div>
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Section À propos */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t('about.title')}</h2>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>{t('about.description')}</p>
              <p>{t('about.version')}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/rules">{t('about.rules')}</Link>
              </Button>
              <Button variant="ghost" size="sm">
                {t('about.help')}
              </Button>
              <Button variant="ghost" size="sm">
                {t('about.privacy')}
              </Button>
              <Button variant="ghost" size="sm">
                {t('about.terms')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
