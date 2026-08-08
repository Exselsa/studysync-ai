# getStudyPlans()

> God node · 4 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\db.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/firebase/db.ts#L99)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as getStudyPlans()
    participant P1 as userPlansCollection()
    participant P2 as saveStudyPlan()
    participant P3 as handleSaveToFirestore()
    participant P4 as fetchPlans()
    participant P5 as loadTopics()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P0->>+ P4: calls
    P4-->>- P0: return
    P4->>+ P0: calls
    P0-->>- P4: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P5->>+ P0: calls
    P0-->>- P5: return
```

## Connections by Relation

### calls
- [[userPlansCollection()]] `EXTRACTED`
- [[fetchPlans()]] `INFERRED`
- [[loadTopics()]] `INFERRED`

### contains
- [[db.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*