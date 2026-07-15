import React, { useState } from 'react';
import type { ReactNode } from 'react';
import styles from './LongContextBenchmarkTable.module.css';

export type ConceptLink = { label: string; href: string };
export type BenchmarkPoint = { tokens: number; label: string; score: number };
export type BenchmarkFamily = 'MRCR v2 8-needle';
export type CurveDensity = 'full' | 'sparse';

export type BenchmarkRow = {
  id: string;
  model: string;
  window: string;
  moderateContext: ReactNode;
  longContext: ReactNode;
  pointDrop: string;
  moderateScore: number;
  longScore: number;
  dropScore: number;
  signal: string;
  signalTone: 'data' | 'warning';
  benchmark: BenchmarkFamily;
  mode: string;
  source: string;
  curveDensity: CurveDensity;
  points: BenchmarkPoint[];
  numbers: ReactNode;
  concept: ReactNode;
  takeaway: ReactNode;
  caveat: ReactNode;
  links: ConceptLink[];
};

export const conceptLinks = {
  longContext: { label: 'effective context', href: '#long-context-is-not-reliable-memory' },
  architecture: { label: 'model card decoder', href: '#how-to-read-a-model-card' },
  recall: { label: 'recall strategy', href: '#recall-strategy' },
  inference: { label: 'inference quality', href: '#inference-quality' },
  training: { label: 'training objective', href: '#training-objective' },
  reliability: { label: 'reliability', href: '#reliability' },
  speed: { label: 'speed', href: '#speed' },
  cost: { label: 'cost', href: '#cost' },
  best: { label: 'no best model', href: '#there-is-no-best-llm' },
  benchmarks: { label: 'benchmarks as evidence', href: '#benchmarks-are-evidence-not-truth' },
};

const pointDrop = (start: number, end: number) => `${start - end >= 0 ? '−' : '+'}${Math.abs(start - end).toFixed(1)} pp`;
const mrcrSource = 'OpenAI MRCR v2 8-needle / vendor system-card reporting';

export const benchmarkRows: BenchmarkRow[] = [
  {
    id: 'gpt-55', model: 'GPT-5.5', window: '1.05M', benchmark: 'MRCR v2 8-needle', mode: 'xhigh reasoning effort', source: 'https://openai.com/index/introducing-gpt-5-5/', curveDensity: 'full',
    points: [{ tokens: 8192, label: '4–8K', score: 98.1 }, { tokens: 16384, label: '8–16K', score: 93.0 }, { tokens: 32768, label: '16–32K', score: 96.5 }, { tokens: 65536, label: '32–64K', score: 90.0 }, { tokens: 131072, label: '64–128K', score: 83.1 }, { tokens: 262144, label: '128–256K', score: 87.5 }, { tokens: 524288, label: '256–512K', score: 81.5 }, { tokens: 1048576, label: '512K–1M', score: 74.0 }],
    moderateContext: '128–256K', longContext: <><strong>74.0%</strong> @512K–1M</>, pointDrop: '−13.5 pp', moderateScore: 87.5, longScore: 74.0, dropScore: 13.5,
    signal: 'Full MRCR curve stays usable at 1M', signalTone: 'data',
    numbers: <>OpenAI reports a full MRCR curve: 87.5% in the 128–256K bucket and 74.0% in the 512K–1M bucket.</>,
    concept: <>This is the cleanest sourceable example of a high-retention product curve. The useful context remains broad instead of collapsing near saturation.</>,
    takeaway: <>Use for native long-context retrieval and agentic coding workloads that really approach 1M tokens.</>,
    caveat: <>The curve is MRCR retrieval evidence, not a guarantee for graph reasoning, latency, price, or tool behavior.</>, links: [conceptLinks.longContext, conceptLinks.benchmarks],
  },
  {
    id: 'opus-46', model: 'Claude Opus 4.6', window: '1M', benchmark: 'MRCR v2 8-needle', mode: '64K extended thinking', source: 'https://www.anthropic.com/claude-opus-4-6-system-card', curveDensity: 'sparse',
    points: [{ tokens: 262144, label: '256K', score: 91.9 }, { tokens: 1048576, label: '1M', score: 78.3 }],
    moderateContext: <><strong>91.9%</strong> @256K</>, longContext: <><strong>78.3%</strong> @1M</>, pointDrop: pointDrop(91.9, 78.3), moderateScore: 91.9, longScore: 78.3, dropScore: 13.6,
    signal: 'Strong sparse-point 1M retention', signalTone: 'data',
    numbers: <>91.9% at 256K becomes 78.3% at 1M on MRCR v2: a −13.6 pp drop across the reported points.</>,
    concept: <>Same advertised 1M class, stronger effective-context evidence. The sparse points show high retention, but do not reveal intermediate shape.</>,
    takeaway: <>Prefer this envelope when buried facts across very large prompts matter and cost or latency are acceptable.</>,
    caveat: <>Only two MRCR points are sourceable here; the connecting segment is a measured-point link, not a measured curve.</>, links: [conceptLinks.architecture, conceptLinks.recall, conceptLinks.longContext],
  },
  {
    id: 'sonnet-46', model: 'Claude Sonnet 4.6', window: '1M', benchmark: 'MRCR v2 8-needle', mode: '64K extended thinking', source: 'https://www.anthropic.com/claude-sonnet-4-6-system-card', curveDensity: 'sparse',
    points: [{ tokens: 262144, label: '256K', score: 90.6 }, { tokens: 1048576, label: '1M', score: 65.1 }],
    moderateContext: '90.6% @256K', longContext: '65.1% @1M', pointDrop: pointDrop(90.6, 65.1), moderateScore: 90.6, longScore: 65.1, dropScore: 25.5,
    signal: 'Usable 1M retrieval with visible decay', signalTone: 'data',
    numbers: <>90.6% at 256K becomes 65.1% at 1M: a −25.5 pp decline.</>,
    concept: <>The 1M window is real capacity, but retrieval precision drops materially by saturation.</>,
    takeaway: <>Use for broad context that can tolerate retrieval loss; validate exact long-context workloads before replacing stronger retention products.</>,
    caveat: <>Sparse two-point MRCR evidence; intermediate degradation shape is not published.</>, links: [conceptLinks.longContext, conceptLinks.benchmarks],
  },
  {
    id: 'deepseek-v4-pro', model: 'DeepSeek V4 Pro', window: '1M', benchmark: 'MRCR v2 8-needle', mode: 'Max', source: 'https://huggingface.co/blog/deepseekv4', curveDensity: 'full',
    points: [{ tokens: 8192, label: '8K', score: 90.0 }, { tokens: 16384, label: '16K', score: 85.0 }, { tokens: 32768, label: '32K', score: 94.0 }, { tokens: 65536, label: '64K', score: 90.0 }, { tokens: 131072, label: '128K', score: 92.0 }, { tokens: 262144, label: '256K', score: 82.0 }, { tokens: 524288, label: '512K', score: 66.0 }, { tokens: 1048576, label: '1M', score: 59.0 }],
    moderateContext: '82.0% @256K', longContext: '59.0% @1M', pointDrop: pointDrop(82.0, 59.0), moderateScore: 82.0, longScore: 59.0, dropScore: 23.0,
    signal: 'DeepSeek Figure 9 drops below 60% at 1M', signalTone: 'warning',
    numbers: <>DeepSeek Figure 9 reports a full MRCR 8-needle curve for Pro Max: 82.0% at 256K, 66.0% at 512K, and 59.0% at 1M.</>,
    concept: <>Use the official Figure 9 MRCR curve here, not the separate model-card 1M table. The full curve shows strong retention through 256K before a visible 512K–1M decline.</>,
    takeaway: <>Treat Pro Max as strong through 256K, then validate saturated-window retrieval instead of assuming the 1M headline stays native.</>,
    caveat: <>DeepSeek publishes conflicting 1M MRCR-style numbers between Figure 9 and the model card. This chart now follows Figure 9 consistently for the full 8-needle curve.</>, links: [conceptLinks.inference, conceptLinks.longContext, conceptLinks.benchmarks],
  },
  {
    id: 'gpt-54', model: 'GPT-5.4', window: '1M', benchmark: 'MRCR v2 8-needle', mode: 'xhigh reasoning effort', source: 'https://openai.com/index/introducing-gpt-5-4/', curveDensity: 'full',
    points: [{ tokens: 8192, label: '4–8K', score: 97.3 }, { tokens: 16384, label: '8–16K', score: 91.4 }, { tokens: 32768, label: '16–32K', score: 97.2 }, { tokens: 65536, label: '32–64K', score: 90.5 }, { tokens: 131072, label: '64–128K', score: 86.0 }, { tokens: 262144, label: '128–256K', score: 79.3 }, { tokens: 524288, label: '256–512K', score: 57.5 }, { tokens: 1048576, label: '512K–1M', score: 36.6 }],
    moderateContext: '79.3% @128–256K', longContext: '36.6% @512K–1M', pointDrop: pointDrop(79.3, 36.6), moderateScore: 79.3, longScore: 36.6, dropScore: 42.7,
    signal: 'Clear post-256K retrieval cliff', signalTone: 'warning',
    numbers: <>The full curve falls from 79.3% in the 128–256K bucket to 57.5% at 256–512K and 36.6% at 512K–1M.</>,
    concept: <>A 1M context window can still behave like a much smaller effective context for precise multi-needle retrieval.</>,
    takeaway: <>Use the headline window as capacity. For saturated retrieval workloads, chunk or upgrade to a higher-retention product.</>,
    caveat: <>This identifies retrieval decay on MRCR; it does not rank the model&apos;s overall coding or agent behavior.</>, links: [conceptLinks.longContext, conceptLinks.benchmarks],
  },
  {
    id: 'deepseek-v4-flash', model: 'DeepSeek V4 Flash', window: '1M', benchmark: 'MRCR v2 8-needle', mode: 'Max', source: 'https://huggingface.co/blog/deepseekv4', curveDensity: 'full',
    points: [{ tokens: 8192, label: '8K', score: 91.0 }, { tokens: 16384, label: '16K', score: 84.0 }, { tokens: 32768, label: '32K', score: 87.0 }, { tokens: 65536, label: '64K', score: 85.0 }, { tokens: 131072, label: '128K', score: 87.0 }, { tokens: 262144, label: '256K', score: 76.0 }, { tokens: 524288, label: '512K', score: 60.0 }, { tokens: 1048576, label: '1M', score: 49.0 }],
    moderateContext: '76.0% @256K', longContext: '49.0% @1M', pointDrop: pointDrop(76.0, 49.0), moderateScore: 76.0, longScore: 49.0, dropScore: 27.0,
    signal: 'Flash curve falls into chunk/validate range at 1M', signalTone: 'warning',
    numbers: <>DeepSeek Figure 9 reports a full MRCR 8-needle curve for Flash Max: 76.0% at 256K, 60.0% at 512K, and 49.0% at 1M.</>,
    concept: <>Use the official Figure 9 MRCR curve here, not the separate model-card 1M table. Flash tracks well through 128K, then decays steadily after 256K.</>,
    takeaway: <>Use Flash for cost-sensitive moderate context, but chunk or validate once workloads approach the far end of the 1M window.</>,
    caveat: <>DeepSeek publishes conflicting 1M MRCR-style numbers between Figure 9 and the model card. This chart now follows Figure 9 consistently for the full 8-needle curve.</>, links: [conceptLinks.speed, conceptLinks.cost, conceptLinks.benchmarks],
  },
  {
    id: 'opus-47', model: 'Claude Opus 4.7', window: '1M', benchmark: 'MRCR v2 8-needle', mode: 'max effort', source: 'https://www.anthropic.com/claude-opus-4-7-system-card', curveDensity: 'sparse',
    points: [{ tokens: 262144, label: '256K', score: 59.2 }, { tokens: 1048576, label: '1M', score: 32.2 }],
    moderateContext: '59.2% @256K', longContext: '32.2% @1M', pointDrop: pointDrop(59.2, 32.2), moderateScore: 59.2, longScore: 32.2, dropScore: 27,
    signal: 'MRCR regression signal', signalTone: 'warning',
    numbers: <>59.2% at 256K becomes 32.2% at 1M on the sourceable max-effort MRCR points.</>,
    concept: <>Newer is not automatically better on every long-context retrieval benchmark. Selection must follow measured behavior, not version number.</>,
    takeaway: <>If saturated-window recall matters, validate directly instead of assuming this replaces Opus 4.6.</>,
    caveat: <>This row is MRCR-specific; Opus 4.7 has a different story on some structured GraphWalks evaluations.</>, links: [conceptLinks.best, conceptLinks.training, conceptLinks.reliability],
  },
  {
    id: 'gemini-31-pro', model: 'Gemini 3.1 Pro', window: '1M / 2M platform-dependent', benchmark: 'MRCR v2 8-needle', mode: 'Thinking High', source: 'https://deepmind.google/models/model-cards/gemini-3-1-pro/', curveDensity: 'sparse',
    points: [{ tokens: 131072, label: '128K avg', score: 84.9 }, { tokens: 1048576, label: '1M pointwise', score: 26.3 }],
    moderateContext: '84.9% @128K avg', longContext: '26.3% @1M', pointDrop: pointDrop(84.9, 26.3), moderateScore: 84.9, longScore: 26.3, dropScore: 58.6,
    signal: 'Strong 128K, weak 1M retrieval', signalTone: 'warning',
    numbers: <>Google reports 84.9% at 128K cumulative average and 26.3% at 1M pointwise.</>,
    concept: <>This is the clearest capacity/precision split: large window, but low native multi-needle retrieval at saturation.</>,
    takeaway: <>Use for moderate long-context work; require RAG/chunking when precise 1M retrieval matters.</>,
    caveat: <>Google publishes two points, not the intermediate curve. The 128K average and 1M pointwise methods differ.</>, links: [conceptLinks.longContext, conceptLinks.best, conceptLinks.benchmarks],
  },
  {
    id: 'gemini-35-flash', model: 'Gemini 3.5 Flash', window: '1M', benchmark: 'MRCR v2 8-needle', mode: 'default / unspecified thinking', source: 'https://deepmind.google/models/model-cards/gemini-3-5-flash/', curveDensity: 'sparse',
    points: [{ tokens: 131072, label: '128K avg', score: 77.3 }, { tokens: 1048576, label: '1M pointwise', score: 26.6 }],
    moderateContext: '77.3% @128K avg', longContext: '26.6% @1M', pointDrop: pointDrop(77.3, 26.6), moderateScore: 77.3, longScore: 26.6, dropScore: 50.7,
    signal: 'Fast tier, saturated retrieval risk', signalTone: 'warning',
    numbers: <>77.3% at 128K cumulative average becomes 26.6% at 1M pointwise.</>,
    concept: <>The fast/cost product envelope is attractive, but the 1M window should not be treated as reliable native retrieval.</>,
    takeaway: <>Use for speed/cost-sensitive moderate-context workloads; chunk before saturated retrieval tasks.</>,
    caveat: <>Only two official MRCR points were found; intermediate degradation shape is not published.</>, links: [conceptLinks.speed, conceptLinks.cost, conceptLinks.recall],
  },
];

function ConceptLinks({ links }: { links: ConceptLink[] }) {
  if (links.length === 0) return null;
  return <ul className={styles.conceptLinks} aria-label="Related concepts" role="list">{links.map((link) => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul>;
}

function DetailPanel({ row, id }: { row: BenchmarkRow; id: string }) {
  return <div id={id} className={`${styles.detailPanel} ${styles[row.signalTone]}`} aria-labelledby={`${row.id}-button`}><DetailBlock title="What the numbers show">{row.numbers}</DetailBlock><DetailBlock title="Selection logic">{row.concept}<ConceptLinks links={row.links} /></DetailBlock><DetailBlock title="Operator takeaway">{row.takeaway}</DetailBlock><DetailBlock title="Evidence">{row.benchmark}; {row.mode}. Source: <a href={row.source}>{row.source}</a>. {row.curveDensity === 'full' ? 'Multiple reported points are plotted.' : 'Only sparse reported points are plotted.'}</DetailBlock><DetailBlock title="Caveat">{row.caveat}</DetailBlock></div>;
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return <div className={styles.detailBlock}><h4>{title}</h4><p>{children}</p></div>;
}

export default function LongContextBenchmarkTable() {
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const containerClassName = styles.container;
  const toggleRow = (id: string) => setOpenRows((current) => toggleSet(current, id));

  return <div className={containerClassName}><table className={styles.table}><caption className={styles.caption}>Long-context retrieval benchmarks. Expand a row to translate the curve into product-selection guidance.</caption><thead><tr><th scope="col">Model</th><th scope="col">Window</th><th scope="col">Benchmark</th><th scope="col">Moderate context</th><th scope="col">Long context</th><th scope="col">Point drop</th><th scope="col">Selection signal</th></tr></thead><tbody>{benchmarkRows.map((row) => <BenchmarkTableRows key={row.id} row={row} open={openRows.has(row.id)} toggleRow={toggleRow} />)}</tbody></table></div>;
}

function BenchmarkTableRows({ row, open, toggleRow }: { row: BenchmarkRow; open: boolean; toggleRow: (id: string) => void }) {
  const detailsId = `${row.id}-details`;
  return <React.Fragment><tr className={`${styles[row.signalTone]} ${open ? styles.openRow : ''}`}><TableHeader label="Model" value={row.model} className={styles.modelCell} /><TableCell label="Window" value={row.window} className={styles.windowCell} /><TableCell label="Benchmark" value={row.benchmark} className={styles.moderateCell} /><TableCell label="Moderate" value={row.moderateContext} className={styles.moderateCell} /><TableCell label="Long" value={row.longContext} className={styles.longCell} /><TableCell label="Drop" value={row.pointDrop} className={`${styles.pointDrop} ${styles.dropCell}`} /><td data-label="Selection signal" className={styles.signalCell}><span className={styles.mobileLabel}>Selection signal</span><button id={`${row.id}-button`} type="button" className={styles.signalButton} aria-expanded={open} aria-controls={detailsId} onClick={() => toggleRow(row.id)}><span>{row.signal}</span><span className={styles.chevron} aria-hidden="true">⌄</span></button></td></tr><tr className={`${styles.detailRow} ${styles[row.signalTone]}`} aria-hidden={!open}><td colSpan={7}><div className={`${styles.detailFrame} ${open ? styles.detailFrameOpen : ''}`} aria-hidden={!open} inert={!open ? true : undefined}><div className={styles.detailClip}><DetailPanel row={row} id={detailsId} /></div></div></td></tr></React.Fragment>;
}

function TableHeader({ label, value, className }: { label: string; value: ReactNode; className: string }) {
  return <th scope="row" data-label={label} className={className}><span className={styles.mobileLabel}>{label}</span><span className={styles.cellValue}>{value}</span></th>;
}

function TableCell({ label, value, className }: { label: string; value: ReactNode; className: string }) {
  return <td data-label={label} className={className}><span className={styles.mobileLabel}>{label}</span><span className={styles.cellValue}>{value}</span></td>;
}

function toggleSet(current: Set<string>, id: string) {
  const next = new Set(current);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}
