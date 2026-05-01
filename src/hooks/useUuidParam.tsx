import { useParams, Navigate } from 'react-router-dom';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

/**
 * Reads a route param and validates it as a UUID. Returns:
 *  - { value }       when the param is a valid UUID
 *  - { redirect }    a JSX <Navigate /> element to render when invalid
 *
 * Usage:
 *   const { value: id, redirect } = useUuidParam('id');
 *   if (redirect) return redirect;
 */
export function useUuidParam(name: string) {
  const params = useParams();
  const raw = params[name];
  const result = uuidSchema.safeParse(raw);

  if (!result.success) {
    return { value: null as string | null, redirect: <Navigate to="/404" replace /> };
  }
  return { value: result.data, redirect: null as null | JSX.Element };
}

/**
 * Soft variant: returns null if invalid (no redirect). Useful when the
 * page handles "not found" itself.
 */
export function useOptionalUuidParam(name: string): string | null {
  const params = useParams();
  const raw = params[name];
  const result = uuidSchema.safeParse(raw);
  return result.success ? result.data : null;
}
