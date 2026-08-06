# Graph Report - C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src  (2026-08-06)

## Corpus Check
- 27 files · ~53,996 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 240 nodes · 254 edges · 20 communities detected
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `POST()` - 5 edges
2. `EASE` - 4 edges
3. `{ user }` - 4 edges
4. `sendMessage()` - 4 edges
5. `handleAttack()` - 4 edges
6. `getStudyPlans()` - 4 edges
7. `sendFriendRequest()` - 4 edges
8. `RESPONSE_SCHEMA` - 3 edges
9. `SYSTEM_INSTRUCTION` - 3 edges
10. `buildFallbackResponse()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `sendMessage()` --calls--> `saveStudyPlan()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\dashboard\tutor\page.tsx → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\db.ts
- `fetchPlans()` --calls--> `getStudyPlans()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\components\BossFightArena.tsx → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\db.ts
- `handleAttack()` --calls--> `submitDuelAnswer()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\components\BossFightArena.tsx → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\friends.ts
- `handleAttack()` --calls--> `commitDuelEvaluation()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\components\BossFightArena.tsx → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\friends.ts
- `ChallengeNotificationToast()` --calls--> `useAuth()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\components\friends\ChallengeNotificationToast.tsx → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\contexts\AuthContext.tsx

## Communities

### Community 0 - "Community 0"

Cohesion: 0.06
Nodes (34): [aiInsights, setAiInsights], containerVariants, dateString, [deleteConfirm, setDeleteConfirm], dismissToast, displayName, [displayName, setDisplayName], EASE (+26 more)

### Community 1 - "Community 1"

Cohesion: 0.05
Nodes (32): [animPhase, setAnimPhase], [attackText, setAttackText], [battleLog, setBattleLog], BOSS_MAX_HP, [bossHp, setBossHp], [combo, setCombo], [currentQuestion, setCurrentQuestion], DEFAULT_CS_CONCEPTS (+24 more)

### Community 2 - "Community 2"

Cohesion: 0.07
Nodes (25): [activeTab, setActiveTab], [addEmail, setAddEmail], [addLoading, setAddLoading], [addStatus, setAddStatus], [challengeFriend, setChallengeFriend], [challengeId, setChallengeId], [customTopic, setCustomTopic], DEFAULT_CS_TOPICS (+17 more)

### Community 3 - "Community 3"

Cohesion: 0.09
Nodes (14): handleAttack(), handleKeyDown(), acceptFriendRequest(), commitDuelEvaluation(), findUserByEmail(), removeFriendRelationship(), saveUserProfile(), sendFriendRequest() (+6 more)

### Community 4 - "Community 4"

Cohesion: 0.09
Nodes (18): accent, avgPct, cardVariants, circ, [collapsed, setCollapsed], completedCount, dash, doneTasks (+10 more)

### Community 5 - "Community 5"

Cohesion: 0.15
Nodes (12): containerRef, coreFeatures, EASE_SMOOTH, fadeUp, heroOpacity, parallaxY, prefersReduced, processSteps (+4 more)

### Community 6 - "Community 6"

Cohesion: 0.17
Nodes (10): containerRef, [isHovered, setIsHovered], isIcon, mount, parent, rippleIdRef, [ripples, setRipples], SHADER_COLOR_BACK (+2 more)

### Community 7 - "Community 7"

Cohesion: 0.18
Nodes (7): AuthContext, googleProvider, useAuth(), ChallengeNotificationToast(), active, DashboardSidebar(), navItems

### Community 8 - "Community 8"

Cohesion: 0.38
Nodes (7): buildFallback(), buildFallbackResponse(), FALLBACK_QUESTIONS, offsetDate(), POST(), RESPONSE_SCHEMA, SYSTEM_INSTRUCTION

### Community 9 - "Community 9"

Cohesion: 0.25
Nodes (4): inter, metadata, outfit, viewport

### Community 10 - "Community 10"

Cohesion: 0.29
Nodes (5): isActive, navLinks, pathname, [signingIn, setSigningIn], { user, loading, signInWithGoogle }

### Community 11 - "Community 11"

Cohesion: 0.33
Nodes (5): containerVariants, isMountedRef, router, spinnerVariants, { user, loading }

### Community 12 - "Community 12"
_Unable to determine domain due to missing code entities._
Cohesion: 0.47
Nodes (5): fetchPlans(), getStudyPlans(), saveStudyPlan(), userPlansCollection(), loadTopics()

### Community 13 - "Community 13"
_Unable to determine domain due to missing code entities._
Cohesion: 0.4
Nodes (4): app, auth, db, firebaseConfig

### Community 14 - "Community 14"
_Unable to determine domain due to missing code entities._
Cohesion: 0.5
Nodes (1): metadata

### Community 15 - "Community 15"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Community 16"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (1): orbs

### Community 17 - "Community 17"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **145 isolated node(s):** `inter`, `outfit`, `viewport`, `EASE_SMOOTH`, `fadeUp` (+140 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 15`** (2 nodes): `loading.tsx`, `SkeletonPulse()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (2 nodes): `orbs`, `BackgroundCanvas.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `cn.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `loading.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `Providers.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.