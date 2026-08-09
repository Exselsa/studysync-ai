# POST()

> God node · 20 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-plan\route.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/app/api/study-plan/route.ts#L7)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as POST()
    participant P1 as normalizeStudyPlanData()
    participant P2 as saveStudyPlan()
    participant P3 as userPlansCollection()
    participant P4 as updateStudyPlanTasks()
    participant P5 as handleToggleTask
    participant P6 as generateTaskId()
    participant P7 as parseFileBuffer()
    participant P8 as extractTextFromDocx()
    participant P9 as match
    participant P10 as extractPrintableStrings()
    participant P11 as sanitizeText()
    participant P12 as buildFallbackResponse()
    participant P13 as buildFallback()
    participant P14 as buildFallbackExplanation()
    participant P15 as formData
    participant P16 as uploadPdfToGemini()
    participant P17 as analyzePdfDocument()
    participant P18 as generateStudyPlanFromPdfUri()
    participant P19 as buildFallbackExplanation()
    participant P20 as buildFallbackStudyPlan()
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
    P4->>+ P5: calls
    P5-->>- P4: return
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
    P8->>+ P10: calls
    P10-->>- P8: return
    P7->>+ P11: calls
    P11-->>- P7: return
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
    P0->>+ P17: calls
    P17-->>- P0: return
    P0->>+ P18: calls
    P18-->>- P0: return
    P0->>+ P19: calls
    P19-->>- P0: return
    P0->>+ P20: calls
    P20-->>- P0: return
```

## Connections by Relation

### calls
- [[normalizeStudyPlanData()]] `INFERRED`
- [[parseFileBuffer()]] `INFERRED`
- [[buildFallbackResponse()]] `EXTRACTED`
- [[buildFallback()]] `EXTRACTED`
- [[buildFallbackExplanation()]] `EXTRACTED`
- [[formData]] `INFERRED`
- [[uploadPdfToGemini()]] `INFERRED`
- [[analyzePdfDocument()]] `INFERRED`
- [[generateStudyPlanFromPdfUri()]] `INFERRED`
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
- [[route.ts]] `EXTRACTED`
- [[route.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*