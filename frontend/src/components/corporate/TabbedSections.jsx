import clsx from 'clsx'

export function TabbedSections({ tabs, activeTab, onTabChange }) {
  return (
    <div className="border-b border-slate-200 mb-6 overflow-x-auto">
      <nav className="flex gap-1 min-w-max" aria-label="Sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
