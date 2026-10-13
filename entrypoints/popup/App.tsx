import { Toggle } from '@/components/Toggle';
import { useStorageItem } from '@/hooks/useStorageItem';
import {
  blockedCount,
  enabled,
  hideBannerAds,
  muteAds,
  resetStats,
  showBadge,
  skipVideoAds,
} from '@/utils/settings';

function App() {
  const [isEnabled, setIsEnabled] = useStorageItem(enabled);
  const [skips, setSkips] = useStorageItem(skipVideoAds);
  const [hides, setHides] = useStorageItem(hideBannerAds);
  const [mutes, setMutes] = useStorageItem(muteAds);
  const [badge, setBadge] = useStorageItem(showBadge);
  const [count] = useStorageItem(blockedCount);

  const options = [
    {
      label: 'Skip video ads',
      hint: 'Auto-skip or fast-forward pre-roll and mid-roll ads',
      value: skips,
      set: setSkips,
    },
    {
      label: 'Hide banner ads',
      hint: 'Masthead, sidebar, feed and overlay ads',
      value: hides,
      set: setHides,
    },
    {
      label: 'Mute during ads',
      hint: 'Silence the player while an ad is playing',
      value: mutes,
      set: setMutes,
    },
    {
      label: 'Show badge counter',
      hint: 'Display the handled ad count on the toolbar icon',
      value: badge,
      set: setBadge,
    },
  ];

  return (
    <div className="flex w-80 flex-col gap-4 bg-slate-950 p-4 text-slate-100 antialiased">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/icon/48.png" alt="" className="h-7 w-7" />
          <div className="leading-tight">
            <h1 className="text-sm font-semibold">KeepWatching</h1>
            <p className="text-[11px] text-slate-400">Uninterrupted viewing</p>
          </div>
        </div>
        <Toggle
          aria-label="Enabled"
          checked={isEnabled ?? false}
          onChange={(value) => void setIsEnabled(value)}
        />
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
        <p className="text-[11px] text-slate-400">Ads handled</p>
        <p className="text-3xl font-bold tabular-nums">{count ?? 0}</p>
      </section>

      <section className="flex flex-col gap-2">
        {options.map((option) => (
          <label
            key={option.label}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs"
          >
            <span>
              {option.label}
              <span className="block text-[10px] text-slate-500">
                {option.hint}
              </span>
            </span>
            <Toggle
              aria-label={option.label}
              checked={option.value ?? false}
              disabled={!isEnabled}
              onChange={(value) => void option.set(value)}
            />
          </label>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void resetStats()}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
        >
          Reset stats
        </button>
        <button
          type="button"
          onClick={() => void browser.runtime.openOptionsPage()}
          className="rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-400"
        >
          Settings
        </button>
      </section>

      <footer className="text-center text-[10px] text-slate-500">
        Works on watch pages, Shorts, feed and search
      </footer>
    </div>
  );
}

export default App;
