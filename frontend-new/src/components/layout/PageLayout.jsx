import React from "react";

export const PageLayout = ({
  eyebrow,
  title,
  description,
  actions,
  children,
}) => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
      {/* Header section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6 transition-colors duration-200">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1.5">
            <span className="w-5 h-0.5 bg-emerald-600 rounded"></span>
            {eyebrow}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {description}
          </p>
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 self-start md:self-end shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Main body */}
      <div>{children}</div>
    </main>
  );
};
