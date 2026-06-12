const PLACEHOLDER_PATTERNS = [
  /^your[_-]?/i,
  /^change[_-]?me/i,
  /^xxx+$/i,
  /^placeholder/i,
  /^example/i,
];

function isPlaceholder(value) {
  if (!value || typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function printEnvReport() {
  const checks = [
    ['EMAIL', isPlaceholder(process.env.EMAIL_USER) ? 'not configured' : 'configured'],
    ['Database', process.env.DB_TYPE || 'sqlite'],
  ];
  checks.forEach(([key, status]) => console.log(`  ${key}: ${status}`));
}

module.exports = { isPlaceholder, printEnvReport };
