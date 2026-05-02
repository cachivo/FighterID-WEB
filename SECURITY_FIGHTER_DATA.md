# Fighter Data Security Model

## Overview
This document explains how fighter personal information (PII) is protected in the database.

## Security Implementation

### 1. Row-Level Security (RLS) Policies

The `fighter_profiles` table has multiple RLS policies that control data access:

#### Public Access (Anonymous & Authenticated)
- **Policy**: "Public can view basic fighter info" / "Anonymous can view basic fighter info"
- **Access**: Can query active fighter profiles (`active = true`)
- **Limitation**: Even though queries return rows, **sensitive fields should be filtered** at the application layer
- **Public Fields**: name, nickname, avatar, country, weight_class, record, fighting style, gym, etc.

#### Fighter Owner Access (Authenticated)
- **Policy**: "Fighters can view their own complete profile"
- **Access**: Full access to their own profile including all sensitive fields
- **Condition**: User must be authenticated and own the profile

#### Administrator Access (Authenticated)
- **Policy**: "Admins can view all fighter profiles"
- **Access**: Full access to all profiles including sensitive data
- **Condition**: User must be authenticated and have `is_admin = true`

### 2. Sensitive Data Categories

**SENSITIVE** (Owner/Admin Only):
- `birthdate` - Date of birth
- `birthplace` - Place of birth
- `blood_type` - Blood type
- `document_type` - ID document type
- `document_number` - ID document number
- `emergency_contact_name` - Emergency contact name
- `emergency_contact_phone` - Emergency contact phone
- `emergency_contact_relation` - Emergency contact relationship
- `medical_conditions` - Medical conditions
- `medical_allergies` - Medical allergies
- `insurance_company` - Insurance company name
- `insurance_policy` - Insurance policy number
- `license_issued_date` - License issue date (detailed)
- `license_expires_date` - License expiry date (detailed)

**PUBLIC** (Everyone):
- Basic identification: first_name, last_name, nickname, avatar_url, country, gender
- Fighting info: weight_class, discipline, fighting_style, stance, martial_arts, gym_name
- Physical stats: height_cm, weight_kg, reach_cm
- Record: record_wins, record_losses, record_draws, record_type
- License basic: license_number, license_status, level
- Profile: bio, boxrec_url, tapology_url
- Status: active, created_at, updated_at

### 3. Secure Data Access Functions

#### `get_fighter_sensitive_data(fighter_id UUID)`
**Purpose**: Securely retrieve sensitive fighter data
**Access Control**: Only accessible by profile owner or admins
**Returns**: All sensitive fields listed above
**Error**: Raises exception if unauthorized

**Usage Example**:
```typescript
const { data, error } = await supabase
  .rpc('get_fighter_sensitive_data', { 
    p_fighter_id: fighterId 
  });
```

#### `is_fighter_owner(fighter_id UUID)`
**Purpose**: Check if current user owns a fighter profile
**Access Control**: Security definer function (safe)
**Returns**: boolean

### 4. Application Layer Responsibilities

#### When Querying Fighter Data:

**For Public Display** (Fighter cards, listings, etc.):
```typescript
// RLS automatically limits access, but be mindful of what you display
const { data: fighters } = await supabase
  .from('fighter_profiles')
  .select('*')
  .eq('active', true);

// IMPORTANT: Filter out sensitive fields before displaying
import { filterPublicFighterData } from '@/lib/fighterDataFilter';
const publicFighters = fighters.map(filterPublicFighterData);
```

**For Owner/Admin Access** (Profile editing, admin panel):
```typescript
// Full access - all fields available due to RLS
const { data: fighter } = await supabase
  .from('fighter_profiles')
  .select('*')
  .eq('id', fighterId)
  .single();

// For sensitive data only:
const { data: sensitiveData } = await supabase
  .rpc('get_fighter_sensitive_data', { 
    p_fighter_id: fighterId 
  });
```

### 5. Best Practices

1. **Always use RLS policies** - Never disable RLS on fighter_profiles
2. **Filter in UI** - Even though RLS protects access, filter sensitive fields in UI components
3. **Use helper functions** - Use `filterPublicFighterData()` for public displays
4. **Audit access** - Log access to sensitive data in critical operations
5. **Least privilege** - Only request fields you actually need

### 6. Testing Security

To verify security is working:

1. **Test as anonymous user**:
```sql
-- Should NOT see sensitive data
SELECT birthdate, medical_conditions FROM fighter_profiles WHERE id = 'some-id';
```

2. **Test as authenticated non-owner**:
```sql
-- Should NOT see other fighters' sensitive data
SELECT birthdate FROM fighter_profiles WHERE user_id != auth.uid();
```

3. **Test as owner**:
```sql
-- Should see own sensitive data
SELECT * FROM fighter_profiles WHERE user_id = (SELECT id FROM app_user WHERE auth_user_id = auth.uid());
```

4. **Test as admin**:
```sql
-- Should see all data
SELECT * FROM fighter_profiles;
```

### 7. Security Checklist

- [x] RLS enabled on fighter_profiles table
- [x] Public access policy restricts to active fighters only
- [x] Owner access policy requires authentication
- [x] Admin access policy checks is_admin flag
- [x] Sensitive data access function created
- [x] Security definer functions properly set
- [x] Application layer filtering helpers created
- [x] Documentation provided

## Common Pitfalls

❌ **Don't do this**:
```typescript
// Exposing all fields publicly
const FighterCard = ({ fighter }) => (
  <div>
    <p>DOB: {fighter.birthdate}</p> {/* SENSITIVE! */}
    <p>Medical: {fighter.medical_conditions}</p> {/* SENSITIVE! */}
  </div>
);
```

✅ **Do this instead**:
```typescript
import { filterPublicFighterData } from '@/lib/fighterDataFilter';

const FighterCard = ({ fighter }) => {
  const publicData = filterPublicFighterData(fighter);
  return (
    <div>
      <p>Name: {publicData.first_name} {publicData.last_name}</p>
      <p>Record: {publicData.record_wins}-{publicData.record_losses}</p>
    </div>
  );
};
```

## Compliance Notes

This security model helps comply with:
- **GDPR** (General Data Protection Regulation) - Personal data protection
- **HIPAA** (Health Insurance Portability and Accountability Act) - Medical data protection
- **CCPA** (California Consumer Privacy Act) - Consumer privacy rights

## Support

For security concerns or questions:
1. Review this document
2. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'fighter_profiles'`
3. Test access patterns in a development environment
4. Consult with security team before making changes

---

**Last Updated**: 2025-09-30
**Security Model Version**: 1.0

---

## Edge Function CORS policy (2026-05-02)

All browser-facing edge functions use the shared helper at
`supabase/functions/_shared/cors.ts`, which validates the request `Origin`
against this allowlist:

- `https://fighter-id.org` (production custom domain)
- `https://www.fighter-id.org`
- `https://fighterid.lovable.app` (Lovable production URL)
- `https://id-preview--c4add1c8-f68d-4715-9b10-5a9613b9085b.lovable.app` (preview)
- `http://localhost:5173`, `http://localhost:8080`, `http://localhost:3000` (dev)

Disallowed origins receive the canonical origin in `Access-Control-Allow-Origin`,
which the browser rejects (no credentials leak, no implicit `*`).

### Functions intentionally exempt (server-to-server)

The following functions keep `Access-Control-Allow-Origin: *` because they are
called by server-to-server clients with no browser `Origin` header. Locking the
origin would break them:

| Function | Caller |
|---|---|
| `ai-strike-ingest` | External IA vision engine (push) |
| `bet-delay-processor` | `pg_cron` worker |
| `finalize-fight-auto` | `pg_cron` / DB trigger |
| `process-email-queue` | `pg_cron` worker |
| `session-embed` | Invoked from other edge functions |
| `vision-start-session` (telemetry path) | External IA vision engine |

These do their own auth (service-role key, JWT, or shared secret) and are
documented as intentional exceptions in `mem://security/`.

## Note on `.env`

The committed `.env` file contains only the **publishable Supabase anon key**
(`SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`). This key is
designed to ship to browsers — RLS and edge function auth enforce all access
control. There is no secret leakage, but the file is still untracked from git
(`scripts/untrack-env.sh`) to avoid noise from generic secret scanners.
