Package.describe({
  name: 'cinn:computed-fields',
  version: '0.0.2',
  summary: 'Computed fields and 2 way data binding on collections for Meteor apps',
  git: 'https://github.com/cinn-labs/meteor-computed-fields',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  const both = ['client', 'server'];
  api.versionsFrom('1.3.2.4');

  api.export('ComputedFields');

  api.use('ecmascript');
  api.use('meteor-base');
  api.use("matb33:collection-hooks@0.8.1");

  api.addFiles('computed-fields.common.js', both);
  api.addFiles('computed-fields.server.js', 'server');
});
