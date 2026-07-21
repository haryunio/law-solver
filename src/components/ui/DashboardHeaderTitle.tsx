import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";

interface DashboardHeaderTitleProps {
  title?: string;
  sectionTitle?: string;
  description?: string;
  logoTo: string;
  logoLabel: string;
  children?: ReactNode;
}

export function DashboardHeaderTitle({
  title,
  sectionTitle,
  description,
  logoTo,
  logoLabel,
  children,
}: DashboardHeaderTitleProps) {
  const hasHeading = Boolean(title || sectionTitle || description);

  return (
    <header className="app-card mb-5 rounded-2xl border">
      <div className="p-3 md:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-3">
          <div className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-3">
            <Link
              to={logoTo}
              className={[
                "group flex min-h-8 w-fit shrink-0 items-center gap-2 text-[15px] font-semibold leading-none tracking-[-0.015em] text-stone-900 transition-colors duration-150 hover:text-red-600 dark:text-stone-100 dark:hover:text-red-400",
                hasHeading ? "pb-3 sm:pb-0" : "pb-0",
              ].join(" ")}
              aria-label={logoLabel}
            >
              <BrandMark
                size="small"
                className="shadow-[0_6px_16px_rgba(239,68,68,0.18)]"
              />
              <span className="whitespace-nowrap">Law Solver</span>
            </Link>

            {hasHeading ? (
              <>
                <span
                  aria-hidden="true"
                  className="hidden h-7 w-px shrink-0 bg-stone-200 sm:block dark:bg-stone-700"
                />

                <div className="flex min-w-0 flex-1 items-center border-y border-stone-200 py-3 sm:border-0 sm:py-0 dark:border-stone-800">
                  <div className="min-w-0 flex-1">
                    <div className="flex h-7 min-w-0 items-center">
                      {title ? (
                        <h1
                          title={title}
                          className="flex h-7 min-w-0 items-center truncate text-base font-semibold leading-none tracking-[-0.02em] text-stone-900 md:text-lg dark:text-stone-100"
                        >
                          {title}
                        </h1>
                      ) : null}
                      {sectionTitle ? (
                        <>
                          {title ? (
                            <span
                              aria-hidden="true"
                              className="mx-2.5 h-5 w-px shrink-0 bg-stone-200 dark:bg-stone-700"
                            />
                          ) : null}
                          <span className="flex h-7 shrink-0 items-center whitespace-nowrap text-[13px] font-medium leading-none text-stone-500 md:text-sm dark:text-stone-400">
                            {sectionTitle}
                          </span>
                        </>
                      ) : null}
                    </div>
                    {description ? (
                      <p className="mt-0.5 hidden text-xs leading-4 text-stone-500 dark:text-stone-500 md:block">
                        {description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {children ? (
            <div className="grid w-full grid-cols-2 gap-2 pt-3 sm:mt-3 sm:flex sm:flex-wrap sm:justify-end sm:border-t sm:border-stone-200 md:mt-4 md:pt-4 lg:mt-0 lg:w-auto lg:shrink-0 lg:border-0 lg:pt-0 [&>*]:w-full sm:[&>*]:w-auto dark:border-stone-800">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
