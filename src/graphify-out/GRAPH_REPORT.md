# Graph Report - C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src  (2026-08-09)

## Corpus Check
- 44 files · ~96,802 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 442 nodes · 480 edges · 29 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `POST()` - 14 edges
2. `handleToggleTask` - 5 edges
3. `normalizeStudyPlanData()` - 5 edges
4. `recordDailyActivity()` - 5 edges
5. `parseFileBuffer()` - 5 edges
6. `router` - 4 edges
7. `RESPONSE_SCHEMA` - 4 edges
8. `EASE` - 4 edges
9. `handleAttack()` - 4 edges
10. `saveStudyPlan()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `parseFileBuffer()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\utils\file-parser.ts
- `POST()` --calls--> `buildFallbackExplanation()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\ai\study-materials.ts
- `POST()` --calls--> `buildFallbackStudyPlan()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\ai\study-materials.ts
- `POST()` --calls--> `normalizeStudyPlanData()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\normalizeStudyPlan.ts
- `POST()` --calls--> `buildFallbackExplanation()`  [EXTRACTED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\meet\explain\route.ts

## Communities

### Community 0 - "Community 0"

Cohesion: 0.03
Nodes (66): appendAiExplanationToRoom(), clearSharedBoard(), createStudyMeetRoom(), deleteStudyMeetRoom(), importStudyPlanToRoom(), joinStudyMeetRoom(), leaveStudyMeetRoom(), parseRoomDoc() (+58 more)

### Community 1 - "Community 1"

Cohesion: 0.04
Nodes (51): [activeTaunt, setActiveTaunt], [animPhase, setAnimPhase], [attackText, setAttackText], [battleLog, setBattleLog], BOSS_MAX_HP, [bossHp, setBossHp], [combo, setCombo], [currentQuestion, setCurrentQuestion] (+43 more)

### Community 2 - "Community 2"

Cohesion: 0.04
Nodes (42): accent, [actionLoading, setActionLoading], [aiInsights, setAiInsights], allPendingTasks, cardVariants, circ, [collapsed, setCollapsed], completedCount (+34 more)

### Community 3 - "Community 3"

Cohesion: 0.06
Nodes (28): sendMatchChallenge(), [activeTab, setActiveTab], [addEmail, setAddEmail], [addLoading, setAddLoading], [addStatus, setAddStatus], [challengeFriend, setChallengeFriend], [challengeId, setChallengeId], [customTopic, setCustomTopic] (+20 more)

### Community 4 - "Community 4"

Cohesion: 0.08
Nodes (14): async(), handleAttack(), handleKeyDown(), acceptFriendRequest(), commitDuelEvaluation(), findUserByEmail(), removeFriendRelationship(), saveUserProfile() (+6 more)

### Community 5 - "Community 5"

Cohesion: 0.08
Nodes (23): [days, setDays], [dragActive, setDragActive], EASE, [error, setError], [explainResult, setExplainResult], fileInputRef, handleDrag, handleDrop (+15 more)

### Community 6 - "Community 6"

Cohesion: 0.12
Nodes (16): fetchPlans(), getStudyPlans(), saveStudyPlan(), toggleTaskCompletion(), updateStudyPlanTasks(), userPlansCollection(), loadTopics(), handleSaveToFirestore() (+8 more)

### Community 7 - "Community 7"

Cohesion: 0.13
Nodes (15): BASE_SYSTEM_INSTRUCTION, buildFallback(), buildFallbackExplanation(), buildFallbackResponse(), FALLBACK_QUESTIONS, offsetDate(), POST(), RESPONSE_SCHEMA (+7 more)

### Community 8 - "Community 8"

Cohesion: 0.11
Nodes (16): canProceedStep2, canProceedStep3, canProceedStep4, [customMajor, setCustomMajor], finalMajor, [isCustomMajor, setIsCustomMajor], isSuccess, isUser (+8 more)

### Community 9 - "Community 9"

Cohesion: 0.12
Nodes (15): containerRef, coreFeatures, EASE_SMOOTH, fadeUp, heroOpacity, parallaxY, prefersReduced, processSteps (+7 more)

### Community 10 - "Community 10"

Cohesion: 0.17
Nodes (10): containerRef, [isHovered, setIsHovered], isIcon, mount, parent, rippleIdRef, [ripples, setRipples], SHADER_COLOR_BACK (+2 more)

### Community 11 - "Community 11"

Cohesion: 0.22
Nodes (5): AuthContext, googleProvider, useAuth(), ChallengeNotificationToast(), MeetInviteNotificationToast()

### Community 12 - "Community 12"
_Unable to determine domain due to missing code entities._
Cohesion: 0.22
Nodes (7): active, [isCollapsed, setIsCollapsed], navItems, pathname, saved, toggleCollapse, { user, signOutUser }

### Community 13 - "Community 13"
_Unable to determine domain due to missing code entities._
Cohesion: 0.25
Nodes (4): inter, metadata, outfit, viewport

### Community 14 - "Community 14"
_Unable to determine domain due to missing code entities._
Cohesion: 0.29
Nodes (5): isActive, navLinks, pathname, [signingIn, setSigningIn], { user, loading, signInWithGoogle }

### Community 15 - "Community 15"
_Unable to determine domain due to missing code entities._
Cohesion: 0.33
Nodes (5): containerVariants, isMountedRef, router, spinnerVariants, { user, loading }

### Community 16 - "Community 16"
_Unable to determine domain due to missing code entities._
Cohesion: 0.67
Nodes (5): extractPrintableStrings(), extractTextFromDocx(), extractTextFromPdf(), parseFileBuffer(), sanitizeText()

### Community 17 - "Community 17"
_Unable to determine domain due to missing code entities._
Cohesion: 0.4
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

### Community 18 - "Community 18"
_Unable to determine domain due to missing code entities._
Cohesion: 0.4
Nodes (4): app, auth, db, firebaseConfig

### Community 19 - "Community 19"
_Unable to determine domain due to missing code entities._
Cohesion: 0.5
Nodes (1): metadata

### Community 20 - "Community 20"
_Unable to determine domain due to missing code entities._
Cohesion: 0.67
Nodes (1): ICE_SERVERS

### Community 21 - "Community 21"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (1): orbs

### Community 24 - "Community 24"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

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

## Knowledge Gaps
- **258 isolated node(s):** `inter`, `outfit`, `viewport`, `EASE_SMOOTH`, `fadeUp` (+253 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 21`** (2 nodes): `page.tsx`, `StudyMeetRoomPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `loading.tsx`, `SkeletonPulse()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `orbs`, `BackgroundCanvas.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `useStudyTimer.ts`, `useStudyTimer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `cn.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `loading.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `Providers.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.