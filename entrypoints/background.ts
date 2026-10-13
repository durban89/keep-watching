import { blockedCount, incrementBlocked, showBadge } from '@/utils/settings';

/** Update the toolbar badge to reflect the total number of handled ads. */
async function refreshBadge(): Promise<void> {
  try {
    const [count, show] = await Promise.all([
      blockedCount.getValue(),
      showBadge.getValue(),
    ]);
    const text = show && count > 0 ? String(count) : '';
    await browser.action.setBadgeText({ text });
    await browser.action.setBadgeBackgroundColor({ color: '#ef4444' });
  } catch (error) {
    console.error('[KeepWatching] Failed to update badge', error);
  }
}

export default defineBackground(() => {
  blockedCount.watch(() => {
    void refreshBadge();
  });

  showBadge.watch(() => {
    void refreshBadge();
  });

  browser.runtime.onMessage.addListener((message: unknown) => {
    const msg = message as { type?: string; count?: number };
    if (msg?.type === 'AD_BLOCKED' && typeof msg.count === 'number') {
      void incrementBlocked(msg.count);
      return;
    }
    if (msg?.type === 'RESET_BADGE') {
      void refreshBadge();
    }
  });

  browser.runtime.onInstalled.addListener(() => {
    void refreshBadge();
  });

  browser.runtime.onStartup.addListener(() => {
    void refreshBadge();
  });

  void refreshBadge();
});
