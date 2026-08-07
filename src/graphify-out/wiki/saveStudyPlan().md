# saveStudyPlan()

> God node · 4 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\db.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/firebase/db.ts#L78)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as saveStudyPlan()
    participant P1 as sendMessage()
    participant P2 as pushToast
    participant P3 as handleKeyDown()
    participant P4 as userPlansCollection()
    participant P5 as getStudyPlans()
    participant P6 as fetchPlans()
    participant P7 as loadTopics()
    participant P8 as handleSaveToFirestore()
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
    P4->>+ P0: calls
    P0-->>- P4: return
    P4->>+ P5: calls
    P5-->>- P4: return
    P5->>+ P4: calls
    P4-->>- P5: return
    P5->>+ P6: calls
    P6-->>- P5: return
    P5->>+ P7: calls
    P7-->>- P5: return
    P0->>+ P8: calls
    P8-->>- P0: return
    P8->>+ P0: calls
    P0-->>- P8: return
```

## Connections by Relation

### calls
- [[sendMessage()]] `INFERRED`
- [[userPlansCollection()]] `EXTRACTED`
- [[handleSaveToFirestore()]] `INFERRED`

### contains
- [[db.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*