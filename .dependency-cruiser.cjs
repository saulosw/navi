module.exports = {
  forbidden: [
    { name: 'no-cycles', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'domain-is-pure',
      severity: 'error',
      from: { path: '^apps/api/src/domain' },
      to: { pathNot: '^apps/api/src/domain' },
    },
    {
      name: 'application-depends-inward',
      severity: 'error',
      from: { path: '^apps/api/src/application' },
      to: { pathNot: '^apps/api/src/(domain|application)' },
    },
    {
      name: 'adapters-do-not-compose',
      severity: 'error',
      from: { path: '^apps/api/src/adapters' },
      to: { path: '^apps/api/src/(main|infrastructure)' },
    },
    {
      name: 'infrastructure-does-not-use-http-or-main',
      severity: 'error',
      from: { path: '^apps/api/src/infrastructure' },
      to: { path: '^apps/api/src/(main|adapters)' },
    },
    {
      name: 'desktop-does-not-import-api',
      severity: 'error',
      from: { path: '^apps/desktop' },
      to: { path: '^apps/api' },
    },
    {
      name: 'api-does-not-import-desktop',
      severity: 'error',
      from: { path: '^apps/api' },
      to: { path: '^apps/desktop' },
    },
    {
      name: 'renderer-is-unprivileged',
      severity: 'error',
      from: { path: '^apps/desktop/src/renderer' },
      to: {
        path: '(^apps/desktop/src/(main|preload))|(^node_modules/electron(/|$))',
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'renderer-no-node-builtins',
      severity: 'error',
      from: { path: '^apps/desktop/src/renderer' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'contracts-independent',
      severity: 'error',
      from: { path: '^packages/contracts' },
      to: { pathNot: '^packages/contracts' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
