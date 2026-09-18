import { type ReactNode } from 'react';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import AudioStatus from '../../audio/AudioStatus';
import SidebarAudioBand from '../../audio/SidebarAudioBand';
import styles from './styles.module.css';

/**
 * The pinned bottom region: chapter audio above the site's own controls.
 *
 * The band is the last thing between the reader and the scrolling list. Nothing here is
 * optional except the band itself, which renders no DOM on a chapter without audio, so the
 * utility row is the only fixed bottom line.
 *
 * The utility row's spare width is where the player names the heading being narrated: the
 * space beside the theme toggle and the GitHub link is otherwise empty, and the whole band
 * buys it a line of its own.
 */
export default function SidebarFooter(): ReactNode {
  return (
    <div className={styles.sidebarFooter} data-sidebar-footer="">
      <SidebarAudioBand />
      <div className={styles.sidebarUtility} data-sidebar-utility="">
        <NavbarColorModeToggle />
        <a
          href="https://github.com/agenticoding/agenticoding.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubLink}
          aria-label="GitHub repository"
        >
          <svg
            viewBox="0 0 24 24"
            width={24}
            height={24}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
          </svg>
        </a>
        <AudioStatus />
      </div>
    </div>
  );
}
