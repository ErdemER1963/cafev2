import { Check } from "lucide-react"
import { cn } from "../lib/utils"

export function OrderState({ states = [], className }) {
    return (
        <div className={cn("relative flex flex-col gap-6", className)}>
            {states.map((state, index) => (
                <div key={index} className="relative flex gap-3 items-start">
                    {/* Connector line */}
                    {index !== states.length - 1 && (
                        <div
                            className={cn(
                                "absolute left-[13px] top-[26px] w-[2px]",
                                state.isActive ? "bg-blue-600/50" : "bg-zinc-800"
                            )}
                            style={{ height: "calc(100% + 8px)" }}
                        />
                    )}
                    {/* Icon circle */}
                    <div
                        className={cn(
                            "relative z-10 shrink-0 flex w-[26px] h-[26px] items-center justify-center rounded-full border-2 bg-zinc-950",
                            state.isActive
                                ? "border-blue-500 text-blue-400 shadow-sm shadow-blue-500/30"
                                : "border-zinc-800 text-zinc-600"
                        )}
                    >
                        {state.isActive ? <Check className="w-3 h-3" /> : state.icon}
                    </div>
                    {/* Text */}
                    <div className="flex flex-col gap-0.5 pt-0.5 min-w-0">
                        <h4 className={cn(
                            "text-xs font-bold leading-tight",
                            state.isActive ? "text-zinc-100" : "text-zinc-500"
                        )}>
                            {state.status}
                        </h4>
                        {state.description && (
                            <p className="text-[10px] text-zinc-600 font-medium leading-tight">{state.description}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
