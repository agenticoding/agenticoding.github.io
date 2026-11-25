import clsx from 'clsx';

import {
  CONTROLS,
  drafterInventory,
  engineCount,
  mtpChipSpoken,
  unreachableContextNote,
} from './openWeightFitCopy.ts';
import type {
  ContextOption,
  ConversationOption,
  MtpOptions,
  Selection,
} from './openWeightFitModel.ts';
import { conversationsLabel } from './openWeightFitModel.ts';
import { contextLabel } from './figureCatalog.ts';
import { FigureStopSlider } from './FigureStopSlider.tsx';
import styles from './openWeightFit.module.css';
import sharedStyles from './Figure.module.css';

/** The drafter lever's two states, in the page's own word order. */
const MTP_STATES = [
  { enabled: true, label: 'On' },
  { enabled: false, label: 'Off' },
] as const;

export type WorkloadControlsProps = {
  selection: Selection;
  contextOptions: readonly ContextOption[];
  conversationOptions: readonly ConversationOption[];
  onContext: (tokens: number) => void;
  onConversations: (conversations: number) => void;
  /** The speculative component's switch: on loads it resident, off frees it. */
  onMtpEnabled: (enabled: boolean) => void;
  /** The fits and sizes this lever's two states leave, from the resolver. */
  mtp: MtpOptions;
  /** Checkpoints the current rows span, the denominator both chips print. */
  mtpTotal: number;
};

/**
 * The request's own size, beside the memory track: both are levers the reader
 * sets, and the cache the workload costs is drawn in the track next to it. A
 * context the runtime cannot reach is absent from the axis and counted below,
 * the same way the runtime rail accounts for a runtime that sizes nothing.
 */
export function OpenWeightFitWorkloadControls({
  selection,
  contextOptions,
  conversationOptions,
  onContext,
  onConversations,
  onMtpEnabled,
  mtp,
  mtpTotal,
}: WorkloadControlsProps) {
  const reachable = contextOptions.filter((option) => option.reachable);
  if (!reachable.length) return null;
  const hidden = contextOptions.length - reachable.length;
  // The store carries the default: an absent flag means the drafter loads.
  const mtpOn = selection.mtpEnabled !== false;

  return (
    <div className={styles.workload}>
      <FigureStopSlider
        label={CONTROLS.context}
        caption={CONTROLS.contextShort}
        axis="context"
        stops={reachable.map((option) => ({
          key: option.tokens,
          label: contextLabel(option.tokens),
          spoken: `${contextLabel(option.tokens)} context, prompt plus output`,
        }))}
        selected={selection.contextTokens}
        onStop={(stop) => onContext(stop.key)}
      />
      <FigureStopSlider
        label={CONTROLS.conversations}
        caption={CONTROLS.conversations}
        axis="conversations"
        stops={conversationOptions.map((option) => ({
          key: option.conversations,
          label: `${option.conversations}`,
          spoken: conversationsLabel(option.conversations),
        }))}
        selected={selection.conversations}
        onStop={(stop) => onConversations(stop.key)}
      />
      {/* The drafter lever: a deployment switch, not a workload size. It sits
          with the other levers because it changes what the rows need. */}
      <div
        className={sharedStyles.leverField}
        role="group"
        aria-label={CONTROLS.drafter}
        data-fit-mtp-toggle=""
      >
        <p className={sharedStyles.leverHead}>
          <span className={sharedStyles.leverLabel}>{CONTROLS.drafter}</span>
        </p>
        {/* The page's one control geometry, and its one count notation: each
            chip prints the fits its own click leaves, so a state that changes
            nothing says so with two equal numbers. */}
        <div className={styles.mtpRail}>
          {MTP_STATES.map((state) => {
            const fits = state.enabled ? mtp.on : mtp.off;
            return (
              <button
                key={state.label}
                type="button"
                className={sharedStyles.chip}
                aria-pressed={mtpOn === state.enabled}
                aria-label={mtpChipSpoken(state.label, fits, mtpTotal)}
                onClick={() => onMtpEnabled(state.enabled)}
                data-fit-mtp={state.label.toLowerCase()}
                data-fit-mtp-fits={fits}
              >
                {state.label}
                <span className={sharedStyles.chipCount} aria-hidden="true">
                  {' · '}
                  {engineCount(fits, mtpTotal)}
                </span>
              </button>
            );
          })}
        </div>
        <p className={clsx(sharedStyles.railNote, styles.mtpNote)}>
          {drafterInventory(mtp.sized, mtpTotal)}
        </p>
      </div>
      {hidden > 0 ? (
        <p className={sharedStyles.railNote}>
          {unreachableContextNote(hidden)}
        </p>
      ) : null}
    </div>
  );
}

export default OpenWeightFitWorkloadControls;
