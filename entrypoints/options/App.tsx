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

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 antialiased">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex items-center gap-3">
          <img src="/icon/128.png" alt="" className="h-10 w-10" />
          <div>
            <h1 className="text-lg font-semibold">KeepWatching</h1>
            <p className="text-sm text-slate-400">
              Enjoy a cleaner, uninterrupted viewing experience on video sites.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-300">
            Ad Handling
          </h2>
          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-between text-sm">
              <span>
                Enable extension
                <span className="block text-xs text-slate-500">
                  Turn every feature on or off
                </span>
              </span>
              <Toggle
                aria-label="Enable extension"
                checked={isEnabled ?? false}
                onChange={(value) => void setIsEnabled(value)}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>
                Skip video ads
                <span className="block text-xs text-slate-500">
                  Click skip buttons and fast-forward unskippable ads
                </span>
              </span>
              <Toggle
                aria-label="Skip video ads"
                checked={skips ?? false}
                disabled={!isEnabled}
                onChange={(value) => void setSkips(value)}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>
                Hide banner ads
                <span className="block text-xs text-slate-500">
                  Masthead, sidebar, feed and in-player overlay ads
                </span>
              </span>
              <Toggle
                aria-label="Hide banner ads"
                checked={hides ?? false}
                disabled={!isEnabled}
                onChange={(value) => void setHides(value)}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>
                Mute during ads
                <span className="block text-xs text-slate-500">
                  Silence the player while an ad is playing
                </span>
              </span>
              <Toggle
                aria-label="Mute during ads"
                checked={mutes ?? false}
                disabled={!isEnabled}
                onChange={(value) => void setMutes(value)}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-300">
            Appearance
          </h2>
          <label className="flex items-center justify-between text-sm">
            <span>
              Show badge counter
              <span className="block text-xs text-slate-500">
                Display the handled ad count on the toolbar icon
              </span>
            </span>
            <Toggle
              aria-label="Show badge counter"
              checked={badge ?? false}
              onChange={(value) => void setBadge(value)}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-300">
            Statistics
          </h2>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Total handled:{' '}
              <span className="font-semibold text-slate-100">{count ?? 0}</span>
            </p>
            <button
              type="button"
              onClick={() => void resetStats()}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium transition hover:bg-slate-800"
            >
              Reset stats
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-xs text-slate-400">
          <h2 className="mb-3 text-sm font-semibold text-slate-300">
            Supported pages
          </h2>
          <p>
            Applies to supported video sites: watch pages, Shorts, the home
            feed, search results and channel pages.
          </p>
        </section>
      </div>
    </div>
  );
}

export default App;
