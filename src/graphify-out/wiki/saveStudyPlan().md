# saveStudyPlan()

> God node · 4 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\db.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/firebase/db.ts#L46)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as saveStudyPlan()
    participant P1 as normalizeStudyPlanData()
    participant P2 as POST()
    participant P3 as parseFileBuffer()
    participant P4 as buildFallbackResponse()
    participant P5 as buildFallback()
    participant P6 as buildFallbackExplanation()
    participant P7 as buildFallbackExplanation()
    participant P8 as buildFallbackStudyPlan()
    participant P9 as updateStudyPlanTasks()
    participant P10 as handleToggleTask
    participant P11 as generateTaskId()
    participant P12 as userPlansCollection()
    participant P13 as handleSaveToFirestore()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P2->>+ P5: calls
    P5-->>- P2: return
    P2->>+ P6: calls
    P6-->>- P2: return
    P2->>+ P7: calls
    P7-->>- P2: return
    P2->>+ P8: calls
    P8-->>- P2: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P9: calls
    P9-->>- P1: return
    P9->>+ P1: calls
    P1-->>- P9: return
    P9->>+ P10: calls
    P10-->>- P9: return
    P1->>+ P11: calls
    P11-->>- P1: return
    P11->>+ P1: calls
    P1-->>- P11: return
    P0->>+ P12: calls
    P12-->>- P0: return
    P0->>+ P13: calls
    P13-->>- P0: return
```

## Connections by Relation

### calls
- [[normalizeStudyPlanData()]] `INFERRED`
- [[userPlansCollection()]] `EXTRACTED`
- [[handleSaveToFirestore()]] `INFERRED`

### contains
- [[db.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*