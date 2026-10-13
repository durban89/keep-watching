import {
  enabled,
  hideBannerAds,
  muteAds,
  skipVideoAds,
} from '@/utils/settings';

/**
 * Ads rendered around the watch page (masthead, feed, sidebar, in-feed).
 * Hiding these never touches actual video content.
 */
const PAGE_AD_SELECTORS = [
  '#masthead-ad',
  '#player-ads',
  'ytd-display-ad-renderer',
  'ytd-promoted-sparkles-web-renderer',
  'ytd-promoted-sparkles-text-search-renderer',
  'ytd-promoted-video-renderer',
  'ytd-ad-slot-renderer',
  'ytd-in-feed-ad-layout-renderer',
  'ytd-banner-promo-renderer',
  'ytd-statement-banner-renderer',
  'ytd-video-masthead-ad-v3-renderer',
  'ytd-primetime-promo-renderer',
  'ytd-companion-slot-renderer',
  'ytd-action-companion-ad-renderer',
  'ytd-search-pyv-renderer',
  'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',
  'ytm-promoted-sparkles-web-renderer',
  'ytm-promoted-video-renderer',
  'ytm-companion-slot-renderer',
].join(',');

/** Banners and overlays drawn on top of the video player itself. */
const PLAYER_AD_SELECTORS = [
  '.ytp-ad-overlay-container',
  '.ytp-ad-overlay-slot',
  '.ytp-ad-image-overlay',
  '.ytp-ad-text-overlay',
  '.ytp-ad-module',
  '.ytp-ad-player-overlay',
  '.ytp-ad-player-overlay-layout',
  '.ytp-ad-player-overlay-instream-info',
  '.ytp-featured-product',
].join(',');

/** Buttons that dismiss the ad when clicked. */
const SKIP_BUTTON_SELECTORS = [
  '.ytp-ad-skip-button',
  '.ytp-ad-skip-button-modern',
  '.ytp-skip-ad-button',
  '.ytp-ad-skip-button-container button',
  '.ytp-skip-ad-button__text',
  'button.ytp-ad-skip-button-modern',
].join(',');

const STYLE_ID = 'ytad-blocker-style';
const TICK_MS = 250;

function buildStyle(): string {
  return `
    ${PAGE_AD_SELECTORS},
    ${PLAYER_AD_SELECTORS} {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;
}

export default defineContentScript({
  matches: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*'],
  runAt: 'document_start',
  main(ctx) {
    const state = {
      enabled: true,
      skipVideoAds: true,
      hideBannerAds: true,
      muteAds: true,
      adActive: false,
      mutedByUs: false,
      reported: 0,
    };

    /** Count a newly detected ad and report it to the background script. */
    function reportAd() {
      state.reported += 1;
      browser.runtime
        .sendMessage({ type: 'AD_BLOCKED', count: 1 })
        .catch(() => {});
    }

    function applyStyle() {
      let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
      const wanted = state.enabled && state.hideBannerAds;
      if (!wanted) {
        style?.remove();
        return;
      }
      if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ID;
        (document.head || document.documentElement).appendChild(style);
      }
      style.textContent = buildStyle();
    }

    function hidePageAds(root: ParentNode) {
      if (!state.enabled || !state.hideBannerAds) return;
      root.querySelectorAll(PAGE_AD_SELECTORS).forEach((el) => {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
      });
    }

    function getPlayer(): HTMLElement | null {
      return document.querySelector<HTMLElement>('.html5-video-player');
    }

    function isAdShowing(player: HTMLElement): boolean {
      return (
        player.classList.contains('ad-showing') ||
        player.classList.contains('ad-interrupting')
      );
    }

    function clickSkipButton(): boolean {
      const button = document.querySelector<HTMLElement>(SKIP_BUTTON_SELECTORS);
      if (!button) return false;
      button.click();
      return true;
    }

    /** Fast-forward an unskippable ad to its end. */
    function fastForwardAd() {
      const player = getPlayer();
      if (!player) return;
      player.querySelectorAll('video').forEach((video) => {
        const duration = video.duration;
        if (Number.isFinite(duration) && duration > 0) {
          try {
            video.currentTime = duration;
          } catch {
            /* seeking may be rejected */
          }
        }
      });
    }

    function setPlayerMuted(muted: boolean) {
      const player = getPlayer();
      if (!player) return;
      player.querySelectorAll('video').forEach((video) => {
        video.muted = muted;
      });
    }

    function handleAdState() {
      const player = getPlayer();
      const adNow = player ? isAdShowing(player) : false;

      if (adNow && !state.adActive) {
        state.adActive = true;
        if (state.enabled) reportAd();
      } else if (!adNow && state.adActive) {
        state.adActive = false;
        if (state.mutedByUs) {
          state.mutedByUs = false;
          setPlayerMuted(false);
        }
      }

      if (!player || !adNow || !state.enabled) {
        if (state.mutedByUs && !adNow) {
          state.mutedByUs = false;
          setPlayerMuted(false);
        }
        return;
      }

      if (state.muteAds) {
        state.mutedByUs = true;
        setPlayerMuted(true);
      }

      if (state.skipVideoAds) {
        if (!clickSkipButton()) fastForwardAd();
      }
    }

    function handlePlayerOverlays() {
      if (!state.enabled || !state.hideBannerAds) return;
      const player = getPlayer();
      if (!player) return;
      player.querySelectorAll(PLAYER_AD_SELECTORS).forEach((el) => {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
      });
    }

    function tick() {
      hidePageAds(document);
      handlePlayerOverlays();
      handleAdState();
    }

    function start() {
      applyStyle();
      tick();
      const interval = window.setInterval(tick, TICK_MS);
      ctx.onInvalidated(() => window.clearInterval(interval));

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              hidePageAds(node as Element);
            }
          }
        }
        handlePlayerOverlays();
      });
      observer.observe(document.documentElement || document, {
        childList: true,
        subtree: true,
      });
      ctx.onInvalidated(() => observer.disconnect());
    }

    enabled.watch((value) => {
      state.enabled = value ?? true;
      applyStyle();
    });
    hideBannerAds.watch((value) => {
      state.hideBannerAds = value ?? true;
      applyStyle();
    });
    skipVideoAds.watch((value) => {
      state.skipVideoAds = value ?? true;
    });
    muteAds.watch((value) => {
      state.muteAds = value ?? true;
      if (!state.muteAds && state.mutedByUs) {
        state.mutedByUs = false;
        setPlayerMuted(false);
      }
    });

    void Promise.all([
      enabled.getValue(),
      hideBannerAds.getValue(),
      skipVideoAds.getValue(),
      muteAds.getValue(),
    ]).then(([isEnabled, hides, skips, mutes]) => {
      state.enabled = isEnabled ?? true;
      state.hideBannerAds = hides ?? true;
      state.skipVideoAds = skips ?? true;
      state.muteAds = mutes ?? true;
      start();
    });
  },
});
