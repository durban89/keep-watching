import { storage } from 'wxt/utils/storage';

/** Master switch: enable all ad handling */
export const enabled = storage.defineItem<boolean>('local:enabled', {
  fallback: true,
});

/** Auto skip / fast-forward video (pre-roll, mid-roll) ads */
export const skipVideoAds = storage.defineItem<boolean>('local:skipVideoAds', {
  fallback: true,
});

/** Hide banner, masthead and feed ads on the page */
export const hideBannerAds = storage.defineItem<boolean>('local:hideBannerAds', {
  fallback: true,
});

/** Mute the player while an ad is playing */
export const muteAds = storage.defineItem<boolean>('local:muteAds', {
  fallback: true,
});

/** Show the number of handled ads as an action badge */
export const showBadge = storage.defineItem<boolean>('local:showBadge', {
  fallback: true,
});

/** Total number of ads that were skipped or hidden */
export const blockedCount = storage.defineItem<number>('local:blockedCount', {
  fallback: 0,
});

export async function incrementBlocked(count: number): Promise<void> {
  if (count <= 0) return;
  const current = await blockedCount.getValue();
  await blockedCount.setValue(current + count);
}

export async function resetStats(): Promise<void> {
  await blockedCount.setValue(0);
}
