// ============================================================
// T-45C DATA FILE
// Follow the same editing conventions as data/t6b/data.js
// ============================================================

const T45C = {
  aircraft: "T-45C",
  fullName: "T-45C Goshawk",
  role: "Strike / Jet Training",
  color: "#ff6b35",

  docs: [
    {
      id: "natops-t45c",
      shortName: "NATOPS",
      fullName: "NATOPS Flight Manual — T-45C Goshawk",
      pubNumber: "A1-T45CA-NFM-000",
      type: "NATOPS",
      url: "",
      description: "Primary authority for T-45C aircraft systems, limitations, and emergency procedures."
    },
    {
      id: "fti-strike",
      shortName: "FTI Strike",
      fullName: "Flight Training Instruction — Strike Primary",
      pubNumber: "CNATRA P-825",
      type: "FTI",
      url: "",
      description: "Procedures and standards for the strike primary phase of jet training."
    },
    {
      id: "cq-supplement",
      shortName: "CQ Supplement",
      fullName: "CQ Procedures & LSO Grading Criteria",
      pubNumber: "NATOPS CQ Supplement",
      type: "Supporting",
      url: "",
      description: "Carrier qualification procedures, FCLP standards, and LSO grading criteria."
    },
    {
      id: "acm-guide",
      shortName: "ACM Guide",
      fullName: "Air Combat Maneuvering Guide",
      pubNumber: "CNATRA P-830",
      type: "Supporting",
      url: "",
      description: "BFM/ACM fundamentals, weapons employment, and tactical maneuvering standards."
    },
    {
      id: "fti-instruments-jet",
      shortName: "FTI Instruments",
      fullName: "Flight Training Instruction — Jet Instruments",
      pubNumber: "CNATRA P-826",
      type: "FTI",
      url: "",
      description: "Instrument procedures for jet training, high-altitude ops, and RNAV." 
    }
  ],

  syllabusPhases: [
    {
      phase: "Strike Primary",
      events: [
        { code: "SP-4100", name: "Familiarization 1",     type: "Dual", hours: "1.0", description: "Cockpit familiarization, engine start, takeoff and landing, traffic pattern." },
        { code: "SP-4101", name: "Familiarization 2",     type: "Dual", hours: "1.0", description: "Area familiarization, visual maneuvers, basic aircraft handling." },
        { code: "SP-4110", name: "Contact 1",             type: "Dual", hours: "1.0", description: "Basic aircraft control, aerobatics intro, area confidence maneuvers." },
        { code: "SP-4111", name: "Contact 2",             type: "Solo", hours: "1.0", description: "Solo area work — apply contact maneuvers independently." },
        { code: "SP-4120", name: "Formation 1",           type: "Dual", hours: "1.0", description: "Basic wing, fingertip, route, tactical formation — join-up and breakout." },
        { code: "SP-4121", name: "Formation 2",           type: "Dual", hours: "1.0", description: "Formation instrument, lead changes, fingertip breakout to IMC procedures." },
        { code: "SP-4130", name: "Instruments 1",         type: "Dual", hours: "1.2", description: "Instrument procedures, precision approaches, airways navigation." },
        { code: "SP-4131", name: "Instruments 2",         type: "Dual", hours: "1.2", description: "Non-precision approaches, GPS, high-altitude procedures." }
      ]
    },
    {
      phase: "Carrier Qualification",
      events: [
        { code: "CQ-4200", name: "FCLP 1",   type: "Dual", hours: "1.0", description: "Field carrier landing practice — groove, on-speed AOA, wires, bolter procedures." },
        { code: "CQ-4201", name: "FCLP 2",   type: "Dual", hours: "1.0", description: "FCLP with signal corrections, LSO grades review." },
        { code: "CQ-4202", name: "FCLP 3",   type: "Solo", hours: "1.0", description: "Solo FCLP — demonstrate consistent on-speed, on-glidepath passes." },
        { code: "CQ-4210", name: "CQ Day",   type: "Dual", hours: "1.5", description: "Carrier qualification — day arrested landings and catapult shots." },
        { code: "CQ-4211", name: "CQ Night", type: "Dual", hours: "1.5", description: "Night carrier qualification — night arrested landings and catapult shots." }
      ]
    },
    {
      phase: "Tactics",
      events: [
        { code: "T-4300", name: "BFM 1 — Offensive",  type: "Dual", hours: "1.0", description: "Basic fighter maneuvering — offensive BFM, guns employment, tracking." },
        { code: "T-4301", name: "BFM 2 — Defensive",  type: "Dual", hours: "1.0", description: "Defensive BFM, neutralize attacks, maneuvering to neutral." },
        { code: "T-4310", name: "Section Tactics 1",   type: "Dual", hours: "1.0", description: "Section offense/defense, mutual support, deconfliction." }
      ]
    }
  ],

  discussionItems: [
    // ── SYSTEMS ──
    {
      id: "t45c-sys-001",
      category: "Systems",
      question: "Describe the T-45C hydraulic system: number of independent systems, what each system powers, and what flight controls are affected by a complete HYD 1 or HYD 2 failure.",
      syllabusEvents: ["SP-4100", "SP-4101"],
      sourceRefs: [
        { docId: "natops-t45c", location: "Chapter 2 — Hydraulic System", note: "Know what each system powers and the backup for flight-critical surfaces." }
      ]
    },
    {
      id: "t45c-sys-002",
      category: "Systems",
      question: "Describe the T-45C fuel system: tank locations, usable fuel, feed sequence, and the indications of an imbalance or fuel asymmetry condition.",
      syllabusEvents: ["SP-4100"],
      sourceRefs: [
        { docId: "natops-t45c", location: "Chapter 2 — Fuel System" }
      ]
    },
    {
      id: "t45c-sys-003",
      category: "Systems",
      question: "Describe the T-45C environmental control system (ECS): bleed air source, pressurization schedule, and cockpit indications of a pressurization failure.",
      syllabusEvents: ["SP-4100"],
      sourceRefs: [
        { docId: "natops-t45c", location: "Chapter 2 — Environmental Control System" }
      ]
    },
    {
      id: "t45c-sys-004",
      category: "Systems",
      question: "Describe the Adour engine: engine type, number of stages, and the purpose of the PCL (power control lever). What happens to thrust if bleed air is extracted at MIL power?",
      syllabusEvents: ["SP-4100", "SP-4101"],
      sourceRefs: [
        { docId: "natops-t45c", location: "Chapter 2 — Propulsion System / Adour Engine", note: "Note how bleed extraction affects EGT and thrust." }
      ]
    },
    // ── CARRIER QUALIFICATION ──
    {
      id: "t45c-cq-001",
      category: "Carrier Qualification",
      question: "Describe on-speed AOA for the T-45C: the indexer indications, the on-speed airspeed at typical landing weight, and how weight change affects on-speed airspeed.",
      syllabusEvents: ["CQ-4200", "CQ-4201", "CQ-4202", "CQ-4210"],
      sourceRefs: [
        { docId: "cq-supplement", location: "FCLP / CQ — AOA and Airspeed section" },
        { docId: "natops-t45c", location: "Chapter 4 — Normal Landing / On-Speed AOA" }
      ]
    },
    {
      id: "t45c-cq-002",
      category: "Carrier Qualification",
      question: "Describe the groove: entry point, altitude, lineup corrections in close, and the common LSO grade deficiencies for 'high in close' and 'low in close.'",
      syllabusEvents: ["CQ-4200", "CQ-4201", "CQ-4202"],
      sourceRefs: [
        { docId: "cq-supplement", location: "FCLP Procedures — The Groove / LSO Grades" }
      ]
    },
    {
      id: "t45c-cq-003",
      category: "Carrier Qualification",
      question: "Describe the wave-off: when the LSO issues a wave-off, what are the required pilot actions and the minimum altitude to comply? What is a mandatory wave-off condition?",
      syllabusEvents: ["CQ-4200", "CQ-4201", "CQ-4210", "CQ-4211"],
      sourceRefs: [
        { docId: "cq-supplement", location: "Wave-Off Criteria and Procedures" },
        { docId: "natops-t45c", location: "Chapter 4 — Carrier Landing Procedures / Wave-Off" }
      ]
    },
    {
      id: "t45c-cq-004",
      category: "Carrier Qualification",
      question: "Describe the catapult shot sequence: hookup, weight board, tension signal, go signal, and pilot actions at end-stroke. What is the minimum flyaway speed?",
      syllabusEvents: ["CQ-4210", "CQ-4211"],
      sourceRefs: [
        { docId: "cq-supplement", location: "Catapult Procedures" },
        { docId: "natops-t45c", location: "Chapter 4 — Catapult Launch" }
      ]
    },
    {
      id: "t45c-cq-005",
      category: "Carrier Qualification",
      question: "Describe the bolter procedure: throttle position at wire crossing, power application timing, and initial climb-out. Why is proper power application timing critical in the night environment?",
      syllabusEvents: ["CQ-4200", "CQ-4201", "CQ-4210", "CQ-4211"],
      sourceRefs: [
        { docId: "cq-supplement", location: "Bolter Procedure" },
        { docId: "natops-t45c", location: "Chapter 4 — Bolter / Touch-and-Go" }
      ]
    },
    // ── EMERGENCY ──
    {
      id: "t45c-emer-001",
      category: "Emergency",
      question: "Describe the T-45C engine failure / fire boldface. When would you elect to eject vs. attempt a field landing following an engine failure?",
      syllabusEvents: ["SP-4100", "SP-4101"],
      sourceRefs: [
        { docId: "natops-t45c", location: "Chapter 3 — Engine Failure / Fire (BOLDFACE)" },
        { docId: "fti-strike", location: "Emergency Procedures — Ejection decision criteria" }
      ]
    },
    {
      id: "t45c-emer-002",
      category: "Emergency",
      question: "Describe the ejection envelope for the Martin-Baker ejection seat in the T-45C. What are the no-eject parameters, and what is the minimum speed for a zero-altitude ejection?",
      syllabusEvents: ["SP-4100"],
      sourceRefs: [
        { docId: "natops-t45c", location: "Chapter 3 — Ejection Seat / Escape System", note: "Know the envelope diagram parameters." }
      ]
    },
    {
      id: "t45c-emer-003",
      category: "Emergency",
      question: "Describe the hydraulic failure emergency procedure. If HYD 1 fails on final approach to the boat, what systems are degraded and can you continue to an arrested landing?",
      syllabusEvents: ["CQ-4210", "CQ-4211"],
      sourceRefs: [
        { docId: "natops-t45c", location: "Chapter 3 — Hydraulic System Failure" },
        { docId: "cq-supplement", location: "Abnormal / Emergency procedures at the boat" }
      ]
    },
    // ── LIMITATIONS ──
    {
      id: "t45c-lim-001",
      category: "Limitations",
      question: "State the T-45C airspeed limitations: Vne, Vmo/Mmo, Va, Vlo, Vle, and maximum crosswind for arrested landing. How do these differ from FCLP limits?",
      syllabusEvents: ["SP-4100", "CQ-4200"],
      sourceRefs: [
        { docId: "natops-t45c", location: "Chapter 5 — Airspeed Limitations" },
        { docId: "cq-supplement", location: "Operating Limits for FCLP / CQ" }
      ]
    },
    {
      id: "t45c-lim-002",
      category: "Limitations",
      question: "Describe the T-45C fuel bingo, joker, and emergency fuel states. How are bingo profiles computed and what are the assumptions made?",
      syllabusEvents: ["SP-4130", "SP-4131", "CQ-4210"],
      sourceRefs: [
        { docId: "natops-t45c", location: "Chapter 7 — Flight Planning / Fuel Planning", note: "Reference the bingo profile computation method." },
        { docId: "fti-strike", location: "Fuel states and bingo planning" }
      ]
    },
    // ── FORMATION ──
    {
      id: "t45c-form-001",
      category: "Formation",
      question: "Describe the visual references for fingertip/parade position in the T-45C: wingtip-to-canopy line, fore-aft position, and altitude reference off lead.",
      syllabusEvents: ["SP-4120", "SP-4121"],
      sourceRefs: [
        { docId: "fti-strike", location: "Formation chapter — Fingertip / Parade visual references" }
      ]
    },
    {
      id: "t45c-form-002",
      category: "Formation",
      question: "Describe the lost wingman procedure for the T-45C entering IMC in formation. What are the initial actions, calls, and separation geometry?",
      syllabusEvents: ["SP-4121"],
      sourceRefs: [
        { docId: "fti-strike", location: "Formation — Lost Wingman / IMC procedures" }
      ]
    },
    // ── BFM ──
    {
      id: "t45c-bfm-001",
      category: "BFM / Tactics",
      question: "Describe the control zone for offensive BFM: what it is, the geometry to achieve it, and how you sustain a tracking solution.",
      syllabusEvents: ["T-4300"],
      sourceRefs: [
        { docId: "acm-guide", location: "Offensive BFM — Control Zone geometry" }
      ]
    },
    {
      id: "t45c-bfm-002",
      category: "BFM / Tactics",
      question: "Describe the break turn for defensive BFM: entry timing relative to the attack, G loading, and the objective of the initial defensive turn.",
      syllabusEvents: ["T-4301"],
      sourceRefs: [
        { docId: "acm-guide", location: "Defensive BFM — Break Turn" }
      ]
    }
  ],

  boldface: [
    {
      id: "t45c-bf-001",
      title: "ENGINE FAILURE IN FLIGHT",
      warning: "Steps must be memorized verbatim. Verify against current NATOPS revision.",
      steps: [
        "PCL — IDLE",
        "LANDING SPOT — SELECT",
        "AIRSPEED — BEST GLIDE",
        "MAYDAY — TRANSMIT",
        "EJECT (if unable to make suitable landing area)"
      ]
    },
    {
      id: "t45c-bf-002",
      title: "ENGINE FIRE IN FLIGHT",
      warning: "Steps must be memorized verbatim. Verify against current NATOPS revision.",
      steps: [
        "PCL — OFF",
        "FIRE HANDLE — PULL",
        "AGENT SWITCH — PUSH",
        "EJECT (if fire continues)"
      ]
    },
    {
      id: "t45c-bf-003",
      title: "HYDRAULIC SYSTEM FAILURE",
      warning: "Steps must be memorized verbatim. Verify against current NATOPS revision.",
      steps: [
        "HYD PRESSURE — CONFIRM LOSS",
        "CROSS-TRANSFER VALVE — OPEN (if applicable)",
        "LANDING GEAR — EMERGENCY EXTEND",
        "DIVERT to nearest suitable field",
        "ARRESTED LANDING — PLAN"
      ]
    },
    {
      id: "t45c-bf-004",
      title: "CABIN PRESSURIZATION FAILURE",
      warning: "Steps must be memorized verbatim. Verify against current NATOPS revision.",
      steps: [
        "OXYGEN MASK — ON, 100%",
        "DESCENT — INITIATE, maintain 6,000 ft/min or max available",
        "LEVEL OFF at 10,000 ft MSL (or MEA if higher)",
        "PRESSURIZATION CONTROLS — CHECK / RESET",
        "DIVERT if unable to pressurize"
      ]
    }
  ]
};
