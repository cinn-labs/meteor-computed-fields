Package.describe({
  name: 'computed-fields',
  version: '0.0.1',
  summary: 'Auto fields values between collection relationship with 2 ways binding',
  git: '',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  const both = ['client', 'server'];
  api.versionsFrom('1.3.2.4');

  api.export('ComputedFields');

  api.use('ecmascript');
  api.use('meteor-base');
  api.use("matb33:collection-hooks@0.7.15");

  api.addFiles('computed-fields.common.js', both);
  api.addFiles('computed-fields.server.js', 'server');
});
