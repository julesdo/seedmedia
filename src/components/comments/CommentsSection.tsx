"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery as useQueryUser } from "convex/react";

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
      <Card>
        <CardHeader>
          <CardTitle className="text-gradient-light">Commentaires</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gradient-light">
          Commentaires ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulaire d'ajout de commentaire */}
        {isAuthenticated ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={!newComment.trim()}
              variant="accent"
            >
              <SolarIcon icon="send-bold" className="h-4 w-4 mr-2" />
              Publier
            </Button>
            <p className="text-xs text-muted-foreground">
            </p>
          </div>
        ) : (
          <Alert>
            <SolarIcon icon="info-circle-bold" className="h-4 w-4" />
            <AlertDescription>
              Vous devez être connecté pour commenter.
            </AlertDescription>
          </Alert>
        )}

        {/* Liste des commentaires */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <SolarIcon icon="chat-round-outline" className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun commentaire pour le moment</p>
          </div>
        ) : (
          <div className="space-y-6">
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
      </CardContent>
    </Card>
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

  const handleReaction = async (type: "like" | "love" | "useful") => {
    if (!isAuthenticated) {
      toast.error("Vous devez être connecté pour réagir");
      return;
    }

    try {
      await toggleReaction({
        commentId: comment._id,
        type,
      });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la réaction");
    }
  };

  return (
    <div className="space-y-4">
      {/* Commentaire principal */}
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.user?.image || undefined} />
          <AvatarFallback>
            {comment.user?.name?.[0]?.toUpperCase() || comment.user?.email[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gradient-light">
              {comment.user?.name || comment.user?.email}
            </span>
            {comment.user?.level && (
              <Badge variant="secondary" className="text-xs">
                Niveau {comment.user.level}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("like")}
              className="h-8"
            >
              <SolarIcon icon="heart-bold" className="h-4 w-4 mr-1" />
              {comment.reactions.like}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("useful")}
              className="h-8"
            >
              <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-1" />
              {comment.reactions.useful}
            </Button>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReply}
                className="h-8"
              >
                <SolarIcon icon="reply-bold" className="h-4 w-4 mr-1" />
                Répondre
              </Button>
            )}
          </div>

          {/* Formulaire de réponse */}
          {isReplying && (
            <div className="mt-3 space-y-2 pl-4 border-l-2 border-border">
              <Textarea
                placeholder="Répondre au commentaire..."
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  onClick={onReplySubmit}
                  disabled={!replyContent.trim()}
                  variant="accent"
                  size="sm"
                >
                  Publier
                </Button>
                <Button
                  onClick={onCancelReply}
                  variant="ghost"
                  size="sm"
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
        <div className="ml-14 space-y-4 pl-4 border-l-2 border-border/50">
          {comment.replies.map((reply: any) => (
            <div key={reply._id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={reply.user?.image || undefined} />
                <AvatarFallback className="text-xs">
                  {reply.user?.name?.[0]?.toUpperCase() || reply.user?.email[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {reply.user?.name || reply.user?.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction("like")}
                    className="h-7 text-xs"
                  >
                    <SolarIcon icon="heart-bold" className="h-3 w-3 mr-1" />
                    {reply.reactions.like}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReaction("useful")}
                    className="h-7 text-xs"
                  >
                    <SolarIcon icon="check-circle-bold" className="h-3 w-3 mr-1" />
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

