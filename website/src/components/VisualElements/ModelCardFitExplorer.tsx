import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import InlineEmojiImage from './InlineEmojiImage';
import { GearNode } from './GearNode';
import {
  TokenTypeTokens,
  tokenIllustrationWidth,
  type TokenExample,
} from './TokenTypeIllustration';
import type { TokenUnitModality } from './TokenUnit';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import {
  BenchmarkChartSvg,
  compactChart,
  compactXTicks,
  layoutCurveLabels,
} from './LongContextBenchmarkChart';
import { benchmarkRows, type BenchmarkRow } from './LongContextBenchmarkTable';
import styles from './ModelCardFitExplorer.module.css';

type ModelId = 'opus' | 'sonnet' | 'gpt55' | 'flash' | 'pro';

type PublishedBenchmark = {
  name: string;
  score: string;
  source: { label: string; href: string };
};

type PriceProfile = {
  input: string;
  output: string;
  cacheRead: string;
  cacheWrite: string;
  cacheTtl: string;
};

type ModalityProfile = {
  input: readonly TokenUnitModality[];
  output: readonly TokenUnitModality[];
};

type ArchitectureProfile = {
  base: string;
  reasoning: string;
  multimodal: string;
  context: string;
};

type CardField = {
  label: string;
  icon: EmojiAsset;
  value: string;
  implication: string;
  boundary: string;
  publishedBenchmark?: PublishedBenchmark;
  price?: PriceProfile;
  modality?: ModalityProfile;
};

type SlideDirection = 'forward' | 'backward';

type ModelCard = {
  id: ModelId;
  benchmarkId: BenchmarkRow['id'];
  provider: string;
  name: string;
  architecture: ArchitectureProfile;
  source: { label: string; href: string };
  fields: readonly CardField[];
};

const SOURCES = {
  opus: {
    label: 'Open Claude Opus 4.6 release report',
    href: 'https://www.anthropic.com/news/claude-opus-4-6',
  },
  sonnet: {
    label: 'Open Claude Sonnet 4.6 release report',
    href: 'https://www.anthropic.com/news/claude-sonnet-4-6',
  },
  gpt55: {
    label: 'Open GPT-5.5 API documentation',
    href: 'https://developers.openai.com/api/docs/models/gpt-5.5',
  },
  flash: {
    label: 'Open DeepSeek V4 Flash model card',
    href: 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash',
  },
  pro: {
    label: 'Open DeepSeek V4 Pro model card',
    href: 'https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro',
  },
} as const;

const LIVEBENCH_INSTRUCTION_FOLLOWING = {
  name: 'LIVEBENCH · INSTRUCTION FOLLOWING',
  source: {
    label: 'LiveBench methodology and leaderboard ↗',
    href: 'https://livebench.ai/',
  },
} as const;

const CARDS: readonly ModelCard[] = [
  {
    id: 'opus',
    benchmarkId: 'opus-46',
    provider: 'Anthropic',
    name: 'Claude Opus 4.6',
    architecture: {
      base: 'Mixture-of-Experts (reported)',
      reasoning: 'Adaptive thinking · System 1 / System 2',
      multimodal: 'GUI navigation · high-resolution images',
      context: '1M tokens · context compaction',
    },
    source: SOURCES.opus,
    fields: [
      {
        label: 'Price',
        icon: EMOJI.money,
        value: '$5 input / $25 output per MTok',
        price: {
          input: '$5.00',
          output: '$25.00',
          cacheRead: '$0.50',
          cacheWrite: '5m $6.25 · 1h $10',
          cacheTtl: '5 minutes or 1 hour',
        },
        implication: 'A high-cost long-context quality envelope.',
        boundary:
          'Cost and latency still depend on reasoning effort and workload volume.',
      },
      {
        label: 'Modality',
        icon: EMOJI.documentTabs,
        value: 'Image + text input; text output',
        modality: { input: ['text', 'image'], output: ['text'] },
        implication:
          'Matches the stated email workload without overclaiming attachment support.',
        boundary:
          'The release report is not a complete I/O limits specification.',
      },
      {
        label: 'Context vs. recall',
        icon: EMOJI.books,
        value: '76% on 1M-token MRCR v2 8-needle',
        implication:
          'Strongest directly relevant published retrieval signal in this set.',
        boundary:
          'MRCR does not measure extraction, ranking, or schema validity.',
      },
      {
        label: 'Instruction following',
        icon: EMOJI.map,
        value: 'LiveBench Instruction Following: 63.3%',
        publishedBenchmark: {
          ...LIVEBENCH_INSTRUCTION_FOLLOWING,
          score: '63.3%',
        },
        implication:
          'The score is comparable across the cards and provides a broad instruction-following signal.',
        boundary: 'It does not replace an inbox-specific evaluation.'
      },
    ],
  },
  {
    id: 'sonnet',
    benchmarkId: 'sonnet-46',
    provider: 'Anthropic',
    name: 'Claude Sonnet 4.6',
    architecture: {
      base: 'Dense Transformer (reported)',
      reasoning: 'Adaptive thinking · System 1 / System 2',
      multimodal: 'GUI navigation · documents',
      context: '1M tokens · context compaction',
    },
    source: SOURCES.sonnet,
    fields: [
      {
        label: 'Price',
        icon: EMOJI.money,
        value: '$3 input / $15 output per MTok',
        price: {
          input: '$3.00',
          output: '$15.00',
          cacheRead: '$0.30',
          cacheWrite: '5m $3.75 · 1h $6',
          cacheTtl: '5 minutes or 1 hour',
        },
        implication: 'A practical middle tier for a production trial.',
        boundary: 'Price does not establish latency or task quality.',
      },
      {
        label: 'Modality',
        icon: EMOJI.documentTabs,
        value: 'Image + text input; text output',
        modality: { input: ['text', 'image'], output: ['text'] },
        implication: 'Fits the current inbox workload.',
        boundary: 'Verify attachment limits before expanding beyond text.',
      },
      {
        label: 'Context vs. recall',
        icon: EMOJI.books,
        value: '90.6% at 256K; 65.1% at 1M in the published comparison',
        implication:
          'Broad context is plausible, but saturated retrieval needs validation.',
        boundary:
          'Sparse points do not show the intermediate degradation shape.',
      },
      {
        label: 'Instruction following',
        icon: EMOJI.map,
        value: 'LiveBench Instruction Following: 63.2%',
        publishedBenchmark: {
          ...LIVEBENCH_INSTRUCTION_FOLLOWING,
          score: '63.2%',
        },
        implication:
          'The score measures explicit constraint adherence, not the quality of the extracted todo list.',
        boundary: 'The email-to-todo workflow still requires a local evaluation.'
      },
    ],
  },
  {
    id: 'gpt55',
    benchmarkId: 'gpt-55',
    provider: 'OpenAI',
    name: 'GPT-5.5',
    architecture: {
      base: 'Massive MoE · ~10T active parameters (rumored)',
      reasoning: 'Chain-of-thought 2.0 · error recovery',
      multimodal: 'Native text · image · audio · video',
      context: '2M tokens (reported)',
    },
    source: SOURCES.gpt55,
    fields: [
      {
        label: 'Price',
        icon: EMOJI.money,
        value: '$5 input / $30 output per MTok',
        price: {
          input: '$5.00',
          output: '$30.00',
          cacheRead: '$0.50',
          cacheWrite: 'No separate rate',
          cacheTtl: 'Not published',
        },
        implication:
          'A practical API baseline with explicit long-context economics.',
        boundary:
          'Prompts above 272K incur a 2x input and 1.5x output surcharge for the session.',
      },
      {
        label: 'Modality',
        icon: EMOJI.documentTabs,
        value: 'Text, image, audio, and video input; text output',
        modality: {
          input: ['text', 'image', 'audio', 'video'],
          output: ['text'],
        },
        implication:
          'Native temporal multimodality is part of the reported GPT-5.5 architecture.',
        boundary:
          'Verify which modalities are exposed by the selected API surface.',
      },
      {
        label: 'Context vs. recall',
        icon: EMOJI.books,
        value: '2M context reported; MRCR score not published',
        implication:
          'Use chunking or retrieval instead of trusting native saturated recall.',
        boundary:
          'MRCR does not predict date normalization, ranking, or schema validity.',
      },
      {
        label: 'Instruction following',
        icon: EMOJI.map,
        value: 'LiveBench Instruction Following: 70.7%',
        publishedBenchmark: {
          ...LIVEBENCH_INSTRUCTION_FOLLOWING,
          score: '70.7%',
        },
        implication:
          'The score measures instruction adherence; API tool and structured-output support are separate capabilities.',
        boundary:
          'Published benchmark results do not replace an inbox-specific test set.'
      },
    ],
  },
  {
    id: 'flash',
    benchmarkId: 'deepseek-v4-flash',
    provider: 'DeepSeek',
    name: 'DeepSeek V4 Flash',
    architecture: {
      base: 'DeepSeekMoE · 285B total / 13B active',
      reasoning: 'Think High · Think Max',
      multimodal: 'Text-focused agentic model',
      context: '1M tokens',
    },
    source: SOURCES.flash,
    fields: [
      {
        label: 'Price',
        icon: EMOJI.money,
        value: '$0.14 input / $0.28 output per MTok',
        price: {
          input: '$0.14',
          output: '$0.28',
          cacheRead: '$0.0028',
          cacheWrite: 'Cache-miss rate',
          cacheTtl: 'No fixed TTL published',
        },
        implication: 'Lowest listed rate among the cards shown.',
        boundary:
          'Actual input cost depends on caching; price is not a quality result.',
      },
      {
        label: 'Modality',
        icon: EMOJI.documentTabs,
        value: 'Text input; text output',
        modality: { input: ['text'], output: ['text'] },
        implication: 'Matches the current email-to-todo route.',
        boundary:
          'Do not route documents or images without a direct product claim.',
      },
      {
        label: 'Context vs. recall',
        icon: EMOJI.books,
        value: '1M context; 49% MRCR at 1M',
        implication:
          'The low price makes it a useful baseline, not evidence of reliable saturated retrieval.',
        boundary:
          'DeepSeek’s published 1M result is a model-specific benchmark signal, not a workload result.',
      },
      {
        label: 'Instruction following',
        icon: EMOJI.map,
        value: 'LiveBench Instruction Following: 63.1%',
        publishedBenchmark: {
          ...LIVEBENCH_INSTRUCTION_FOLLOWING,
          score: '63.1%',
        },
        implication:
          'The score provides a comparable constraint-following signal for the text-only inbox route.',
        boundary: 'Test the email-to-todo workflow locally.',
      },
    ],
  },
  {
    id: 'pro',
    benchmarkId: 'deepseek-v4-pro',
    provider: 'DeepSeek',
    name: 'DeepSeek V4 Pro',
    architecture: {
      base: 'DeepSeekMoE · 1.6T total / 49B active',
      reasoning: 'Think High · Think Max',
      multimodal: 'Text-focused agentic model',
      context: '1M tokens',
    },
    source: SOURCES.pro,
    fields: [
      {
        label: 'Price',
        icon: EMOJI.money,
        value: '$0.435 input / $0.87 output per MTok',
        price: {
          input: '$0.435',
          output: '$0.87',
          cacheRead: '$0.003625',
          cacheWrite: 'Cache-miss rate',
          cacheTtl: 'No fixed TTL published',
        },
        implication: 'A higher-cost DeepSeek option than Flash.',
        boundary:
          'Actual input cost depends on caching; price is not a quality result.',
      },
      {
        label: 'Modality',
        icon: EMOJI.documentTabs,
        value: 'Text input; text output',
        modality: { input: ['text'], output: ['text'] },
        implication: 'Matches the current email-to-todo route.',
        boundary:
          'Do not route documents or images without a direct product claim.',
      },
      {
        label: 'Context vs. recall',
        icon: EMOJI.books,
        value: '1M context; report: >82% through 256K, 59% at 1M',
        implication:
          'A published long-context signal to test against inbox archives.',
        boundary:
          'This separately scoped curve is not comparable to the Terra/Luna pair.',
      },
      {
        label: 'Instruction following',
        icon: EMOJI.map,
        value: 'LiveBench Instruction Following: 62.4%',
        publishedBenchmark: {
          ...LIVEBENCH_INSTRUCTION_FOLLOWING,
          score: '62.4%',
        },
        implication:
          'The score provides a comparable constraint-following signal for the text-only inbox route.',
        boundary: 'Test the email-to-todo workflow locally.',
      },
    ],
  },
] as const;

function cardIndex(id: ModelId) {
  return CARDS.findIndex((card) => card.id === id);
}

function nextCardId(current: ModelId, key: string) {
  if (key === 'Home') return CARDS[0].id;
  if (key === 'End') return CARDS[CARDS.length - 1].id;
  const direction = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
  const index = cardIndex(current);
  return CARDS[(index + direction + CARDS.length) % CARDS.length].id;
}

function EmojiLabel({
  asset,
  children,
}: {
  asset: EmojiAsset;
  children: string;
}) {
  return (
    <span className={styles.emojiLabel}>
      <InlineEmojiImage asset={asset} size={20} />
      <span>{children}</span>
    </span>
  );
}

function ModelSelector({
  activeId,
  onSelect,
}: {
  activeId: ModelId;
  onSelect: (id: ModelId, direction?: SlideDirection) => void;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: ModelId) => {
    if (
      ![
        'ArrowRight',
        'ArrowDown',
        'ArrowLeft',
        'ArrowUp',
        'Home',
        'End',
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    const nextId = nextCardId(id, event.key);
    const direction: SlideDirection =
      event.key === 'ArrowRight' ||
      event.key === 'ArrowDown' ||
      event.key === 'End'
        ? 'forward'
        : 'backward';
    onSelect(nextId, direction);
    buttons.current[cardIndex(nextId)]?.focus();
  };

  return (
    <div
      className={styles.modelSelector}
      role="tablist"
      aria-label="Published model cards"
    >
      {CARDS.map((card, index) => (
        <button
          key={card.id}
          ref={(element) => {
            buttons.current[index] = element;
          }}
          id={`model-card-tab-${card.id}`}
          type="button"
          role="tab"
          className={styles.modelButton}
          aria-selected={activeId === card.id}
          aria-controls={`model-card-panel-${card.id}`}
          tabIndex={activeId === card.id ? 0 : -1}
          onClick={() => onSelect(card.id)}
          onKeyDown={(event) => onKeyDown(event, card.id)}
        >
          <span>{card.provider}</span>
          <strong>{card.name.replace(`${card.provider} `, '')}</strong>
        </button>
      ))}
    </div>
  );
}

function ProviderMark({ provider }: { provider: ModelCard['provider'] }) {
  return (
    <span
      className={`${styles.providerMark} ${styles[provider.toLowerCase()]}`}
      aria-hidden="true"
    />
  );
}

function CardFieldView({
  field,
  benchmarkRow,
}: {
  field: CardField;
  benchmarkRow: BenchmarkRow;
}) {
  return (
    <section className={styles.cardField}>
      <p className={styles.fieldLabel}>
        <EmojiLabel asset={field.icon}>{field.label}</EmojiLabel>
      </p>
      <div className={styles.fieldSummary}>
        <p className={styles.fieldValue}>{field.value}</p>
      </div>
      <FieldGraphic field={field} benchmarkRow={benchmarkRow} />
      <div className={styles.fieldImplication}>
        <span>IMPLICATION</span>
        <p>{field.implication}</p>
      </div>
      <div className={styles.boundary}>
        <span>BOUNDARY</span>
        <p>{field.boundary}</p>
      </div>
    </section>
  );
}

function FieldGraphic({
  field,
  benchmarkRow,
}: {
  field: CardField;
  benchmarkRow: BenchmarkRow;
}) {
  const graphic = field.label === 'Context vs. recall' ? (
    <BenchmarkRecallGraphic row={benchmarkRow} />
  ) : field.publishedBenchmark ? (
    <PublishedBenchmarkGraphic benchmark={field.publishedBenchmark} />
  ) : field.price ? (
    <PriceGraphic profile={field.price} />
  ) : field.modality ? (
    <ModalityGraphic profile={field.modality} />
  ) : (
    <RecallGraphic value={field.value} />
  );
  return <div className={styles.fieldGraphic}>{graphic}</div>;
}

type PricePhase = 'input' | 'output' | 'static';

function pricePhase(label: string): PricePhase {
  if (label === 'INPUT' || label === 'CACHE READ') return 'input';
  if (label === 'OUTPUT' || label === 'CACHE WRITE') return 'output';
  return 'static';
}

function pricePhaseClass(phase: PricePhase) {
  if (phase === 'input') return styles.priceRowInput;
  if (phase === 'output') return styles.priceRowOutput;
  return '';
}

function PriceGraphic({ profile }: { profile: PriceProfile }) {
  const rows = [
    ['INPUT', profile.input],
    ['OUTPUT', profile.output],
    ['CACHE READ', profile.cacheRead],
    ['CACHE WRITE', profile.cacheWrite],
    ['CACHE TTL', profile.cacheTtl],
  ] as const;
  return (
    <div
      className={styles.priceGraphic}
      aria-label="Cost profile in USD per MTok"
    >
      <div className={styles.priceUnit}>USD / MTOK</div>
      {rows.map(([label, value]) => (
        <div
          className={`${styles.priceRow} ${pricePhaseClass(pricePhase(label))}`}
          key={label}
        >
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

const modalityTokens = (
  modalities: readonly TokenUnitModality[]
): readonly TokenExample[] =>
  modalities.map((modality) => ({
    modality,
    signal:
      modality === 'code'
        ? 'salient'
        : modality === 'video'
          ? 'compressed'
          : 'ordinary',
    label: modality === 'code' ? 'call' : modality,
  }));

function ModalityGraphic({ profile }: { profile: ModalityProfile }) {
  const inputTokens = modalityTokens(profile.input);
  const outputTokens = modalityTokens(profile.output);
  const centerX = 169;
  const inputX = centerX - tokenIllustrationWidth(inputTokens.length) / 2;
  const outputX = centerX - tokenIllustrationWidth(outputTokens.length) / 2;
  const modalityLabel = (modalities: readonly TokenUnitModality[]) =>
    modalities.join(' + ');

  return (
    <div
      className={styles.modalityGraphic}
      aria-label={`Documented modality flow: ${modalityLabel(profile.input)} input becomes ${modalityLabel(profile.output)} output`}
    >
      <svg viewBox="0 0 338 192" role="img" aria-hidden="true">
        <text
          x={20}
          y={36}
          dominantBaseline="middle"
          className={styles.modalityDirection}
        >
          INPUT
        </text>
        <TokenTypeTokens
          examples={inputTokens}
          x={inputX}
          y={22}
          className={styles.inputTokens}
          itemClassName={styles.modalityToken}
        />
        <path className={styles.modalityConnector} d="M 169 70 V 78" />
        <path className={styles.modalityArrow} d="M 169 82 l -4 -6 h 8 z" />
        <GearNode
          x={149}
          y={82}
          size={40}
          className={`${styles.modalityGear} idle-inference-cycle`}
        />
        <path className={styles.modalityConnector} d="M 169 122 V 130" />
        <path className={styles.modalityArrow} d="M 169 134 l -4 -6 h 8 z" />
        <text
          x={20}
          y={160}
          dominantBaseline="middle"
          className={styles.modalityDirection}
        >
          OUTPUT
        </text>
        <TokenTypeTokens
          examples={outputTokens}
          x={outputX}
          y={146}
          className={styles.outputTokens}
          itemClassName={styles.modalityToken}
        />
      </svg>
    </div>
  );
}

function BenchmarkRecallGraphic({ row }: { row: BenchmarkRow }) {
  const labels = layoutCurveLabels([row], compactChart).map((label) => ({
    ...label,
    visible: true,
  }));
  return (
    <div className={styles.benchmarkRecallGraphic}>
      <BenchmarkChartSvg
        chart={compactChart}
        ticks={compactXTicks}
        rows={[row]}
        selectedIds={[row.id]}
        labels={labels}
        variant="compact"
        title={`${row.model} ${row.benchmark} retrieval curve`}
        description={`${row.model} reported ${row.benchmark} retrieval scores across the plotted context range. ${row.curveDensity === 'full' ? 'Multiple reported points form a full curve.' : 'Only sparse reported points are available; the connecting line is not a measured intermediate curve.'}`}
      />
      <div className={styles.benchmarkMeta}>
        <span>{row.benchmark}</span>
        <span>{row.mode} · {row.curveDensity === 'full' ? 'full reported curve' : 'sparse reported points'}</span>
        <a href={row.source}>Benchmark source ↗</a>
      </div>
    </div>
  );
}

function RecallGraphic({ value }: { value: string }) {
  const scores = [...value.matchAll(/(\d+(?:\.\d+)?)%/g)].map((match) =>
    Number(match[1])
  );
  return (
    <div
      className={styles.recallGraphic}
      aria-label={`Retrieval scores: ${scores.join(', ')} percent`}
    >
      {scores.map((score, index) => (
        <div className={styles.recallRow} key={`${score}-${index}`}>
          <span>POINT {index + 1}</span>
          <span className={styles.recallTrack}>
            <span style={{ width: `${Math.min(score, 100)}%` }} />
          </span>
          <strong>{score}%</strong>
        </div>
      ))}
    </div>
  );
}

function PublishedBenchmarkGraphic({
  benchmark,
}: {
  benchmark: PublishedBenchmark;
}) {
  return (
    <div className={styles.benchmarkGraphic}>
      <div className={styles.scoreHero} aria-label={`${benchmark.name}: ${benchmark.score}`}>
        <span>{benchmark.name}</span>
        <strong>{benchmark.score}</strong>
      </div>
      <div className={styles.benchmarkMeta}>
        <a href={benchmark.source.href}>{benchmark.source.label}</a>
      </div>
    </div>
  );
}

function ArchitectureFact({ label, value }: { label: string; value: string }) {
  return (
    <span className={styles.architectureFact}>
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  );
}

function ModelCardView({
  card,
  direction,
}: {
  card: ModelCard;
  direction: SlideDirection;
}) {
  const benchmarkRow = benchmarkRows.find((row) => row.id === card.benchmarkId);
  if (!benchmarkRow) throw new Error(`Missing benchmark row: ${card.benchmarkId}`);
  return (
    <section
      id={`model-card-panel-${card.id}`}
      className={`${styles.modelCard} ${styles[direction]}`}
      role="tabpanel"
      aria-labelledby={`model-card-tab-${card.id}`}
    >
      <header className={styles.cardHeader}>
        <ProviderMark provider={card.provider} />
        <div className={styles.cardIdentity}>
          <p>{card.provider}</p>
          <h4>{card.name}</h4>
        </div>
        <a className={styles.sourceLink} href={card.source.href}>
          {card.source.label} ↗
        </a>
        <div className={styles.architecture}>
          <span>ARCHITECTURE</span>
          <div className={styles.architectureGrid}>
            <ArchitectureFact label="BASE" value={card.architecture.base} />
            <ArchitectureFact
              label="REASONING"
              value={card.architecture.reasoning}
            />
            <ArchitectureFact
              label="MULTIMODAL"
              value={card.architecture.multimodal}
            />
            <ArchitectureFact
              label="CONTEXT"
              value={card.architecture.context}
            />
          </div>
        </div>
      </header>
      <div className={styles.fieldGrid}>
        {card.fields.map((field) => (
          <CardFieldView
            key={field.label}
            field={field}
            benchmarkRow={benchmarkRow}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Motion spec: selection changes the published card being inspected. The card
 * is complete without motion; the brief transition only confirms that change.
 */
export default function ModelCardFitExplorer() {
  const [activeId, setActiveId] = useState<ModelId>('opus');
  const [direction, setDirection] = useState<SlideDirection>('forward');
  const selectCard = (id: ModelId, nextDirection?: SlideDirection) => {
    if (id === activeId) return;
    setDirection(
      nextDirection ??
        (cardIndex(id) > cardIndex(activeId) ? 'forward' : 'backward')
    );
    setActiveId(id);
  };
  const card = CARDS[cardIndex(activeId)];
  return (
    <section
      className={styles.container}
      aria-label="Published model cards for a daily email-to-todo workload"
    >
      <ModelSelector activeId={activeId} onSelect={selectCard} />
      <ModelCardView key={card.id} card={card} direction={direction} />
    </section>
  );
}
