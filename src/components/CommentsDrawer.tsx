import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useState } from "react";
import { Send, MessageSquarePlus } from "lucide-react";

interface Comment {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
  likes: number;
}

interface CommentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenSymbol: string;
  comments: Comment[];
  onAddComment: (text: string) => void;
}

export const CommentsDrawer = ({
  open,
  onOpenChange,
  tokenSymbol,
  comments,
  onAddComment,
}: CommentsDrawerProps) => {
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText("");
      setIsCommenting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[75vh] flex flex-col p-0 pb-safe"
      >
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-center">{comments.length} comments</SheetTitle>
        </SheetHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground text-sm">No comments yet</p>
              <p className="text-muted-foreground text-xs mt-1">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={comment.userAvatar} />
                    <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {comment.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {comment.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5 break-words">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t border-border p-3 bg-background flex-shrink-0 safe-bottom">
          {!isCommenting ? (
            <Button
              onClick={() => setIsCommenting(true)}
              variant="outline"
              className="w-full h-11 justify-start gap-2 text-muted-foreground"
            >
              <MessageSquarePlus className="w-4 h-4" />
              Add a comment...
            </Button>
          ) : (
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[44px] max-h-[100px] resize-none pr-12"
                  rows={1}
                  autoFocus={true}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                  disabled={!commentText.trim()}
                  className="absolute right-1 bottom-1 h-9 w-9"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
