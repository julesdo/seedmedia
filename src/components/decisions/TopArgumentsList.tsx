"use client";

import { useState, useRef, useEffect, memo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { Skeleton } from "@/components/ui/skeleton";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { formatDistanceToNow } from "date-fns";
import { MentionAutocomplete } from "@/components/comments/MentionAutocomplete";
import { CommentBoostDrawer } from "@/components/comments/CommentBoostDrawer";
import Link from "next/link";

interface TopArgumentsListProps {
  decisionId: Id<"decisions">;
}

/**
 * 🎯 FEATURE 3: Commentaires en vedette - Liste des commentaires (style Instagram)
 * Formulaire inline en bas, pas de modal
 */
export const TopArgumentsList = memo(function TopArgumentsList({ decisionId }: TopArgumentsListProps) {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<Id<"users">[]>([]);
  const [boostingArgumentId, setBoostingArgumentId] = useState<Id<"topArguments"> | null>(null);
  const [mentionedUsers, setMentionedUsers] = useState<Array<{
    _id: string;
    username?: string;
    name?: string;
    image?: string;
  }>>([]);
  const textareaRef = useRef<HTMLDivElement>(null);

  // Récupérer TOUS les commentaires (feed complet, pas seulement le top)
  const topArguments = useQuery(api.topArguments.getAllArguments, {
    decisionId,
  });

  const bidOnArgument = useMutation(api.topArguments.bidOnArgument);
  const boostArgument = useMutation(api.topArguments.boostArgument);


  // Gérer les touches du clavier
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Si Enter + Cmd/Ctrl, publier
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePublish();
    }
  };

  // Supprimer une mention du contenu
  const handleRemoveMention = (username: string) => {
    if (!textareaRef.current) return;
    const regex = new RegExp(`@${username}\\s?`, "g");
    const newContent = content.replace(regex, "");
    setContent(newContent);
    const userToRemove = mentionedUsers.find((u) => u.username?.toLowerCase() === username.toLowerCase());
    setMentionedUsers((prev) => prev.filter((u) => u.username?.toLowerCase() !== username.toLowerCase()));
    if (userToRemove) {
      setMentionedUserIds((prev) => prev.filter((id) => id !== userToRemove._id));
    }
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  // Éviter les re-renders qui réinitialisent le curseur
  const [isComposing, setIsComposing] = useState(false);
  const lastContentRef = useRef(content);

  // Mettre à jour le contenu seulement si ça vient d'une action externe (pas de la saisie)
  // Ne créer des chips QUE pour les mentions qui sont dans mentionedUsers (sélectionnées)
  useEffect(() => {
    if (!textareaRef.current || isComposing) return;
    if (lastContentRef.current !== content) {
      // Le contenu a changé depuis l'extérieur (ex: suppression de mention, insertion depuis autocomplete)
      const currentText = textareaRef.current.textContent || "";
      if (currentText !== content) {
        // Mettre à jour seulement si vraiment différent
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const cursorOffset = range ? getTextOffset(range) : content.length;

        // Reconstruire le contenu avec les chips UNIQUEMENT pour les mentions sélectionnées
        textareaRef.current.innerHTML = "";
        content.split(/(@\w+)/g).forEach((part) => {
          if (part.startsWith("@")) {
            const username = part.substring(1);
            // SEULEMENT créer un chip si l'utilisateur est dans mentionedUsers (sélectionné)
            const user = mentionedUsers.find((u) => u.username?.toLowerCase() === username.toLowerCase());
            if (user) {
              // C'est une mention sélectionnée, créer un chip
              const span = document.createElement("span");
              span.contentEditable = "false";
              span.className = "inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary";
              span.style.display = "inline-flex";
              span.style.verticalAlign = "baseline";
              span.style.lineHeight = "1";
              const img = user?.image ? `<img src="${user.image}" class="w-2.5 h-2.5 shrink-0 rounded-full object-cover" alt="" />` : "";
              const usernameSpan = `<span class="text-[10px]">@${username}</span>`;
              const button = `<button type="button" data-remove-mention="${username}" class="ml-0.5 hover:bg-primary/20 rounded-full p-0 transition-colors flex items-center justify-center" style="width: 10px; height: 10px;"><svg class="w-2.5 h-2.5 text-primary/70" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg></button>`;
              span.innerHTML = img + usernameSpan + button;
              textareaRef.current.appendChild(span);
            } else {
              // C'est juste du texte "@username" en cours de saisie, pas encore sélectionné
              textareaRef.current.appendChild(document.createTextNode(part));
            }
          } else if (part) {
            textareaRef.current.appendChild(document.createTextNode(part));
          }
        });

        // Restaurer le curseur approximativement
        if (range && cursorOffset >= 0) {
          const textNodes = Array.from(textareaRef.current.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
          let offset = 0;
          for (const node of textNodes) {
            const nodeLength = node.textContent?.length || 0;
            if (offset + nodeLength >= cursorOffset) {
              const newRange = document.createRange();
              newRange.setStart(node, Math.min(cursorOffset - offset, nodeLength));
              newRange.setEnd(node, Math.min(cursorOffset - offset, nodeLength));
              selection?.removeAllRanges();
              selection?.addRange(newRange);
              break;
            }
            offset += nodeLength;
          }
        }
      }
      lastContentRef.current = content;
    }
  }, [content, mentionedUsers, isComposing]);

  const getTextOffset = (range: Range): number => {
    if (!textareaRef.current) return 0;
    let offset = 0;
    const walker = document.createTreeWalker(
      textareaRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );
    let node;
    while ((node = walker.nextNode())) {
      if (node === range.startContainer) {
        return offset + range.startOffset;
      }
      offset += node.textContent?.length || 0;
    }
    return offset;
  };



  // 🎯 PUBLIER UN COMMENTAIRE GRATUIT
  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error("Veuillez écrire un commentaire");
      return;
    }

    try {
      await bidOnArgument({
        decisionId,
        content: content.trim(),
        bidAmount: 0, // Commentaire gratuit
        mentionedUserIds: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
      });

      toast.success("Commentaire publié !");
      setContent("");
      setMentionedUserIds([]);
      setMentionedUsers([]);
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible de publier le commentaire.",
      });
    }
  };

  // 🎯 BOOSTER UN COMMENTAIRE EXISTANT (n'importe quel commentaire)
  const handleBoost = async (argumentId: Id<"topArguments">, amount: number) => {
    const argument = topArguments?.find((arg: any) => arg._id === argumentId);
    if (!argument) return;

    try {
      await boostArgument({
        argumentId,
        bidAmount: amount,
      });

      toast.success("Commentaire boosté !", {
        description: `Vous avez investi ${amount} Seeds pour mettre ce commentaire en avant.`,
      });

      setBoostingArgumentId(null);
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible de booster le commentaire.",
      });
      throw error;
    }
  };

  if (topArguments === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // 🎯 TRIER LE FEED COMME INSTAGRAM :
  // 1. Commentaires payants (bid > 0) par investissement décroissant
  // 2. Commentaires gratuits (bid = 0) par date décroissante (plus récents en premier)
  const argumentsList = (topArguments || []).sort((a: any, b: any) => {
    // Si les deux sont payants, trier par bid décroissant
    if (a.currentBid > 0 && b.currentBid > 0) {
      return b.currentBid - a.currentBid;
    }
    // Si l'un est payant et l'autre gratuit, le payant passe en premier
    if (a.currentBid > 0 && b.currentBid === 0) {
      return -1;
    }
    if (a.currentBid === 0 && b.currentBid > 0) {
      return 1;
    }
    // Si les deux sont gratuits, trier par date décroissante (plus récents en premier)
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Liste des commentaires - SEULEMENT CETTE ZONE EST SCROLLABLE */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4">
        {argumentsList.length > 0 ? (
          <div className="space-y-0">
            {argumentsList.map((arg: any, index: number) => {
              const timeAgo = arg.createdAt 
                ? formatDistanceToNow(new Date(arg.createdAt), { addSuffix: true })
                : "";
              // Trouver le top commentaire (pour calculer le min boost)
              const paidArguments = argumentsList.filter((a: any) => a.currentBid > 0 && a._id !== arg._id);
              const topComment = paidArguments.reduce((top: any, current: any) => {
                return !top || current.currentBid > top.currentBid ? current : top;
              }, null);
              const minBoost = topComment ? topComment.currentBid + 1 : Math.max(arg.currentBid + 1, 50);

              return (
                <div key={arg._id || index} className="border-b border-border/10 last:border-0">
                  <div className="py-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="size-9 shrink-0">
                        <AvatarImage src={arg.user?.image} />
                        <AvatarFallback className="text-xs">
                          {arg.user?.name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">
                            {arg.user?.name || "Anonyme"}
                          </p>
                          {arg.currentBid > 0 && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                              <SolarIcon icon="crown-bold" className="size-2.5 text-primary" />
                              <SeedDisplay amount={arg.currentBid} variant="inline" iconSize="size-2.5" className="text-[9px]" />
                            </div>
                          )}
                          {timeAgo && (
                            <span className="text-xs text-muted-foreground">
                              {timeAgo}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {renderContentWithMentions(arg.content, arg.mentionedUsers)}
                        </p>
                        <div className="flex items-center gap-4 pt-0.5">
                          {/* Bouton like style TikTok */}
                          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                            <SolarIcon icon="heart-bold" className="size-4" />
                            <span className="text-xs">0</span>
                          </button>
                          {/* Bouton pour booster n'importe quel commentaire */}
                          {user && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                              onClick={() => setBoostingArgumentId(arg._id)}
                            >
                              <SolarIcon icon="crown-bold" className="size-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <SolarIcon icon="chat-round-bold" className="size-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucun commentaire
            </p>
          </div>
        )}
      </div>

      {/* Input FIXE style TikTok - PAS SCROLLABLE, TOUJOURS EN BAS */}
      {user && (
        <div className="shrink-0 border-t border-border/20 bg-background/95 backdrop-blur-sm -mx-4 px-4 pt-3 pb-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
          <div className="flex items-end gap-2 max-w-full">
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={user.image} />
              <AvatarFallback className="text-xs">
                {user.name?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 relative min-w-0">
              <div className="relative">
                <div
                  ref={textareaRef}
                  contentEditable
                  onInput={(e) => {
                    const text = e.currentTarget.textContent || "";
                    lastContentRef.current = text;
                    setContent(text);
                  }}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    const button = target.closest('[data-remove-mention]');
                    if (button) {
                      e.preventDefault();
                      e.stopPropagation();
                      const username = button.getAttribute('data-remove-mention');
                      if (username) {
                        handleRemoveMention(username);
                      }
                    }
                  }}
                  className="resize-none w-full text-sm min-h-[44px] max-h-32 rounded-2xl px-4 py-3 pr-20 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring overflow-y-auto"
                  suppressContentEditableWarning
                  style={{
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                  }}
                />
                {!content && (
                  <div className="absolute top-3 left-4 text-sm text-muted-foreground pointer-events-none">
                    Ajouter un commentaire...
                  </div>
                )}
                {/* Icônes @ et emoji à droite */}
                <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted"
                    onClick={() => {
                      if (textareaRef.current) {
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                          const range = selection.getRangeAt(0);
                          const textNode = document.createTextNode("@");
                          range.insertNode(textNode);
                          range.setStartAfter(textNode);
                          range.collapse(true);
                          selection.removeAllRanges();
                          selection.addRange(range);
                          setContent(textareaRef.current.textContent || "");
                        } else {
                          // Si pas de sélection, ajouter à la fin
                          const textNode = document.createTextNode("@");
                          textareaRef.current.appendChild(textNode);
                          const newRange = document.createRange();
                          newRange.setStartAfter(textNode);
                          newRange.collapse(true);
                          const sel = window.getSelection();
                          sel?.removeAllRanges();
                          sel?.addRange(newRange);
                          setContent(textareaRef.current.textContent || "");
                        }
                        textareaRef.current.focus();
                      }
                    }}
                  >
                    <span className="text-base">@</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted"
                  >
                    <span className="text-base">😊</span>
                  </Button>
                </div>
                <MentionAutocomplete
                  content={content}
                  onContentChange={setContent}
                  onMentionsChange={setMentionedUserIds}
                  onMentionInserted={(userInfo) => {
                    setMentionedUsers((prev) => {
                      if (prev.some((u) => u._id === userInfo._id)) {
                        return prev;
                      }
                      return [...prev, userInfo];
                    });
                    setMentionedUserIds((prev) => {
                      if (prev.includes(userInfo._id)) {
                        return prev;
                      }
                      return [...prev, userInfo._id];
                    });
                  }}
                  textareaRef={textareaRef}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
            <Button 
              onClick={handlePublish} 
              disabled={!content.trim()}
              size="sm"
              className="h-9 px-4 shrink-0 rounded-full font-medium text-primary hover:text-primary disabled:opacity-50"
              variant="ghost"
            >
              Publier
            </Button>
          </div>
        </div>
      )}

      {/* Drawer de boost */}
      {boostingArgumentId && user && (() => {
        const arg = argumentsList.find((a: any) => a._id === boostingArgumentId);
        if (!arg) return null;
        const paidArgs = argumentsList.filter((a: any) => a.currentBid > 0 && a._id !== arg._id);
        const topComment = paidArgs.reduce((top: any, current: any) => {
          return !top || current.currentBid > top.currentBid ? current : top;
        }, null);
        const minBoost = topComment ? topComment.currentBid + 1 : Math.max(arg.currentBid + 1, 50);
        
        return (
          <CommentBoostDrawer
            open={boostingArgumentId !== null}
            onOpenChange={(open) => !open && setBoostingArgumentId(null)}
            argumentId={boostingArgumentId}
            currentBid={arg.currentBid}
            minBoost={minBoost}
            userSeedsBalance={user.seedsBalance || 0}
            onBoost={handleBoost}
          />
        );
      })()}
    </div>
  );
});

// Fonction pour rendre le contenu avec les mentions cliquables
function renderContentWithMentions(content: string, mentionedUsers?: any[]) {
  if (!content) return null;
  
  // Détecter les mentions (@username) dans le texte
  const mentionRegex = /@(\w+)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Ajouter le texte avant la mention
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    
    // Ajouter la mention comme lien
    const username = match[1];
    // Vérifier si l'utilisateur mentionné existe dans la liste
    const mentionedUser = mentionedUsers?.find(u => u?.username?.toLowerCase() === username.toLowerCase());
    
    parts.push(
      <Link
        key={match.index}
        href={`/u/${username}`}
        className="text-primary hover:underline font-medium"
        onClick={(e) => e.stopPropagation()}
      >
        @{username}
      </Link>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Ajouter le texte restant
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }
  
  return parts.length > 0 ? <>{parts}</> : content;
}
