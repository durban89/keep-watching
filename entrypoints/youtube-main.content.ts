/**
 * MAIN-world patch.
 *
 * YouTube does not load ads from third-party ad networks: it packages ad
 * instructions inside its own API responses (`adPlacements`, `playerAds`,
 * `adSlots`, ...). A reactive blocker (hide/skip while the ad is in the DOM)
 * leaves fingerprints the anti-adblock system can detect.
 *
 * Running in the page's MAIN world lets us strip those instructions *before*
 * the player reads them, so no ad slot is ever created and there is nothing to
 * detect. We intercept every place the payload can be deserialized:
 *
 *   1. `JSON.parse`                - XHR / `response.text()` payloads
 *   2. `Response.prototype.json`   - `fetch(...).json()`
 *   3. `ytInitialPlayerResponse` / `ytInitialData` setters - inline bootstrap
 *
 * This file must NOT use the `browser` API: MAIN-world scripts have no access
 * to extension APIs.
 */

const AD_KEYS = new Set<string>([
  'adPlacements',
  'playerAds',
  'adSlots',
  'adBreakHeartbeatParams',
  'adBreakParams',
  'adPlacementConfig',
  'adPlacementRenderer',
  'adSignalsInfo',
  'adBreakServiceRenderer',
  'adBreakRenderer',
  'adSlotRenderer',
  'adSlotAndLayout',
  'adSlotMetadata',
  'adLayoutMetadata',
  'adLayoutRenderData',
  'adActionInterstitialRenderer',
  'adFeedbackRenderer',
  'adInfoDialogRenderer',
  'adReasonRenderer',
  'adHoverTextButtonRenderer',
  'advertiserInfoRenderer',
  'playerLegacyDesktopWatchAdsRenderer',
  'instreamVideoAdRenderer',
  'instreamAdPlayerOverlayRenderer',
  'linearAdSequenceRenderer',
  'invideoOverlayAdRenderer',
  'actionCompanionAdRenderer',
  'promotedSparklesWebRenderer',
  'promotedSparklesTextSearchRenderer',
  'promotedVideoRenderer',
  'compactPromotedVideoRenderer',
  'displayAdRenderer',
  'adBreakResponsiveHeaderRenderer',
]);

const ENFORCEMENT_KEYS = new Set<string>([
  'enforcementMessageViewModel',
  'enforcementMessage',
  'adBlockerOverlay',
  'adBlockDetected',
]);

/** Catches ad keys YouTube may rename or add in the future. */
const AD_KEY_PATTERN =
  /^(?:ad[A-Z]\w*|playerAds?)$|Ad(?:Renderer|Module|Layout|Config|Slot|Break|Placement|Overlay|Sequence)$/;

const AD_RENDERER_PATTERNS = [
  'adSlotRenderer',
  'promotedSparkles',
  'promotedVideo',
  'displayAd',
  'inFeedAdLayout',
  'CompanionAd',
  'companionAd',
  'adSlot',
  'searchPyv',
];

/** Cheap substring gate so we only invest in cleansing real payloads. */
const AD_MARKERS = [
  'adPlacements',
  'playerAds',
  'adSlots',
  'adBreakHeartbeatParams',
  'enforcementMessage',
  'adSlotRenderer',
];

function hasAdMarker(text: string): boolean {
  return AD_MARKERS.some((marker) => text.includes(marker));
}

function isAdRenderer(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return Object.keys(value).some((key) =>
    AD_RENDERER_PATTERNS.some((pattern) => key.includes(pattern)),
  );
}

function isEnforcementAction(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  try {
    const text = JSON.stringify(value);
    return (
      text.includes('enforcementMessage') ||
      text.includes('adBlocker') ||
      text.includes('ad blocker')
    );
  } catch {
    return false;
  }
}

/** Recursively remove ad and enforcement data from a decoded payload. */
function cleanse(value: unknown, seen: WeakSet<object>): unknown {
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i--) {
      const item = value[i];
      if (isAdRenderer(item) || isEnforcementAction(item)) {
        value.splice(i, 1);
        continue;
      }
      cleanse(item, seen);
    }
    return value;
  }

  const obj = value as Record<string, unknown>;

  if (Array.isArray(obj.actions)) {
    obj.actions = obj.actions.filter((action) => !isEnforcementAction(action));
  }

  for (const key of Object.keys(obj)) {
    if (
      AD_KEYS.has(key) ||
      ENFORCEMENT_KEYS.has(key) ||
      AD_KEY_PATTERN.test(key)
    ) {
      delete obj[key];
    }
  }

  for (const key of Object.keys(obj)) {
    cleanse(obj[key], seen);
  }

  return obj;
}

export default defineContentScript({
  matches: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*'],
  runAt: 'document_start',
  world: 'MAIN',

  main() {
    const win = window as typeof window & {
      __keepWatchingMain?: boolean;
      ytInitialPlayerResponse?: unknown;
      ytInitialData?: unknown;
    };

    if (win.__keepWatchingMain) return;
    win.__keepWatchingMain = true;

    // 1. JSON.parse ---------------------------------------------------------
    const nativeParse = JSON.parse;
    Object.defineProperty(JSON, 'parse', {
      configurable: true,
      writable: true,
      value: function (
        text: string,
        reviver?: (this: unknown, key: string, value: unknown) => unknown,
      ) {
        const result = nativeParse(text, reviver);
        try {
          if (typeof text === 'string' && hasAdMarker(text)) {
            cleanse(result, new WeakSet());
          }
        } catch {
          /* never break the page */
        }
        return result;
      },
    });

    // 2. Response.prototype.json -------------------------------------------
    const nativeResponseJson = Response.prototype.json;
    Object.defineProperty(Response.prototype, 'json', {
      configurable: true,
      writable: true,
      value: async function (this: Response) {
        const data = await nativeResponseJson.call(this);
        try {
          const url = this.url || '';
          if (url.includes('/youtubei/') || url.includes('/get_watch')) {
            cleanse(data, new WeakSet());
          }
        } catch {
          /* never break the page */
        }
        return data;
      },
    });

    // 3. Bootstrap payload setters -----------------------------------------
    function trap(name: 'ytInitialPlayerResponse' | 'ytInitialData') {
      let current = win[name];
      try {
        if (current) cleanse(current, new WeakSet());
        Object.defineProperty(win, name, {
          configurable: true,
          get() {
            return current;
          },
          set(value: unknown) {
            current = cleanse(value, new WeakSet());
          },
        });
      } catch {
        /* property already non-configurable: fall back to the DOM cleanup */
      }
    }

    trap('ytInitialPlayerResponse');
    trap('ytInitialData');
  },
});
