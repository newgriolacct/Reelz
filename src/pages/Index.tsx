import { TokenCard } from "@/components/TokenCard";
import { BottomNav } from "@/components/BottomNav";
import { mockTokens } from "@/data/mockTokens";

const Index = () => {
  const handleLike = (tokenId: string) => {
    console.log("Liked token:", tokenId);
  };

  const handleComment = (tokenId: string) => {
    console.log("Comment on token:", tokenId);
  };

  const handleBookmark = (tokenId: string) => {
    console.log("Bookmarked token:", tokenId);
  };

  return (
    <>
      <div className="min-h-screen bg-background overflow-y-auto snap-y snap-mandatory">
        {mockTokens.map((token) => (
          <TokenCard
            key={token.id}
            token={token}
            onLike={handleLike}
            onComment={handleComment}
            onBookmark={handleBookmark}
          />
        ))}
      </div>
      <BottomNav />
    </>
  );
};

export default Index;
