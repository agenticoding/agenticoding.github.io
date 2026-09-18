/**
 * The reader's eye channel — the heading they are actually looking at — published once
 * per page.
 *
 * The TOC renders twice on every page (the desktop sidebar and the always-mounted mobile
 * drawer), so a scrollspy per TOC instance ran two observers over the same headings and
 * could report two different rows. `DocItem/Layout` mounts exactly one publisher; every
 * TOC instance reads the store instead.
 *
 * The resolver itself stays in `DocSidebar/Desktop/scrollspy.ts`, which is unit tested.
 * This module owns only the DOM plumbing, the store, and moving the page to a heading.
 */
import React from 'react';

import { publishActiveHeading, useTocEntries } from './tocStore';
import {
  resolveActiveHeading,
  type HeadingSnapshot,
} from './DocSidebar/Desktop/scrollspy';

export function useActiveHeadingPublisher(docId: string): void {
  const ids = useTocIds();
  const idsKey = ids.join(',');
  React.useEffect(() => {
    if (ids.length === 0) {
      publishActiveHeading('');
      return undefined;
    }
    return observeHeadings(ids); // observeHeadings returns its own teardown
    // `idsKey` is the identity of the list. Re-running on array identity would rebuild the
    // observers every time the article column re-renders. `docId` re-arms them per document:
    // two chapters may share a heading id set, and observers bound to the previous
    // chapter's detached headings would never fire again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, docId]);
}

/** Heading ids in document order, deduped: a repeated id must not be observed twice. */
function useTocIds(): string[] {
  const entries = useTocEntries();
  return React.useMemo(
    () => [...new Set(entries.map((entry) => entry.id))],
    [entries]
  );
}

const SCROLLSPY_EVENTS = ['scroll', 'resize', 'hashchange'] as const;
/** Any of these means the reader is driving the page again by hand. */
const TAKEOVER_EVENTS = [
  'wheel',
  'touchstart',
  'keydown',
  'pointerdown',
] as const;

/**
 * The heading the reader asked for, until the page has travelled to it. The spy measures where the
 * page is, not where the reader pointed it, so its very next frame would name the heading the reader
 * just left — blinking the requested row back to its idle weight for the whole length of the scroll.
 */
let requestedHeadingId: string | null = null;
let requestedFromY = 0;

/** Watch the headings until the returned teardown is called. */
function observeHeadings(ids: readonly string[]): () => void {
  const frames = createFrameScheduler(ids);
  const observer = createScrollspyObserver(ids, frames.schedule);
  const stopListening = listenSpyEvents(frames.schedule);
  requestedHeadingId = null; // a new document owns the page; no request can be in flight
  publishActiveHeading('');
  frames.schedule();

  return () => {
    frames.cancel();
    observer.disconnect();
    stopListening();
  };
}

/** Wire (and later unwire) the window events the spy and the takeover release listen to. */
function listenSpyEvents(schedule: () => void): () => void {
  const release = () => {
    requestedHeadingId = null;
  };
  SCROLLSPY_EVENTS.forEach((type) =>
    window.addEventListener(type, schedule, { passive: true })
  );
  TAKEOVER_EVENTS.forEach((type) =>
    window.addEventListener(type, release, { passive: true })
  );
  return () => {
    SCROLLSPY_EVENTS.forEach((type) =>
      window.removeEventListener(type, schedule)
    );
    TAKEOVER_EVENTS.forEach((type) =>
      window.removeEventListener(type, release)
    );
  };
}

/** One measurement pass per frame, however many events arrive inside that frame. */
function createFrameScheduler(ids: readonly string[]): {
  schedule: () => void;
  cancel: () => void;
} {
  let frame = 0;
  return {
    schedule: () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        publishActiveHeading(nextHeading(ids));
      });
    },
    cancel: () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
    },
  };
}

function createScrollspyObserver(
  ids: readonly string[],
  schedule: () => void
): IntersectionObserver {
  const observer = new IntersectionObserver(schedule, { threshold: 0 });
  ids
    .flatMap((id) => document.getElementById(id) ?? [])
    .forEach((el) => observer.observe(el));
  return observer;
}

/**
 * The heading to publish. The reader's request wins until the spy names the same row, so the
 * handover happens exactly when both agree and the highlight never blinks in between.
 */
function nextHeading(ids: readonly string[]): string {
  const measured = resolveCurrentHeading(ids);
  if (requestedHeadingId === null || measured === requestedHeadingId) {
    requestedHeadingId = null;
    return measured;
  }
  // The last rows of a chapter sit closer to the bottom than the reading line can ever reach, so a
  // page that has already stopped moving is as far as this travel goes; the spy knows where that is.
  if (isAtPageBottom() && window.scrollY !== requestedFromY) {
    requestedHeadingId = null;
    return measured;
  }
  return requestedHeadingId;
}

function resolveCurrentHeading(ids: readonly string[]): string {
  return resolveActiveHeading({
    headings: ids.flatMap(headingSnapshot),
    viewportHeight: window.innerHeight,
    atPageBottom: isAtPageBottom(),
  });
}

function headingSnapshot(id: string): HeadingSnapshot[] {
  const element = document.getElementById(id);
  if (element == null) return [];
  const rect = element.getBoundingClientRect();
  return [{ id, top: rect.top, bottom: rect.bottom }];
}

function isAtPageBottom(): boolean {
  const scrollBottom = window.scrollY + window.innerHeight;
  return Math.ceil(scrollBottom) >= document.documentElement.scrollHeight - 1;
}

/**
 * Move the page to a heading without a reload; reduced motion removes the travel. The heading is
 * claimed for the length of that travel — the spy would otherwise report the route, not the
 * destination, and the row the reader just clicked would lose its highlight until the page arrives.
 */
export function scrollToHeading(id: string): void {
  const element = document.getElementById(id);
  if (element == null) return;
  requestedHeadingId = id;
  requestedFromY = window.scrollY;
  window.history.pushState(null, '', `#${id}`);
  element.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
    inline: 'nearest',
  });
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
