# saveStudyPlan()

> God node · 4 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\db.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/firebase/db.ts#L242)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as saveStudyPlan()
    participant P1 as sanitizeStudyPlan()
    participant P2 as normalizePlanTasks()
    participant P3 as userPlansCollection()
    participant P4 as getStudyPlans()
    participant P5 as fetchPlans()
    participant P6 as loadTopics()
    participant P7 as handleSaveToFirestore()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P0->>+ P3: calls
    P3-->>- P0: return
    P3->>+ P0: calls
    P0-->>- P3: return
    P3->>+ P4: calls
    P4-->>- P3: return
    P4->>+ P3: calls
    P3-->>- P4: return
    P4->>+ P5: calls
    P5-->>- P4: return
    P4->>+ P6: calls
    P6-->>- P4: return
    P0->>+ P7: calls
    P7-->>- P0: return
    P7->>+ P0: calls
    P0-->>- P7: return
```

## Connections by Relation

### calls
- [[sanitizeStudyPlan()]] `EXTRACTED`
- [[userPlansCollection()]] `EXTRACTED`
- [[handleSaveToFirestore()]] `INFERRED`

### contains
- [[db.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*