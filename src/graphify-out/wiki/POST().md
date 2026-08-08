# POST()

> God node · 13 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/app/api/study-materials/parse/route.ts#L14)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as POST()
    participant P1 as parseFileBuffer()
    participant P2 as extractTextFromPdf()
    participant P3 as extractPrintableStrings()
    participant P4 as extractTextFromDocx()
    participant P5 as sanitizeText()
    participant P6 as buildFallbackResponse()
    participant P7 as offsetDate()
    participant P8 as buildFallback()
    participant P9 as buildFallbackExplanation()
    participant P10 as buildFallbackExplanation()
    participant P11 as buildFallbackStudyPlan()
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
    P1->>+ P4: calls
    P4-->>- P1: return
    P4->>+ P1: calls
    P1-->>- P4: return
    P4->>+ P3: calls
    P3-->>- P4: return
    P1->>+ P5: calls
    P5-->>- P1: return
    P5->>+ P1: calls
    P1-->>- P5: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P6->>+ P0: calls
    P0-->>- P6: return
    P6->>+ P7: calls
    P7-->>- P6: return
    P7->>+ P6: calls
    P6-->>- P7: return
    P0->>+ P8: calls
    P8-->>- P0: return
    P0->>+ P9: calls
    P9-->>- P0: return
    P0->>+ P10: calls
    P10-->>- P0: return
    P0->>+ P11: calls
    P11-->>- P0: return
```

## Connections by Relation

### calls
- [[parseFileBuffer()]] `INFERRED`
- [[buildFallbackResponse()]] `EXTRACTED`
- [[buildFallback()]] `EXTRACTED`
- [[buildFallbackExplanation()]] `EXTRACTED`
- [[buildFallbackExplanation()]] `INFERRED`
- [[buildFallbackStudyPlan()]] `INFERRED`

### contains
- [[route.ts]] `EXTRACTED`
- [[route.ts]] `EXTRACTED`
- [[route.ts]] `EXTRACTED`
- [[route.ts]] `EXTRACTED`
- [[route.ts]] `EXTRACTED`
- [[route.ts]] `EXTRACTED`
- [[route.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*