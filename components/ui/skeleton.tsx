import type React from "react"
import {cn} from "@/utils/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "shimmer" | "pulse" | "wave"
}

const Skeleton = ({className, variant = "shimmer", ...props}: SkeletonProps) => {
    const variants = {
        default: "animate-[pulse_0.8s_ease-in-out_infinite] bg-muted",
        shimmer:
            "relative overflow-hidden bg-muted before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer-fast.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent",
        pulse: "animate-[pulse_0.6s_ease-in-out_infinite] bg-gradient-to-r from-muted via-muted/30 to-muted",
        wave: "relative overflow-hidden bg-muted before:absolute before:inset-0 before:animate-[wave-intense_0.7s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent before:translate-x-[-100%]",
    }

    return <div className={cn("rounded-md", variants[variant], className)} {...props} />
}

export {Skeleton}
