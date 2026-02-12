import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

/**
 * Separator component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {"horizontal"|"vertical"} [props.orientation="horizontal"] - Separator orientation
 * @param {boolean} [props.decorative=true] - Whether the separator is decorative
 * @param {React.Ref<HTMLDivElement>} ref - Forwarded ref
 */
const Separator = React.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)}
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };