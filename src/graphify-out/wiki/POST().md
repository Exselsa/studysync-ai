# POST()

> God node · 15 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/app/api/study-materials/parse/route.ts#L14)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as POST()
    participant P1 as parseFileBuffer()
    participant P2 as extractTextFromPdf()
    participant P3 as match
    participant P4 as extractPrintableStrings()
    participant P5 as extractTextFromDocx()
    participant P6 as sanitizeText()
    participant P7 as normalizeStudyPlanData()
    participant P8 as saveStudyPlan()
    participant P9 as updateStudyPlanTasks()
    participant P10 as generateTaskId()
    participant P11 as buildFallbackResponse()
    participant P12 as buildFallback()
    participant P13 as buildFallbackExplanation()
    participant P14 as formData
    participant P15 as buildFallbackExplanation()
    participant P16 as buildFallbackStudyPlan()
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
    P1->>+ P5: calls
    P5-->>- P1: return
    P5->>+ P1: calls
    P1-->>- P5: return
    P5->>+ P3: calls
    P3-->>- P5: return
    P5->>+ P4: calls
    P4-->>- P5: return
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
    P7->>+ P9: calls
    P9-->>- P7: return
    P7->>+ P10: calls
    P10-->>- P7: return
    P0->>+ P11: calls
    P11-->>- P0: return
    P0->>+ P12: calls
    P12-->>- P0: return
    P0->>+ P13: calls
    P13-->>- P0: return
    P0->>+ P14: calls
    P14-->>- P0: return
    P0->>+ P15: calls
    P15-->>- P0: return
    P0->>+ P16: calls
    P16-->>- P0: return
```

## Connections by Relation

### calls
- [[parseFileBuffer()]] `INFERRED`
- [[normalizeStudyPlanData()]] `INFERRED`
- [[buildFallbackResponse()]] `EXTRACTED`
- [[buildFallback()]] `EXTRACTED`
- [[buildFallbackExplanation()]] `EXTRACTED`
- [[formData]] `INFERRED`
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