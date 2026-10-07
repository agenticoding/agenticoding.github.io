import { type ReactNode } from 'react';
import { useLocation } from '@docusaurus/router';
import Translate from '@docusaurus/Translate';
import { useDateTimeFormat } from '@docusaurus/theme-common/internal';
import type { Props } from '@theme/LastUpdated';

function UpdatedDate({ timestamp }: { timestamp: number }): ReactNode {
  const date = new Date(timestamp);
  const formatted = useDateTimeFormat({
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
  return (
    <time dateTime={date.toISOString()} itemProp="dateModified">
      {formatted}
    </time>
  );
}

/**
 * Swizzled to keep the footer metadata row on one line on narrow phones:
 * - label drops the "on" connector — still "Last updated <date>", but short
 *   enough to sit beside "Edit this page" at 320px;
 * - the date is not bolded (tertiary metadata; EditMetaRow owns its styling);
 * - Docusaurus's dev-only "Simulated during dev" note is omitted — it widened
 *   the date span and forced an awkward wrap during development only.
 * Absolute build-time date, rendered server-side; no JS enhancement.
 *
 * The homepage is the book's cover: its date is the book-wide last update
 * injected via `markdown.parseFrontMatter` (see docusaurus.config.ts). Label it
 * "Book last updated" to name that scope; chapters keep "Last updated".
 */
export default function LastUpdated({
  lastUpdatedAt,
  lastUpdatedBy,
}: Props): ReactNode {
  // Cover only: exact '/' matches single-locale, no-prefix deploys
  // (trailingSlash:false, baseUrl:'/', one locale). Revisit with i18n/prefix.
  const isHomepage = useLocation().pathname === '/';
  return (
    <span className="theme-last-updated">
      {lastUpdatedAt && (
        <Translate
          id={
            isHomepage
              ? 'theme.lastUpdated.bookLastUpdated'
              : 'theme.lastUpdated.lastUpdated'
          }
          description="Label for when a page was last updated"
          values={{ date: <UpdatedDate timestamp={lastUpdatedAt} /> }}
        >
          {isHomepage ? 'Book last updated {date}' : 'Last updated {date}'}
        </Translate>
      )}
      {lastUpdatedBy && (
        <Translate
          id="theme.lastUpdated.byUser"
          description="The words used to describe by who the page has been last updated"
          values={{ user: lastUpdatedBy }}
        >
          {' by {user}'}
        </Translate>
      )}
    </span>
  );
}
