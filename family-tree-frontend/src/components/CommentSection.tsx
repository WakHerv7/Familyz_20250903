'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useComments, useCreateComment, useLikeComment, useProfile } from '@/hooks/api';
import { Comment } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ClipLoader } from 'react-spinners';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CommentSectionProps {
  postId: string;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  level?: number;
}

function CommentItem({ comment, postId, level = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const { data: profile } = useProfile();
  const createCommentMutation = useCreateComment();
  const likeCommentMutation = useLikeComment();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLike = async () => {
    try {
      await likeCommentMutation.mutateAsync(comment.id);
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        postId,
        data: {
          content: replyContent.trim(),
          parentCommentId: comment.id,
        },
      });

      setReplyContent('');
      setShowReplyForm(false);
      setShowReplies(true);
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const isOwnComment = profile?.id === comment.authorId;
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className={cn("space-y-3", level > 0 && "ml-8 border-l pl-4")}>
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {getInitials(comment.author.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          {/* Comment Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{comment.author.name}</span>
                {isOwnComment && <Badge variant="outline" className="text-xs">You</Badge>}
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>

            {isOwnComment && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Comment Content */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

            {comment.imageUrl && (
              <img
                src={comment.imageUrl}
                alt="Comment attachment"
                className="mt-2 max-w-xs rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likeCommentMutation.isPending}
              className={cn(
                "h-6 px-2 text-xs",
                comment.isLikedByCurrentUser && "text-red-500"
              )}
            >
              <Heart
                className={cn(
                  "h-3 w-3 mr-1",
                  comment.isLikedByCurrentUser && "fill-current"
                )}
              />
              {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
              <span className="ml-1">Like</span>
            </Button>

            {level < 2 && ( // Limit nesting to 2 levels
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="h-6 px-2 text-xs"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="h-6 px-2 text-xs"
              >
                {showReplies ? 'Hide' : 'Show'} {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${comment.author.name}...`}
                className="min-h-[60px] text-sm"
              />
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyContent.trim() || createCommentMutation.isPending}
                >
                  {createCommentMutation.isPending ? (
                    <ClipLoader size={12} color="white" />
                  ) : (
                    'Reply'
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {hasReplies && showReplies && (
        <div className="space-y-3">
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');

  const { data: comments, isLoading } = useComments(postId);
  const { data: profile } = useProfile();
  const createCommentMutation = useCreateComment();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        postId,
        data: {
          content: newComment.trim(),
        },
      });

      setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {profile ? getInitials(profile.name) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[60px] text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {newComment.length}/2000 characters
            </span>
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || createCommentMutation.isPending}
            >
              {createCommentMutation.isPending ? (
                <div className="flex items-center space-x-1">
                  <ClipLoader size={12} color="white" />
                  <span>Posting...</span>
                </div>
              ) : (
                'Comment'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <ClipLoader size={20} color="#3B82F6" />
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
            />
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs">Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}
