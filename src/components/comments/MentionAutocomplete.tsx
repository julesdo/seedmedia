"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MentionAutocompleteProps {
  content: string;
  onContentChange: (content: string) => void;
  onMentionsChange: (mentionedUserIds: Id<"users">[]) => void;
  onMentionInserted?: (user: { _id: Id<"users">; username?: string; name?: string; image?: string }) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | HTMLDivElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLDivElement>) => void;
}

export function MentionAutocomplete({
  content,
  onContentChange,
  onMentionsChange,
  onMentionInserted,
  textareaRef,
  onKeyDown,
}: MentionAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Rechercher les utilisateurs
  const searchResults = useQuery(
    api.users.searchUsersByUsername,
    mentionQuery.length >= 1 ? { query: mentionQuery, limit: 5 } : "skip"
  );

  // Utiliser useEffect pour détecter les changements dans le contenu
  useEffect(() => {
    if (!textareaRef.current) return;

    // Obtenir la position du curseur (compatible textarea et contentEditable)
    let cursorPosition = 0;
    let textBeforeCursor = "";

    if (textareaRef.current instanceof HTMLTextAreaElement) {
      cursorPosition = textareaRef.current.selectionStart;
      textBeforeCursor = content.substring(0, cursorPosition);
    } else {
      // Pour contentEditable
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(textareaRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        textBeforeCursor = preCaretRange.toString();
        cursorPosition = textBeforeCursor.length;
      } else {
        textBeforeCursor = content;
        cursorPosition = content.length;
      }
    }

    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      // Vérifier qu'il n'y a pas d'espace entre @ et le curseur
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        // On est en train de taper une mention
        const query = textAfterAt.toLowerCase();
        setMentionQuery(query);
        setMentionStartIndex(lastAtIndex);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [content]);

  // Extraire les IDs des utilisateurs mentionnés depuis le contenu
  // Cette fonction sera appelée lors de la publication pour résoudre les usernames en IDs
  // Pour l'instant, on retourne un tableau vide car on stocke les usernames dans le texte
  const extractMentions = (text: string): Id<"users">[] => {
    return [];
  };

  // Insérer une mention dans le texte
  const insertMention = (username: string, userId: Id<"users">, userInfo?: { name?: string; image?: string }) => {
    if (!textareaRef.current || mentionStartIndex === -1) return;

    let textBefore = "";
    let textAfter = "";
    let currentCursorPos = 0;

    if (textareaRef.current instanceof HTMLTextAreaElement) {
      textBefore = content.substring(0, mentionStartIndex);
      currentCursorPos = textareaRef.current.selectionStart;
      textAfter = content.substring(currentCursorPos);
    } else {
      // Pour contentEditable
      textBefore = content.substring(0, mentionStartIndex);
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(textareaRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        currentCursorPos = preCaretRange.toString().length;
        textAfter = content.substring(currentCursorPos);
      } else {
        textAfter = content.substring(mentionStartIndex);
      }
    }

    const newContent = `${textBefore}@${username} ${textAfter}`;
    onContentChange(newContent);
    setShowSuggestions(false);
    setMentionQuery("");
    setMentionStartIndex(-1);

    // Notifier le parent qu'une mention a été insérée
    if (onMentionInserted) {
      onMentionInserted({
        _id: userId,
        username,
        name: userInfo?.name,
        image: userInfo?.image,
      });
    }

    // Focus et placer le curseur après la mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        
        if (textareaRef.current instanceof HTMLTextAreaElement) {
          const newCursorPos = mentionStartIndex + username.length + 2; // +2 pour "@" et l'espace
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        } else {
          // Pour contentEditable, placer le curseur après la mention
          const selection = window.getSelection();
          if (selection && textareaRef.current) {
            // Trouver ou créer un textNode après la mention pour placer le curseur
            const walker = document.createTreeWalker(
              textareaRef.current,
              NodeFilter.SHOW_TEXT,
              null
            );
            let node;
            let offset = 0;
            const targetOffset = mentionStartIndex + username.length + 2; // Position après "@username "
            
            // Parcourir tous les textNodes pour trouver la bonne position
            while ((node = walker.nextNode())) {
              const nodeLength = node.textContent?.length || 0;
              if (offset + nodeLength >= targetOffset) {
                // On a trouvé le bon textNode
                const range = document.createRange();
                const localOffset = targetOffset - offset;
                range.setStart(node, Math.min(localOffset, nodeLength));
                range.setEnd(node, Math.min(localOffset, nodeLength));
                selection.removeAllRanges();
                selection.addRange(range);
                return;
              }
              offset += nodeLength;
            }
            
            // Si on n'a pas trouvé, placer le curseur à la fin
            const range = document.createRange();
            range.selectNodeContents(textareaRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }, 0);
  };

  // Exposer la gestion des touches pour le parent
  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    
    const handleKeyDownEvent = (e: KeyboardEvent) => {
      if (!showSuggestions || !searchResults || searchResults.length === 0) {
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          const selectedUser = searchResults[selectedIndex];
          insertMention(
            selectedUser.username || "",
            selectedUser._id,
            { name: selectedUser.name, image: selectedUser.image }
          );
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          const selectedUser = searchResults[selectedIndex];
          insertMention(
            selectedUser.username || "",
            selectedUser._id,
            { name: selectedUser.name, image: selectedUser.image }
          );
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
      }
    };

    textarea.addEventListener("keydown", handleKeyDownEvent);
    return () => {
      textarea.removeEventListener("keydown", handleKeyDownEvent);
    };
  }, [showSuggestions, searchResults, selectedIndex, content, mentionStartIndex]);

  return (
    <>
      {showSuggestions && searchResults && searchResults.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-[100] bg-background border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto bottom-full left-0 right-0 mb-2"
          style={{
            width: textareaRef.current ? `${textareaRef.current.offsetWidth}px` : "100%",
            maxWidth: "100%",
          }}
        >
          {searchResults.map((user, index) => (
            <button
              key={user._id}
              type="button"
              onClick={() =>
                insertMention(user.username || "", user._id, { name: user.name, image: user.image })
              }
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors",
                index === selectedIndex && "bg-muted"
              )}
            >
              <Avatar className="size-6 shrink-0">
                <AvatarImage src={user.image} />
                <AvatarFallback className="text-xs">
                  {user.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.name || "Utilisateur"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

