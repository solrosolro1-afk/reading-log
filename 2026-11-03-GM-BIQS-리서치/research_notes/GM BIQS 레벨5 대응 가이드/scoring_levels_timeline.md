# GM BIQS Scoring, Level Determination (Levels 0–5 / "Sourceability Level") and a New Supplier's Realistic Path to Level 5

Provenance tags used throughout: **(a)** official or near-official GM document (GM CSR / GM Scorecard guides that GM publishes for certification bodies on iatfglobaloversight.org); **(a-)** an unofficial copy of a GM-internal document (Scribd / PDFCoffee / iDoc / supplier-hosted), where the version cannot be verified; **(b)** secondary source (consultant blog, supplier manual, news); **(c)** forum post or anecdote. Research date: 2026-11-03.

**How the sources were accessed:** WebFetch and curl were blocked by the session network policy for iatfglobaloversight.org, elsmar.com, ease.io and pdfcoffee.com (proxy returned 403 / ENOTFOUND). Every quote below therefore comes from search-engine extracts of those pages, not from reading the full documents. Garbled table extracts are flagged where they occur. Before anyone builds a training deck on the exact numbers, the current **GM 1927 17** (via SupplyPower) should be checked.

**Premise corrections (important for the report writer):**
1. **"GM 1927 03" is not the BIQS document.** GM 1927 03 is the *SQ Sub-Tier Supplier Management Statement of Requirements* (GM doc CG4355). The BIQS documents are GM 1927 36 (BIQS training material and element definitions), GM 1927 30 (BIQS assessment, now called the "Quality Management System Gap Assessment") and GM 1927 17 (SQ Processes & Measurement Procedure, which defines the levels and metrics).
2. **Since 2019 the BIQS Level is not calculated from the assessment score.** It is calculated purely from quality-performance metrics. Since 1 Jan 2023 GM calls it the **"Sourceability Level"**.
3. **"BIQS Level 1" is not an entry level.** Under the performance-based scheme, Levels 1–2 are *failing* levels. A new supplier with no receipts sits at **Level 0**. "BIQS-1" is the number of an *element* in the GM 1927 30 checklist, not a level.

---

## Q1. How individual BIQS elements are scored, who assesses, how often, and where the result is recorded

### Takeaway
Each element of the GM 1927 30 BIQS assessment is rated **Green / Yellow / Red** (no published point scale such as 0/1/2/3). GM SQEs used to run BIQS audits, but around 2019 GM reportedly stopped them. Today each **manufacturing DUNS site must complete a GM 1927 30 gap assessment every year itself**, using a competent auditor. The site uploads it to **SCMS** (Supplier Certification Management System) and must close gaps within 60 days. The assessment no longer feeds the Level.

### Cited Findings
**Document map**
- GM 1927 03 = "SQ Sub-Tier Supplier Management Statement of Requirements" (CG4355, rev 7 and rev 9 copies circulate). It names the GM 1927 30 gap assessment as the *recommended* tool for assessing a sub-tier supplier's quality system, "preferably performed by a qualified individual in the supplier management organization." (a-) — [CG4355 GM 1927 03 rev 9 (supplier-hosted)](https://mexico.autokabel.com/AutoKabelMX/FTP/Dropbox/Compras/DocumentosVarios/CG4355%20GM%201927%2003%20Sub%20Tier%20Supplier%20Management%20Statement%20of%20Requirements%20rev%209.pdf); [Scribd copy rev 7](https://www.scribd.com/document/738966095/1-2-CG4355-GM-1927-03-Sub-Tier-Supplier-Management-rev-7)
- GM 1927 36 is the BIQS training / element series. Titles include "GM 1927-36 Introduction and Foundational Elements of BIQS" and "GM 1927-36 Group A Elements". (a-) — [Scribd: GM 1927-36 Intro & Foundational Elements](https://www.scribd.com/document/481967216/GM-1927-36-Introduction-and-Foundational-Elements-of-BIQS); [Scribd: GM 1927-36 Group A Elements](https://www.scribd.com/document/555139077/GM-1927-36-Group-a-Elements)
- GM 1927 30 is the BIQS assessment / audit form. Versions seen: "BIQS Audit v7.0 2017-04-05", "BIQS Assessment Self Assessment 2019", "BIQS Supplier SelfAssessment rev 15.0 2020". (a-) — [iDoc: GM 1927-30 BIQS Audit v7.0 2017](https://idoc.pub/documents/gm-1927-30-biqs-audit-v70-2017-04-05-34wm3mgy0zl7); [PDFCoffee: 2019 self-assessment](https://pdfcoffee.com/gm-1927-30-biqs-assessment-self-assessment-2019-pdf-free.html); [Scribd: rev 15.0 2020](https://www.scribd.com/document/466005290/GM-1927-30-BIQS-Supplier-SelfAssessment-rev-15-0-2020-xlsx)
- GM 1927 17 = "SQ Processes and Measurement Procedure". The CSR says: "Organizations shall refer to the GM 1927 17 SQ Processes and Measurement Procedure, for metrics and status definitions." (a) — [GM CSR Jan 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/01/IATF-16949-GM-Customer-Specific-Requirements-January-2025.pdf)

**Element scoring**
- Each element is rated Green, Yellow or Red. The GM 1927 30 form defines them as follows. **Green**: "a mature, well-defined, quality system or process is in place, being followed/utilized as directed, and the system or process does not place GM at unnecessary risk." **Yellow**: the system "is in place, but is not followed/utilized as intended." **Red**: the system "is not evident, or the current system or process in place puts GM at significant risk." (a-) — [PDFCoffee: GM 1927 30 2019 self-assessment](https://pdfcoffee.com/gm-1927-30-biqs-assessment-self-assessment-2019-pdf-free.html)
- The form has fields for "BIQS Score", "BIQS Level" and counts of green / yellow / red elements. The extract does not show how those counts map to a score or level. Several versions of the form state "**BIQS 30 is not used to calculate BIQS Level score**". (a-) — [PDFCoffee 2019 form](https://pdfcoffee.com/gm-1927-30-biqs-assessment-self-assessment-2019-pdf-free.html); [Scribd rev 15.0 2020](https://www.scribd.com/document/466005290/GM-1927-30-BIQS-Supplier-SelfAssessment-rev-15-0-2020-xlsx)
- Number of elements (sources conflict):
  - "30 different elements" (versus 11 under the predecessor QSB). (b) — [Ease.io, 2018](https://www.ease.io/blog/what-auto-suppliers-need-to-know-about-new-gm-biqs/)
  - "29-element quality strategy". (b) — [Ease.io, 2016](https://www.ease.io/blog/three-key-gm-biqs-controls-every-organization-should-implement/)
  - "five major principles, a total of 29+2 clauses". (b) — [iNEWS (Chinese analysis)](https://inf.news/en/auto/04c5c4bf7c16d63b0126bbba6678a9e0.html)
  - Korean secondary summaries say QSB covered 11 elements and BIQS covers 29 or 30.
- "GM CSR training" material describes GM 1927 30 as "an assessment consisting of 30 elements of the GM manufacturing system" aligned with GMS, IATF 16949 and the CSRs. (a-/b) — [PDFCoffee: GM CSR Training](https://pdfcoffee.com/gm-csr-training-pdf-free.html)

**Who assesses and how often (old regime versus current)**
- In 2019 a Tier-1 supplier quoted a GM SQE email: GM "still uses BIQS… **no longer conduct BIQS audit, the audit score is eliminated from the SSE measure, the level of BIQS will be measure as stated in the bulletin**." This implies SQE-conducted audits had existed before. (c) — [Elsmar Cove: "GM BIQS level 5 requirements"](https://elsmar.com/elsmarqualityforum/threads/gm-biqs-level-5-requirements.76783/)
- Current requirement (GM CSR, Jan 2025):
  - The organization must complete a **GM 1927 30 gap assessment annually for each manufacturing DUNS location**.
  - The assessment must be performed by a **competent auditor**.
  - "The completed assessments shall be uploaded into the Supplier Certification Management System (SCMS) under the DUNS location".
  - "gaps shall be closed within 60 days from the assessment."
  - The same CSR references a "GM 1927 30 Quality Management System Gap assessment".
  (a) — [GM CSR Jan 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/01/IATF-16949-GM-Customer-Specific-Requirements-January-2025.pdf)
- A Mexican training provider runs a course titled "QMS Quality Management System GM 1927-30", which is consistent with the rename. (b) — [QIS Consultores](https://www.qis-consultores.com/event-details/qms-quality-management-system-gm-1927-30-7)

**Where results are recorded**
- The Level is shown on GM's **Sourceability Report**. In 2020 GM told certification bodies to "ignore the BIQS survey score and level on the Impact Detail Report or any other scorecard, commercial performance report, 6 panel, etc., **only use the BIQS level on the Sourceability Report**." (a) — [GM Scorecard Quick Reference Guide, Aug 2020](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2020/08/GM-Scorecard-quick-reference-guide6Aug2020.pdf); [GM Scorecard Screen Images, Aug 2020](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2020/08/GM-Scorecard-screen-images_6Aug2020.pdf)
- NBH, service disruptions and field actions are recorded in **SCMS Supplier Records**, not in SPPS records. The October 2025 scorecard guide covers the SCMS Supplier Records screen, the Sourceability Report, NBH / field-action details and the SPPS detail report. (a) — [GM Scorecard Screen Images, Oct 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/11/GM-Scorecard-screen-images_October2025.pdf)
- GM distributes GM 1927 17 and related documents through the **GM SupplyPower Document Library** (login required). (a) — [GM Scorecard Screen Images, Oct 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/11/GM-Scorecard-screen-images_October2025.pdf)

### Inferences
- The brief's options "0/1/2/3 points", "Not Implemented / Implemented / Sustained" and "% of requirements met" are **not supported** by any source found. The only documented scheme is the element-level Green/Yellow/Red rating.
- Today the GM 1927 30 assessment is a **compliance obligation** (annual, uploaded to SCMS, 60-day gap closure, and an IATF CB can check it). It is **not a lever for raising the Level**. A new supplier still has to do it: it is evidence of system maturity, and the SQE and the CB will look at it.
- GQTS (Global Quality Tracking System) was named in the brief. No current source tied the BIQS / Sourceability Level to GQTS; the current CSR points to SCMS and the Sourceability Report. GQTS may hold certificate data, but that is unverified.

### Gaps
- No public source gives a formula that turns green/yellow/red counts into a "BIQS Score" (the old SSE / scorecard input).
- No full, version-verified list of the 30 element titles was retrievable (see Q3).
- The share of GM 1927 30 assessments that are self-assessments versus SQE-witnessed today: no source found.

---

## Q2. How the Level (0–5) is calculated: metrics, windows and thresholds

### Takeaway
Since about May 2019 the Level is computed **only from quality performance** over rolling **6-month and 12-month windows**. The inputs are SPPS quality issues (normalized per million parts shipped in the 2019 table), **severity score**, **field actions**, **disruptions**, **IATF 16949 certification status**, and holds such as NBH. **Level 5 needs a clean 12-month record.** In 2019 that meant ≤1 SPPS per 1M parts shipped, 0 field actions, 0 disruptions and a near-zero severity score over 12 months. From 2020 Levels 5 and 4 allow *no* production-part rejections, field actions, disruptions or severity score. **Level 4 uses 6-month windows. Level 0 means no production receipts and no quality SPPS in the last 12 months.** The full current matrix sits in GM 1927 17 behind SupplyPower and was not retrievable.

### Cited Findings
**The switch from assessment-based to performance-based**
- A Tier-1 supplier's Level dropped **from 5 to 1 in May 2019 without notice**. The SQE explained that the BIQS audit score had been removed and that the Level is now measured "as stated in the bulletin". GM verbally conceded the CSR manual needed revising. (c) — [Elsmar Cove thread 76783](https://elsmar.com/elsmarqualityforum/threads/gm-biqs-level-5-requirements.76783/)
- GM 1927 30 forms: "BIQS 30 is not used to calculate BIQS Level score." (a-) — [PDFCoffee 2019 form](https://pdfcoffee.com/gm-1927-30-biqs-assessment-self-assessment-2019-pdf-free.html)

**2019 table (CSR May 2019; search extract partly garbled)**
- **Level 5**: "**1 SPPS/1 Million parts shipped in 12 Months**, **0 Field Action in 12 Months**, **0 Disruption in 12 Months**", a severity score of about "0.75 to 0" over 12 months (garbled), and IATF 16949 certified. (a, garbled extract) — [GM CSR May 2019](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2019/05/IATF-16949-GM-CSR-May-2019.pdf)
- **Level 4**: appears to include "**0 Field Action in 6 Months**" and "**0 Disruption in 6 Months**". The SPPS threshold could not be confirmed. (a, garbled) — [GM CSR May 2019](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2019/05/IATF-16949-GM-CSR-May-2019.pdf)

**2020 table "2020 Quality Performance Requirements (BIQS Levels)"**
- "Key changes for 2020 include **more stringent criteria for BIQS Levels 5 and 4 with no allowed production part rejections, field actions, disruptions or severity scores**. A **new BIQS Level 0** was added for suppliers who have not shipped parts in over a year." (a-) — [Scribd: 2020 QPR BIQS Levels](https://www.scribd.com/document/466005233/2020-Quality-Performance-Requirements-BIQS-Levels-1-pdf); [PDFCoffee copy](https://pdfcoffee.com/2020-quality-performance-requirements-biqs-levels-pdf-pdf-free.html)
- Lower-level criteria in the 2020 table (garbled extract; the column could not be confirmed, but these appear to be what drops a supplier to Level 3 or below): "1 Field Action in 6 Months", "> 1 Disruption in 6 Months", "**≥25 Severity Score in 6 Months**", "**Not Certified IATF 16949**". (a-, garbled) — [PDFCoffee copy](https://pdfcoffee.com/2020-quality-performance-requirements-biqs-levels-pdf-pdf-free.html)
- The **2021** requirements were "unchanged" from 2020. The 2021 document repeats that Level 0 identifies suppliers with no production parts supplied in over 12 months. (a-) — [Scribd: 2021 BIQS requirements](https://www.scribd.com/document/658582610/2021-BIQS-requirements)

**Severity score**
- "The severity rating is explained in a matrix in GM 1927 17 SQ Processes and Measurements Procedure", and the score is "the sum of the severity scores for all issues over 6 months". (a) — [GM CSR Dec 2020](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2020/12/IATF-16949-GM-CSR-Dec-2020.pdf); [GM Scorecard Screen Images Aug 2020](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2020/08/GM-Scorecard-screen-images_6Aug2020.pdf)

**Level 3 floor (anecdote)**
- A supplier received an IATF major finding for "**loss of BIQS Level 3 (more than 6 SPPS in 6 months)**". (c) — [Elsmar Cove thread 77943](https://elsmar.com/elsmarqualityforum/threads/received-a-major-finding-during-iatf-surveillance-audit-for-loss-of-biqs-level-3-more-than-6-spps-in-6-months-how-should-we-address-systemic-ca.77943/)

**Level 0 / not rated**
- "BIQS Level 0 – With no production receipts nor any quality SPPS records in the last 12 months." Level 0 is exempt from the below-Level-3 nonconformance. (a) — [GM CSR Dec 2020](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2020/12/IATF-16949-GM-CSR-Dec-2020.pdf)
- The same rule carries over as "Sourceability Level 0 – With no production receipts nor any quality SPPS records in the last 12 months". (a) — [GM CSR Jan 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/01/IATF-16949-GM-Customer-Specific-Requirements-January-2025.pdf)

**Levels 1–2 meaning**
- "The GM system Sourceability Report will indicate a Sourceability Level of 1 or 2 for those organizations **not meeting the GM Quality Performance Requirements**." Older wording: "...a BIQS Level of 1 or 2 for those organizations not meeting the BIQS requirements." (a) — [GM CSR Jan 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/01/IATF-16949-GM-Customer-Specific-Requirements-January-2025.pdf); [GM CSR Dec 2020](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2020/12/IATF-16949-GM-CSR-Dec-2020.pdf)

**Current (Oct 2025) view**
- "Where a client has achieved **Sourceability level 5, 12 months of quality history** is shown."
- "If the Sourceability Level is 3, the CB auditor should use the SPPSs, disruptions or other records to inform the audit."
- (a) — [GM Scorecard Screen Images, Oct 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/11/GM-Scorecard-screen-images_October2025.pdf)
- Auditors are told to "prioritize **NBH, Yard Holds and higher Severity SPPSs**" in audit planning. (a) — [GM Scorecard QRG June 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/06/GM-Scorecard-quick-reference-guide_June-2025.pdf)
- Scorecard inputs listed for CBs: disruptions, nonconformity incidents (SPPS), field actions, and the Level from the Sourceability Report. (a) — [GM Scorecard QRG Aug 2020](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2020/08/GM-Scorecard-quick-reference-guide6Aug2020.pdf)

**PRR (older metric)**
- The 2016 GM document computes PPM impact from PRRs: "Total all the weight factors of all the Quality PRR's received in the last 6 months for that plant." Supplier-initiated PRRs and supplier alerts are excluded. This was a PPM / scorecard metric, not the Level calculation. (a, dated 2016) — [GM CSR ISO/TS 16949, Oct 2016](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2016/12/GM-Customer-Specifics-Requirements-ISO-TS-16949-26Oct2016-1.pdf)

**Controlled Shipping**
- From the Dec 2022 revision, **CS II became a "performance indicator" rather than a special status**. The organization must notify its CB within 5 business days of entering CS II, and the CB is not required to issue a nonconformance for CS II. The Oct 2025 CSR requires an assessment for each manufacturing DUNS with a Sourceability Level under 3. (a) — [GM CSR Jan 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/01/IATF-16949-GM-Customer-Specific-Requirements-January-2025.pdf); [GM CSR Oct 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/10/IATF-16949-GM-Customer-Specific-Requirements-October-2025.pdf); [simpleQuE summary](https://www.simpleque.com/general-motors-revises-iatf-16949customer-specific-requirements-effective-1-1-23/)

### Inferences
Reconstructed matrix, provisional (2020–2021 logic, assumed still the basis of the current QPR):

| Level | Indicative condition | Window |
|---|---|---|
| 5 | 0 quality SPPS (production-part rejections), 0 field actions, 0 disruptions, 0 severity score, IATF 16949 certified | 12 months |
| 4 | Same zero criteria | 6 months |
| 3 | Minimum acceptable level; some SPPS / severity allowed | 6 months |
| 1–2 | Fail QPR: e.g. ≥1 field action or >1 disruption in 6 months, severity ≥25 in 6 months, not IATF certified, NBH | 6 months |
| 0 | No receipts and no SPPS | 12 months |

Caveats on this matrix:
- Exactly which trigger maps to Level 1 versus Level 2 is **unconfirmed**.
- The Level 3 SPPS ceiling is unconfirmed. The forum anecdote implies more than 6 SPPS in 6 months loses Level 3.
- GM may have tightened the matrix after 2021. No 2022–2026 table was found.

Further inferences:
- **SPPS appears to have replaced PRR** as GM's problem-report system. The 2016 documents say "PRR", and the 2019+ documents say "SPPS". Korean press glosses SPPS as "부품품질시스템(SPPS)". This is an inference from the change in terminology.
- The brief also lists PPM/IPPM, launch performance and GP-12 status. Only **SPPS count/rate and severity, field actions, disruptions, NBH / yard holds and IATF certification** are documented as Level inputs. **No source ties GP-12 results, launch metrics or PPM directly to the Level.** But an SPPS raised during launch (including issues GM finds while the supplier is in GP-12) would count as an SPPS. This is an inference, not confirmed.

### Gaps
- The current (2023–2026) QPR table in GM 1927 17: whether the 2020 thresholds are unchanged, the exact Level 3 limit, and whether Level 5 is a strict 0 SPPS or a ppm-normalized limit. Not retrievable (SupplyPower login; the IATF-hosted PDFs were blocked from direct fetch).
- Whether "disruption" covers only GM plant disruptions (line stops, yard holds) or also service disruptions. The extract only says details are in SCMS.
- Whether supplier-initiated SPPS / supplier alerts are excluded from the Level count (they were excluded from the 2016 PRR-based PPM).

---

## Q3. What "BIQS Level 1" / "BIQS-1" / the new-supplier entry requirement actually consists of

### Takeaway
No source supports the idea of a "BIQS Level 1 entry package". **Level 1 is the lowest *failing* level** under the performance scheme. A brand-new site with no receipts is **Level 0**. **"BIQS-1" is element #1 of the GM 1927 30 checklist** (nonconforming material / material identification, per a 2017 copy). What is actually required at entry is IATF 16949 certification (third-party, under the GM CSR), the **annual GM 1927 30 QMS gap assessment uploaded to SCMS with gaps closed within 60 days**, and the APQP/PPAP deliverables in GM's SQ Statement of Requirements.

### Cited Findings
- Element numbering in the GM 1927-30 BIQS Audit v7.0 (2017-04-05) runs from **BIQS-1 ("nonconforming material and material identification")** to **BIQS-23 ("feedback and feedforward")**. Other elements include gage calibration & MSA, fast response / problem solving, standardized work, and a "Quality Focused Checks" element, possibly BIQS-10. The OCR scrambles some number-title pairs. (a-, garbled) — [iDoc: GM 1927-30 BIQS Audit v7.0](https://idoc.pub/documents/gm-1927-30-biqs-audit-v70-2017-04-05-34wm3mgy0zl7)
- The 2018 GM SQD Bulletin (GM 1927-36 2018-3, "BIQS Training & Assessment Update") says the BIQS elements were **reordered and renumbered under a new "BIQS House" structure** and the assessment was changed to match. Element numbers from before 2018 (such as the v7.0 list) are therefore not current. (a-) — [Scribd: GM SQD Bulletin 1927-36 2018-3](https://www.scribd.com/document/431576730/GM-SQD-Bulletin-1927-36-2018-3)
- Elements named as examples by a consultant: Layered Process Audit (frequency, schedule, findings, corrective action) and risk reduction through PFMEA. (b) — [Ease.io, 2016](https://www.ease.io/blog/three-key-gm-biqs-controls-every-organization-should-implement/)
- New-supplier and new-site timing in the older GM Supplier Quality Manual (GM 1927, 2018 rev 21):
  - The quality-system assessment applies **at APQP kick-off**.
  - A "**Greenfield**" site is defined as a new supplier facility built to support a program.
  - A 2012 GM launch document applies a gap analysis at **supplier gate review #1**.
  (a-, dated) — [PDFCoffee: GM 1927 SQM 2018 rev21](https://pdfcoffee.com/gm-1927-supplier-quality-manual-2018-rev21-pdf-free.html); [iDoc: GM 1927 Supplier Quality Manual](https://idoc.pub/documents/gm-1927-supplier-quality-manual-1d47me680m42)
- Current GM CSR: an annual GM 1927 30 gap assessment per manufacturing DUNS, by a competent auditor, uploaded to SCMS, gaps closed in 60 days. (a) — [GM CSR Jan 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/01/IATF-16949-GM-Customer-Specific-Requirements-January-2025.pdf)
- The 2016-era CSR said "Suppliers shall have BIQS or QSB certification", and its absence was written up as a major finding by the CB. This requirement is superseded. (a, dated 2016) — [GM CSR Oct 2016](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2016/12/GM-Customer-Specifics-Requirements-ISO-TS-16949-26Oct2016-1.pdf)
- A Korean supplier (청우) displays a BIQS certificate "GM1927-30 BIQS, 2016.12.11 등록". This shows that site certificates were issued in the assessment era. (b) — [청우 website](https://www.chungwoo-kor.com/?act=affiliates.page&pcode=sub3_2)
- GM's Supplier Quality Statement of Requirements (SQ SOR) has a 2023 update. Only a secondary upload was found. (a-) — [Studocu: SQ SOR 2023 Update](https://www.studocu.com/es-mx/document/escuela-industrial-y-preparatoria-tecnica-alvaro-obregon-uanl/tecnologia-de-informacion-y-comunicacion/actividaes-clases-2016/91301476)

### Inferences
- The brief's "BIQS Level 1 (GM 1927 30?, a subset of critical elements required for new suppliers before sourcing/PPAP)" probably mixes two things: "BIQS-1" (element 1) and GM's own plant-side BIQ Level 1. GM assembly plants are rated **BIQ Levels 1–5** by achieving the items at each level; for example, 한국GM 창원공장 received BIQ Level 4 per Korean press. That is a staircase model for GM plants and **does not apply to the supplier BIQS / Sourceability Level**. Inference based on [메트로신문 2019](https://www.metroseoul.co.kr/article/2019052400023).
- In practice the new supplier needs: (1) a valid IATF 16949 certificate; (2) a completed GM 1927 30 gap assessment covering all ~30 BIQS elements, with Red/Yellow gaps closed within 60 days and uploaded to SCMS; (3) APQP / PPAP / run-at-rate and GP-12 readiness. Only (1) feeds the Level directly. The rest are hygiene requirements that prevent SPPS.

### Gaps
- No current (post-2018 "BIQS House") element list with titles and numbers was retrievable. The 2020 rev 15.0 self-assessment exists on Scribd but could not be opened.
- No source defines a GM-mandated "critical subset of elements" for new sites before PPAP.

---

## Q4. Business consequences by level

### Takeaway
GM requires **Level 3, 4 or 5**. Dropping below 3 triggers mandatory CB notification within 5 business days. Older CSRs (2019–2022) then required a **major nonconformance and a special audit**. Since 2025 GM files a **performance complaint that starts the IATF certificate decertification process**. NBH (New Business Hold – Quality) requires certificate suspension. Level 5 is a precondition for, or strongly associated with, recognition such as GM Supplier of the Year and Supplier Quality Excellence awards. The name "Sourceability" signals that the Level drives sourcing eligibility, but no public text gives a minimum Level for quoting.

### Cited Findings
- "Organizations shall achieve and maintain BIQS Level of 3, 4 or 5. The organization whose BIQS Level falls below Level 3 shall notify its Certification Body within 5 business days." (a) — [GM CSR Dec 2020](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2020/12/IATF-16949-GM-CSR-Dec-2020.pdf)
- The 2025 wording is the same, using Sourceability Level. (a) — [GM CSR Jan 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/01/IATF-16949-GM-Customer-Specific-Requirements-January-2025.pdf)
- Older CSR (2019–2022 era) rules:
  - Failing to notify → minor NC against IATF 16949 clause 9.1.2.1.
  - Notified of, or discovers, Level 1 or 2 → "**major non-conformance against IATF 16949:2016, clause 9.1.2.1**" plus an on-site special audit.
  - Closure requires reaching Level 3+ or an action plan confirmed by the GM SQE.
  - "Organizations that have not had their initial IATF 16949 certification and are BIQS Level 1 or 2 shall not be issued a non-conformance."
  (a) — [GM CSR Dec 2020](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2020/12/IATF-16949-GM-CSR-Dec-2020.pdf); [GM Scorecard QRG Aug 2020](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2020/08/GM-Scorecard-quick-reference-guide6Aug2020.pdf); [SMR Appendix E GM CSR, 2020](https://www.smr-automotive.com/application/files/9116/0674/2393/Appendix_E-GM_CSR_R03.pdf)
- 2025 rule: below Level 3, "a **performance complaint will be submitted against the organization on behalf of GM**. The submission of the performance complaint will lead to the initiation of the **Certificate Decertification Process**." (a) — [GM CSR Jan 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/01/IATF-16949-GM-Customer-Specific-Requirements-January-2025.pdf)
- The Oct 2025 CSR (effective 30 Oct 2025) revised §9.1.2.1 on performance complaints and Sourceability Level, and added SPPS consideration to audit planning (§9.2.2.3). (a) — [IATF news, 14 Oct 2025](https://www.iatfglobaloversight.org/news/14-october-2025-gm-customer-specific-requirements-update/); [GM CSR Oct 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/10/IATF-16949-GM-Customer-Specific-Requirements-October-2025.pdf)
- "NBH Quality also requires certificate suspension per GM CSRs" (2020). "New Business Hold (NBH) requires certificate suspension per GM CSRs" (2025). (a) — [GM Scorecard QRG Aug 2020](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2020/08/GM-Scorecard-quick-reference-guide6Aug2020.pdf); [GM Scorecard QRG June 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/06/GM-Scorecard-quick-reference-guide_June-2025.pdf)
- Training material: "the minimum requirement is BIQS level 3". A consultant blog (2016/2018 era) says suppliers "must achieve a **Level III score or higher to be a certified supplier**". (a-/b) — [PDFCoffee: GM CSR training](https://pdfcoffee.com/gm-csr-training-pdf-free.html); [Ease.io 2018](https://www.ease.io/blog/what-auto-suppliers-need-to-know-about-new-gm-biqs/)
- Recognition:
  - 남선알미늄 (SM Group) was named GM Supplier of the Year (SOY) for the 15th consecutive year (announced June 2026). Korean press credits "**최근 1년간 부품품질시스템(SPPS) 이슈 0건**" and "**BIQS Level 5**" ("GM 품질평가시스템 최고등급"). SOY was given to 103 suppliers out of about 6,000 evaluated. (b) — [Seoul Economic Daily (EN), 2026-06-02](https://en.sedaily.com/finance/2026/06/02/namsun-aluminum-named-gm-supplier-of-the-year-for-15th); [헤럴드경제](https://biz.heraldcorp.com/article/10762102); [디지털데일리](https://www.ddaily.co.kr/page/view/2026060209361992987)
  - GM México recognized four suppliers that reached Level 5, "the highest category of the program", as quality excellence. (b) — [Cluster Industrial](https://clusterindustrial.com.mx/gm-mexico-reconoce-a-sus-proveedores-por-excelencia-en-calidad/)

### Inferences
- **Level 3 is the "license to operate"** (IATF certificate exposure). **Level 4/5 is the differentiator** for awards and probably for sourcing preference. The direct consequences are triggered by NBH, CS II, Level <3 and field actions.
- For a new supplier, a single SPPS during launch would reset Level 5 eligibility for 12 months (under the 2020 logic), because Level 5 requires zero SPPS in 12 months.

### Gaps
- No public text gives the minimum Level required to *quote* or be *awarded* new business (as opposed to keeping IATF certification). This is likely in GM's internal sourcing rules or the SQ SOR.
- No public list of eligibility criteria for the GM Supplier Quality Excellence Award or Supplier of the Year links them to an exact Level.

---

## Q5. Realistic timeline for a new, IATF-certified Korean supplier (sourced ~Nov 2026) to reach Level 5 by Jul–Aug 2027

### Takeaway
Level 5 cannot be "applied for" or earned through an audit. It is a **computed result of 12 months of clean GM quality history** (zero SPPS, field actions, disruptions and severity, plus IATF certified). Until the site has production receipts at GM it shows **Level 0**. So **Level 5 by Jul–Aug 2027 is realistic only if the site is already shipping production parts to GM** (on another program, or with an SOP well before mid-2027) **and has zero quality SPPS/severity**. Whether the system shows Level 5 before 12 months of receipts have built up is undocumented and needs SQE confirmation. If SOP for the newly sourced part is after Q1 2027, the realistic target is to **avoid Level 1–2 and reach Level 3/4 at launch, with Level 5 about 12 months after SOP if the record stays clean**.

### Cited Findings
- Level 0 = "no production receipts nor any quality SPPS records in the last 12 months". (a) — [GM CSR Jan 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/01/IATF-16949-GM-Customer-Specific-Requirements-January-2025.pdf)
- For a client at Sourceability Level 5, the CB view shows 12 months of quality history. (a) — [GM Scorecard Screen Images, Oct 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/11/GM-Scorecard-screen-images_October2025.pdf)
- 2019 Level 5 criteria: 12-month windows (≤1 SPPS / 1M parts, 0 field action, 0 disruption in 12 months). From 2020, Levels 4/5 allow zero rejections, field actions, disruptions or severity. (a / a-) — [GM CSR May 2019](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2019/05/IATF-16949-GM-CSR-May-2019.pdf); [Scribd 2020 QPR](https://www.scribd.com/document/466005233/2020-Quality-Performance-Requirements-BIQS-Levels-1-pdf)
- Exemption for new sites: under the old rules, organizations that have not had their initial IATF 16949 certification and are at Level 1 or 2 are not issued an NC. The brief's supplier already holds IATF certification, so this exemption would not apply. (a) — [GM CSR Dec 2020](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2020/12/IATF-16949-GM-CSR-Dec-2020.pdf)

**Case examples**
- **Exo-s, Querétaro (Mexico)**: plant in Querétaro since 2014. It reportedly became **the first GM Mexico supplier at BIQS Level 5 in May 2018**, so about 4 years after the plant opened. One article says GM granted it after two weeks of audits, including visits from Detroit management. That was in the assessment era, before the 2019 performance-only switch. (b) — [PT México](https://www.pt-mexico.com/articulos/exo-s-y-la-formula-detrs-de-un-proveedor-de-gm-biqs-nivel-5); [Mexico Industry](https://mexicoindustry.com/hecho-en-mexico/exo-s-transforma-el-plastico-en-aplicaciones-especializadas); [ProMéxico Industry](https://www.promexicoindustry.com/en/article/exo-s-manufactures-plastic-parts-for-the-automotive-industry)
- **대지오토모티브 (Daeji Automotive)**: "GM(K) BIQS Level-4 certified" (2019–2020 profile). (b) — [Korea Parts Info](https://koreapartsinfo.com/2020/01/14/daeji-auto/)
- **코아비스 (Koavis)**: a 2022 article reports its 10th GM "올해의 우수 협력사" award. A search summary says the company claims "국내 최초 GM BIQS Level 5", but the year was not confirmed. (b, partially unverified) — [스포츠월드 2022-04-05](https://www.sportsworldi.com/newsView/20220405517788)
- **남선알미늄**: Level 5 plus 0 SPPS over 1 year, SOY 2026. This is a long-established GM Korea supplier, not a new one. (b) — [Seoul Economic Daily](https://en.sedaily.com/finance/2026/06/02/namsun-aluminum-named-gm-supplier-of-the-year-for-15th)

### Inferences
- **The binding constraint is the 12-month window, not effort.** No audit, self-assessment score or BIQS training can raise the Level after 2019. The levers are: (1) zero quality SPPS, and SPPS severity kept at 0; (2) zero GM disruptions or yard holds; (3) zero field actions; (4) keeping the IATF certificate valid; (5) never entering NBH or CS II.
- **Scenario A** (site already ships production parts to GM, or SOP of the new part by about Q4 2026–Q1 2027): with zero SPPS, the site can plausibly show Level 4 after 6 clean months and Level 5 after 12 clean months. If the rolling window counts months without receipts as "clean", Level 5 could appear earlier. That is undocumented and must be confirmed with the GM SQE.
- **Scenario B** (SOP after about Apr 2027): at Jul–Aug 2027 the site will most likely be **Level 0** (no receipts) or hold only a few months of history. **Level 5 by Jul–Aug 2027 is then very unlikely.** The more realistic milestone is Level 5 about 12 months after SOP, with zero SPPS through launch and GP-12.
- **The highest risk is the launch phase.** GP-12 / early production containment exists because launch defects are common. Any SPPS GM raises during launch (receiving rejects, line issues) would block Level 5 for 12 months under the 2020+ zero-tolerance rule.
- **Recommended positioning for the guide:** define the Jul–Aug 2027 goal as "Level 5-ready" rather than "Level 5 displayed". That means all GM 1927 30 elements Green and uploaded to SCMS, 0 SPPS since first shipment, 0 disruptions, and the IATF certificate maintained. State plainly that the displayed Level depends on GM's 12-month window.

### Gaps
- The algorithm for new sites with fewer than 12 months of receipts: does the system move straight from Level 0 to Level 5 if there are no SPPS, or does it need a minimum history or volume? (The 2019 ppm-normalized criterion "1 SPPS / 1M parts" suggests volume mattered at one time.) No source found. **Ask the GM SQE.**
- Whether GP-12 internal catches (found by the supplier, not GM) create SPPS: no source found.
- No public case of a new supplier reaching Level 5 within 12 months of SOP under the post-2019 rules was found. LinkedIn content was not reachable through search.
- The supplier's actual SOP / PPAP dates were not provided in the brief. The answer depends on them.

---

## Q6. Changes in the scoring logic, 2016–2026

### Takeaway
There have been five shifts:
1. **2016**: BIQS replaces QSB (11 → about 30 elements); the Level was assessment-based.
2. **2018**: "BIQS House" renumbering.
3. **May 2019**: the assessment score is dropped and the Level becomes performance-only.
4. **2020**: zero-tolerance Levels 4/5 and a new Level 0; 2021 unchanged.
5. **1 Jan 2023**: renamed "Sourceability Level" / "GM Quality Performance Requirements"; CS II becomes a performance indicator. Then **2025**: below Level 3 triggers a GM performance complaint and IATF decertification process. **Oct 2025**: §9.1.2.1 revised and SPPS-based audit planning added.

### Cited Findings
- **2016**: GM introduced BIQS to replace QSB. Korean sources say January 2016, 11 → 29 elements. Ease.io says 30 elements. (b) — [Ease.io 2016](https://www.ease.io/blog/three-key-gm-biqs-controls-every-organization-should-implement/); [Ease.io 2018](https://www.ease.io/blog/what-auto-suppliers-need-to-know-about-new-gm-biqs/)
- **2018**: the GM SQD bulletin 1927-36 2018-3 reordered and renumbered elements under the "BIQS House" and updated the assessment. (a-) — [Scribd](https://www.scribd.com/document/431576730/GM-SQD-Bulletin-1927-36-2018-3)
- **2019**: the audit score was eliminated from the SSE measure and Levels were recalculated from performance. A supplier went from Level 5 to Level 1 in May 2019. (c) — [Elsmar 76783](https://elsmar.com/elsmarqualityforum/threads/gm-biqs-level-5-requirements.76783/). The May 2019 CSR table shows 12-month criteria for Level 5. (a) — [GM CSR May 2019](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2019/05/IATF-16949-GM-CSR-May-2019.pdf)
- **2020**: stricter Levels 5/4 (zero rejections, field actions, disruptions, severity) and Level 0 added. **2021** unchanged. (a-) — [Scribd 2020](https://www.scribd.com/document/466005233/2020-Quality-Performance-Requirements-BIQS-Levels-1-pdf); [Scribd 2021](https://www.scribd.com/document/658582610/2021-BIQS-requirements)
- **Dec 2022 revision (effective 1/1/2023)**: "Replaced BIQS Requirements with GM Quality Performance Requirements and BIQS Level with Sourceability Level." BIQS levels "will now be called sourceability levels, but will still be viewed on the sourceability report." CS II changed from special status to performance indicator. (a/b) — [GM CSR Jan 2023](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2022/12/IATF-16949-GM-CSR-Jan-2023.pdf); [simpleQuE](https://www.simpleque.com/general-motors-revises-iatf-16949customer-specific-requirements-effective-1-1-23/)
- **Aug 2023** CSR revision exists (details not extracted). (a) — [GM CSR Aug 2023](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2023/08/IATF-16949-GM-CSR-Aug-2023.pdf)
- A supplier flow-down from Feb 2024 mirrors the GM CSR. (b) — [SMR Appendix E R05 2024](https://www.smr-automotive.com/application/files/9317/0721/1560/Appendix_E-GM_CSR.pdf)
- **Jan 2025 / Mar 2025**: below Level 3 → performance complaint → certificate decertification process; annual GM 1927 30 QMS gap assessment uploaded to SCMS. (a) — [GM CSR Jan 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/01/IATF-16949-GM-Customer-Specific-Requirements-January-2025.pdf); [GM CSR Mar 2025 (CN mirror)](https://iatfglobaloversight.org.cn/wp-content/uploads/2025/02/IATF-16949-GM-Customer-Specific-Requirements-March-2025.pdf)
- **Oct 2025** (effective 30 Oct 2025): §9.1.2.1 changed (performance complaints / Sourceability Level) and §9.2.2.3 added SPPS consideration to audit planning. The Oct 2025 scorecard guide refers to the current QPR in GM 1927 17. (a) — [IATF news 14 Oct 2025](https://www.iatfglobaloversight.org/news/14-october-2025-gm-customer-specific-requirements-update/); [GM Scorecard Screen Images Oct 2025](https://www.iatfglobaloversight.org/wp/wp-content/uploads/2025/11/GM-Scorecard-screen-images_October2025.pdf)

### Inferences
- In current GM and IATF documents, the "BIQS Level" now survives mainly as industry and Korean shorthand ("BIQS Level 5"). Korean news in 2026 still uses "BIQS Level 5". The official term is **Sourceability Level**, and a training guide should present both.
- The trend from 2019 to 2025 is toward **harsher consequences** (major NC, then decertification process) and **heavier use of SPPS data in IATF audits**. The cost of a launch SPPS for a new supplier has therefore gone up.

### Gaps
- No 2026 GM CSR revision was found in search results. Whether anything changed between Nov 2025 and Nov 2026 is unknown.
- The current GM 1927 17 revision number, date and Level table were not found (SupplyPower only).
