"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { useConvexAuth } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";

interface CommentsSectionProps {
  targetType: "article" | "project" | "action" | "proposal";
  targetId: Id<"articles"> | Id<"projects"> | Id<"actions"> | Id<"governanceProposals">;
}

export function CommentsSection({ targetType, targetId }: CommentsSectionProps) {
  const { isAuthenticated } = useConvexAuth();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Id<"comments"> | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const comments = useQuery(api.comments.getComments, {
    targetType,
    targetId,
  });
  const addComment = useMutation(api.comments.addComment);
  const currentUser = useQuery(api.users.getCurrentUser);

  const handleSubmit = async (parentId?: Id<"comments">) => {
    if (!isAuthenticated) {
      toast.error("Vous devez être connecté pour commenter");
      return;
    }

    const content = parentId ? replyContent : newComment;
    if (!content.trim()) {
      toast.error("Le commentaire ne peut pas être vide");
      return;
    }

    try {
      await addComment({
        targetType,
        targetId,
        content: content.trim(),
        parentId,
      });
      
      if (parentId) {
        setReplyContent("");
        setReplyingTo(null);
      } else {
        setNewComment("");
      }
      
      toast.success("Commentaire ajouté avec succès");
    } catch (error: any) {
      // La vérification de crédibilité se fait côté backend
      // On affiche simplement l'erreur retournée par le backend
      toast.error(error.message || "Erreur lors de l'ajout du commentaire");
    }
  };

  if (comments === undefined) {
    return (
      <div className="border border-border/60 rounded-lg bg-muted/20 p-3">
        <div className="flex items-center gap-2 mb-3">
          <SolarIcon icon="chat-round-bold" className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Commentaires</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border/60 rounded-lg bg-muted/20 p-3 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <SolarIcon icon="chat-round-bold" className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          Commentaires ({comments.length})
        </h3>
      </div>
      <div className="flex flex-col flex-1 min-h-0 space-y-4">
        {/* Formulaire d'ajout de commentaire */}
        <div className="shrink-0">
          {isAuthenticated ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Ajouter un commentaire..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              <Button
                onClick={() => handleSubmit()}
                disabled={!newComment.trim()}
                variant="accent"
                size="sm"
                className="h-8 text-xs shadow-none"
              >
                <SolarIcon icon="check-circle-bold" className="h-3.5 w-3.5 mr-1.5" />
                Publier
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <SolarIcon icon="info-circle-bold" className="h-3.5 w-3.5 shrink-0" />
                <span>Vous devez être connecté pour commenter.</span>
              </div>
            </div>
          )}
        </div>

        {/* Liste des commentaires - scrollable */}
        {comments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <SolarIcon icon="chat-round-outline" className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Aucun commentaire pour le moment</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin min-h-0">
            {comments.map((comment) => (
              <CommentThread
                key={comment._id}
                comment={comment}
                onReply={() => setReplyingTo(comment._id)}
                isReplying={replyingTo === comment._id}
                replyContent={replyContent}
                onReplyContentChange={setReplyContent}
                onReplySubmit={() => handleSubmit(comment._id)}
                onCancelReply={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
                targetType={targetType}
                targetId={targetId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentThreadProps {
  comment: any;
  onReply: () => void;
  isReplying: boolean;
  replyContent: string;
  onReplyContentChange: (value: string) => void;
  onReplySubmit: () => void;
  onCancelReply: () => void;
  targetType: "article" | "project" | "action";
  targetId: Id<"articles"> | Id<"projects"> | Id<"actions">;
}

function CommentThread({
  comment,
  onReply,
  isReplying,
  replyContent,
  onReplyContentChange,
  onReplySubmit,
  onCancelReply,
  targetType,
  targetId,
}: CommentThreadProps) {
  const { isAuthenticated } = useConvexAuth();
  const toggleReaction = useMutation(api.comments.toggleCommentReaction);

  const handleReaction = async (type: "like" | "love" | "useful", commentId?: Id<"comments">) => {
    if (!isAuthenticated) {
      toast.error("Vous devez être connecté pour réagir");
      return;
    }

    try {
      await toggleReaction({
        commentId: commentId || comment._id,
        type,
      });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la réaction");
    }
  };

  return (
    <div className="space-y-3">
      {/* Commentaire principal */}
      <div className="flex gap-2.5">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user?.image || undefined} />
          <AvatarFallback className="text-xs">
            {comment.user?.name?.[0]?.toUpperCase() || comment.user?.email[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">
              {comment.user?.name || comment.user?.email}
            </span>
            {comment.user?.level && (
              <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                Niveau {comment.user.level}
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
          <p className="text-xs whitespace-pre-wrap leading-relaxed">{comment.content}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("like")}
              className="h-7 text-xs px-2"
            >
              <SolarIcon icon="heart-bold" className="h-3 w-3 mr-1" />
              {comment.reactions.like}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("useful")}
              className="h-7 text-xs px-2"
            >
              <SolarIcon icon="check-circle-bold" className="h-3 w-3 mr-1" />
              {comment.reactions.useful}
            </Button>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReply}
                className="h-7 text-xs px-2"
              >
                <SolarIcon icon="reply-bold" className="h-3 w-3 mr-1" />
                Répondre
              </Button>
            )}
          </div>

          {/* Formulaire de réponse */}
          {isReplying && (
            <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-border/60">
              <Textarea
                placeholder="Répondre au commentaire..."
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                rows={2}
                className="resize-none text-xs"
              />
              <div className="flex gap-1.5">
                <Button
                  onClick={onReplySubmit}
                  disabled={!replyContent.trim()}
                  variant="accent"
                  size="sm"
                  className="h-7 text-xs shadow-none"
                >
                  <SolarIcon icon="check-circle-bold" className="h-3 w-3 mr-1.5" />
                  Publier
                </Button>
                <Button
                  onClick={onCancelReply}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Réponses */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 space-y-3 pl-3 border-l-2 border-border/60">
          {comment.replies.map((reply: any) => (
            <div key={reply._id} className="flex gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={reply.user?.image || undefined} />
                <AvatarFallback className="text-[10px]">
                  {reply.user?.name?.[0]?.toUpperCase() || reply.user?.email[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold">
                    {reply.user?.name || reply.user?.email}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>
                <p className="text-xs whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction("like", reply._id)}
                    className="h-6 text-[11px] px-1.5"
                  >
                    <SolarIcon icon="heart-bold" className="h-3 w-3 mr-0.5" />
                    {reply.reactions.like}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction("useful", reply._id)}
                    className="h-6 text-[11px] px-1.5"
                  >
                    <SolarIcon icon="check-circle-bold" className="h-3 w-3 mr-0.5" />
                    {reply.reactions.useful}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

