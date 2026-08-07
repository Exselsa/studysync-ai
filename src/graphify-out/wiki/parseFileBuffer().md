# parseFileBuffer()

> God node · 5 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\utils\file-parser.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/utils/file-parser.ts#L15)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as parseFileBuffer()
    participant P1 as POST()
    participant P2 as buildFallbackResponse()
    participant P3 as offsetDate()
    participant P4 as buildFallback()
    participant P5 as buildFallbackExplanation()
    participant P6 as buildFallbackStudyPlan()
    participant P7 as extractTextFromDocx()
    participant P8 as extractPrintableStrings()
    participant P9 as extractTextFromPdf()
    participant P10 as sanitizeText()
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
    P1->>+ P5: calls
    P5-->>- P1: return
    P5->>+ P1: calls
    P1-->>- P5: return
    P1->>+ P6: calls
    P6-->>- P1: return
    P6->>+ P1: calls
    P1-->>- P6: return
    P0->>+ P7: calls
    P7-->>- P0: return
    P7->>+ P0: calls
    P0-->>- P7: return
    P7->>+ P8: calls
    P8-->>- P7: return
    P8->>+ P7: calls
    P7-->>- P8: return
    P8->>+ P9: calls
    P9-->>- P8: return
    P0->>+ P9: calls
    P9-->>- P0: return
    P0->>+ P10: calls
    P10-->>- P0: return
```

## Connections by Relation

### calls
- [[POST()]] `INFERRED`
- [[extractTextFromDocx()]] `EXTRACTED`
- [[extractTextFromPdf()]] `EXTRACTED`
- [[sanitizeText()]] `EXTRACTED`

### contains
- [[file-parser.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*