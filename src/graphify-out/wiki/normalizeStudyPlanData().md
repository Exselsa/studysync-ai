# normalizeStudyPlanData()

> God node · 5 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\normalizeStudyPlan.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/normalizeStudyPlan.ts#L61)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as normalizeStudyPlanData()
    participant P1 as POST()
    participant P2 as parseFileBuffer()
    participant P3 as extractTextFromDocx()
    participant P4 as sanitizeText()
    participant P5 as buildFallbackResponse()
    participant P6 as offsetDate()
    participant P7 as buildFallback()
    participant P8 as buildFallbackExplanation()
    participant P9 as formData
    participant P10 as uploadPdfToGemini()
    participant P11 as analyzePdfDocument()
    participant P12 as generateStudyPlanFromPdfUri()
    participant P13 as buildFallbackExplanation()
    participant P14 as buildFallbackStudyPlan()
    participant P15 as saveStudyPlan()
    participant P16 as updateStudyPlanTasks()
    participant P17 as generateTaskId()
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
    P5->>+ P6: calls
    P6-->>- P5: return
    P1->>+ P7: calls
    P7-->>- P1: return
    P7->>+ P1: calls
    P1-->>- P7: return
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
    P1->>+ P13: calls
    P13-->>- P1: return
    P1->>+ P14: calls
    P14-->>- P1: return
    P0->>+ P15: calls
    P15-->>- P0: return
    P0->>+ P16: calls
    P16-->>- P0: return
    P0->>+ P17: calls
    P17-->>- P0: return
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