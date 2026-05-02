# Bug Hunter Report

_Files scanned: **437** · Auto-fixes applied: **0**_

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 1 | Fix immediately |
| 🟠 High | 8 | Fix this sprint |
| 🟡 Medium | 493 | Fix next sprint |
| 🔵 Low | 271 | Fix when convenient |

## By category

| Category | Count |
|----------|-------|
| typescript | 348 |
| react | 71 |
| security | 7 |
| logic | 78 |
| a11y | 269 |


## 🔴 Critical (1)


### security

- **.env tracked in git** — `.env:1`
  ```
  .env
  ```
  → _Remove from git history and add to .gitignore._


## 🟠 High (8)


### security

- **Wildcard CORS in edge function** — `supabase/functions/ai-strike-ingest/index.ts:5`
  ```
  'Access-Control-Allow-Origin': '*',
  ```
  → _Restrict Access-Control-Allow-Origin to your domain(s)._

- **Wildcard CORS in edge function** — `supabase/functions/bet-delay-processor/index.ts:5`
  ```
  'Access-Control-Allow-Origin': '*',
  ```
  → _Restrict Access-Control-Allow-Origin to your domain(s)._

- **Wildcard CORS in edge function** — `supabase/functions/finalize-fight-auto/index.ts:5`
  ```
  "Access-Control-Allow-Origin": "*",
  ```
  → _Restrict Access-Control-Allow-Origin to your domain(s)._

- **Wildcard CORS in edge function** — `supabase/functions/process-email-queue/index.ts:11`
  ```
  "Access-Control-Allow-Origin": "*",
  ```
  → _Restrict Access-Control-Allow-Origin to your domain(s)._

- **Wildcard CORS in edge function** — `supabase/functions/session-embed/index.ts:10`
  ```
  "Access-Control-Allow-Origin": "*",
  ```
  → _Restrict Access-Control-Allow-Origin to your domain(s)._

- **Wildcard CORS in edge function** — `supabase/functions/vision-start-session/index.ts:5`
  ```
  'Access-Control-Allow-Origin': '*',
  ```
  → _Restrict Access-Control-Allow-Origin to your domain(s)._


### typescript

- **TS strict mode disabled** — `tsconfig.app.json:1`
  ```
  "strict": false (or missing)
  ```
  → _Enable `"strict": true` in compilerOptions to catch null/undefined bugs at build time._

- **TS strict mode disabled** — `tsconfig.json:1`
  ```
  "strict": false (or missing)
  ```
  → _Enable `"strict": true` in compilerOptions to catch null/undefined bugs at build time._


## 🟡 Medium (493)


### logic

- **Async function without try/catch** — `src/components/DopingTestUploadForm.tsx:28`
  ```
  const handleSubmit = async (e: React.FormEvent) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/PWAInstallPrompt.tsx:53`
  ```
  const handleInstall = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/admin/AssignFighterToGymModal.tsx:65`
  ```
  const handleAssign = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/admin/CoachEditModal.tsx:42`
  ```
  const uploadAvatar = async (file: File): Promise<string | null> => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/admin/DeleteCoachDialog.tsx:23`
  ```
  const handleDelete = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/admin/DeleteGymDialog.tsx:23`
  ```
  const handleDelete = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/admin/EnrollFighterModal.tsx:44`
  ```
  const handleEnroll = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/admin/FighterGymTab.tsx:81`
  ```
  const handleDeactivate = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/admin/FighterLeaguesTab.tsx:40`
  ```
  const handleEnroll = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/admin/FighterLeaguesTab.tsx:58`
  ```
  const handleRemove = async (rankingId: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/admin/FighterLeaguesTab.tsx:65`
  ```
  const handleLevelChange = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/admin/GymEditModal.tsx:71`
  ```
  const handleSubmit = async (e: React.FormEvent) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/admin/PrepareFightDialog.tsx:43`
  ```
  const handlePrepare = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/social/CommentCard.tsx:23`
  ```
  const checkOwnership = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/social/CommentSection.tsx:21`
  ```
  const handleSubmit = async (e: React.FormEvent) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/social/CommentSection.tsx:31`
  ```
  const handleDelete = async (commentId: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/social/PostCard.tsx:36`
  ```
  const loadMediaFiles = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/components/social/PostCard.tsx:59`
  ```
  const loadLinkPreviews = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useAppUserId.tsx:75`
  ```
  export async function getAppUserIdFromAuth(authUserId: string): Promise<string> {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useFightRequests.tsx:120`
  ```
  const validateEligibility = async (fighterAId: string, fighterBId: string, weightClass?: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useFighterProfiles.tsx:349`
  ```
  const adminCreateFighterProfile = async (profileData: Partial<FighterProfileData>): Promise<string | null> => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useLinkPreview.tsx:58`
  ```
  const fetchMultiplePreviews = async (urls: string[]): Promise<Map<string, LinkPreview>> => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useOlympicTimer.tsx:41`
  ```
  const fetchRounds = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useRealtimeScoring.tsx:12`
  ```
  const loadEvents = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useRoundControl.tsx:46`
  ```
  const startRound = async (roundId: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useRoundControl.tsx:69`
  ```
  const pauseRound = async (roundId: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useRoundControl.tsx:92`
  ```
  const endRound = async (roundId: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useRoundControl.tsx:115`
  ```
  const cancelRound = async (roundId: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useSanctions.tsx:86`
  ```
  const createSanction = async (input: CreateSanctionInput) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useSanctions.tsx:100`
  ```
  const updateSanctionStatus = async (id: string, status: Sanction['status'], notes?: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useSanctions.tsx:112`
  ```
  const deleteSanction = async (id: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useSanctions.tsx:140`
  ```
  const createAppeal = async (reason: string, evidenceUrls?: string[]) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useSanctions.tsx:152`
  ```
  const updateAppealStatus = async (appealId: string, status: SanctionAppeal['status'], decisionNotes?: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useStrikeCounter.tsx:32`
  ```
  const fetchCurrentRound = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useSuperAdmin.tsx:18`
  ```
  const check = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/hooks/useVisionSyncSession.ts:22`
  ```
  const startSession = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/lib/avatarOptimizer.ts:15`
  ```
  export async function optimizeAvatar(
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/lib/backgroundRemovalAI.ts:47`
  ```
  export async function removeBackgroundAI(file: File): Promise<Blob> {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/Auth.tsx:49`
  ```
  const checkInvitation = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/Auth.tsx:199`
  ```
  const handleResendEmail = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/AuthCallback.tsx:156`
  ```
  const handleResendEmail = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/FightResults.tsx:18`
  ```
  const fetchResults = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/HudPublicDisplay.tsx:50`
  ```
  const load = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/SocialFeed.tsx:39`
  ```
  const checkUserType = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/SocialFeed.tsx:131`
  ```
  const handleDelete = async (postId: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/SocialFeed.tsx:143`
  ```
  const handleCreatePost = async (postData: any) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/admin/ContactInbox.tsx:36`
  ```
  const handleMarkAsRead = async (id: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/admin/ContactInbox.tsx:55`
  ```
  const handleArchive = async (id: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/admin/ContactInbox.tsx:74`
  ```
  const handleDelete = async (id: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/admin/EmailCampaignEditor.tsx:80`
  ```
  const handleSave = async (html: string, json: any) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/admin/EntrenadoresAdmin.tsx:75`
  ```
  const handleDeactivate = async (staffId: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/admin/FightApproval.tsx:60`
  ```
  const handleApprove = async (req: FightRequestWithDetails) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/admin/FightApproval.tsx:67`
  ```
  const handleReject = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/admin/FightResults.tsx:52`
  ```
  const fetchEvents = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/admin/FightResults.tsx:67`
  ```
  const fetchFights = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/admin/JudgesManagement.tsx:107`
  ```
  const handleToggleStatus = async (judgeId: string, currentStatus: boolean) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/admin/OrganizationsManagement.tsx:91`
  ```
  const handleSave = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/auth/ResetPassword.tsx:111`
  ```
  const handleSubmit = async (e: React.FormEvent) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/judge/DigitalScorecard.tsx:50`
  ```
  const fetchFightDetails = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/judge/DigitalScorecard.tsx:71`
  ```
  const loadSubmittedRounds = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/license/LicenseAuth.tsx:175`
  ```
  const handleEmailSubmit = async (e: React.FormEvent) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/license/LicenseOnboarding.tsx:192`
  ```
  const handleSubmit = async (e: React.FormEvent) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/license/LicensePending.tsx:174`
  ```
  const handleManualRefresh = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/license/ResetPassword.tsx:110`
  ```
  const handleSubmit = async (e: React.FormEvent) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/profile/ProfileHub.tsx:34`
  ```
  const checkModules = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/social/SocialProfile.tsx:32`
  ```
  const loadData = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/social/SocialProfile.tsx:48`
  ```
  const handleCreatePost = async (postData: any) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/social/Trending.tsx:18`
  ```
  const handleHashtagClick = async (hashtag: string) => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/social/UserProfile.tsx:160`
  ```
  const handleFriendAction = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/station/Station1Scoring.tsx:44`
  ```
  const fetchFighter = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/station/Station2Scoring.tsx:44`
  ```
  const fetchFighter = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/station/Station3RoundControl.tsx:63`
  ```
  const fetchFighters = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/pages/station/Station3RoundControl.tsx:86`
  ```
  const handleStart = async () => {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/system/events/event.logger.ts:41`
  ```
  export async function getSessionEvents(sessionId: string) {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/system/rag/retrieval.service.ts:10`
  ```
  export async function retrieveRelevantContext(params: {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/system/session/session.service.ts:107`
  ```
  export async function getOpenSessionFor(authUserId: string, context: string) {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `src/system/workflow/workflow.adapter.ts:16`
  ```
  export async function getNextActions(
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._

- **Async function without try/catch** — `supabase/functions/finalize-fight-auto/index.ts:117`
  ```
  async function collectFightData(supabase: any, fightId: string): Promise<FightData> {
  ```
  → _Wrap awaited calls in try/catch and surface errors via toast/logger._


### react

- **Component file too long (303 LOC)** — `src/App.tsx:1`
  ```
  303 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (386 LOC)** — `src/components/AdminAnalytics.tsx:1`
  ```
  386 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (423 LOC)** — `src/components/EnhancedFighterID.tsx:1`
  ```
  423 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (483 LOC)** — `src/components/FighterProfileForm.tsx:1`
  ```
  483 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (428 LOC)** — `src/components/Header.tsx:1`
  ```
  428 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (1187 LOC)** — `src/components/UserFighterProfileEditForm.tsx:1`
  ```
  1187 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (320 LOC)** — `src/components/UserProfileForm.tsx:1`
  ```
  320 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (511 LOC)** — `src/components/admin/AIAssistant/ChatWidget.tsx:1`
  ```
  511 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (1092 LOC)** — `src/components/admin/AdminFighterForm.tsx:1`
  ```
  1092 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (303 LOC)** — `src/components/admin/AssignFighterToGymModal.tsx:1`
  ```
  303 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (484 LOC)** — `src/components/admin/FighterDetailModal.tsx:1`
  ```
  484 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (1100 LOC)** — `src/components/admin/FighterEditModal.tsx:1`
  ```
  1100 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (302 LOC)** — `src/components/admin/FighterLeaguesTab.tsx:1`
  ```
  302 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (564 LOC)** — `src/components/admin/LiveControl.tsx:1`
  ```
  564 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (568 LOC)** — `src/components/admin/SettlementConsole.tsx:1`
  ```
  568 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (427 LOC)** — `src/components/sections/Ranking.tsx:1`
  ```
  427 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (339 LOC)** — `src/components/social/CreatePostForm.tsx:1`
  ```
  339 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (339 LOC)** — `src/components/social/PostCard.tsx:1`
  ```
  339 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (363 LOC)** — `src/components/ui/chart.tsx:1`
  ```
  363 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (761 LOC)** — `src/components/ui/sidebar.tsx:1`
  ```
  761 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (361 LOC)** — `src/hooks/useEvents.tsx:1`
  ```
  361 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (460 LOC)** — `src/hooks/useFightControl.tsx:1`
  ```
  460 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (376 LOC)** — `src/hooks/useFighterProfiles.tsx:1`
  ```
  376 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (640 LOC)** — `src/hooks/useLicenseAuth.tsx:1`
  ```
  640 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (306 LOC)** — `src/hooks/useOlympicTimer.tsx:1`
  ```
  306 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (373 LOC)** — `src/hooks/usePendingChanges.tsx:1`
  ```
  373 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (741 LOC)** — `src/hooks/useSocialPosts.tsx:1`
  ```
  741 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (404 LOC)** — `src/pages/Auth.tsx:1`
  ```
  404 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (412 LOC)** — `src/pages/EnVivo.tsx:1`
  ```
  412 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (685 LOC)** — `src/pages/EventDetail.tsx:1`
  ```
  685 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (552 LOC)** — `src/pages/EventoBetting.tsx:1`
  ```
  552 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (607 LOC)** — `src/pages/FighterProfile.tsx:1`
  ```
  607 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (538 LOC)** — `src/pages/Fighters.tsx:1`
  ```
  538 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (323 LOC)** — `src/pages/HudPublicDisplay.tsx:1`
  ```
  323 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (304 LOC)** — `src/pages/Predicciones.tsx:1`
  ```
  304 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (657 LOC)** — `src/pages/ProfileChangeRequest.tsx:1`
  ```
  657 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (447 LOC)** — `src/pages/SocialFeed.tsx:1`
  ```
  447 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (409 LOC)** — `src/pages/UserProfile.tsx:1`
  ```
  409 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (415 LOC)** — `src/pages/admin/AIStrikeMonitor.tsx:1`
  ```
  415 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (448 LOC)** — `src/pages/admin/AliadosEstrategicos.tsx:1`
  ```
  448 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (337 LOC)** — `src/pages/admin/ApprovalQueue.tsx:1`
  ```
  337 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (768 LOC)** — `src/pages/admin/Betting.tsx:1`
  ```
  768 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (1032 LOC)** — `src/pages/admin/Comunidad.tsx:1`
  ```
  1032 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (473 LOC)** — `src/pages/admin/Configuracion.tsx:1`
  ```
  473 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (397 LOC)** — `src/pages/admin/EmailCampaignDetail.tsx:1`
  ```
  397 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (374 LOC)** — `src/pages/admin/EmailMonitoring.tsx:1`
  ```
  374 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (2114 LOC)** — `src/pages/admin/EventosPelea.tsx:1`
  ```
  2114 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (312 LOC)** — `src/pages/admin/FightApproval.tsx:1`
  ```
  312 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (609 LOC)** — `src/pages/admin/FightResults.tsx:1`
  ```
  609 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (506 LOC)** — `src/pages/admin/FightersProfiles.tsx:1`
  ```
  506 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (307 LOC)** — `src/pages/admin/GimnasiosAdmin.tsx:1`
  ```
  307 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (433 LOC)** — `src/pages/admin/JudgeStationsSetup.tsx:1`
  ```
  433 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (500 LOC)** — `src/pages/admin/JudgesManagement.tsx:1`
  ```
  500 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (763 LOC)** — `src/pages/admin/LiveEventsControl.tsx:1`
  ```
  763 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (446 LOC)** — `src/pages/admin/OfficialsManagement.tsx:1`
  ```
  446 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (321 LOC)** — `src/pages/admin/OrganizationsManagement.tsx:1`
  ```
  321 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (716 LOC)** — `src/pages/admin/PendingChangesHub.tsx:1`
  ```
  716 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (331 LOC)** — `src/pages/admin/RankingsManagement.tsx:1`
  ```
  331 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (811 LOC)** — `src/pages/admin/ValidacionLicencias.tsx:1`
  ```
  811 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (476 LOC)** — `src/pages/admin/VisionDiagnostics.tsx:1`
  ```
  476 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (305 LOC)** — `src/pages/gym/RequestFight.tsx:1`
  ```
  305 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (484 LOC)** — `src/pages/judge/DigitalScorecard.tsx:1`
  ```
  484 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (576 LOC)** — `src/pages/license/LicenseAuth.tsx:1`
  ```
  576 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (896 LOC)** — `src/pages/license/LicenseDashboard.tsx:1`
  ```
  896 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (752 LOC)** — `src/pages/license/LicenseOnboarding.tsx:1`
  ```
  752 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (362 LOC)** — `src/pages/license/LicensePending.tsx:1`
  ```
  362 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (465 LOC)** — `src/pages/referee/RefereeControlRoom.tsx:1`
  ```
  465 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (505 LOC)** — `src/pages/social/UserProfile.tsx:1`
  ```
  505 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._

- **Component file too long (341 LOC)** — `src/pages/station/Station3RoundControl.tsx:1`
  ```
  341 lines
  ```
  → _Consider splitting into smaller focused components/hooks (<300 LOC)._


### typescript

- **Explicit `any` annotation** — `src/components/AdminAnalytics.tsx:319`
  ```
  function processGrowthData(data: any[], dateRange: string) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/AdminAnalytics.tsx:341`
  ```
  function processDisciplineData(data: any[]) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/AdminAnalytics.tsx:353`
  ```
  function processLicenseData(data: any[]) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/AdminAnalytics.tsx:365`
  ```
  function getTopCountries(data: any[]): Array<{country: string, count: number}> {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/ContactForm.tsx:69`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/LiveFightStatsWidget.tsx:36`
  ```
  function computeQuick(events: any[], fighter: string) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/LiveFightStatsWidget.tsx:37`
  ```
  const mine = events.filter((e: any) => e.fighter === fighter);
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/LiveFightStatsWidget.tsx:38`
  ```
  const attempted = mine.filter((e: any) => e.event_type === 'strike_attempted').length;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/LiveFightStatsWidget.tsx:39`
  ```
  const connected = mine.filter((e: any) => e.event_type === 'strike_connected').length;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/UserFighterProfileEditForm.tsx:196`
  ```
  const GymSelectField = ({ form: f }: { form: any }) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/UserFighterProfileEditForm.tsx:269`
  ```
  const immediateUpdates: any = {};
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/UserFighterProfileEditForm.tsx:270`
  ```
  const recordChanges: any = {};
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/UserFighterProfileEditForm.tsx:403`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/AIAssistant/ChatWidget.tsx:28`
  ```
  data: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/AIAssistant/ChatWidget.tsx:84`
  ```
  {data.topGanadores.slice(0, 5).map((fighter: any, idx: number) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/AdminFighterForm.tsx:167`
  ```
  const handleChange = (field: keyof AdminFighterFormData, value: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/AssignGymOwnerModal.tsx:58`
  ```
  const fighterSet = new Set((fighters || []).map((f: any) => f.user_id));
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/AssignGymOwnerModal.tsx:64`
  ```
  const s = (staffEntries || []).find((s: any) => s.user_id === u.id);
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/AssignGymOwnerModal.tsx:125`
  ```
  } catch (e: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/EventBrandingModal.tsx:24`
  ```
  onSave: (eventId: string, meta: any) => Promise<void>;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/ExternalFighterForm.tsx:23`
  ```
  onFormChange: (data: any) => void;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/FighterDetailModal.tsx:25`
  ```
  const getRecordDisplay = (profile: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/FighterDetailModal.tsx:56`
  ```
  const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number | null }) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/FighterDetailModal.tsx:305`
  ```
  data.licenses.map((license: any) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/FighterDetailModal.tsx:350`
  ```
  data.documents.map((doc: any) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/FighterDetailModal.tsx:388`
  ```
  data.statusUpdates.map((update: any) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/FighterDetailModal.tsx:443`
  ```
  data.changeRequests.map((request: any) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/FighterEditModal.tsx:172`
  ```
  const handleChange = (field: keyof AdminFighterFormData, value: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/FighterGymTab.tsx:225`
  ```
  {history.map((h: any) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/LicenseCard.tsx:8`
  ```
  license: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/LicenseCard.tsx:10`
  ```
  onReview?: (license: any) => void;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/LicenseCard.tsx:34`
  ```
  const fighterPhoto = license.license_documents?.find((doc: any) => doc.document_type === 'photo');
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/LiveControl.tsx:139`
  ```
  totalPool: market.outcome?.reduce((sum: number, o: any) => sum + o.pool, 0) || 0,
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/PointAdjustmentModal.tsx:103`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/PrepareFightDialog.tsx:12`
  ```
  fight: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/SettlementConsole.tsx:136`
  ```
  totalPool: market.outcome?.reduce((sum: number, o: any) => sum + o.pool, 0) || 0,
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/admin/roles/DeleteUserDialog.tsx:40`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/email/EmailTipTapEditor.tsx:52`
  ```
  initialJsonContent?: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/email/EmailTipTapEditor.tsx:53`
  ```
  onSave?: (html: string, json: any) => void;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/email/EmailTipTapEditor.tsx:54`
  ```
  onAutoSave?: (html: string, json: any) => void;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/email/EmailTipTapEditor.tsx:150`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/email/ImageResize.tsx:9`
  ```
  export default function ImageResize({ node, updateAttributes, deleteNode, selected }: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/components/social/PostCard.tsx:39`
  ```
  post.media_files.map(async (file: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/fighters/useFighterMutations.ts:30`
  ```
  mutationFn: async ({ fighterId, profileData }: { fighterId: string; profileData: any }) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/fighters/useFighterMutations.ts:53`
  ```
  mutationFn: async ({ fighterId, profileData }: { fighterId: string; profileData: any }) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/fighters/useFighterMutations.ts:75`
  ```
  mutationFn: async (profileData: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymDashboard.ts:67`
  ```
  const staffUserIds = (staffRes.data || []).map((s: any) => s.user_id);
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymDashboard.ts:68`
  ```
  let staffUsers: any[] = [];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymDashboard.ts:77`
  ```
  const staff = (staffRes.data || []).map((s: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymDashboard.ts:81`
  ```
  user: staffUsers.find((u: any) => u.id === s.user_id) || {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymDashboard.ts:87`
  ```
  .map((d: any) => d.disciplines)
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymDashboard.ts:94`
  ```
  total_wins: fighters.reduce((sum: number, f: any) => sum + (f.fighter_profiles?.mma_record_wins || 0), 0),
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymDashboard.ts:95`
  ```
  total_losses: fighters.reduce((sum: number, f: any) => sum + (f.fighter_profiles?.mma_record_losses || 0), 0),
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymDashboard.ts:96`
  ```
  total_draws: fighters.reduce((sum: number, f: any) => sum + (f.fighter_profiles?.mma_record_draws || 0), 0),
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymDisciplines.ts:48`
  ```
  return (data || []).map((d: any) => d.disciplines).filter(Boolean) as Discipline[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymDisciplines.ts:81`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymFighters.ts:63`
  ```
  const fighters: GymFighter[] = (data || []).map((m: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymMembership.ts:53`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymMembership.ts:103`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymStaff.ts:37`
  ```
  const userIds = (data || []).map((s: any) => s.user_id);
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymStaff.ts:45`
  ```
  return (data || []).map((s: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymStaff.ts:47`
  ```
  user: (users || []).find((u: any) => u.id === s.user_id),
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymStaff.ts:79`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymStaff.ts:95`
  ```
  const userIds = (data || []).map((s: any) => s.user_id);
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymStaff.ts:101`
  ```
  return (data || []).map((s: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymStaff.ts:103`
  ```
  user: (users || []).find((u: any) => u.id === s.user_id),
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/gyms/useGymStaff.ts:127`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAIConfig.tsx:8`
  ```
  value: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAIConfig.tsx:51`
  ```
  const updateConfig = async (key: string, value: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAIConfig.tsx:85`
  ```
  const getConfigValue = (key: string, defaultValue: any = null) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAIInferenceSessions.tsx:16`
  ```
  metadata: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAIStrikeEvents.tsx:15`
  ```
  metadata: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAuth.tsx:9`
  ```
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAuth.tsx:10`
  ```
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAuth.tsx:12`
  ```
  resetPassword: (email: string) => Promise<{ error: any }>;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAuth.tsx:13`
  ```
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAuth.tsx:14`
  ```
  resendConfirmation: (email: string) => Promise<{ error: any }>;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAuth.tsx:111`
  ```
  } catch (e: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAuth.tsx:146`
  ```
  } catch (e: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAuth.tsx:197`
  ```
  } catch (e: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useAuth.tsx:233`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useCoaches.tsx:63`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useCoaches.tsx:89`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useCoaches.tsx:111`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useComments.tsx:49`
  ```
  const enriched: Comment[] = (data || []).map((c: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useComments.tsx:78`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useComments.tsx:122`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useComments.tsx:140`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useDetailedFighterData.tsx:5`
  ```
  profile: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useDetailedFighterData.tsx:6`
  ```
  licenses: any[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useDetailedFighterData.tsx:7`
  ```
  documents: any[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useDetailedFighterData.tsx:8`
  ```
  medicalCertifications: any[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useDetailedFighterData.tsx:9`
  ```
  statusUpdates: any[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useDetailedFighterData.tsx:10`
  ```
  changeRequests: any[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEmailCampaignEditor.ts:41`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEmailCampaignEditor.ts:56`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEmailCampaignEditor.ts:65`
  ```
  mutationFn: ({ id, html, json }: { id: string; html: string; json: any }) =>
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEmailCampaignEditor.ts:70`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEmailCampaignEditor.ts:84`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEmailCampaignEditor.ts:98`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEmailCampaignEditor.ts:112`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEvents.tsx:18`
  ```
  meta: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEvents.tsx:51`
  ```
  fighter_a?: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEvents.tsx:52`
  ```
  fighter_b?: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEvents.tsx:53`
  ```
  fighter_a_external?: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEvents.tsx:54`
  ```
  fighter_b_external?: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEvents.tsx:97`
  ```
  meta?: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEvents.tsx:117`
  ```
  const insertData: any = {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useEvents.tsx:248`
  ```
  const updateEventMeta = async (eventId: string, meta: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useExternalFighters.tsx:18`
  ```
  metadata?: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useExternalFighters.tsx:52`
  ```
  const mappedData: ExternalFighter[] = (data || []).map((item: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useExternalFighters.tsx:67`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useExternalFighters.tsx:131`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFightControl.tsx:43`
  ```
  metadata?: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFightRealtime.tsx:23`
  ```
  const handleScorecardUpdate = useCallback((payload: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFightRealtime.tsx:48`
  ```
  const handleControlEventUpdate = useCallback((payload: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFightRealtime.tsx:58`
  ```
  const handleResultUpdate = useCallback((payload: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFightRealtime.tsx:167`
  ```
  const broadcastScorecardUpdate = useCallback(async (scorecard: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFightRealtime.tsx:177`
  ```
  const broadcastControlEvent = useCallback(async (controlEvent: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFightRealtime.tsx:255`
  ```
  fights: any[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFightRequests.tsx:26`
  ```
  eligibility_check: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFightRequests.tsx:82`
  ```
  onError: (err: any) => toast.error(err.message),
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFightRequests.tsx:97`
  ```
  onError: (err: any) => toast.error(err.message),
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFightRequests.tsx:117`
  ```
  onError: (err: any) => toast.error(err.message),
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFightTelemetry.ts:68`
  ```
  let session: any = null;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFighterActiveLeagues.tsx:48`
  ```
  return (data || []).map((item: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFighterInvitations.tsx:34`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFighterInvitations.tsx:52`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFighterInvitations.tsx:69`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useFighterUpdates.tsx:117`
  ```
  const mapped: GymFighterUpdate[] = (data || []).map((item: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useGyms.tsx:83`
  ```
  const payload: any = {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useGyms.tsx:107`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useGyms.tsx:133`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useGyms.tsx:155`
  ```
  onError: (error: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useInView.ts:43`
  ```
  export function useThrottledCallback<T extends (...args: any[]) => void>(callback: T, delay: number = 100) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:14`
  ```
  licenseData: any | null;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:15`
  ```
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:16`
  ```
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:20`
  ```
  resetPassword: (email: string) => Promise<{ error: any }>;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:21`
  ```
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:22`
  ```
  resendConfirmation: (email: string) => Promise<{ error: any }>;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:329`
  ```
  let profileChannel: any = null;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:330`
  ```
  let licenseChannel: any = null;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:331`
  ```
  let broadcastChannel: any = null;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:446`
  ```
  (payload: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:451`
  ```
  setLicenseData((prev: any) => prev ? { ...prev, status: 'ACTIVE' } : prev);
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:458`
  ```
  setLicenseData((prev: any) => prev ? { ...prev, status: 'SUSPENDED' } : prev);
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:570`
  ```
  } catch (e: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenseAuth.tsx:604`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLicenses.ts:40`
  ```
  mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLinkPreview.tsx:12`
  ```
  metadata: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useLinkPreview.tsx:49`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useOptimizedOnboarding.ts:106`
  ```
  ) as { data: CreateProfileResult | null; error: any };
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useOptimizedOnboarding.ts:145`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useOrganizationRanking.tsx:160`
  ```
  const rankings: RankingEntry[] = (rankingsResult.data || []).map((r: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/usePendingChanges.tsx:9`
  ```
  requested_changes: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/usePerformanceMonitor.ts:86`
  ```
  export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/usePerformanceMonitor.ts:91`
  ```
  export function throttle<T extends (...args: any[]) => void>(fn: T, limit: number): (...args: Parameters<T>) => void {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useProfileChangeRequests.ts:11`
  ```
  requested_changes: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useProfileChangeRequests.ts:97`
  ```
  requestedChanges: any
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useProfileChangeRequests.ts:294`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useProfileChangeRequests.ts:307`
  ```
  const applyProfileChanges = async (fighterProfileId: string, changes: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSanctions.tsx:77`
  ```
  } catch (e: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:13`
  ```
  media_files?: any[] | null;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:39`
  ```
  const getUserDisplayName = (userProfile: any): string => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:101`
  ```
  let fighterProfiles: any[] = [];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:114`
  ```
  let userProfiles: any[] = [];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:126`
  ```
  let likesData: any[] = [];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:173`
  ```
  const optimisticPosts = prev.filter((p: any) => p.isOptimistic);
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:178`
  ```
  const keptOptimistic = optimisticPosts.filter((p: any) => !realPostIds.has(p.id));
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:262`
  ```
  let uploadedFiles: any[] = [];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:470`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:573`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:655`
  ```
  let fighterProfiles: any[] = [];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:668`
  ```
  let userProfiles: any[] = [];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useSocialPosts.tsx:680`
  ```
  let likesData: any[] = [];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useStrikeCounter.tsx:139`
  ```
  const event: any = {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useUserProfile.tsx:72`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useUserProfile.tsx:140`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useUserProfile.tsx:209`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useWallet.tsx:18`
  ```
  meta: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/hooks/useWallet.tsx:142`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/lib/fighterDataFilter.ts:117`
  ```
  export function filterPublicFighterData(fighter: any): PublicFighterData {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/lib/fighterDataFilter.ts:118`
  ```
  const publicData: any = {};
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/Auth.tsx:192`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/AuthCallback.tsx:142`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/EnVivo.tsx:24`
  ```
  meta: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/EnVivo.tsx:34`
  ```
  const parseMeta = (meta: any): Record<string, any> | null => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/EventDetail.tsx:66`
  ```
  const getEventBranding = (event: any): EventBranding => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/EventoBetting.tsx:112`
  ```
  (marketsData || []).map((m: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/EventoBetting.tsx:128`
  ```
  .in('market_id', (marketsData || []).map((m: any) => m.id));
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/EventoBetting.tsx:132`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/EventoBetting.tsx:223`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/Fighters.tsx:438`
  ```
  {typeof filter.options.find((o: any) =>
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/Fighters.tsx:442`
  ```
  : (filter.options.find((o: any) => o.value === filter.value) as any)?.label || filter.value
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/Fighters.tsx:448`
  ```
  {filter.options.map((option: any) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/HudDemoDisplay.tsx:20`
  ```
  function computeStats(events: any[], fighter: string): StrikeStats {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/HudPublicDisplay.tsx:225`
  ```
  function computeStats(events: any[], fighter: string): StrikeStats {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/Predicciones.tsx:74`
  ```
  markets: event.market?.map((market: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/Predicciones.tsx:78`
  ```
  total_pool: market.outcome?.reduce((sum: number, outcome: any) => sum + (outcome.pool || 0), 0) || 0,
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/ProfileChangeRequest.tsx:98`
  ```
  const handleInputChange = (field: string, value: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/SocialFeed.tsx:115`
  ```
  const isOwnerPost = (post: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/SocialFeed.tsx:143`
  ```
  const handleCreatePost = async (postData: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/VerifyLicense.tsx:45`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/AIStrikeTestPanel.tsx:19`
  ```
  const callSimulator = async (action: string, additionalData?: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/Betting.tsx:35`
  ```
  meta: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/Betting.tsx:189`
  ```
  const handleCreateEvent = async (data: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/Betting.tsx:217`
  ```
  const handleUpdateEvent = async (data: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/Betting.tsx:249`
  ```
  const handleCreateMarket = async (data: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EmailCampaignDetail.tsx:56`
  ```
  metadata: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EmailCampaignEditor.tsx:74`
  ```
  const handleAutoSave = (html: string, json: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EmailCampaignEditor.tsx:80`
  ```
  const handleSave = async (html: string, json: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EmailCampaignEditor.tsx:146`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EmailCampaigns.tsx:24`
  ```
  metadata?: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EmailMonitoring.tsx:93`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EmailValidation.tsx:54`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EmailValidation.tsx:102`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EmailValidation.tsx:132`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EntrenadoresAdmin.tsx:68`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EventosPelea.tsx:606`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EventosPelea.tsx:659`
  ```
  const handleEditFight = async (fight: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/EventosPelea.tsx:795`
  ```
  const getFighterName = (fight: any, corner: 'A' | 'B') => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/FightApproval.tsx:18`
  ```
  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/FightApproval.tsx:53`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/FightApproval.tsx:262`
  ```
  {(eligibilityResult.checks || []).map((check: any, i: number) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/FightResults.tsx:81`
  ```
  const fightIds = (fightsData || []).map((f: any) => f.id);
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/FightResults.tsx:96`
  ```
  const enriched = (fightsData || []).map((f: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/FightResults.tsx:107`
  ```
  const openResultDialog = (fight: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/FightResults.tsx:180`
  ```
  const finalizeFightAuto = async (fight: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/FightResults.tsx:198`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/FightResults.tsx:270`
  ```
  const FightCard = ({ fight }: { fight: any }) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/FightersProfilesInvite.tsx:63`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/GimnasiosAdmin.tsx:64`
  ```
  const onSubmit = async (data: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/GimnasiosAdmin.tsx:95`
  ```
  } catch (invErr: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/GimnasiosAdmin.tsx:106`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/JudgesManagement.tsx:92`
  ```
  const handleEdit = (judge: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/LiveEventsControl.tsx:34`
  ```
  const FightCard = ({ fight }: { fight: any }) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/LiveEventsControl.tsx:222`
  ```
  fight: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/LiveEventsControl.tsx:223`
  ```
  events: any[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/LiveEventsControl.tsx:224`
  ```
  stats: any[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/LiveEventsControl.tsx:225`
  ```
  session: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/LiveEventsControl.tsx:747`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/LiveStreaming.tsx:52`
  ```
  const openEditor = (event: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/LiveStreaming.tsx:84`
  ```
  const quickToggle = async (event: any, value: boolean) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/LiveStreaming.tsx:102`
  ```
  const getLiveStream = (event: any) => (event.meta as any)?.live_stream || {};
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/OrganizationsManagement.tsx:71`
  ```
  const handleOpenEdit = (org: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/PendingChangesHub.tsx:161`
  ```
  const renderChangeDiff = (current: any, requested: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/Sanctions.tsx:89`
  ```
  } catch (e: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/Sanctions.tsx:192`
  ```
  } catch (e: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/SystemAssets.tsx:67`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/ValidacionLicencias.tsx:212`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/ValidacionLicencias.tsx:244`
  ```
  const openReviewModal = (license: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/ValidacionLicencias.tsx:653`
  ```
  {reviewingLicense.license_documents.map((doc: any) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/VisionDiagnostics.tsx:122`
  ```
  const sessionIds = allSessions.map((s: any) => s.id);
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/VisionDiagnostics.tsx:129`
  ```
  (countRows ?? []).forEach((r: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/VisionDiagnostics.tsx:133`
  ```
  setSessionHistory(allSessions.map((s: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/VisionDiagnostics.tsx:165`
  ```
  } catch (e: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/VisionDiagnostics.tsx:182`
  ```
  } catch (e: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/VisionDiagnostics.tsx:200`
  ```
  } catch (e: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/admin/VisionDiagnostics.tsx:218`
  ```
  } catch (e: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/gym/GymOnboarding.tsx:94`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/gym/RequestFight.tsx:73`
  ```
  const fighters = (memberships || []).map((d: any) => d.fighter_profiles).filter(Boolean);
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/gym/RequestFight.tsx:97`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/gym/RequestFight.tsx:134`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/gym/RequestFight.tsx:269`
  ```
  {(eligibilityResult.checks || []).map((check: any, i: number) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/judge/JudgeOnboarding.tsx:91`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/license/LicenseAuth.tsx:263`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/license/LicenseAuth.tsx:279`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/license/LicenseDashboard.tsx:94`
  ```
  const getMissingFields = (profile: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/license/LicenseDashboard.tsx:718`
  ```
  {medicalCerts.data.slice(0, 2).map((cert: any) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/license/LicenseDashboard.tsx:766`
  ```
  {upcomingFights.slice(0, 2).map((fight: any, index: number) => (
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/referee/RefereeControlRoom.tsx:66`
  ```
  const sendControlEvent = async (eventType: string, metadata: any = {}) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/referee/RefereeControlRoom.tsx:113`
  ```
  const getEventDescription = (eventType: string, metadata: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/referee/RefereeControlRoom.tsx:166`
  ```
  const metadata: any = { reason: actionReason };
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/pages/social/SocialProfile.tsx:48`
  ```
  const handleCreatePost = async (postData: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/services/emailCampaignService.ts:10`
  ```
  json_content: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/services/emailCampaignService.ts:16`
  ```
  metadata: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `src/services/emailCampaignService.ts:98`
  ```
  static async autoSave(id: string, htmlContent: string, jsonContent: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/_shared/email-config.ts:138`
  ```
  } catch (validationError: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/_shared/email-config.ts:176`
  ```
  } catch (err: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:131`
  ```
  async function searchFighters(criteria: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:163`
  ```
  async function advancedSearchFighters(criteria: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:270`
  ```
  async function updateFighterProfile(fighterId: string, updates: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:275`
  ```
  const sanitizedUpdates: any = {};
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:350`
  ```
  async function createTournament(tournamentData: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:627`
  ```
  async function generateComprehensiveReport(filters?: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:725`
  ```
  async function createFighter(fighterData: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:751`
  ```
  async function updateFighterComplete(fighterId: string, updates: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:795`
  ```
  async function generateFilteredReport(filters: any = {}) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:801`
  ```
  const stats: any = {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:810`
  ```
  fighters.forEach((f: any) => {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:894`
  ```
  async function handleFunctionCall(functionName: string, args: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/admin-ai-assistant/index.ts:984`
  ```
  ...conversation_history.map((msg: any) => ({
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/ai-strike-ingest/index.ts:18`
  ```
  function computeFighterStats(events: any[], fighter: string) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/ai-strike-ingest/index.ts:19`
  ```
  const fe = events.filter((e: any) => e.fighter === fighter);
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/ai-strike-ingest/index.ts:20`
  ```
  const attempted = fe.filter((e: any) => e.event_type === 'strike_attempted').length;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/ai-strike-ingest/index.ts:21`
  ```
  const connected = fe.filter((e: any) => e.event_type === 'strike_connected').length;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/ai-strike-ingest/index.ts:40`
  ```
  async function validateFightExists(supabase: any, fightId: string) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/ai-strike-ingest/index.ts:306`
  ```
  const updateData: any = {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/ai-strike-ingest/index.ts:393`
  ```
  rounds_detected: [...new Set(events.map((e: any) => e.round_number))].sort(),
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/fetch-link-metadata/index.ts:80`
  ```
  const metadata: any = {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/fetch-link-metadata/index.ts:121`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/fetch-sports-news/index.ts:215`
  ```
  const items: any[] = [];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/fetch-sports-news/index.ts:333`
  ```
  const allNewsItems: any[] = [];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:10`
  ```
  fight: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:11`
  ```
  scorecards: any[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:12`
  ```
  statistics: any[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:13`
  ```
  aiStrikes: any[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:14`
  ```
  controlEvents: any[];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:117`
  ```
  async function collectFightData(supabase: any, fightId: string): Promise<FightData> {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:212`
  ```
  const result: any = {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:244`
  ```
  function determineWinnerByScorecard(fighterAId: string, fighterBId: string, scorecards: any): string | null {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:268`
  ```
  function determineDecisionType(scorecards: any): string {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:310`
  ```
  async function generateAISummary(data: FightData, result: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:327`
  ```
  const statsA = data.statistics.find((s: any) => s.fighter_id === data.fight.fighter_a_id) || {};
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:328`
  ```
  const statsB = data.statistics.find((s: any) => s.fighter_id === data.fight.fighter_b_id) || {};
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:330`
  ```
  const aiStrikesA = data.aiStrikes.filter((s: any) => s.fighter === 'A');
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:331`
  ```
  const aiStrikesB = data.aiStrikes.filter((s: any) => s.fighter === 'B');
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:442`
  ```
  function extractKeyMoments(data: FightData): any[] {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:443`
  ```
  const moments: any[] = [];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/finalize-fight-auto/index.ts:471`
  ```
  function calculateAIAccuracy(strikes: any[]): number {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/notify-admin-pending/index.ts:78`
  ```
  } catch (emailError: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/notify-admin-pending/index.ts:110`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/process-email-queue/index.ts:23`
  ```
  emailData: any,
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/process-email-queue/index.ts:29`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/process-email-queue/index.ts:144`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/process-email-queue/index.ts:197`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/publish-news-to-social/index.ts:135`
  ```
  function shouldCreatePost(newsItem: any): boolean {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/publish-news-to-social/index.ts:155`
  ```
  function createPostContent(newsItem: any): string {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/receive-contact/index.ts:97`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-fighter-invitation/index.ts:218`
  ```
  } catch (emailError: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-fighter-invitation/index.ts:282`
  ```
  } catch (emailError: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-fighter-invitation/index.ts:298`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-gym-invitation/index.ts:99`
  ```
  let activeInvitation: any;
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-gym-invitation/index.ts:195`
  ```
  } catch (emailError: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-gym-invitation/index.ts:209`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-license-approval/index.ts:159`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-mass-email/index.ts:32`
  ```
  emailData: any,
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-mass-email/index.ts:38`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-mass-email/index.ts:251`
  ```
  const queueItems: any[] = [];
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-mass-email/index.ts:327`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-mass-email/index.ts:408`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-password-recovery/index.ts:254`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **Explicit `any` annotation** — `supabase/functions/send-signup-confirmation/index.ts:261`
  ```
  } catch (error: any) {
  ```
  → _Replace `any` with the actual type or `unknown` + narrowing._

- **noImplicitAny disabled** — `tsconfig.app.json:1`
  ```
  "noImplicitAny": false
  ```
  → _Re-enable noImplicitAny to force explicit parameter types._

- **noImplicitAny disabled** — `tsconfig.json:1`
  ```
  "noImplicitAny": false
  ```
  → _Re-enable noImplicitAny to force explicit parameter types._


## 🔵 Low (271)


### a11y

- **<button> missing type** — `src/components/AdminAnalytics.tsx:152`
  ```
  <Button variant="outline" size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/AdminDisciplineLayout.tsx:64`
  ```
  <Button variant="ghost" size="icon" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/AdminLayout.tsx:36`
  ```
  <Button variant="ghost" size="icon" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/EnhancedFighterID.tsx:353`
  ```
  <Button variant="outline" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/EnhancedFighterID.tsx:360`
  ```
  <Button variant="outline" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/EnhancedFighterID.tsx:414`
  ```
  <Button onClick={onEdit} variant="professional">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/Header.tsx:90`
  ```
  <Button variant="ghost" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/Header.tsx:93`
  ```
  <Button variant="ghost" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/Header.tsx:96`
  ```
  <Button variant="ghost" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/Header.tsx:105`
  ```
  <Button variant="ghost" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/Header.tsx:115`
  ```
  <Button variant="ghost" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/Header.tsx:118`
  ```
  <Button variant="ghost" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/Header.tsx:121`
  ```
  <Button variant="ghost" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/Header.tsx:130`
  ```
  <Button variant="ghost" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/Header.tsx:140`
  ```
  <Button variant="ghost" size="icon" className="md:hidden min-h-[44px] min-w-[44px] touch-manipulation">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/Header.tsx:327`
  ```
  <Button variant="ghost" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0 min-h-[44px] min-w-[44px] touch-manipulation">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/Header.tsx:416`
  ```
  <Button variant="default" size="sm" asChild className="hidden sm:inline-flex">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/ProfileCompletionPrompt.tsx:72`
  ```
  <Button asChild variant="professional">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/UserProfileForm.tsx:148`
  ```
  <Button variant="outline" disabled={uploading} className="cursor-pointer">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/WalletDisplay.tsx:94`
  ```
  <Button variant="outline" size="sm" className="mt-3" onClick={handleRefresh}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/WalletDisplay.tsx:151`
  ```
  <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/components/admin/AdminGymCard.tsx:80`
  ```
  <img src={gym.banner_url} alt={gym.nombre} className="w-full h-full object-cover" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<img> missing loading="lazy"** — `src/components/admin/AdminGymCard.tsx:87`
  ```
  <img src={gym.logo_url} alt={gym.nombre} className="w-12 h-12 rounded-lg object-cover shrink-0" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/components/admin/AdminGymCard.tsx:173`
  ```
  <Button variant="outline" size="sm" onClick={() => setShowOwnerModal(true)} title="Asignar Main Coach">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/AdminGymCard.tsx:176`
  ```
  <Button variant="outline" size="sm" onClick={() => setShowAssignModal(true)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/AdminGymCard.tsx:179`
  ```
  <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/AssignFighterToGymModal.tsx:133`
  ```
  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/AssignFighterToGymModal.tsx:287`
  ```
  <Button variant="outline" onClick={handleClose}>Cancelar</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/AssignGymOwnerModal.tsx:164`
  ```
  <Button variant="outline" onClick={() => { setConfirmReplace(false); setSelectedUser(null); }}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/EmailRecipientSelector.tsx:253`
  ```
  <Button onClick={addManualEmail} size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/EnrollFighterModal.tsx:193`
  ```
  <Button variant="outline" onClick={handleClose}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/EventBrandingModal.tsx:262`
  ```
  <Button variant="outline" onClick={() => onOpenChange(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/EventBrandingModal.tsx:265`
  ```
  <Button onClick={handleSave} disabled={saving}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/FighterDetailModal.tsx:117`
  ```
  <Button variant="outline" onClick={() => fetchDetailedData(fighterId)} className="mt-4">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/FighterDetailModal.tsx:368`
  ```
  <Button variant="outline" size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/FighterGymTab.tsx:145`
  ```
  <Button size="sm" onClick={() => { setMode('assign'); setSelectedGymId(''); setSelectedCoachId(''); }}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/FighterGymTab.tsx:206`
  ```
  <Button variant="outline" size="sm" onClick={() => setMode('idle')}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/FighterLeaguesTab.tsx:104`
  ```
  <Button size="sm" onClick={() => setEnrollDialogOpen(true)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/FighterLeaguesTab.tsx:153`
  ```
  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/FighterLeaguesTab.tsx:246`
  ```
  <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/FighterLeaguesTab.tsx:287`
  ```
  <Button variant="outline" onClick={() => setLevelDialogOpen(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/LiveControl.tsx:313`
  ```
  <Button size="sm" variant="destructive">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/PointAdjustmentModal.tsx:210`
  ```
  <Button variant="outline" onClick={() => onOpenChange(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/PrepareFightDialog.tsx:95`
  ```
  <Button size="sm" variant="default">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/PrepareFightDialog.tsx:165`
  ```
  <Button variant="outline" onClick={() => setIsOpen(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/PrepareFightDialog.tsx:168`
  ```
  <Button onClick={handlePrepare} disabled={loading}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/PrepareFightDialog.tsx:239`
  ```
  <Button onClick={() => {
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/RoundControlPanel.tsx:149`
  ```
  <Button onClick={() => startRound(nextRound.id)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/SettlementConsole.tsx:353`
  ```
  <Button size="sm" variant="outline" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/SettlementConsole.tsx:362`
  ```
  <Button size="sm" className="bg-fighter-success hover:bg-fighter-success/90">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/SettlementConsole.tsx:520`
  ```
  <Button variant="outline" onClick={resetForm}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/SettlementConsole.tsx:557`
  ```
  <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/SettlementConsole.tsx:560`
  ```
  <Button onClick={submitSettlement} disabled={loading}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/roles/RoleEditDialog.tsx:193`
  ```
  <Button variant="outline" size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/roles/RoleEditDialog.tsx:261`
  ```
  <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancelar</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/admin/roles/RoleEditDialog.tsx:262`
  ```
  <Button onClick={handleSave} disabled={isLoading}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:174`
  ```
  <Button variant={isPreviewMode ? 'default' : 'outline'} size="sm" onClick={() => setIsPreviewMode(!isPreviewMode)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:178`
  ```
  <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:195`
  ```
  <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="h-4 w-4" /></Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:196`
  ```
  <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="h-4 w-4" /></Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:198`
  ```
  <Button variant={editor.isActive('bold') ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:199`
  ```
  <Button variant={editor.isActive('italic') ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:200`
  ```
  <Button variant={editor.isActive('underline') ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-4 w-4" /></Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:201`
  ```
  <Button variant={editor.isActive('strike') ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:203`
  ```
  <Button variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Bu
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:204`
  ```
  <Button variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Bu
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:205`
  ```
  <Button variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Bu
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:207`
  ```
  <Button variant={editor.isActive('bulletList') ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:208`
  ```
  <Button variant={editor.isActive('orderedList') ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:210`
  ```
  <Button variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft className="h-4 w-4" /></Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:211`
  ```
  <Button variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter className="h-4 w-4" /></Butt
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:212`
  ```
  <Button variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight className="h-4 w-4" /></Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:213`
  ```
  <Button variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'} size="sm" onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify className="h-4 w-4" /></B
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:219`
  ```
  <Button variant="ghost" size="sm"><ImageIcon className="h-4 w-4" /></Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:235`
  ```
  <Button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:245`
  ```
  <Button onClick={handleInsertImageUrl} className="w-full">Insertar Imagen</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/EmailTipTapEditor.tsx:252`
  ```
  <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/ImageResize.tsx:116`
  ```
  <Button variant="ghost" size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/ImageResize.tsx:138`
  ```
  <Button variant="outline" size="sm" onClick={() => setSize(300)}>Pequeño</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/ImageResize.tsx:139`
  ```
  <Button variant="outline" size="sm" onClick={() => setSize(500)}>Mediano</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/ImageResize.tsx:140`
  ```
  <Button variant="outline" size="sm" onClick={() => setSize(700)}>Grande</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/ImageResize.tsx:150`
  ```
  <Button variant="ghost" size="sm" onClick={resetSize} title="Tamaño original">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/components/email/ImageResize.tsx:153`
  ```
  <Button variant="ghost" size="sm" onClick={() => deleteNode()} className="text-destructive hover:text-destructive">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/components/gym/GymCard.tsx:23`
  ```
  <img src={gym.banner_url} alt="" className="w-full h-full object-cover" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<img> missing loading="lazy"** — `src/components/gym/GymDashboardHeader.tsx:48`
  ```
  <img src={gym.banner_url} alt="" className="w-full h-full object-cover" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<img> missing loading="lazy"** — `src/components/sections/GymShowcase.tsx:76`
  ```
  <img src={gym.logo_url} alt={gym.nombre} className="h-10 w-10 rounded-full object-cover" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/components/social/PostCard.tsx:222`
  ```
  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/AccessDenied.tsx:25`
  ```
  <Button asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/AccessDenied.tsx:32`
  ```
  <Button variant="outline" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/pages/Auth.tsx:220`
  ```
  <img src={fighterIdLogo} alt="Fighter ID" className="w-24 mx-auto mb-2" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/pages/Auth.tsx:350`
  ```
  <Button variant="outline" size="sm" className="w-full border-border" onClick={handleResendEmail} disabled={resendCooldown > 0 || isResending}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/AuthCallback.tsx:202`
  ```
  <Button onClick={() => navigate('/auth', { replace: true })} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/AuthCallback.tsx:223`
  ```
  <Button onClick={() => navigate('/auth', { replace: true })} variant="outline" className="w-full border-border">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/AuthCallback.tsx:229`
  ```
  <Button variant="ghost" onClick={() => navigate('/auth', { replace: true })} className="w-full text-muted-foreground">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EnVivo.tsx:199`
  ```
  <Button asChild size="lg" className="bg-destructive hover:bg-destructive/90 text-white font-bold">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EnVivo.tsx:202`
  ```
  <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EnVivo.tsx:304`
  ```
  <Button asChild size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/pages/EnVivo.tsx:377`
  ```
  <img src={getEventBrandingLogo(event)} alt="" className="h-6 w-auto opacity-70" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/pages/EnVivo.tsx:395`
  ```
  <Button asChild variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EntrenadorDetalle.tsx:33`
  ```
  <Button onClick={() => window.history.back()}>Volver</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EntrenadorDetalle.tsx:65`
  ```
  <Button variant="outline" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EntrenadorDetalle.tsx:73`
  ```
  <Button variant="outline" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EntrenadorDetalle.tsx:81`
  ```
  <Button variant="outline" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EventDetail.tsx:154`
  ```
  <Button asChild variant="outline">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EventDetail.tsx:160`
  ```
  <Button asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EventDetail.tsx:204`
  ```
  <Button variant="ghost" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EventDetail.tsx:210`
  ```
  <Button variant="ghost" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EventDetail.tsx:258`
  ```
  <Button asChild size="lg" className="bg-destructive hover:bg-destructive/90 animate-pulse">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/EventDetail.tsx:265`
  ```
  <Button size="lg" className="animate-pulse">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/pages/EventDetail.tsx:325`
  ```
  <img src={getEventBranding(event).watermark_url || '/lovable-uploads/ucc-logo-transparent.png'} alt="Watermark" className="w-64 h-64 object-contain" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<img> missing loading="lazy"** — `src/pages/EventDetail.tsx:396`
  ```
  <img src={getEventBranding(event).watermark_url || '/lovable-uploads/ucc-logo-transparent.png'} alt="VS" className="w-10 h-10 opacity-70" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<img> missing loading="lazy"** — `src/pages/EventDetail.tsx:540`
  ```
  <img alt="VS" className="w-16 h-16 md:w-24 md:h-24 opacity-80 animate-pulse" src="/lovable-uploads/8d2ed2c0-f2be-4577-9514-8e96c6c99034.png" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/pages/Events.tsx:239`
  ```
  <Button asChild className="w-full">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/FighterLicense.tsx:46`
  ```
  <Button onClick={() => navigate('/fighters')}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/FighterLicense.tsx:68`
  ```
  <Button variant="outline" size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/FighterLicense.tsx:72`
  ```
  <Button variant="outline" size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/FighterProfile.tsx:108`
  ```
  <Button asChild variant="outline">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/FighterProfile.tsx:114`
  ```
  <Button asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/FighterProfile.tsx:169`
  ```
  <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/FighterProfile.tsx:175`
  ```
  <Button asChild variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/FighterProfile.tsx:183`
  ```
  <Button asChild variant="default" className="min-h-[44px] touch-manipulation w-full sm:w-auto">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/Fighters.tsx:295`
  ```
  <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 animate-glow">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/GimnasioDetalle.tsx:39`
  ```
  <Button onClick={() => window.history.back()}>Volver</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/pages/GimnasioDetalle.tsx:54`
  ```
  <img src={gym.banner_url} alt="" className="w-full h-full object-cover" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/pages/GimnasioDetalle.tsx:84`
  ```
  <Button variant="outline" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/GimnasioDetalle.tsx:92`
  ```
  <Button variant="outline" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/GimnasioDetalle.tsx:100`
  ```
  <Button variant="outline" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/GimnasioDetalle.tsx:108`
  ```
  <Button variant="outline" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/pages/HudDemoDisplay.tsx:156`
  ```
  <img src={logoUrl} alt="Fighter ID" className="h-8 opacity-70" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/pages/HudDemoDisplay.tsx:176`
  ```
  <button onClick={togglePause} className="p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/HudDemoDisplay.tsx:179`
  ```
  <button onClick={reset} className="p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/pages/HudPublicDisplay.tsx:127`
  ```
  <img src={logoUrl} alt="Fighter ID" className="h-16 mx-auto opacity-60" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<img> missing loading="lazy"** — `src/pages/HudPublicDisplay.tsx:155`
  ```
  <img src={logoUrl} alt="Fighter ID" className="h-8 opacity-70" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/pages/ImportEvent.tsx:13`
  ```
  <Button variant="ghost" size="sm" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/NotFound.tsx:46`
  ```
  <Button variant="outline" asChild className="flex-1">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/NotFound.tsx:52`
  ```
  <Button variant="outline" asChild className="flex-1">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/ProfileChangeRequest.tsx:205`
  ```
  <Button variant="ghost" onClick={() => navigate(-1)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/SocialFeed.tsx:338`
  ```
  <Button size="sm" variant="ghost" className="text-primary flex-shrink-0">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/UserProfile.tsx:63`
  ```
  <Button asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/UserProfile.tsx:156`
  ```
  <Button onClick={() => setShowCreateDialog(true)} className="bg-professional-primary hover:bg-professional-primary/90">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/UserProfile.tsx:239`
  ```
  <Button asChild className="bg-professional-primary hover:bg-professional-primary/90 w-full sm:w-auto min-h-[44px] touch-manipulation text-sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/UserProfile.tsx:245`
  ```
  <Button variant="outline" asChild className="border-professional-accent/40 hover:bg-professional-accent/10 w-full sm:w-auto min-h-[44px] touch-manipulation text-sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/UserProfile.tsx:263`
  ```
  <Button asChild className="bg-professional-primary hover:bg-professional-primary/90 w-full sm:w-auto min-h-[44px] touch-manipulation text-sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/UserProfile.tsx:269`
  ```
  <Button variant="outline" asChild className="border-professional-accent/40 hover:bg-professional-accent/10 w-full sm:w-auto min-h-[44px] touch-manipulation text-sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/UserProfile.tsx:368`
  ```
  <Button variant="outline" asChild className="justify-start">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/UserProfile.tsx:374`
  ```
  <Button variant="outline" asChild className="justify-start">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/AIStrikeMonitor.tsx:101`
  ```
  <Button variant="outline" className="gap-2">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/AIStrikeMonitor.tsx:400`
  ```
  <Button variant="outline" size="icon">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/AliadosEstrategicos.tsx:243`
  ```
  <Button onClick={resetForm}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/AliadosEstrategicos.tsx:334`
  ```
  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/ApprovalQueue.tsx:314`
  ```
  <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Betting.tsx:390`
  ```
  <Button onClick={() => {
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Betting.tsx:507`
  ```
  <Button size="sm" variant="outline">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Betting.tsx:572`
  ```
  <Button onClick={() => {
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Betting.tsx:747`
  ```
  <Button size="sm" variant="outline">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Comunidad.tsx:434`
  ```
  <Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Comunidad.tsx:587`
  ```
  <Button variant="ghost" size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Comunidad.tsx:638`
  ```
  <Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/pages/admin/Comunidad.tsx:756`
  ```
  <img src={partner.logo} alt={partner.nombre} className="w-10 h-10 object-contain" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/pages/admin/Comunidad.tsx:796`
  ```
  <Button variant="ghost" size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Configuracion.tsx:242`
  ```
  <Button variant="outline" onClick={crearConfiguracionesComunes}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Configuracion.tsx:250`
  ```
  <Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Configuracion.tsx:357`
  ```
  <Button variant="ghost" size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Configuracion.tsx:396`
  ```
  <Button variant="outline" onClick={crearConfiguracionesComunes}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/ContactInbox.tsx:129`
  ```
  <Button onClick={() => refetch()} variant="outline" size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EmailCampaignDetail.tsx:208`
  ```
  <Button variant="outline" onClick={() => navigate('/admin/email-campaigns')} className="mt-4">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EmailCampaignDetail.tsx:222`
  ```
  <Button variant="ghost" size="icon" onClick={() => navigate('/admin/email-campaigns')}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EmailCampaignDetail.tsx:243`
  ```
  <Button variant="outline" onClick={() => setShowPreview(true)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EmailCampaignDetail.tsx:331`
  ```
  <Button variant="outline" onClick={exportToCSV}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EmailCampaignEditor.tsx:158`
  ```
  <Button variant="ghost" size="icon" onClick={() => navigate("/admin/email-campaigns")}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EmailCampaignEditor.tsx:248`
  ```
  <Button size="lg" onClick={handleSend} disabled={sending || !subject}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EmailCampaigns.tsx:98`
  ```
  <Button size="lg" onClick={() => navigate('/admin/email-campaigns/editor')} className="gap-2">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EmailCampaigns.tsx:187`
  ```
  <Button variant="ghost" size="sm" onClick={() => duplicateDraft.mutate(d.id)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EmailCampaigns.tsx:190`
  ```
  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm('¿Eliminar borrador?')) deleteDraft.mutate(d.id); }}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EmailValidation.tsx:173`
  ```
  <Button onClick={validateResendConfig} disabled={validating}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EmailValidation.tsx:238`
  ```
  <Button onClick={testMassEmail} disabled={testingMass} variant="outline">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EmailValidation.tsx:260`
  ```
  <Button onClick={testAdminNotification} disabled={testingNotification} variant="outline">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EntrenadoresAdmin.tsx:92`
  ```
  <Button><Plus className="mr-2 h-4 w-4" />Agregar Staff</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EntrenadoresAdmin.tsx:149`
  ```
  <Button variant="ghost" size="sm" className="ml-auto h-6" onClick={() => { setSelectedUser(null); setSearchQuery(''); }}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EntrenadoresAdmin.tsx:169`
  ```
  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EntrenadoresAdmin.tsx:170`
  ```
  <Button onClick={handleAddStaff} disabled={isSubmitting}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EntrenadoresAdmin.tsx:207`
  ```
  <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={() => handleDeactivate(staff.id)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EntrenadoresAdmin.tsx:222`
  ```
  <Button onClick={() => setIsDialogOpen(true)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:882`
  ```
  <Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:995`
  ```
  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:998`
  ```
  <Button onClick={handleCreateEvent}>Crear Evento</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:1009`
  ```
  <Button onClick={() => setShowCreateDialog(true)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:1030`
  ```
  <Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:1147`
  ```
  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:1150`
  ```
  <Button onClick={handleCreateEvent}>Crear Evento</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:1286`
  ```
  <Button variant="outline" size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:1369`
  ```
  <Button variant="outline" size="sm" onClick={() => { setBrandingEvent(event); setShowBrandingModal(true); }} className="text-primary border-primary/30">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:1372`
  ```
  <Button variant="outline" size="sm" onClick={() => openStreamDialog(event)} className={((event.meta as any)?.live_stream?.is_streaming) ? 'text-destructive' : ''}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:1375`
  ```
  <Button variant="outline" size="sm" onClick={() => { setSelectedEvent(event); setEventFighters([]); setShowFightersDialog(true); }}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:1378`
  ```
  <Button variant="outline" size="sm" onClick={() => { setSelectedEvent(event); setFightsEventId(event.id); resetFightForm(); setShowFightsDialog(true); }}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:1383`
  ```
  <Button variant="outline" size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:1504`
  ```
  <Button variant="outline" onClick={() => setShowFightersDialog(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:2028`
  ```
  <Button variant="outline" onClick={() => {
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:2035`
  ```
  <Button variant="outline" onClick={resetFightForm}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:2039`
  ```
  <Button onClick={handleSaveFight}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:2107`
  ```
  <Button variant="outline" onClick={() => setShowStreamDialog(false)}>Cancelar</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/EventosPelea.tsx:2108`
  ```
  <Button onClick={handleSaveStream}>Guardar Transmisión</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/FightApproval.tsx:175`
  ```
  <Button size="sm" variant="outline" className="text-fighter-success border-fighter-success/30" onClick={(e) => { e.stopPropagation(); handleApprove(req); }}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/FightApproval.tsx:178`
  ```
  <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); setShowRejectDialog(true); }}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/FightApproval.tsx:277`
  ```
  <Button variant="outline" onClick={() => { setShowRejectDialog(true); }}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/FightApproval.tsx:280`
  ```
  <Button onClick={() => handleApprove(selectedRequest)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/FightApproval.tsx:303`
  ```
  <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/FightApproval.tsx:304`
  ```
  <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/FightResults.tsx:597`
  ```
  <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/FightResults.tsx:600`
  ```
  <Button onClick={submitResult}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/FightersProfiles.tsx:166`
  ```
  <Button onClick={() => navigate('/admin/fighters-profiles/invite')} size="lg">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/FightersProfiles.tsx:480`
  ```
  <Button variant="outline" size="sm" onClick={() => setQuickAssignFighter(null)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/GimnasiosAdmin.tsx:136`
  ```
  <Button size="sm">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/GimnasiosAdmin.tsx:298`
  ```
  <Button onClick={() => setIsDialogOpen(true)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/JudgesManagement.tsx:144`
  ```
  <Button onClick={() => {
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/JudgesManagement.tsx:489`
  ```
  <Button onClick={() => setIsDialogOpen(true)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/LiveEventsControl.tsx:250`
  ```
  <Button size="sm" variant="cyber">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/LiveEventsControl.tsx:439`
  ```
  <Button variant="outline" onClick={() => setIsOpen(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/LiveEventsControl.tsx:442`
  ```
  <Button variant="neon" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/LiveEventsControl.tsx:479`
  ```
  <Button size="sm" variant="outline" className="w-full text-xs">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/LiveEventsControl.tsx:512`
  ```
  <Button variant="outline" onClick={() => setIsOpen(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/LiveEventsControl.tsx:515`
  ```
  <Button onClick={handleAssign} disabled={!selectedJudgeId}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/LiveEventsControl.tsx:668`
  ```
  <Button onClick={() => window.location.href = '/admin/eventos-pelea'}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/LiveEventsControl.tsx:758`
  ```
  <Button variant="outline" size="sm" onClick={diagnose}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/LiveStreaming.tsx:116`
  ```
  <Button variant="outline" asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/LiveStreaming.tsx:184`
  ```
  <Button size="sm" variant="ghost" onClick={() => openEditor(event)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/LiveStreaming.tsx:262`
  ```
  <Button variant="outline" onClick={() => setEditingEvent(null)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/LiveStreaming.tsx:265`
  ```
  <Button onClick={handleSave} disabled={saving}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/OfficialsManagement.tsx:119`
  ```
  <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(official)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/OfficialsManagement.tsx:122`
  ```
  <button onClick={() => onToggle(official.id, !official.active)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/OfficialsManagement.tsx:130`
  ```
  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/OfficialsManagement.tsx:247`
  ```
  <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Oficial</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/OrganizationsManagement.tsx:144`
  ```
  <Button onClick={handleOpenCreate}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/pages/admin/OrganizationsManagement.tsx:170`
  ```
  {org.logo_url && <img src={org.logo_url} alt="" className="h-6 w-6 rounded" />}
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/pages/admin/OrganizationsManagement.tsx:204`
  ```
  <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(org)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/OrganizationsManagement.tsx:312`
  ```
  <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/OrganizationsManagement.tsx:313`
  ```
  <Button onClick={handleSave} disabled={!form.code || !form.name || !form.short_name}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/PendingChangesHub.tsx:236`
  ```
  <Button variant="outline" size="sm" onClick={refreshAll}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/PendingChangesHub.tsx:576`
  ```
  <Button variant="outline" onClick={() => setDialogType(null)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/PendingChangesHub.tsx:639`
  ```
  <Button variant="outline" onClick={() => setDialogType(null)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/PendingChangesHub.tsx:707`
  ```
  <Button variant="outline" onClick={() => setDialogType(null)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/RankingsManagement.tsx:207`
  ```
  <Button size="sm" onClick={() => setEnrollModalOpen(true)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Sanctions.tsx:99`
  ```
  <Button><Plus className="h-4 w-4 mr-2" />Nueva Sanción</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Sanctions.tsx:164`
  ```
  <Button onClick={handleSubmit} disabled={submitting} className="w-full">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Sanctions.tsx:265`
  ```
  <Button size="sm" variant="outline" onClick={() => handleStatusChange(s.id, 'under_review')}>Revisar</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Sanctions.tsx:268`
  ```
  <Button size="sm" onClick={() => handleStatusChange(s.id, 'decided')}>Decidir</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/admin/Sanctions.tsx:271`
  ```
  <Button size="sm" variant="secondary" onClick={() => handleStatusChange(s.id, 'closed')}>Cerrar</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/pages/auth/ForgotPassword.tsx:99`
  ```
  <img src={fighterIdLogo} alt="Fighter ID Logo" className="w-32 mx-auto mb-2" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<img> missing loading="lazy"** — `src/pages/auth/ResetPassword.tsx:146`
  ```
  <img src={fighterIdLogo} alt="Fighter ID Logo" className="w-32 mb-4" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<img> missing loading="lazy"** — `src/pages/auth/ResetPassword.tsx:159`
  ```
  <img src={fighterIdLogo} alt="Fighter ID Logo" className="w-32 mx-auto mb-2" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/pages/gym/GymAddFighter.tsx:81`
  ```
  <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/gym/GymAddFighter.tsx:96`
  ```
  <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" onClick={() => navigate(-1)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/gym/GymAddFighter.tsx:223`
  ```
  <Button variant="outline" className="flex-1 h-12" onClick={() => setAddingFighterId(null)} disabled={isMutating}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/gym/GymDashboard.tsx:85`
  ```
  <Button variant="ghost" size="sm" onClick={() => navigate(`/gym/${gymId}/fighters`)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/pages/gym/GymOnboarding.tsx:109`
  ```
  <img src={fighterIdLogo} alt="Fighter ID" className="w-20 mx-auto mb-2" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<img> missing loading="lazy"** — `src/pages/gym/GymPendingInvitation.tsx:17`
  ```
  <img src={fighterIdLogo} alt="Fighter ID" className="w-24 mx-auto mb-2" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/pages/gym/RequestFight.tsx:259`
  ```
  <Button variant="outline" size="sm" onClick={handleCheckEligibility} disabled={checking} className="w-full">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/gym/RequestFight.tsx:280`
  ```
  <Button onClick={handleSubmit} className="w-full" disabled={!form.fighter_a_id || !form.weight_class}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/pages/judge/JudgeOnboarding.tsx:106`
  ```
  <img src={fighterIdLogo} alt="Fighter ID" className="w-20 mx-auto mb-2" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<img> missing loading="lazy"** — `src/pages/license/LicenseAuth.tsx:540`
  ```
  <img src={avatarPreview} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-full border-2 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)] animate-scale-in" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/pages/license/LicenseWelcome.tsx:72`
  ```
  <Button asChild className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold group-hover:scale-105 transition-transform">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<img> missing loading="lazy"** — `src/pages/profile/ProfileHub.tsx:153`
  ```
  <img src={fighterIdLogo} alt="Fighter ID" className="w-20 mx-auto mb-4" />
  ```
  → _Add loading="lazy" for non-hero images._

- **<button> missing type** — `src/pages/profile/ProfileHub.tsx:158`
  ```
  <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/referee/RefereeControlRoom.tsx:454`
  ```
  <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/referee/RefereeControlRoom.tsx:457`
  ```
  <Button onClick={handleDetailedAction}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/social/SocialProfile.tsx:78`
  ```
  <Button asChild>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/social/SocialProfile.tsx:176`
  ```
  <Button variant="default" size="lg">
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/social/SocialProfile.tsx:236`
  ```
  <Button variant="ghost" size="sm" onClick={() => setShowCreatePost(false)}>
  ```
  → _Add type="button" to avoid unintended form submissions._

- **<button> missing type** — `src/pages/social/SocialProfile.tsx:288`
  ```
  <Button onClick={() => setShowCreatePost(true)}>
  ```
  → _Add type="button" to avoid unintended form submissions._


### react

- **Direct DOM access** — `src/main.tsx:40`
  ```
  createRoot(document.getElementById("root")!).render(<App />);
  ```
  → _Use a ref or React state instead of direct DOM manipulation when possible._

- **Direct DOM access** — `src/pages/Index.tsx:84`
  ```
  const element = document.getElementById(id);
  ```
  → _Use a ref or React state instead of direct DOM manipulation when possible._

