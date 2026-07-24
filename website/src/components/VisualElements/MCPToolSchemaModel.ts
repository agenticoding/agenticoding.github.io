export const TASK_STAGES = [
  { label: 'Inspect repository', capability: 'repository search' },
  { label: 'Change implementation', capability: 'file editing' },
  { label: 'Run verification', capability: 'test runner' },
  { label: 'Review in browser', capability: 'browser inspection' },
] as const;

export type MCPToolSchemaStage = (typeof TASK_STAGES)[number];

export type MCPToolSchemaLayout = {
  catalogTools: number;
  eagerSchemas: number;
  lazySchemas: readonly MCPToolSchemaStage[];
  deferredSchemas: number;
};

function relevantSchemaCount(catalogTools: number) {
  return Math.min(
    TASK_STAGES.length,
    Math.max(1, Math.ceil(catalogTools / 10))
  );
}

export function modelMCPToolSchema(catalogTools: number): MCPToolSchemaLayout {
  const catalog = Math.max(0, catalogTools);
  const lazySchemas = TASK_STAGES.slice(
    0,
    Math.min(relevantSchemaCount(catalog), catalog)
  );

  return {
    catalogTools: catalog,
    eagerSchemas: catalog,
    lazySchemas,
    deferredSchemas: Math.max(0, catalog - lazySchemas.length),
  };
}
