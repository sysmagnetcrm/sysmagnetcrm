/**
 * Sanitize search terms before interpolating into Supabase filter strings like .or(...)
 * Strips special operators and characters to prevent filter injection.
 */
export function sanitizeSearchTerm(term) {
  if (!term || typeof term !== 'string') return '';
  return term.replace(/[,().*%"'\\]/g, '').trim();
}
