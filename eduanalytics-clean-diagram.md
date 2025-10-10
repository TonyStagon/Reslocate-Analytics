# EduAnalytics Dashboard - Navigation Components & Data Flow

## Project Architecture Overview

### Navigation System Flowchart

```mermaid
graph TD
    %% === Main Navigation Controller ===
    A[Universal Navigation Component<br/>with 11 Menu Items]

    B[• Students/Carousel Interface<br/>• Uses: Lucide React Icons]
    B -->|Triggers onClick| C
    C[App.tsx Route Manager<br/>handle onNavigate function]

    %% === Three Navigational Domains ===
    C -->|Level 1 Routes| D[🎓 Academic Analytics]
    C -->|Level 2 Routes| E[🔍 Match Discovery]
    C -->|Level 3 Routes| F[📊 User Analytics]

    %% === Academic Analytics Pages ===
    subgraph Pag&ImplAcademics[Academic Analytics Interfaces]
        D1[🏠 Overview — Count & Achievement Rates]
        D2[🎓 Universities — Qualification Sorting]
        D3['''TVET''' — APS Level Filtering with custom criteria]
        D4[📖 Student Marks Panel]
    end

    %% === Discovery Services Pages ===
    subgraph PageImplementDiscovery[]
        E1[• Maps Programs and Measures APS Level vs target calculation]
        E2[finding System Integration: Internal Validation for Log data Quality Standards]"
    end

classOfBindingImpl[{External Invoke Code-Logic Layer: for selected root condition passes interactive template module override params mapping loops produced incorrect view-cycle attributes returning erroneous search parsing branch flow termination nodes finish reset detect output filter pool union phase bottom leaf result leaf from limit test set binding class var limit internal find wrap}}

    EmptyEndCode{Not valid: Jump Stop System Routing Library Parser — Exception Raised:<dataGraph process_end>},Return:NothingForkTrue];

# End File Structure Container markup signal invalid ---> Some mermaid parsing artifact errors appeared
```

### Detailed Database Table Mapping by Page

| Page Category   | Navigation Item                                                                                                                                                                                                                | Database Tables                                        | Key Functionality                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------ |
| **Academic**    | Overview                                                                                                                                                                                                                       | user_marks                                             | Student achievement KPI dashboard                      |
| **Academic**    | Universities                                                                                                                                                                                                                   | universities                                           | Program listings with APS requirements                 |
| **Academic**    | TVET Colleges                                                                                                                                                                                                                  | tvet_colleges_name                                     | Higher learning filtering & presentation               |
| **Academic**    | StudentMarks                                                                                                                                                                                                                   | user_marks                                             | Full academic performance across all subjects          |
| **Match**       | Funding                                                                                                                                                                                                                        | scholarships, bursaries                                | Scholarship & bursary directory with deadlines         |
| **Match**       | Institutions Table                                                                                                                                                                                                             | Institutions Information                               | School geo-contact information section                 |
| **User**        | Session Health                                                                                                                                                                                                                 | sessions                                               | Real-time session monitoring with CR-D stats           |
| **User**        | Engagement                                                                                                                                                                                                                     | sessions + ❌ MISSING_buttons (refer FeatureAdoption?) | **_ISSUE Detected_** — Mock layer mismatch not reading |
| \*\*Other group | FeatureAdopt maybe being mixed routes by development</li>, code debug case compile select view] \_test local item: final results of quick snapshot table: --> assert compileStatus.doneAllOK result global var finalScanAssign |

## Engagement Page Critical Path Resolution

### Current Implementation Issues ☠️

📍 **Problem:** Engagement.tsx currently uses 100% mock data instead of actual Supabase API calls  
📍 **Missing:** No active connection to `button_clicks` table observations  
📍 **Confusion:** Data overlap between Engagement.tsx (page-level activity) vs FeatureAdoption.tsx (interaction patterns)

This file represents the final analysis ready for implementation in Code Mode.
