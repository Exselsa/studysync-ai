# userPlansCollection()

> God node · 3 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\db.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/firebase/db.ts#L65)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as userPlansCollection()
    participant P1 as getStudyPlans()
    participant P2 as fetchPlans()
    participant P3 as loadTopics()
    participant P4 as saveStudyPlan()
    participant P5 as sendMessage()
    participant P6 as pushToast
    participant P7 as handleKeyDown()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P1->>+ P3: calls
    P3-->>- P1: return
    P3->>+ P1: calls
    P1-->>- P3: return
    P0->>+ P4: calls
    P4-->>- P0: return
    P4->>+ P5: calls
    P5-->>- P4: return
    P5->>+ P4: calls
    P4-->>- P5: return
    P5->>+ P6: calls
    P6-->>- P5: return
    P5->>+ P7: calls
    P7-->>- P5: return
    P4->>+ P0: calls
    P0-->>- P4: return
```

## Connections by Relation

### calls
- [[getStudyPlans()]] `EXTRACTED`
- [[saveStudyPlan()]] `EXTRACTED`

### contains
- [[db.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*