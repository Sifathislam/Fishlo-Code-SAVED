import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

export default function FloatingButtonSkeleton() {
  return (
    <SkeletonTheme baseColor="#e0e0e0" highlightColor="#f5f5f5">
      <div
        className="chat-float-btn shadow-lg rounded-circle"
        style={{
          width: 56,
          height: 56,
          padding: 0,
          border: "none", // Remove default button borders
          lineHeight: 0, // Removes extra vertical space often caused by line-height
        }}
      >
        {/* The Skeleton provides the gray pulsing circle */}
        <Skeleton circle width={56} height={56} />
      </div>
    </SkeletonTheme>
  );
}
