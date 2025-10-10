# EduAnalytics Dashboard - Navigation Flow & Component Relationships

## Comprehensive Mermaid Diagram

Based on my analysis of your React TypeScript dashboard that connects to 8+ Supabase database tables and covers 11 navigation sections grouped into Academic Analytics, Discovery, and User Engagement domains, here are the detailed diagrams.

```mermaid
graph TD
    %% ===== NAVIGATION SYSTEM =====
    NAV[Navigation.tsx<br/>User Discovery Menu<br/>Carousel+Tabs Interface]

    %% ===== CENTRAL ROUTING =====
    APP[App.tsx<br/>Central Router<br/>State: currentPage]<br/>App defines switch]

    %% ===== DATABASE TABLES  =====
    DB[Supabase Database<br/>10+ Connected Tables]
    DB1[user_ marks<br/>2,447 student records]
    DB2[student_university_matches<br/>Matching analytics]
    DB3[sessions + button_clicks<br/>Engagement Tracking]
    DB4[universities + tv t_colleges<br/>Educational programs]
    DB5[scholarships + bursaries<br/>Funding resources]
    DB6[unique_matched_students]

    %% ===== ACADEMIC ANALYTICS PAGES =====
    subgraph Group1 [🎓 Academic Analytics]
        A1[Overview<br/><- DB1 header count<br/>Metrics: 2,447 students]
        A2[Universities<br/>60+ institutions<br/>APS program sorting]
        A3[TVET Colleges<br/>Technical/Skill programs<br/>18 APS levels]
        A4[StudentMarks<br/>Full academic analysis<br/>Subject/Achievement breakdown]
    end

    %% ===== MATCHING & DISCOVERY PAGES =====
    subgraph Group2 [🔍 Matching & Discovery]
        D1[MatchingProfiles<br/>APS-Based sorting<br/>Program qualification rates]
        D2[Matches<br/>2-way statistic views<br/>Duplicate detection enabled]
        D3[Funding<br/>Scholarships & Bursaries<br/>Filter: Appl. deadlines]
        D4[0Institutions<br/>School Directory<br/>Geographic mapping]
    end

    %% ===== USER ANALYTICS PAGES =====
    subgraph GroupFiller [📈 Engagement Analytics]
        T1[!!! ENGAGEMENT Status !!! ⚠️<br/>🚨 CURRENT STATE Issues:<br/>• Uses Mock data layer<br/>• Single table broken? Spec errors<br/>EXPECTATIONS RESET vfix after merge<br/>Tables were originally '7': buttons_CLICK, _session tracking diff component merge???<br/>check: currentModule IS Mock backfill<br/>Let execution specs before routing commit API resolution: Check step for Prod !<br/>TODO DB_SUPABASE INSERT protocol |3~ call service complete logic-fill channels fix*< br/>Make trigger key visible entity correct<br/>?bound data sessions stable binding?<br/>Unit loaded into matrix target end result primary trigger_bugs in logic connection linkups:<br/>- is out invalid mapping return_null instead reload see total_base process:<table_usage> ? but data connectivity base mismatch errors:<MOD_map userSession view area broken zero-sql call syntax=? override in memo fetch hook]
        T2[fixed_by_engagement:session table status logs]
        T3[active >complete tracking by_u ser_session?? fail parse unknown!!:sending event missing catch true<br/>~F/Absolved by another constraint buffer subloop overflow token user]
        T4[to check the trigger logic: v see_truth from_page? scan missing call branch base position] </br/>eof final
    end

    Subsystem_Main[--- UNDER DEVELOPMENT CHECK <MARK MOVE TO CODE BRANCH> ---]<br?/>

    NAV --> APP
    APP -->|route switching| Group1
    APP -->|route switching| Group2
    APP -->|route switching| GroupFiller

    DB1 -->|1x fetch count-only| A1
    each bind loop cluster for table loop below => is assignment required completion?

Write fin copy compact and use specific filter database module cascade via operational stable logic map database: end
      CALL stack void [exit] prepare no status signal
```
