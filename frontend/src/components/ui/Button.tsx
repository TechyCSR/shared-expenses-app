import { ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/utils/cn"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline"
  size?: "sm" | "md" | "lg"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black",
          "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          {
            "bg-white text-black hover:bg-gray-200 shadow-sm": variant === "primary",
            "bg-gray-800 text-white border border-gray-600 hover:bg-gray-700 hover:border-gray-500": variant === "secondary",
            "bg-transparent text-gray-300 hover:text-white hover:bg-gray-800": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700": variant === "danger",
            "bg-transparent text-white border-2 border-gray-500 hover:bg-gray-800 hover:border-gray-400": variant === "outline",
          },
          {
            "text-xs px-2.5 py-1": size === "sm",
            "text-sm px-4 py-2": size === "md",
            "text-base px-6 py-3": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }