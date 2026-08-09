# Graph Report - C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src  (2026-08-09)

## Corpus Check
- 49 files · ~102,478 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 445 nodes · 501 edges · 32 communities detected
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 15 edges
2. `data` - 15 edges
3. `recordDailyActivity()` - 6 edges
4. `handleToggleTask` - 5 edges
5. `match` - 5 edges
6. `normalizeStudyPlanData()` - 5 edges
7. `parseFileBuffer()` - 5 edges
8. `router` - 4 edges
9. `RESPONSE_SCHEMA` - 4 edges
10. `EMIL_EASE_ARR` - 4 edges

## Surprising Connections (you probably didn't know these)
- `parseDayNumber()` --calls--> `match`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\normalizeStudyPlan.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\components\study\MaterialUploader.tsx
- `POST()` --calls--> `formData`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\components\study\MaterialUploader.tsx
- `POST()` --calls--> `parseFileBuffer()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\utils\file-parser.ts
- `POST()` --calls--> `buildFallbackExplanation()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\ai\study-materials.ts
- `POST()` --calls--> `buildFallbackStudyPlan()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\ai\study-materials.ts

## Communities

### Community 0 - "Community 0"

Cohesion: 0.03
Nodes (69): appendAiExplanationToRoom(), clearSharedBoard(), createStudyMeetRoom(), deleteStudyMeetRoom(), importStudyPlanToRoom(), joinStudyMeetRoom(), leaveStudyMeetRoom(), parseRoomDoc() (+61 more)

### Community 1 - "Community 1"

Cohesion: 0.03
Nodes (57): [activeTaunt, setActiveTaunt], [animPhase, setAnimPhase], [attackText, setAttackText], barGradient, [battleLog, setBattleLog], BOSS_MAX_HP, [bossHp, setBossHp], [combo, setCombo] (+49 more)

### Community 2 - "Community 2"

Cohesion: 0.04
Nodes (43): accent, [actionLoading, setActionLoading], avgPct, canProceedStep2, canProceedStep3, canProceedStep4, cardVariants, circ (+35 more)

### Community 3 - "Community 3"

Cohesion: 0.07
Nodes (30): allPendingTasks, cardRef, circumference, coreFeatures, ctx, dateString, displayName, EASE_EMIL_OUT_ARR (+22 more)

### Community 4 - "Community 4"

Cohesion: 0.1
Nodes (17): async(), handleAttack, handleKeyDown(), commitDuelEvaluation(), createOrGetMultiplayerMatch(), findUserByEmail(), getMatchStatus(), saveUserProfile() (+9 more)

### Community 5 - "Community 5"

Cohesion: 0.12
Nodes (16): formData, BASE_SYSTEM_INSTRUCTION, buildFallback(), buildFallbackExplanation(), buildFallbackResponse(), FALLBACK_QUESTIONS, offsetDate(), POST() (+8 more)

### Community 6 - "Community 6"

Cohesion: 0.13
Nodes (16): fetchPlans(), getStudyPlans(), saveStudyPlan(), toggleTaskCompletion(), updateStudyPlanTasks(), userPlansCollection(), loadTopics(), generateTaskId() (+8 more)

### Community 7 - "Community 7"

Cohesion: 0.1
Nodes (18): sendMatchChallenge(), [challengeId, setChallengeId], [customTopic, setCustomTopic], DEFAULT_CS_TOPICS, [error, setError], friendEmail, friendName, handleSendChallenge() (+10 more)

### Community 8 - "Community 8"

Cohesion: 0.11
Nodes (16): EASE, ext, extractedText, file, fileBase64, isActive, isOpen, isPdf (+8 more)

### Community 9 - "Community 9"

Cohesion: 0.17
Nodes (10): containerRef, [isHovered, setIsHovered], isIcon, mount, parent, rippleIdRef, [ripples, setRipples], SHADER_COLOR_BACK (+2 more)

### Community 10 - "Community 10"

Cohesion: 0.22
Nodes (5): AuthContext, googleProvider, useAuth(), ChallengeNotificationToast(), MeetInviteNotificationToast()

### Community 11 - "Community 11"

Cohesion: 0.22
Nodes (7): active, [isCollapsed, setIsCollapsed], navItems, pathname, saved, toggleCollapse, { user, signOutUser }

### Community 12 - "Community 12"
_Unable to determine domain due to missing code entities._
Cohesion: 0.25
Nodes (4): metadata, plusJakartaSans, spaceGrotesk, viewport

### Community 13 - "Community 13"
_Unable to determine domain due to missing code entities._
Cohesion: 0.29
Nodes (5): isActive, navLinks, pathname, [signingIn, setSigningIn], { user, loading, signInWithGoogle }

### Community 14 - "Community 14"
_Unable to determine domain due to missing code entities._
Cohesion: 0.62
Nodes (6): extractPrintableStrings(), extractTextFromDocx(), extractTextFromPdf(), parseFileBuffer(), sanitizeText(), match

### Community 15 - "Community 15"
_Unable to determine domain due to missing code entities._
Cohesion: 0.33
Nodes (5): containerVariants, isMountedRef, router, spinnerVariants, { user, loading }

### Community 16 - "Community 16"
_Unable to determine domain due to missing code entities._
Cohesion: 0.33
Nodes (4): connectedPeerCount, remoteCount, {
    remoteStreams,
    connectionStates,
    voiceParticipants,
    isMuted,
    isAudioBlocked,
    firestoreError,
    toggleMute,
    resumeAudio,
    attachAudioElement,
  }, { user }

### Community 17 - "Community 17"
_Unable to determine domain due to missing code entities._
Cohesion: 0.33
Nodes (0): 

### Community 18 - "Community 18"
_Unable to determine domain due to missing code entities._
Cohesion: 0.4
Nodes (4): app, auth, db, firebaseConfig

### Community 19 - "Community 19"
_Unable to determine domain due to missing code entities._
Cohesion: 0.5
Nodes (3): EMIL_EASE_IN_OUT, EMIL_EASE_OUT, EMIL_SPRING_TRANSITION

### Community 20 - "Community 20"
_Unable to determine domain due to missing code entities._
Cohesion: 0.67
Nodes (1): metadata

### Community 21 - "Community 21"
_Unable to determine domain due to missing code entities._
Cohesion: 0.67
Nodes (1): ICE_SERVERS

### Community 22 - "Community 22"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (1): orbs

### Community 25 - "Community 25"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **249 isolated node(s):** `plusJakartaSans`, `spaceGrotesk`, `viewport`, `EASE_EMIL_OUT_ARR`, `fadeUp` (+244 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 22`** (2 nodes): `page.tsx`, `StudyMeetRoomPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `loading.tsx`, `SkeletonPulse()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `orbs`, `BackgroundCanvas.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `SmoothScrollProvider.tsx`, `SmoothScrollProvider()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `useStudyTimer.ts`, `useStudyTimer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `cn.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `loading.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `VoiceChat.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `Providers.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.