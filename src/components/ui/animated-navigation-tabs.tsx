import { motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TabItem = {
    id: string;
    tile: string;
};

type Props = {
    items: TabItem[];
    activeItem: string;
    onTabChange: (id: string) => void;
};

export function AnimatedNavigationTabs({ items, activeItem, onTabChange }: Props) {
    const [isHover, setIsHover] = useState<TabItem | null>(null);

    const active = items.find((item) => item.id === activeItem) || items[0];

    return (
        <div className="relative">
            <ul className="flex items-center justify-center">
                {items.map((item) => (
                    <button
                        key={item.id}
                        className={cn(
                            "py-2 relative duration-300 transition-colors hover:!text-primary",
                            active.id === item.id ? "text-primary" : "text-muted-foreground"
                        )}
                        onClick={() => onTabChange(item.id)}
                        onMouseEnter={() => setIsHover(item)}
                        onMouseLeave={() => setIsHover(null)}
                    >
                        <div className="px-5 py-2 relative">
                            {item.tile}
                            {isHover?.id === item.id && (
                                <motion.div
                                    layoutId="hover-bg"
                                    className="absolute bottom-0 left-0 right-0 w-full h-full bg-primary/10"
                                    style={{
                                        borderRadius: 6,
                                    }}
                                />
                            )}
                        </div>
                        {active.id === item.id && (
                            <motion.div
                                layoutId="active"
                                className="absolute bottom-0 left-0 right-0 w-full h-0.5 bg-primary"
                            />
                        )}
                        {isHover?.id === item.id && (
                            <motion.div
                                layoutId="hover"
                                className="absolute bottom-0 left-0 right-0 w-full h-0.5 bg-primary"
                            />
                        )}
                    </button>
                ))}
            </ul>
        </div>
    );
}
