"use client";

import * as React from "react";
import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ArticleCommentsSidebarProps {
  articleId: Id<"articles">;
  onClose?: () => void;
}

interface Comment {
  _id: Id<"comments">;
  userId: Id<"users">;
  content: string;
  parentId?: Id<"comments">;
  usefulCount: number;
  createdAt: number;
  updatedAt: number;
  author: {
    _id: Id<"users">;
    email: string;
    name: string;
    image: string | null;
  } | null;
  replies?: Comment[];
}

export function ArticleCommentsSidebar({ articleId, onClose }: ArticleCommentsSidebarProps) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const comments = useQuery(api.content.getComments, {
    targetType: "article",
    targetId: articleId,
  });
  const addComment = useMutation(api.content.addComment);
  const toggleCommentReaction = useMutation(api.content.toggleCommentReaction);
  const addReaction = useMutation(api.content.addReaction);
  const hasUserReacted = useQuery(api.content.hasUserReacted, {
    targetType: "article",
    targetId: articleId,
  });

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Id<"comments"> | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [mentioningUser, setMentioningUser] = useState<{ id: Id<"users">; name: string } | null>(null);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gérer les mentions @
  const handleCommentChange = useCallback((value: string) => {
    setNewComment(value);
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.substring(lastAtIndex + 1);
      const spaceIndex = query.indexOf(" ");
      
      if (spaceIndex === -1 && query.length > 0) {
        setMentionQuery(query);
        setShowMentionSuggestions(true);
        // TODO: Récupérer les utilisateurs pour les suggestions
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  }, []);

  const handleReplyChange = useCallback((value: string) => {
    setReplyContent(value);
    const cursorPos = replyTextareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.substring(lastAtIndex + 1);
      const spaceIndex = query.indexOf(" ");
      
      if (spaceIndex === -1 && query.length > 0) {
        setMentionQuery(query);
        setShowMentionSuggestions(true);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  }, []);

  const insertMention = useCallback((userId: Id<"users">, userName: string, isReply: boolean = false) => {
    const mentionText = `@${userName} `;
    
    if (isReply) {
      const textarea = replyTextareaRef.current;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = replyContent.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");
        const newContent = 
          replyContent.substring(0, lastAtIndex) + 
          mentionText + 
          replyContent.substring(cursorPos);
        setReplyContent(newContent);
        setShowMentionSuggestions(false);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(lastAtIndex + mentionText.length, lastAtIndex + mentionText.length);
        }, 0);
      }
    } else {
      const textarea = textareaRef.current;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = newComment.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");
        const newContent = 
          newComment.substring(0, lastAtIndex) + 
          mentionText + 
          newComment.substring(cursorPos);
        setNewComment(newContent);
        setShowMentionSuggestions(false);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(lastAtIndex + mentionText.length, lastAtIndex + mentionText.length);
        }, 0);
      }
    }
  }, [newComment, replyContent]);

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim() || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment({
        targetType: "article",
        targetId: articleId,
        content: newComment.trim(),
      });
      setNewComment("");
      toast.success("Commentaire ajouté");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout du commentaire");
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, currentUser, articleId, addComment, isSubmitting]);

  const handleSubmitReply = useCallback(async (parentId: Id<"comments">) => {
    if (!replyContent.trim() || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment({
        targetType: "article",
        targetId: articleId,
        content: replyContent.trim(),
        parentId,
      });
      setReplyContent("");
      setReplyingTo(null);
      toast.success("Réponse ajoutée");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout de la réponse");
    } finally {
      setIsSubmitting(false);
    }
  }, [replyContent, currentUser, articleId, addComment, isSubmitting]);

  const handleToggleCommentReaction = useCallback(async (commentId: Id<"comments">, type: "like" | "love" | "useful") => {
    if (!currentUser) {
      toast.error("Vous devez être connecté pour réagir");
      return;
    }

    try {
      await toggleCommentReaction({ commentId, type });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la réaction");
    }
  }, [currentUser, toggleCommentReaction]);

  const handleToggleArticleReaction = useCallback(async (type: "like" | "love" | "useful") => {
    if (!currentUser) {
      toast.error("Vous devez être connecté pour réagir");
      return;
    }

    try {
      await addReaction({
        targetType: "article",
        targetId: articleId,
        type,
      });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la réaction");
    }
  }, [currentUser, articleId, addReaction]);

  // Note: Les réactions seront récupérées dans chaque CommentItem individuellement

  return (
    <aside className="w-80 border-l border-border/10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Commentaires</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <SolarIcon icon="close-circle-bold" className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Réactions à l'article */}
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border/10 bg-muted/30">
          <span className="text-xs text-muted-foreground/70 mr-2">Réagir :</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleArticleReaction("like")}
            className={cn(
              "h-7 px-2 text-xs",
              hasUserReacted?.hasReacted && hasUserReacted.reactionType === "like" && "text-primary"
            )}
          >
            <SolarIcon icon="heart-bold" className="h-3.5 w-3.5 mr-1" />
            J'aime
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleArticleReaction("love")}
            className={cn(
              "h-7 px-2 text-xs",
              hasUserReacted?.hasReacted && hasUserReacted.reactionType === "love" && "text-primary"
            )}
          >
            <SolarIcon icon="heart-pulse-bold" className="h-3.5 w-3.5 mr-1" />
            J'adore
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleArticleReaction("useful")}
            className={cn(
              "h-7 px-2 text-xs",
              hasUserReacted?.hasReacted && hasUserReacted.reactionType === "useful" && "text-primary"
            )}
          >
            <SolarIcon icon="bookmark-bold" className="h-3.5 w-3.5 mr-1" />
            Utile
          </Button>
        </div>

        {/* Formulaire de nouveau commentaire */}
        {currentUser && (
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => handleCommentChange(e.target.value)}
              placeholder="Ajouter un commentaire... (utilisez @ pour mentionner)"
              className="min-h-[80px] text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewComment("")}
                disabled={!newComment.trim() || isSubmitting}
                className="h-7 text-xs"
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="h-7 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <SolarIcon icon="refresh-bold" className="h-3 w-3 mr-1 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "Publier"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Liste des commentaires */}
        <div className="space-y-4">
          {comments === undefined ? (
            <div className="text-center py-8 text-sm text-muted-foreground/60">
              Chargement...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground/60">
              Aucun commentaire pour le moment
            </div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                currentUserId={currentUser?._id}
                onReply={() => setReplyingTo(comment._id)}
                onToggleReaction={handleToggleCommentReaction}
                replyingTo={replyingTo === comment._id}
                replyContent={replyContent}
                onReplyChange={handleReplyChange}
                onSubmitReply={() => handleSubmitReply(comment._id)}
                onCancelReply={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
                replyTextareaRef={replyTextareaRef}
                isSubmitting={isSubmitting}
              />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: Id<"users">;
  onReply: () => void;
  onToggleReaction: (commentId: Id<"comments">, type: "like" | "love" | "useful") => void;
  replyingTo: boolean;
  replyContent: string;
  onReplyChange: (value: string) => void;
  onSubmitReply: () => void;
  onCancelReply: () => void;
  replyTextareaRef: React.RefObject<HTMLTextAreaElement>;
  isSubmitting: boolean;
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onToggleReaction,
  replyingTo,
  replyContent,
  onReplyChange,
  onSubmitReply,
  onCancelReply,
  replyTextareaRef,
  isSubmitting,
}: CommentItemProps) {
  const hasUserReacted = useQuery(api.content.hasUserReacted, {
    targetType: "comment",
    targetId: comment._id,
  });
  const reactions = useQuery(api.content.getCommentReactions, { commentId: comment._id });

  return (
    <div className="space-y-3">
      {/* Commentaire principal */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={comment.author?.image || undefined} alt={comment.author?.name} />
            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
              {comment.author?.name[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">{comment.author?.name || "Anonyme"}</span>
              <span className="text-xs text-muted-foreground/50">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleReaction(comment._id, "like")}
                className={cn(
                  "h-6 px-2 text-xs text-muted-foreground/70 hover:text-foreground",
                  hasUserReacted?.hasReacted && hasUserReacted.reactionType === "like" && "text-primary"
                )}
              >
                <SolarIcon icon="heart-bold" className="h-3 w-3 mr-1" />
                {reactions.like > 0 && reactions.like}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleReaction(comment._id, "love")}
                className={cn(
                  "h-6 px-2 text-xs text-muted-foreground/70 hover:text-foreground",
                  hasUserReacted?.hasReacted && hasUserReacted.reactionType === "love" && "text-primary"
                )}
              >
                <SolarIcon icon="heart-pulse-bold" className="h-3 w-3 mr-1" />
                {reactions.love > 0 && reactions.love}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleReaction(comment._id, "useful")}
                className={cn(
                  "h-6 px-2 text-xs text-muted-foreground/70 hover:text-foreground",
                  hasUserReacted?.hasReacted && hasUserReacted.reactionType === "useful" && "text-primary"
                )}
              >
                <SolarIcon icon="bookmark-bold" className="h-3 w-3 mr-1" />
                {reactions.useful > 0 && reactions.useful}
              </Button>
              {currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReply}
                  className="h-6 px-2 text-xs text-muted-foreground/70 hover:text-foreground"
                >
                  <SolarIcon icon="chat-round-bold" className="h-3 w-3 mr-1" />
                  Répondre
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Formulaire de réponse */}
        {replyingTo && currentUserId && (
          <div className="ml-9 space-y-2">
            <Textarea
              ref={replyTextareaRef}
              value={replyContent}
              onChange={(e) => onReplyChange(e.target.value)}
              placeholder={`Répondre à ${comment.author?.name}... (utilisez @ pour mentionner)`}
              className="min-h-[60px] text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onSubmitReply();
                }
              }}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelReply}
                disabled={isSubmitting}
                className="h-6 text-xs"
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={onSubmitReply}
                disabled={!replyContent.trim() || isSubmitting}
                className="h-6 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <SolarIcon icon="refresh-bold" className="h-3 w-3 mr-1 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "Répondre"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Réponses */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-9 space-y-3 border-l border-border/10 pl-3">
          {comment.replies.map((reply) => (
            <ReplyItem
              key={reply._id}
              reply={reply}
              currentUserId={currentUserId}
              onToggleReaction={onToggleReaction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReplyItemProps {
  reply: Comment;
  currentUserId?: Id<"users">;
  onToggleReaction: (commentId: Id<"comments">, type: "like" | "love" | "useful") => void;
}

function ReplyItem({ reply, currentUserId, onToggleReaction }: ReplyItemProps) {
  const hasUserReacted = useQuery(api.content.hasUserReacted, {
    targetType: "comment",
    targetId: reply._id,
  });
  const reactions = useQuery(api.content.getCommentReactions, { commentId: reply._id });

  return (
    <div className="flex items-start gap-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={reply.author?.image || undefined} alt={reply.author?.name} />
        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
          {reply.author?.name[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{reply.author?.name || "Anonyme"}</span>
          <span className="text-xs text-muted-foreground/50">
            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: fr })}
          </span>
        </div>
        <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
          {reply.content}
        </p>
        <div className="flex items-center gap-2 pt-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleReaction(reply._id, "like")}
            className={cn(
              "h-5 px-1.5 text-xs text-muted-foreground/60 hover:text-foreground",
              hasUserReacted?.hasReacted && hasUserReacted.reactionType === "like" && "text-primary"
            )}
          >
            <SolarIcon icon="heart-bold" className="h-2.5 w-2.5 mr-0.5" />
            {reactions?.like || 0}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleReaction(reply._id, "love")}
            className={cn(
              "h-5 px-1.5 text-xs text-muted-foreground/60 hover:text-foreground",
              hasUserReacted?.hasReacted && hasUserReacted.reactionType === "love" && "text-primary"
            )}
          >
            <SolarIcon icon="heart-pulse-bold" className="h-2.5 w-2.5 mr-0.5" />
            {reactions?.love || 0}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleReaction(reply._id, "useful")}
            className={cn(
              "h-5 px-1.5 text-xs text-muted-foreground/60 hover:text-foreground",
              hasUserReacted?.hasReacted && hasUserReacted.reactionType === "useful" && "text-primary"
            )}
          >
            <SolarIcon icon="bookmark-bold" className="h-2.5 w-2.5 mr-0.5" />
            {reactions?.useful || 0}
          </Button>
        </div>
      </div>
    </div>
  );
}

