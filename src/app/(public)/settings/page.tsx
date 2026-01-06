"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LanguageSelectorCompact } from "@/components/translation/LanguageSelectorCompact";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

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
  
  // Debounce du username pour la vérification en temps réel
  const debouncedUsername = useDebounce(username, 500);
  const usernameAvailability = useQuery(
    api.users.isUsernameAvailable,
    isEditingUsername && debouncedUsername.length >= USERNAME_MIN_LENGTH && debouncedUsername !== user?.username
      ? { username: debouncedUsername }
      : "skip"
  );
  
  // Générer des suggestions stables basées sur le username
  const usernameSuggestions = useMemo(() => {
    if (!username || username.length < USERNAME_MIN_LENGTH) return [];
    const base = username.slice(0, USERNAME_MAX_LENGTH - 5); // Laisser de la place pour les suffixes
    const year = new Date().getFullYear();
    // Utiliser un hash simple basé sur le username pour générer des nombres stables
    const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return [
      `${base}_${year}`,
      `${base}${(hash % 100).toString().padStart(2, '0')}`,
      `${base}_${(hash % 1000).toString().padStart(3, '0')}`,
    ].filter(s => s.length <= USERNAME_MAX_LENGTH);
  }, [username]);
  
  // Synchroniser les états quand l'utilisateur change
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
    }
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-[614px] mx-auto px-4 text-center">
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
    <div className="min-h-screen bg-background">
      <div className="max-w-[614px] mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <SolarIcon icon="settings-bold" className="size-6 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        </div>

        <div className="space-y-6">
          {/* Compte */}
          <Card>
            <CardHeader>
              <CardTitle>{t('account.title')}</CardTitle>
              <CardDescription>{t('account.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('account.email')}</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  {t('account.emailDescription')}
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="username">{t('account.username')}</Label>
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
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            if (username.length < USERNAME_MIN_LENGTH) {
                              toast.error(t('account.usernameTooShort'), {
                                description: `${t('account.usernameTooShort')} (${USERNAME_MIN_LENGTH} ${t('common.all').toLowerCase()})`,
                              });
                              return;
                            }
                            if (username !== user?.username && usernameAvailability && !usernameAvailability.available) {
                              toast.error(t('account.usernameTaken'), {
                                description: t('account.usernameTaken'),
                              });
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
                            toast.error(t('account.error'), {
                              description: error instanceof Error ? error.message : t('account.updateUsernameError'),
                            });
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
                ) : (
                  <div className="flex items-center justify-between">
                    <Input
                      id="username"
                      value={username ? `@${username}` : t('account.notDefined')}
                      disabled
                      className="bg-muted/50 font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingUsername(true)}
                      className="ml-2"
                    >
{t('account.edit')}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('account.usernameDescription')}
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="name">{t('account.name')}</Label>
                {isEditingName ? (
                  <div className="flex gap-2">
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('account.name')}
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const result = await updateProfile({ 
                            name: name.trim() || undefined 
                          });
                          setIsEditingName(false);
                          toast.success(t('account.updated'), {
                            description: t('account.nameUpdated'),
                          });
                        } catch (error) {
                          console.error("Error updating name:", error);
                          toast.error(t('account.error'), {
                            description: error instanceof Error ? error.message : t('account.updateNameError'),
                          });
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
                  <div className="flex items-center justify-between">
                    <Input
                      id="name"
                      value={name || t('account.notDefined')}
                      disabled
                      className="bg-muted/50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingName(true)}
                      className="ml-2"
                    >
{t('account.edit')}
                    </Button>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="bio">{t('account.bio')}</Label>
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
                              const result = await updateProfile({ 
                                bio: bio.trim() || undefined 
                              });
                              setIsEditingBio(false);
                              toast.success(t('account.updated'), {
                                description: t('account.bioUpdated'),
                              });
                            } catch (error) {
                              console.error("Error updating bio:", error);
                              toast.error(t('account.error'), {
                                description: error instanceof Error ? error.message : t('account.updateBioError'),
                              });
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
            </CardContent>
          </Card>

          {/* Préférences */}
          <Card>
            <CardHeader>
              <CardTitle>{t('preferences.title')}</CardTitle>
              <CardDescription>{t('preferences.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{t('preferences.language')}</div>
                  <div className="text-sm text-muted-foreground">{t('preferences.languageDescription')}</div>
                </div>
                <LanguageSelectorCompact variant="outline" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold">{t('preferences.publicProfile')}</div>
                  <div className="text-sm text-muted-foreground">
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
                      toast.error(t('errors.generic'), {
                        description: t('errors.generic'),
                      });
                    }
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold">{t('preferences.breakingNews')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('preferences.breakingNewsDescription')}
                  </div>
                </div>
                <Switch
                  checked={user?.showBreakingNews !== false} // Défaut: true si non défini
                  onCheckedChange={async (checked) => {
                    try {
                      await updateProfile({ showBreakingNews: checked });
                      toast.success(t('preferences.preferenceUpdated'), {
                        description: checked 
                          ? t('preferences.breakingNewsShown') 
                          : t('preferences.breakingNewsHidden'),
                      });
                    } catch (error) {
                      console.error("Error updating breaking news preference:", error);
                      toast.error(t('errors.generic'), {
                        description: t('errors.generic'),
                      });
                    }
                  }}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold">{t('preferences.notifications')}</div>
                  <div className="text-sm text-muted-foreground">{t('preferences.notificationsDescription')}</div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>{t('stats.title')}</CardTitle>
                <CardDescription>{t('stats.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('stats.level')}</span>
                  <span className="font-semibold">{user.level || 1}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('stats.seeds')}</span>
                  <span className="font-semibold">{user.seedsBalance || 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t('stats.credibility')}</span>
                  <span className="font-semibold">{user.credibilityScore || 0}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* À propos */}
          <Card>
            <CardHeader>
              <CardTitle>{t('about.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>{t('about.description')}</p>
                <p>{t('about.version')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href="/rules">{t('about.rules')}</a>
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Espace pour la bottom nav mobile */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="max-w-[614px] mx-auto px-4 py-6">
            <Skeleton className="h-12 w-full mb-6" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
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

