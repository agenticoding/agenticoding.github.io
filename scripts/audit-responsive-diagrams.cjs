const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'website', 'src', 'components', 'VisualElements');
const names = [
  'AgentWorkStabilityDiagram',
  'ContextMechanismMap',
  'ContextWindowAnatomyDiagram',
  'ErrorReasonComparisonDiagram',
  'ExecutionPortfolioDiagram',
  'GroundingDistillationDiagram',
  'HarnessContextLoop',
  'HarnessDeltaExplorer',
  'HarnessLoopDiagram',
  'InstructionLayerAuthority',
  'InteractiveHarnessWorkbench',
  'LivingContextWindowStream',
  'LocalChoicesGlobalCoherenceDiagram',
  'LongContextBenchmarkExplorer',
  'ModelEncodingAtlas',
  'OperatorCycleDiagram',
  'OperatorTransformationDiagram',
  'OwnershipBoundaryDiagram',
  'PlanningContractCheckpointDiagram',
  'PostTrainingTuningBoard',
  'ProbabilityIsNotLogicDiagram',
  'SpecExecutionRunsDiagram',
  'SpeedAccuracyTradeoff',
  'StructuredControlPlaneWorkbench',
  'SubAgentFanoutDiagram',
  'TokenPredictionDiagram',
  'UShapeAttentionCurve',
  'ValidationClaimBenchDiagram',
  'ValidationEvidenceLifecycle',
];
const variantSelector =
  /\.(?:desktopDiagram|mobileDiagram|desktop|mobile|operatorDesktop|operatorMobile|validationDesktop|validationMobile|desktopChart|mobileChart)\b/;
const failures = [];

for (const name of names) {
  const tsxPath = path.join(root, `${name}.tsx`);
  const cssPath = path.join(root, `${name}.module.css`);
  const tsx = fs.readFileSync(tsxPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');

  if (!tsx.includes('ResponsiveDiagram')) {
    failures.push(`${name}: paired diagram does not use ResponsiveDiagram`);
  }

  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1];
    const declarations = match[2];
    if (variantSelector.test(selector) && /\bdisplay\s*:/.test(declarations)) {
      failures.push(`${name}.module.css: variant selector owns display (${selector.trim()})`);
    }
    if (/^\s*\.diagram\s*$/.test(selector) && /\bdisplay\s*:/.test(declarations)) {
      failures.push(`${name}.module.css: generic diagram selector owns display`);
    }
  }
}

const sharedCss = fs.readFileSync(
  path.join(root, 'ResponsiveDiagram.module.css'),
  'utf8'
);
for (const required of [
  '.container[data-responsive-breakpoint=',
  '.desktopVariant',
  '.mobileVariant',
  'data-responsive-mode',
]) {
  if (!sharedCss.includes(required)) failures.push(`shared contract missing ${required}`);
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`responsive diagram audit passed (${names.length} paired diagrams)`);
}
