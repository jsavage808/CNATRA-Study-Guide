// ============================================================
// T-44C DATA FILE
// Follow the same editing conventions as data/t6b/data.js
// ============================================================

const T44C = {
  aircraft: "T-44C",
  fullName: "T-44C Pegasus",
  role: "Multi-Engine Advanced",
  color: "#ffb300",

  docs: [
    {
      id: "natops-t44c",
      shortName: "NATOPS",
      fullName: "NATOPS Flight Manual — T-44C Pegasus",
      pubNumber: "A1-T44CA-NFM-000",
      type: "NATOPS",
      url: "",
      description: "Primary authority for T-44C aircraft systems, limitations, and emergency procedures."
    },
    {
      id: "fti-mae",
      shortName: "FTI Multi-Engine",
      fullName: "Flight Training Instruction — Multi-Engine Advanced",
      pubNumber: "CNATRA P-820",
      type: "FTI",
      url: "",
      description: "Procedures and standards for the multi-engine advanced phase."
    },
    {
      id: "crm-guide",
      shortName: "CRM Guide",
      fullName: "Crew Resource Management Guide",
      pubNumber: "OPNAVINST 3710.7",
      type: "Supporting",
      url: "",
      description: "CRM standards, crew coordination, and multi-crew communication techniques."
    },
    {
      id: "ifr-supplement",
      shortName: "IFR Supplement",
      fullName: "IFR Supplement — Multi-Engine Procedures",
      pubNumber: "CNATRA P-821",
      type: "Supporting",
      url: "",
      description: "IFR procedures specific to multi-engine training aircraft operations."
    }
  ],

  syllabusPhases: [
    {
      phase: "Advanced Multi-Engine",
      events: [
        { code: "MA-3100", name: "Transition 1",            type: "Dual", hours: "2.0", description: "Systems orientation, normal procedures, traffic pattern, engine starting." },
        { code: "MA-3101", name: "Transition 2",            type: "Dual", hours: "2.0", description: "Advanced traffic pattern, short/soft field ops, abnormal procedures." },
        { code: "MA-3110", name: "Multi-Engine Basics 1",   type: "Dual", hours: "2.0", description: "VMC demonstration, engine failure identification, Vmc awareness, single-engine ops." },
        { code: "MA-3111", name: "Multi-Engine Basics 2",   type: "Dual", hours: "2.0", description: "Single-engine maneuvers, feathering, air restart, SE traffic pattern." },
        { code: "MA-3120", name: "Instrument Procedures 1", type: "Dual", hours: "2.0", description: "IFR procedures in multi-engine aircraft, precision approaches, holds." },
        { code: "MA-3121", name: "Instrument Procedures 2", type: "Dual", hours: "2.0", description: "Non-precision approaches, GPS procedures, complex IFR clearances." },
        { code: "MA-3130", name: "SE Approaches 1",         type: "Dual", hours: "2.0", description: "Single-engine ILS, SE missed approach, SE traffic pattern procedures." },
        { code: "MA-3131", name: "SE Approaches 2",         type: "Solo", hours: "2.0", description: "Solo multi-engine IFR — apply SE procedures independently." },
        { code: "MA-3140", name: "Long X-Country",          type: "Dual", hours: "4.0", description: "Extended cross-country under IFR, fuel planning, alternate selection, ATC coordination." }
      ]
    }
  ],

  discussionItems: [
    // ── SYSTEMS ──
    {
      id: "t44c-sys-001",
      category: "Systems",
      question: "Describe the T-44C fuel system: tank arrangement, crossfeed operation, fuel imbalance limits, and fuel management for a long cross-country.",
      syllabusEvents: ["MA-3100", "MA-3140"],
      sourceRefs: [
        { docId: "natops-t44c", location: "Chapter 2 — Fuel System", note: "Include the crossfeed valve logic and imbalance limits." }
      ]
    },
    {
      id: "t44c-sys-002",
      category: "Systems",
      question: "Describe the hydraulic system: what is powered by hydraulics, what is the backup system for gear extension, and what indications would you see with a complete hydraulic failure?",
      syllabusEvents: ["MA-3100"],
      sourceRefs: [
        { docId: "natops-t44c", location: "Chapter 2 — Hydraulic System" }
      ]
    },
    {
      id: "t44c-sys-003",
      category: "Systems",
      question: "Describe the T-44C electrical system: AC vs DC buses, what is lost with a generator failure, and the priority of load shedding.",
      syllabusEvents: ["MA-3100"],
      sourceRefs: [
        { docId: "natops-t44c", location: "Chapter 2 — Electrical System", note: "Note the inverter system for AC power." }
      ]
    },
    // ── VMC / MULTI-ENGINE ──
    {
      id: "t44c-vmc-001",
      category: "VMC / Multi-Engine",
      question: "Define VMC (Vmc) for the T-44C. Describe the certification conditions for Vmc and the factors that increase or decrease actual minimum control speed in flight.",
      syllabusEvents: ["MA-3110", "MA-3111"],
      sourceRefs: [
        { docId: "natops-t44c", location: "Chapter 5 — Limitations / Vmc", note: "Know the published value and the variable factors." },
        { docId: "fti-mae", location: "Multi-Engine Aerodynamics chapter — Vmc factors" }
      ]
    },
    {
      id: "t44c-vmc-002",
      category: "VMC / Multi-Engine",
      question: "Explain the concept of critical engine for the T-44C. Why is one engine more critical than the other, and how does this affect minimum control speed?",
      syllabusEvents: ["MA-3110"],
      sourceRefs: [
        { docId: "fti-mae", location: "Multi-Engine Aerodynamics — Critical Engine / P-factor" }
      ]
    },
    {
      id: "t44c-vmc-003",
      category: "VMC / Multi-Engine",
      question: "Describe the engine failure identification procedure: identify, verify, feather. What is the hazard of incorrectly identifying the failed engine?",
      syllabusEvents: ["MA-3110", "MA-3111"],
      sourceRefs: [
        { docId: "fti-mae", location: "Engine Failure procedures — Identify, Verify, Feather" },
        { docId: "natops-t44c", location: "Chapter 3 — Engine Failure In Flight" }
      ]
    },
    // ── EMERGENCY ──
    {
      id: "t44c-emer-001",
      category: "Emergency",
      question: "Describe the engine fire in flight boldface for the T-44C. What is the purpose of feathering the propeller during a fire?",
      syllabusEvents: ["MA-3100", "MA-3110"],
      sourceRefs: [
        { docId: "natops-t44c", location: "Chapter 3 — Engine Fire In Flight (BOLDFACE)" }
      ]
    },
    {
      id: "t44c-emer-002",
      category: "Emergency",
      question: "At what point during the takeoff roll would you attempt to continue vs. abort following an engine failure? What factors affect this decision?",
      syllabusEvents: ["MA-3110", "MA-3111"],
      sourceRefs: [
        { docId: "fti-mae", location: "Engine Failure — Takeoff Decision criteria" },
        { docId: "natops-t44c", location: "Chapter 3 — Engine Failure During Takeoff" }
      ]
    },
    {
      id: "t44c-emer-003",
      category: "Emergency",
      question: "Describe the ditching procedure for the T-44C. What are the passenger briefing requirements and the preferred ditching heading relative to wind and swells?",
      syllabusEvents: ["MA-3140"],
      sourceRefs: [
        { docId: "natops-t44c", location: "Chapter 3 — Ditching" }
      ]
    },
    // ── LIMITATIONS ──
    {
      id: "t44c-lim-001",
      category: "Limitations",
      question: "State the T-44C airspeed limitations: Vne, Vmo, Va, Vlo, Vle, and Vyse (blue line). Why is Vyse called 'blue line' and what does it optimize?",
      syllabusEvents: ["MA-3100", "MA-3110"],
      sourceRefs: [
        { docId: "natops-t44c", location: "Chapter 5 — Airspeed Limitations", note: "Know all values and the reasoning behind Vyse." }
      ]
    },
    // ── CRM ──
    {
      id: "t44c-crm-001",
      category: "CRM",
      question: "Describe the crew callouts and division of duties during a single-engine missed approach. Who flies, who manages the engine failure, and how are tasks prioritized?",
      syllabusEvents: ["MA-3130", "MA-3131"],
      sourceRefs: [
        { docId: "crm-guide", location: "Task Sharing / Abnormal Procedures section" },
        { docId: "fti-mae", location: "Single-Engine Approaches — crew coordination" }
      ]
    },
    {
      id: "t44c-crm-002",
      category: "CRM",
      question: "Define threat and error management (TEM). Describe an example of a latent threat during a night IFR cross-country in the T-44C and how it should be briefed.",
      syllabusEvents: ["MA-3140"],
      sourceRefs: [
        { docId: "crm-guide", location: "Threat and Error Management chapter" }
      ]
    },
    // ── INSTRUMENTS ──
    {
      id: "t44c-inst-001",
      category: "Instruments",
      question: "Describe the procedure for flying a coupled ILS approach in the T-44C: autopilot mode sequence, monitoring responsibilities, and criteria for disconnecting.",
      syllabusEvents: ["MA-3120", "MA-3121"],
      sourceRefs: [
        { docId: "natops-t44c", location: "Chapter 4 — Autopilot / Flight Director" },
        { docId: "fti-mae", location: "Instrument Procedures — Coupled Approaches" }
      ]
    }
  ],

  boldface: [
    {
      id: "t44c-bf-001",
      title: "ENGINE FAILURE IN FLIGHT",
      warning: "Steps must be memorized verbatim. Verify against current NATOPS revision.",
      steps: [
        "POWER (operating engine) — MAXIMUM",
        "MIXTURES — RICH",
        "PROPS — HIGH RPM",
        "IDENTIFY — failed engine (foot on the dead engine)",
        "VERIFY — retard throttle (confirm failure)",
        "FEATHER — propeller of failed engine",
        "GEAR — UP (if not already)",
        "FLAPS — RETRACT",
        "AIRSPEED — Vyse (blue line) or best as available",
        "TRIM — relieve rudder pressure"
      ]
    },
    {
      id: "t44c-bf-002",
      title: "ENGINE FIRE IN FLIGHT",
      warning: "Steps must be memorized verbatim. Verify against current NATOPS revision.",
      steps: [
        "THROTTLE (affected engine) — CLOSE",
        "MIXTURE (affected engine) — IDLE CUTOFF",
        "PROP (affected engine) — FEATHER",
        "FUEL SELECTOR (affected engine) — OFF",
        "FIRE EXTINGUISHER — ARM / DISCHARGE",
        "CROSSFEED — OFF",
        "LAND AS SOON AS POSSIBLE"
      ]
    },
    {
      id: "t44c-bf-003",
      title: "ELECTRICAL FIRE / SMOKE IN COCKPIT",
      warning: "Steps must be memorized verbatim. Verify against current NATOPS revision.",
      steps: [
        "OXYGEN MASKS — ON, 100%",
        "NON-ESSENTIAL ELECTRICS — OFF",
        "IDENTIFY source and isolate",
        "LAND AS SOON AS POSSIBLE"
      ]
    }
  ]
};
