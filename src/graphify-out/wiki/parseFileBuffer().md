# parseFileBuffer()

> God node · 5 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\utils\file-parser.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/utils/file-parser.ts#L17)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as parseFileBuffer()
    participant P1 as POST()
    participant P2 as normalizeStudyPlanData()
    participant P3 as saveStudyPlan()
    participant P4 as updateStudyPlanTasks()
    participant P5 as generateTaskId()
    participant P6 as buildFallbackResponse()
    participant P7 as offsetDate()
    participant P8 as buildFallback()
    participant P9 as buildFallbackExplanation()
    participant P10 as formData
    participant P11 as buildFallbackExplanation()
    participant P12 as buildFallbackStudyPlan()
    participant P13 as extractTextFromPdf()
    participant P14 as extractTextFromDocx()
    participant P15 as sanitizeText()
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
    P2->>+ P4: calls
    P4-->>- P2: return
    P2->>+ P5: calls
    P5-->>- P2: return
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
    P1->>+ P12: calls
    P12-->>- P1: return
    P0->>+ P13: calls
    P13-->>- P0: return
    P0->>+ P14: calls
    P14-->>- P0: return
    P0->>+ P15: calls
    P15-->>- P0: return
```

## Connections by Relation

### calls
- [[POST()]] `INFERRED`
- [[extractTextFromPdf()]] `EXTRACTED`
- [[extractTextFromDocx()]] `EXTRACTED`
- [[sanitizeText()]] `EXTRACTED`

### contains
- [[file-parser.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*