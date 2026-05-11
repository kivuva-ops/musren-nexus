import type { ReactNode } from "react";

export function Section({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: {
  eyebrow?: string;
  title?: ReactNode;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16 ${className}`}>
      {(eyebrow || title || description) && (
        <div className="max-w-3xl mx-auto mb-8 text-center">
          {eyebrow && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium tracking-wide text-primary uppercase">
              {eyebrow}
            </span>
          )}
          {title && (
            <h2 className="mt-4 text-4xl sm:text-5xl font-bold leading-[1.05]">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
