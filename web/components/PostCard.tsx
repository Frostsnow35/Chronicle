import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import SerifHeading from "@/components/ui/SerifHeading";
import MetaText from "@/components/ui/MetaText";
import { formatDate } from "@/lib/utils";
import type { PublicPost } from "@/lib/data";
import { ArrowRight } from "lucide-react";

export default function PostCard({ post }: { post: PublicPost }) {
  return (
    <Link href={`/posts/${post.slug}`} className="block group">
      <GlassCard className="p-8 transition-transform duration-300 group-hover:-translate-y-0.5">
        <div className="mb-4 flex items-center gap-3">
          <MetaText>{formatDate(post.created_at, "short")}</MetaText>
          {post.category && (
            <>
              <span className="text-ink-300">·</span>
              <span className="chip">{post.category.name}</span>
            </>
          )}
        </div>
        <SerifHeading level={3} className="mb-3 group-hover:text-hermes-orange-700 transition-colors">
          {post.title}
        </SerifHeading>
        {post.excerpt && (
          <p className="line-clamp-3 text-ink-700 leading-[1.85] text-[15.5px]">
            {post.excerpt}
          </p>
        )}
        <div className="mt-5 inline-flex items-center gap-1.5 font-sans text-sm text-hermes-orange-600">
          继续阅读
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </GlassCard>
    </Link>
  );
}
