import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Breadcrumb component
 * @param {Object} props - Component props
 * @param {React.ReactNode} [props.separator] - Custom separator between breadcrumb items
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.Ref<HTMLElement>} ref - Forwarded ref
 */
const Breadcrumb = React.forwardRef(({ separator, className, ...props }, ref) => (
  <nav ref={ref} aria-label="breadcrumb" className={className} {...props} />
));
Breadcrumb.displayName = "Breadcrumb";

/**
 * BreadcrumbList component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.Ref<HTMLOListElement>} ref - Forwarded ref
 */
const BreadcrumbList = React.forwardRef(({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
        className,
      )}
      {...props}
    />
  ),
);
BreadcrumbList.displayName = "BreadcrumbList";

/**
 * BreadcrumbItem component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.Ref<HTMLLIElement>} ref - Forwarded ref
 */
const BreadcrumbItem = React.forwardRef(({ className, ...props }, ref) => (
    <li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} />
  ),
);
BreadcrumbItem.displayName = "BreadcrumbItem";

/**
 * BreadcrumbLink component
 * @param {Object} props - Component props
 * @param {boolean} [props.asChild] - Whether to render as child component
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.Ref<HTMLAnchorElement>} ref - Forwarded ref
 */
const BreadcrumbLink = React.forwardRef(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";

  return <Comp ref={ref} className={cn("transition-colors hover:text-foreground", className)} {...props} />;
});
BreadcrumbLink.displayName = "BreadcrumbLink";

/**
 * BreadcrumbPage component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.Ref<HTMLSpanElement>} ref - Forwarded ref
 */
const BreadcrumbPage = React.forwardRef(({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

/**
 * BreadcrumbSeparator component
 * @param {Object} props - Component props
 * @param {React.ReactNode} [props.children] - Child elements
 * @param {string} [props.className] - Additional CSS classes
 */
const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}) => (
  <li role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
    {children ?? <ChevronRight />}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

/**
 * BreadcrumbEllipsis component
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 */
const BreadcrumbEllipsis = ({
  className,
  ...props
}) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
