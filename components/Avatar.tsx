interface AvatarProps {
  type: "user" | "assistant";
  size?: "sm" | "md";
}

export function Avatar({ type, size = "md" }: AvatarProps) {
  const isUser = type === "user";

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-8",
  };

  return (
    <div
      className={`${
        sizeClasses[size]
      } rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`text-xs font-semibold ${
          isUser ? "text-white" : "text-gray-600"
        }`}
      >
        {isUser ? "You" : "SMEC"}
      </span>
    </div>
  );
}
