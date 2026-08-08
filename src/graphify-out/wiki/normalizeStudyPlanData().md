# normalizeStudyPlanData()

> God node · 5 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\normalizeStudyPlan.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/normalizeStudyPlan.ts#L61)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as normalizeStudyPlanData()
    participant P1 as POST()
    participant P2 as parseFileBuffer()
    participant P3 as extractTextFromPdf()
    participant P4 as extractTextFromDocx()
    participant P5 as sanitizeText()
    participant P6 as buildFallbackResponse()
    participant P7 as offsetDate()
    participant P8 as buildFallback()
    participant P9 as buildFallbackExplanation()
    participant P10 as buildFallbackExplanation()
    participant P11 as buildFallbackStudyPlan()
    participant P12 as saveStudyPlan()
    participant P13 as updateStudyPlanTasks()
    participant P14 as generateTaskId()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P2->>+ P5: calls
    P5-->>- P2: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P6: calls
    P6-->>- P1: return
    P6->>+ P1: calls
    P1-->>- P6: return
    P6->>+ P7: calls
    P7-->>- P6: return
    P1->>+ P8: calls
    P8-->>- P1: return
    P8->>+ P1: calls
    P1-->>- P8: return
    P1->>+ P9: calls
    P9-->>- P1: return
    P9->>+ P1: calls
    P1-->>- P9: return
    P1->>+ P10: calls
    P10-->>- P1: return
    P1->>+ P11: calls
    P11-->>- P1: return
    P0->>+ P12: calls
    P12-->>- P0: return
    P0->>+ P13: calls
    P13-->>- P0: return
    P0->>+ P14: calls
    P14-->>- P0: return
```

## Connections by Relation

### calls
- [[POST()]] `INFERRED`
- [[saveStudyPlan()]] `INFERRED`
- [[updateStudyPlanTasks()]] `INFERRED`
- [[generateTaskId()]] `EXTRACTED`

### contains
- [[normalizeStudyPlan.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*