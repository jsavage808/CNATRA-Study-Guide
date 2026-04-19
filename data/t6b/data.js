// ============================================================
// T-6B DATA FILE
// HOW TO EDIT:
//   - syllabusPhases: add/remove phases and events
//   - discussionItems: each item has a question, category,
//     syllabusEvent code (links it to the syllabus), and
//     ONE or MORE sourceRefs (links it to documents)
//   - docs: list every publication students should reference
//   - boldface: emergency procedures — each step is one string
// ============================================================

const T6B = {
  aircraft: "T-6B",
  fullName: "T-6B Texan II",
  role: "Primary Training",
  color: "#00e5ff",

  // ── DOCUMENTS ──────────────────────────────────────────────
  // Add a URL if you host the PDF somewhere (e.g. GitHub LFS,
  // S3, Cloudflare R2). Leave url: "" if not hosted yet.
  docs: [
    {
      id: "natops-t6b",
      shortName: "NATOPS",
      fullName: "NATOPS Flight Manual — T-6B Texan II",
      pubNumber: "A1-T6BAA-NFM-000",
      type: "NATOPS",
      url: "",
      description: "Primary authority for aircraft systems, limitations, and emergency procedures."
    },
    {
      id: "fti-contact",
      shortName: "FTI Contact",
      fullName: "Flight Training Instruction — Contact",
      pubNumber: "CNATRA P-816",
      type: "FTI",
      url: "",
      description: "Procedures and standards for the contact phase of primary flight training."
    },
    {
      id: "fti-instruments",
      shortName: "FTI Instruments",
      fullName: "Flight Training Instruction — Instruments",
      pubNumber: "CNATRA P-817",
      type: "FTI",
      url: "",
      description: "Instrument procedures, approaches, and airways navigation standards."
    },
    {
      id: "fti-navigation",
      shortName: "FTI Navigation",
      fullName: "Flight Training Instruction — Navigation",
      pubNumber: "CNATRA P-818",
      type: "FTI",
      url: "",
      description: "Low-level navigation, cross-country planning, and night operations."
    },
    {
      id: "irc",
      shortName: "IRC",
      fullName: "Instrument Refresher Course",
      pubNumber: "CNATRA P-1025",
      type: "Supporting",
      url: "",
      description: "Refresher material for instrument currency and proficiency standards."
    }
  ],

  // ── SYLLABUS PHASES & EVENTS ────────────────────────────────
  // Each event has a unique `code`. Discussion items reference
  // this code in their `syllabusEvents` array to cross-link.
  syllabusPhases: [
    {
      phase: "Contact",
      events: [
        { code: "C-2001", name: "Familiarization 1", type: "Dual", hours: "1.2", description: "Area familiarization, basic aircraft control, local area orientation, traffic pattern introduction." },
        { code: "C-2002", name: "Familiarization 2", type: "Dual", hours: "1.2", description: "Basic maneuvers, traffic pattern, touch-and-go landings, aircraft handling qualities." },
        { code: "C-2003", name: "Familiarization 3", type: "Dual", hours: "1.2", description: "Transition maneuvers, stalls, spin awareness, emergency procedures review." },
        { code: "C-2010", name: "First Solo",        type: "Solo", hours: "0.8", description: "Solo traffic pattern and landings — first solo flight milestone." },
        { code: "C-2020", name: "Aerobatics 1",      type: "Dual", hours: "1.2", description: "Introduction to aerobatic maneuvers: loops, aileron rolls, lazy eights, chandelles." },
        { code: "C-2021", name: "Aerobatics 2",      type: "Dual", hours: "1.2", description: "Advanced aerobatics, cuban eights, cloverleafs, split-S." },
        { code: "C-2030", name: "Formation 1",       type: "Dual", hours: "1.2", description: "Basic wing position, join-up procedures, breakout and rendezvous." },
        { code: "C-2031", name: "Formation 2",       type: "Dual", hours: "1.2", description: "Route and cruise formation, lead changes, formation takeoff and landing." }
      ]
    },
    {
      phase: "Instruments",
      events: [
        { code: "I-2101", name: "Basic Instruments 1",    type: "Dual", hours: "1.4", description: "Instrument scan technique, attitude flying, partial panel, unusual attitude recovery." },
        { code: "I-2102", name: "Basic Instruments 2",    type: "Dual", hours: "1.4", description: "Precision approaches: ILS, LOC. Non-precision: VOR, NDB." },
        { code: "I-2110", name: "Airways Navigation 1",   type: "Dual", hours: "1.6", description: "VOR/TACAN airways, en-route navigation, holding patterns, ATC procedures." },
        { code: "I-2111", name: "Airways Navigation 2",   type: "Dual", hours: "1.6", description: "RNAV procedures, GPS approaches, complex clearances." },
        { code: "I-2120", name: "Instrument X-Country",   type: "Dual", hours: "2.0", description: "Cross-country under IFR, flight planning, filed flight plans, ATC coordination." }
      ]
    },
    {
      phase: "Navigation",
      events: [
        { code: "N-2201", name: "Low Level Navigation 1", type: "Dual", hours: "1.4", description: "Tactical low-level route, map reading, timing, course corrections, hazard avoidance." },
        { code: "N-2202", name: "Low Level Navigation 2", type: "Solo", hours: "1.4", description: "Solo low-level route — apply navigation techniques independently." },
        { code: "N-2210", name: "Night Navigation",       type: "Dual", hours: "1.4", description: "Night familiarization, night pattern, cross-country navigation, night illusions." }
      ]
    }
  ],

  // ── DISCUSSION ITEMS ────────────────────────────────────────
  // Each item:
  //   id           — unique string, used for deep-linking
  //   category     — groups items in the UI filter bar
  //   question     — the discussion item exactly as in the syllabus
  //   syllabusEvents — array of event codes this item applies to
  //   sourceRefs   — WHERE to find the answer. Each ref has:
  //                    docId    — matches a doc `id` above
  //                    location — chapter, section, page, or table
  //                    note     — optional hint about what to look for
  discussionItems: [
    // ── SYSTEMS ──
    {
      id: "t6b-sys-001",
      category: "Systems",
      question: "Describe the PT6A-68 engine oil system, normal oil pressure range, and indications of low oil pressure in flight.",
      syllabusEvents: ["C-2001", "C-2002"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 2 — Propulsion System", note: "See oil system schematic and limits table." }
      ]
    },
    {
      id: "t6b-sys-002",
      category: "Systems",
      question: "Explain the auto-feather system: arm conditions required, activation logic, and how to reset after an inadvertent actuation.",
      syllabusEvents: ["C-2001", "C-2002", "C-2003"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 2 — Propeller System / Auto-Feather", note: "Note the torque threshold and arm switch positions." }
      ]
    },
    {
      id: "t6b-sys-003",
      category: "Systems",
      question: "Describe the fuel system: tank arrangement, usable fuel quantity, unusable fuel, crossfeed capability, and fuel flow path.",
      syllabusEvents: ["C-2001", "C-2002"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 2 — Fuel System", note: "Reference fuel quantity table and system schematic." }
      ]
    },
    {
      id: "t6b-sys-004",
      category: "Systems",
      question: "Describe the electrical system: number of buses, generator output, battery endurance, and load-shedding priorities in the event of a generator failure.",
      syllabusEvents: ["C-2001", "C-2002"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 2 — Electrical System", note: "Pay attention to essential vs. non-essential bus items." }
      ]
    },
    {
      id: "t6b-sys-005",
      category: "Systems",
      question: "Describe the pressurization and bleed air system: normal cabin altitude, differential pressure limit, and what happens when pressurization is lost.",
      syllabusEvents: ["C-2001"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 2 — Environmental Control System", note: "Note the cabin altitude warning threshold." }
      ]
    },
    // ── LIMITATIONS ──
    {
      id: "t6b-lim-001",
      category: "Limitations",
      question: "What is the maximum demonstrated crosswind component for the T-6B? Is this a limitation or an operational consideration, and what is the distinction?",
      syllabusEvents: ["C-2001", "C-2002", "C-2003", "C-2010"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 5 — Operating Limitations", note: "Crosswind component table. Distinguish demonstrated vs. placarded limits." },
        { docId: "fti-contact", location: "Crosswind Procedures section", note: "Review the preferred technique and commander's discretion language." }
      ]
    },
    {
      id: "t6b-lim-002",
      category: "Limitations",
      question: "State the T-6B airspeed limitations: Vne, Vmo, Va, Vlo (gear operating), Vle (gear extended), and flap extension speeds.",
      syllabusEvents: ["C-2001", "C-2002", "C-2003"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 5 — Airspeed Limitations / Placard Speeds", note: "Memorize all bolded/placarded values." }
      ]
    },
    {
      id: "t6b-lim-003",
      category: "Limitations",
      question: "What are the T-6B G-load limitations (normal category and aerobatic category)? What factors reduce the structural limit load factor?",
      syllabusEvents: ["C-2020", "C-2021"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 5 — Structural Limits", note: "Note flap/gear-down limits vs. clean configuration." },
        { docId: "fti-contact", location: "Aerobatics chapter — G requirements and restrictions" }
      ]
    },
    {
      id: "t6b-lim-004",
      category: "Limitations",
      question: "Describe the torque, ITT, Ng, and prop RPM limits for takeoff power and maximum continuous power settings.",
      syllabusEvents: ["C-2001", "C-2002"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 5 — Engine Operating Limits / Power Assurance Check table" }
      ]
    },
    // ── EMERGENCY PROCEDURES ──
    {
      id: "t6b-emer-001",
      category: "Emergency",
      question: "Describe the engine fire on deck procedure. At what point would you NOT pull the fire T-handle, and why?",
      syllabusEvents: ["C-2001", "C-2002", "C-2003"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 3 — Engine Fire On Deck (BOLDFACE)", note: "Know all steps verbatim. Understand the logic behind each step." }
      ]
    },
    {
      id: "t6b-emer-002",
      category: "Emergency",
      question: "Describe the engine failure in flight boldface. What airspeed do you target, and what are the decision points for field landing vs. bailout?",
      syllabusEvents: ["C-2001", "C-2002", "C-2003"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 3 — Engine Failure In Flight (BOLDFACE)" },
        { docId: "fti-contact", location: "Emergency Procedures — decision altitude and bailout criteria" }
      ]
    },
    {
      id: "t6b-emer-003",
      category: "Emergency",
      question: "Describe the smoke and fumes elimination procedure. How do you differentiate between electrical smoke and an oil/fuel vapor smell?",
      syllabusEvents: ["C-2001", "C-2002"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 3 — Smoke and Fume Elimination", note: "Review the decision tree for source identification." }
      ]
    },
    {
      id: "t6b-emer-004",
      category: "Emergency",
      question: "Describe the emergency gear extension procedure. What are the indications of a successful emergency extension, and what does a single green light indicate?",
      syllabusEvents: ["C-2002", "C-2003"],
      sourceRefs: [
        { docId: "natops-t6b", location: "Chapter 3 — Emergency Gear Extension", note: "Know the handle location and the sequence of lights." }
      ]
    },
    // ── AEROBATICS ──
    {
      id: "t6b-aero-001",
      category: "Aerobatics",
      question: "Describe the entry parameters, g-onset rules, and altitude requirements for the loop. What common errors cause an asymmetrical loop?",
      syllabusEvents: ["C-2020", "C-2021"],
      sourceRefs: [
        { docId: "fti-contact", location: "Aerobatics chapter — Loop", note: "Pay attention to airspeed at the top and recovery altitude." }
      ]
    },
    {
      id: "t6b-aero-002",
      category: "Aerobatics",
      question: "Explain the difference between a aileron roll and a barrel roll. Describe the entry parameters and common errors for each.",
      syllabusEvents: ["C-2020", "C-2021"],
      sourceRefs: [
        { docId: "fti-contact", location: "Aerobatics chapter — Rolls" }
      ]
    },
    // ── FORMATION ──
    {
      id: "t6b-form-001",
      category: "Formation",
      question: "Describe the visual references for parade (fingertip) position: wingtip-to-canopy relationship, fore-aft position cues, and altitude reference.",
      syllabusEvents: ["C-2030", "C-2031"],
      sourceRefs: [
        { docId: "fti-contact", location: "Formation chapter — Parade Position visual references" }
      ]
    },
    {
      id: "t6b-form-002",
      category: "Formation",
      question: "Describe the lost wingman procedure. What are the calls, the actions, and the criteria for initiating the procedure?",
      syllabusEvents: ["C-2030", "C-2031"],
      sourceRefs: [
        { docId: "fti-contact", location: "Formation chapter — Lost Wingman / IMC procedures" }
      ]
    },
    // ── INSTRUMENTS ──
    {
      id: "t6b-inst-001",
      category: "Instruments",
      question: "Describe the instrument scan technique. What is the primary/supporting method and how does it differ from the selective radial scan?",
      syllabusEvents: ["I-2101", "I-2102"],
      sourceRefs: [
        { docId: "fti-instruments", location: "Basic Instruments chapter — Scan Technique" },
        { docId: "irc", location: "Instrument Fundamentals section" }
      ]
    },
    {
      id: "t6b-inst-002",
      category: "Instruments",
      question: "Describe the ILS approach: what defines the final approach fix, how do you identify glideslope intercept, and what are the criteria for going missed?",
      syllabusEvents: ["I-2102", "I-2110"],
      sourceRefs: [
        { docId: "fti-instruments", location: "Precision Approaches — ILS", note: "Reference the approach plate interpretation section." }
      ]
    },
    // ── WEATHER ──
    {
      id: "t6b-wx-001",
      category: "Weather",
      question: "State the VFR weather minimums for Class B, C, D, and E airspace below 10,000 ft MSL and above 10,000 ft MSL.",
      syllabusEvents: ["C-2001", "C-2002", "C-2010"],
      sourceRefs: [
        { docId: "fti-contact", location: "Airspace chapter — VFR minimums table" },
        { docId: "natops-t6b", location: "Chapter 7 — Flight Planning / Weather Minimums" }
      ]
    },
    // ── NAVIGATION ──
    {
      id: "t6b-nav-001",
      category: "Navigation",
      question: "Describe the low-level navigation planning process: route selection criteria, checkpoint spacing, altitude selection, and timing techniques.",
      syllabusEvents: ["N-2201", "N-2202"],
      sourceRefs: [
        { docId: "fti-navigation", location: "Low-Level Navigation chapter — Route Planning" }
      ]
    },
    {
      id: "t6b-nav-002",
      category: "Navigation",
      question: "Describe the night illusions most commonly encountered during night flight and the corrections/awareness techniques for each.",
      syllabusEvents: ["N-2210"],
      sourceRefs: [
        { docId: "fti-navigation", location: "Night Operations chapter — Visual Illusions" },
        { docId: "fti-contact", location: "Night Familiarization section" }
      ]
    }
  ],

  // ── BOLDFACE / EMERGENCY PROCEDURES ─────────────────────────
  // Steps must be memorized verbatim from current NATOPS.
  // Update these whenever a NATOPS revision is issued.
  boldface: [
    {
      id: "t6b-bf-001",
      title: "ENGINE FIRE — ON DECK",
      warning: "Steps must be memorized verbatim. Verify against current NATOPS revision.",
      steps: [
        "CONDITION LEVER — FUEL OFF",
        "FIRE PULL HANDLE — PULL",
        "AGENT SWITCH — PUSH (if fire persists)",
        "EVACUATE AIRCRAFT"
      ]
    },
    {
      id: "t6b-bf-002",
      title: "ENGINE FAILURE IN FLIGHT",
      warning: "Steps must be memorized verbatim. Verify against current NATOPS revision.",
      steps: [
        "THROTTLE — IDLE",
        "LANDING SPOT — SELECT",
        "AIRSPEED — 100 KIAS (best glide)",
        "MAYDAY — TRANSMIT (121.5 or assigned freq)",
        "EJECT — (if unable to make suitable field)"
      ]
    },
    {
      id: "t6b-bf-003",
      title: "ENGINE FIRE IN FLIGHT",
      warning: "Steps must be memorized verbatim. Verify against current NATOPS revision.",
      steps: [
        "THROTTLE — IDLE",
        "CONDITION LEVER — FUEL OFF",
        "FIRE PULL HANDLE — PULL",
        "AGENT SWITCH — PUSH",
        "AIRSPEED — AS REQUIRED FOR LANDING / EJECT"
      ]
    },
    {
      id: "t6b-bf-004",
      title: "SMOKE AND FUMES — IMMEDIATE ACTION",
      warning: "Steps must be memorized verbatim. Verify against current NATOPS revision.",
      steps: [
        "OXYGEN MASK — ON, 100%",
        "BLEED AIR — OFF",
        "PRESSURIZATION — DUMP",
        "VENTS — OPEN",
        "LAND AS SOON AS POSSIBLE"
      ]
    }
  ]
};
