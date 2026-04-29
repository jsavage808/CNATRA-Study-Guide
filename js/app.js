// ============================================================
// CNATRA STUDY HUB - APP LOGIC (JSON-driven)
// Data source: data/{t6b,t44c,t45c}/discuss-data.json
// ============================================================

let currentAC = 'T-6B';
let currentPanel = 'discussion';
let blockFilter = 'ALL';
let mediaFilter = 'ALL';
let searchTerm = '';
let acData = {};
let studyTab = 'procedures';
let quizState = {
  mode: 'procedure',
  question: null,
  revealed: false,
  checked: false,
};

const ICONS = {
  discussion: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 3h12v7H9l-3 4v-4H2z"/></svg>`,
  documents: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 2h6l4 4v8H4V2z"/><path d="M10 2v4h4"/><path d="M6 9h4M6 11.5h3"/></svg>`,
  boldface: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 3.5h12M2 8h12M2 12.5h12"/><path d="M12.5 2.5v11"/></svg>`,
  doc: `<svg viewBox="0 0 16 16" fill="none" stroke="#00e5ff" stroke-width="1.3"><path d="M4 2h6l4 4v8H4V2z"/><path d="M10 2v4h4"/></svg>`,
};

const PANEL_NAV = [
  { id: 'discussion', label: 'Discussion Items', icon: ICONS.discussion },
  { id: 'documents', label: 'Publications', icon: ICONS.documents },
  { id: 'boldface', label: 'EPs / Limits / Quiz', icon: ICONS.boldface },
];

const DISCUSSION_OVERRIDES = {
  'T-45C': {
    TR34: [
      { eventCode: 'TR3401', discussText: 'QOD' },
      { eventCode: 'TR3401', discussText: 'warning and caution tones' },
      { eventCode: 'TR3401', discussText: 'BASH mitigation profile procedures' },
      { eventCode: 'TR3402', discussText: 'QOD' },
      { eventCode: 'TR3402', discussText: 'lost canopy' },
      { eventCode: 'TR3402', discussText: 'aircraft configurations for field arrestments' },
      { eventCode: 'TR3403', discussText: 'QOD' },
      { eventCode: 'TR3403', discussText: 'aileron PCU checklist procedures' },
      { eventCode: 'TR3403', discussText: 'PCU failure modes' },
    ],
  },
};

const STUDY_DATA = {
  'T-6B': {
    aircraft: 'T-6B',
    title: 'T-6B Texan II',
    emergencyProcedures: [
      { title: 'Abort Start Procedure', category: 'Memory Item', steps: ['PCL - OFF or STARTER switch - AUTO/RESET'] },
      { title: 'Emergency Engine Shutdown on the Ground', category: 'Memory Item', steps: ['PCL - OFF', 'FIREWALL SHUTOFF HANDLE - PULL', 'EMERGENCY GROUND EGRESS - AS REQUIRED'] },
      { title: 'Emergency Ground Egress', category: 'Memory Item', steps: ['ISS MODE SELECTOR - SOLO', 'SEAT SAFETY PIN - INSTALL (BOTH)', 'PARKING BRAKE - AS REQUIRED', 'CANOPY - OPEN', 'CFS HANDLE - ROTATE 90 DEGREES COUNTERCLOCKWISE AND PULL (BOTH)', 'UPPER FITTINGS, LOWER FITTINGS, AND LEG RESTRAINT GARTERS - RELEASE (BOTH)', 'BAT, GEN, AND AUX BAT SWITCHES - OFF', 'EVACUATE AIRCRAFT'] },
      { title: 'Abort', category: 'Memory Item', steps: ['PCL - IDLE', 'BRAKES - AS REQUIRED'] },
      { title: 'Engine Failure Immediately After Takeoff (Sufficient Runway Remaining Straight Ahead)', category: 'Memory Item', steps: ['AIRSPEED - 110 KNOTS (MINIMUM)', 'PCL - AS REQUIRED', 'EMER LDG GR HANDLE - PULL (AS REQUIRED)', 'FLAPS - AS REQUIRED'] },
      { title: 'Engine Failure During Flight', category: 'Memory Item', steps: ['ZOOM/GLIDE - 125 KNOTS (MINIMUM)', 'PCL - OFF', 'INTERCEPT ELP', 'AIRSTART - ATTEMPT IF WARRANTED', 'FIREWALL SHUTOFF HANDLE - PULL', 'EXECUTE FORCED LANDING OR EJECT'] },
      { title: 'Immediate Airstart (PMU NORM)', category: 'Memory Item', steps: ['PCL - OFF', 'STARTER SWITCH - AUTO/RESET', 'PCL - IDLE, ABOVE 13% N1', 'ENGINE INSTRUMENTS - MONITOR ITT, N1, AND OIL PRESSURE', 'PCL - OFF', 'FIREWALL SHUTOFF HANDLE - PULL', 'EXECUTE FORCED LANDING OR EJECT', 'PCL - AS REQUIRED AFTER N1 REACHES IDLE RPM (APPROXIMATELY 67% N1)', 'PEL - EXECUTE'] },
      { title: 'Uncommanded Power Changes / Loss of Power / Uncommanded Propeller Feather', category: 'Memory Item', steps: ['PCL - MID RANGE', 'PMU SWITCH - OFF', 'PROP SYS CIRCUIT BREAKER (LEFT FRONT CONSOLE) - PULL, IF NP STABLE BELOW 40%', 'PCL - AS REQUIRED', 'PEL - EXECUTE', 'PROP SYS CIRCUIT BREAKER - RESET, AS REQUIRED', 'PCL - OFF', 'FIREWALL SHUTOFF HANDLE - PULL', 'EXECUTE FORCED LANDING OR EJECT'] },
      { title: 'Compressor Stalls', category: 'Memory Item', steps: ['PCL - SLOWLY RETARD BELOW STALL THRESHOLD', 'DEFOG SWITCH - ON', 'PCL - SLOWLY ADVANCE (AS REQUIRED)', 'PEL - EXECUTE', 'PCL - OFF', 'FIREWALL SHUTOFF HANDLE - PULL', 'EXECUTE FORCED LANDING OR EJECT'] },
      { title: 'Inadvertent Departure From Controlled Flight', category: 'Memory Item', steps: ['PCL - IDLE', 'CONTROLS - NEUTRAL', 'ALTITUDE - CHECK', 'RECOVER FROM UNUSUAL ATTITUDE'] },
      { title: 'Fire In Flight', category: 'Memory Item', steps: ['PCL - OFF', 'FIREWALL SHUTOFF HANDLE - PULL', 'FORCED LANDING - EXECUTE', 'EJECT (BOTH)', 'PEL - EXECUTE'] },
      { title: 'Chip Detector Warning', category: 'Memory Item', steps: ['PCL - MINIMUM NECESSARY TO INTERCEPT ELP; AVOID UNNECESSARY PCL MOVEMENTS', 'PEL - EXECUTE'] },
      { title: 'Oil System Malfunction or Low Oil Pressure', category: 'Memory Item', steps: ['TERMINATE MANEUVER', 'CHECK OIL PRESSURE; IF OIL PRESSURE IS NORMAL, CONTINUE OPERATIONS', 'PCL - MINIMUM NECESSARY TO INTERCEPT ELP; AVOID UNNECESSARY PCL MOVEMENTS', 'PEL - EXECUTE'] },
      { title: 'Low Fuel Pressure', category: 'Memory Item', steps: ['PEL - EXECUTE', 'BOOST PUMP SWITCH - ON'] },
      { title: 'OBOGS FAIL Message', category: 'Memory Item', steps: ['PCL - ADVANCE'] },
      { title: 'OBOGS Failure / Physiological Symptoms', category: 'Memory Item', steps: ['GREEN RING - PULL (AS REQUIRED) (BOTH)', 'DESCENT BELOW 10,000 FEET MSL - INITIATE', 'DISCONNECT MAIN OXYGEN SUPPLY HOSE FROM CRU-60P'] },
      { title: 'Eject', category: 'Memory Item', steps: ['EJECTION HANDLE - PULL (BOTH)'] },
      { title: 'Smoke and Fume Elimination / Electrical Fire', category: 'Memory Item', steps: ['OBOGS - CHECK', 'OBOGS SUPPLY LEVER - ON', 'OBOGS CONCENTRATION LEVER - MAX', 'OBOGS PRESSURE LEVER - EMERGENCY'] },
      { title: 'Forced Landing', category: 'Memory Item', steps: ['AIRSPEED - 125 KIAS PRIOR TO EXTENDING LANDING GEAR', 'EMER LDG GR HANDLE - PULL (AS REQUIRED)', 'AIRSPEED - 120 KIAS MINIMUM UNTIL INTERCEPTING FINAL; 110 KIAS MINIMUM ON FINAL', 'FLAPS - AS REQUIRED'] },
      { title: 'Precautionary Emergency Landing (PEL)', category: 'Memory Item', steps: ['TURN TO NEAREST SUITABLE FIELD', 'CLIMB OR ACCELERATE TO INTERCEPT ELP', 'GEAR, FLAPS, SPEED BRAKE - UP'] },
    ],
    limits: [
      { label: 'VLE / VFE', value: 'MAXIMUM AIRSPEED GEAR DOWN (VLE) AND FLAP DOWN (VFE): 150 KIAS' },
      { label: 'VMO / MMO', value: 'MAX OPERATING (VMO): 316 KIAS / MAX MACH (MMO): 0.67 MACH' },
      { label: 'Turbulent Air', value: 'TURBULENT AIR PENETRATION SPEED, MAXIMUM: 207 KIAS' },
      { label: 'Icing Approval', value: 'THE AIRCRAFT HAS BEEN APPROVED ONLY FOR TRANSIT THROUGH 5000 FEET OF LIGHT RIME ICE.' },
      { label: 'Minimum Battery Voltage', value: 'MINIMUM BATTERY VOLTAGE: 22.0 VOLTS' },
      { label: 'Hydraulic Caution', value: 'HYDRAULIC CAUTION: BELOW 1800 PSI, ABOVE 3500 PSI' },
      { label: 'Fuel Caution Light', value: 'FUEL CAUTION LIGHT: BELOW 110 POUNDS IN RESPECTIVE WING TANK' },
      { label: 'Cockpit Pressurization', value: 'COCKPIT PRESSURIZATION SCHEDULE LIMIT: 3.6 +/- 0.2 PSI' },
      { label: 'Starter Cycles', value: 'STARTER DUTY CYCLE IS LIMITED TO FOUR 20 SECOND CYCLES. COOLING: FIRST 30 SEC, SECOND 2 MIN, THIRD 5 MIN, FOURTH 30 MIN.' },
      { label: 'Inverted Flight', value: 'INVERTED FLIGHT: 60 SECONDS' },
      { label: 'Intentional Zero G', value: 'INTENTIONAL ZERO G FLIGHT: 5 SECONDS' },
      { label: 'Negative G Flight', value: 'NEGATIVE G OPERATIONS: 60 SECONDS. DO NOT EXCEED -2.5 G FOR LONGER THAN 30 SECONDS. MINIMUM UPRIGHT POSITIVE G BEFORE ADDITIONAL NEGATIVE GS: 60 SECONDS.' },
      { label: 'Acceleration Limits', value: 'SYMMETRIC CLEAN +7.0 TO -3.5 GS. SYMMETRIC GEAR AND FLAPS EXTENDED +2.5 TO 0.0 GS. ASYMMETRIC CLEAN +4.7 TO -1.0 GS. ASYMMETRIC GEAR AND FLAPS EXTENDED +2.0 TO 0.0 GS.' },
      { label: 'Uncoordinated Rolling Maneuvers', value: 'FOR UNCOORDINATED ROLLING MANEUVERS INITIATED AT -1 G, MAXIMUM BANK ANGLE CHANGE IS 180 DEGREES.' },
      { label: 'Battery Start Voltage', value: 'MIN VOLTAGE FOR BATTERY START: 23.5 VOLTS' },
      { label: 'Crosswind Limits', value: 'MAX CROSSWIND: DRY RUNWAY 25 KNOTS, WET RUNWAY 10 KNOTS, ICY RUNWAY 5 KNOTS' },
      { label: 'Tailwind Takeoff', value: 'MAX TAILWIND COMPONENT FOR TAKEOFF: 10 KNOTS' },
      { label: 'Prohibited Maneuvers', value: 'INVERTED STALLS, INVERTED SPINS, SPINS WITH PCL ABOVE IDLE, SPINS WITH LANDING GEAR / FLAPS / SPEEDBRAKE EXTENDED, SPINS WITH PMU OFF, AGGRAVATED SPINS PAST TWO TURNS, SPINS BELOW 10,000 FEET PRESSURE ALTITUDE, SPINS ABOVE 22,000 FEET PRESSURE ALTITUDE, ABRUPT CROSS-CONTROLLED SNAP MANEUVERS, AEROBATICS / SPINS / STALLS WITH FUEL IMBALANCE GREATER THAN 50 POUNDS, AND TAIL SLIDES ARE PROHIBITED.' },
    ],
  },
  'T-44C': {
    aircraft: 'T-44C',
    title: 'T-44C Pegasus',
    emergencyProcedures: [
      { title: 'Abnormal Start', category: 'Memory Item', steps: ['CONDITION LEVER - FUEL CUTOFF (DEC BELOW 790 C)', 'STARTER - STARTER ONLY (FOR THE REMAINDER OF THE 40 SECONDS)', 'STARTER - OFF (AT 40 SECONDS)'] },
      { title: 'Smoke and Fume Elimination', category: 'Memory Item', steps: ['OXYGEN MASK / MIC SWITCHES (100 PERCENT) - AS REQUIRED', 'PRESSURIZATION - DUMP'] },
      { title: 'Fuel Leaks', category: 'Memory Item', steps: ['CONDITION LEVER - FUEL CUTOFF', 'EMERGENCY SHUTDOWN CHECKLIST - EXECUTE'] },
      { title: 'Emergency Shutdown on Deck', category: 'Memory Item', steps: ['STOP THE AIRCRAFT AND SET THE PARKING BRAKE', 'CONDITION LEVERS - FUEL CUTOFF', 'FIREWALL VALVES - CLOSED', 'BOOST PUMPS - OFF', 'FIRE EXTINGUISHER - AS REQUIRED', 'AUX BATT SWITCH - OFF', 'GANG BAR - OFF', 'EVACUATE AIRCRAFT'] },
      { title: 'Aborting Takeoff', category: 'Memory Item', steps: ['ANNOUNCE "ABORT"', 'POWER LEVERS - IDLE', 'REVERSE - AS REQUIRED', 'BRAKES - AS REQUIRED', 'CONDITION LEVERS - FUEL CUTOFF', 'FIREWALL VALVES - CLOSED', 'BOOST PUMPS - OFF', 'FIRE EXTINGUISHER(S) - AS REQUIRED', 'AUX BATT SWITCH - OFF', 'GANG BAR - OFF', 'EVACUATE AIRCRAFT'] },
      { title: 'Engine Failure After Takeoff', category: 'Memory Item', steps: ['POWER - AS REQUIRED', 'LANDING GEAR - UP', 'AIRSPEED - AS REQUIRED (VXSE OR VYSE)', 'EMERGENCY SHUTDOWN CHECKLIST - EXECUTE'] },
      { title: 'Emergency Shutdown Checklist', category: 'Memory Item', steps: ['POWER LEVER - IDLE', 'PROP LEVER - FEATHER', 'CONDITION LEVER - FUEL CUTOFF', 'FIREWALL VALVE - CLOSED', 'FIRE EXTINGUISHER - AS REQUIRED', 'BLEED AIR VALVE - CLOSED'] },
      { title: 'Windmilling Airstart', category: 'Memory Item', steps: ['POWER LEVER (FAILED ENGINE) - IDLE', 'PROP LEVER (FAILED ENGINE) - PULL FORWARD', 'CONDITION LEVER (FAILED ENGINE) - FUEL CUTOFF', 'FIREWALL VALVE - OPEN', 'AUTOIGNITION - ARMED', 'CONDITION LEVER - LOW IDLE', 'POWER - AS REQUIRED'] },
      { title: 'Primary Governor Failure / Malfunction', category: 'Memory Item', steps: ['ATTEMPT TO ADJUST PROP RPM TO NORMAL OPERATING RANGE', 'POWER LEVER - IDLE', 'PROP LEVER - FEATHER', 'ALTERNATE PROP FEATHER CHECKLIST - AS REQUIRED', 'LAND AS SOON AS POSSIBLE'] },
      { title: 'Explosive Decompression', category: 'Memory Item', steps: ['OXYGEN MASK / MIC SWITCHES (100 PERCENT) - AS REQUIRED', 'DESCEND - AS REQUIRED'] },
      { title: 'Unscheduled Electric Trim Activation', category: 'Memory Item', steps: ['A/P / TRIM DISCONNECT (CONTROL WHEEL) - DEPRESS FULLY AND HOLD'] },
      { title: 'Emergency Descent Procedure', category: 'Memory Item', steps: ['POWER LEVERS - IDLE', 'PROPS - FULL FORWARD', 'FLAPS - AS REQUIRED', 'LANDING GEAR - AS REQUIRED', 'AIRSPEED - AS REQUIRED', 'WINDSHIELD HEAT - AS REQUIRED'] },
      { title: 'Spin / Out of Control Flight Recovery', category: 'Memory Item', steps: ['POWER LEVERS - IDLE', 'RUDDER - FULL DEFLECTION OPPOSITE DIRECTION OF TURN NEEDLE', 'CONTROL WHEEL - RAPIDLY FORWARD', 'RUDDER - NEUTRALIZE AFTER ROTATION STOPS', 'CONTROL WHEEL - PULL OUT OF DIVE BY EXERTING SMOOTH, STEADY BACK PRESSURE'] },
      { title: 'Terrain Warning (IMC or at Night)', category: 'Memory Item', steps: ['WINGS - LEVEL', 'POWER - MAX CONTINUOUS', 'PITCH - AS REQUIRED TO SET AND MAINTAIN VX', 'FLAPS - APPROACH (UNLESS ALREADY UP)', 'GEAR - UP', 'FLAPS - UP', 'PROPS - 1900 RPM', 'CONTINUE CLIMB AT VX UNTIL ALL VISUAL AND VOICE WARNINGS CEASE'] },
      { title: 'Single-Engine Waveoff / Missed Approach', category: 'Memory Item', steps: ['POWER - MAX CONTINUOUS, ESTABLISH POSITIVE RATE OF CLIMB (VXSE MINIMUM)', 'FLAPS - APPROACH (UNLESS ALREADY UP)', 'LANDING GEAR - UP', 'FLAPS - UP', 'PROP - 1900 RPM'] },
      { title: 'Low Altitude Windshear', category: 'Memory Item', steps: ['POWER - MAXIMUM CONTINUOUS', 'PITCH - SET AND HOLD APPROXIMATELY 15 DEGREES NOSEUP', 'LANDING GEAR - UP', 'FLAPS - MAINTAIN CURRENT SETTING'] },
      { title: 'Waveoff / Missed Approach', category: 'Memory Item', steps: ['POWER - AS REQUIRED, ESTABLISH POSITIVE RATE OF CLIMB (VX MINIMUM)', 'FLAPS - APPROACH (UNLESS ALREADY UP)', 'LANDING GEAR - UP', 'FLAPS - UP', 'PROPS - 1900 RPM'] },
      { title: 'Smoke / Fire of Unknown Origin', category: 'Memory Item', steps: ['CREW - ALERTED', 'CABIN TEMPERATURE MODE - OFF', 'VENT BLOWER - AUTO', 'OXYGEN MASK / MIC SWITCHES (100 PERCENT) - AS REQUIRED'] },
    ],
    limits: [
      { label: 'Engine Operating Limits', value: 'MAX ALLOWABLE 5 MIN: 1315 FT-LB / 1520 FT-LB, ITT 790, N1 101.5, NP 2200, OIL PRESS 85-100, OIL TEMP 10-99' },
      { label: 'Fuel Capacity', value: 'TOTAL FUEL SYSTEM CAPACITY IS 387.6 U.S. GALLONS, OF WHICH 384 U.S. GALLONS ARE USABLE.' },
      { label: 'Altitude Ceiling', value: '31,000 FT' },
      { label: 'Max Sink Rate', value: 'MAXIMUM SINK RATE AT GROUND CONTACT: 600 FPM' },
      { label: 'Crosswind', value: 'MAXIMUM CROSSWIND COMPONENT: 20 KNOTS' },
      { label: 'Gyro Suction', value: 'GYRO SUCTION NORMAL OPERATING RANGE: 4.3-5.9 INHG' },
      { label: 'Weight Limits', value: 'MAX TAKEOFF 9650 POUNDS, MAX LANDING 9168 POUNDS, MAX RAMP 9710 POUNDS' },
      { label: 'Minimum Oxygen', value: 'MIN OXYGEN REQUIRED FOR LOCAL / X-C FLIGHT: 1,000 / 1,500 PSI' },
      { label: 'Cabin Pressure Differential', value: 'MAXIMUM OPERATING CABIN PRESSURE DIFFERENTIAL: 4.7 PSI' },
      { label: 'VMCG', value: 'MIN CONTROLLABLE SPEED ON GROUND (VMCG): 63 KIAS' },
      { label: 'Pneumatic Pressure', value: 'PNEUMATIC PRESSURE NORMAL OPERATING RANGE: 12-20 PSI' },
      { label: 'Climb / Glide Speeds', value: 'VYSE 110 KIAS, MAX RANGE GLIDE 130 KIAS, MAX ENDURANCE GLIDE 102 KIAS, VX 102 KIAS, VY 108 KIAS, VXSE 102 KIAS' },
      { label: 'Gear / Flap Limits', value: 'VLE 155 KIAS, VLR 145 KIAS, VFE APPROACH 174 KIAS, VFE FULL 140 KIAS' },
      { label: 'Single-Engine / Maneuvering Speeds', value: 'VSSE 91 KIAS, VMCA 86 KIAS, VA 153 KIAS' },
      { label: 'VMO / MMO', value: 'VMO 227 KIAS. DECREASE VMO 4 KIAS FOR EVERY 1,000 FT ABOVE 15,500 FT. MMO .48 MACH' },
      { label: 'Battery Minimums', value: 'MIN BATTERY VOLTAGE FOR APU CHARGE 18 VDC, APU START 20 VDC, BATT START 22 VDC' },
      { label: 'Starter Cycle Limits', value: 'STARTER DUTY CYCLE IS LIMITED TO THREE 40 SECOND CYCLES. COOLING AFTER FIRST 60 SECONDS, SECOND 60 SECONDS, THIRD 30 MINUTES' },
      { label: 'Prop Deicer Ammeter', value: 'PROP DEICER AMMETER NORMAL OPERATION: 14-18 AMPS' },
      { label: 'Acceleration Limits', value: 'CLEAN +3.0 TO -1.0 G. FULL FLAPS +2.0 TO 0.0 G' },
      { label: 'Prohibited Maneuvers', value: 'INTENTIONAL SPINS' },
    ],
  },
  'T-45C': {
    aircraft: 'T-45C',
    title: 'T-45C Goshawk',
    emergencyProcedures: [
      { title: 'Clear Engine Procedure / Abnormal Start / TP Fire on Shutdown', category: 'Immediate Action', steps: ['THROTTLE - OFF'] },
      { title: 'Emergency Shutdown / Egress', category: 'Immediate Action', steps: ['THROTTLE - OFF', 'ENGINE SWITCH - OFF', 'FUEL SHUTOFF HANDLE - PULL', 'EJECTION SEATS - SAFE', 'BATT SWITCHES - OFF'] },
      { title: 'Engine Failure', category: 'Immediate Action', steps: ['IF BELOW 1,500 FEET AGL AND AIRSPEED BELOW 180 KIAS: EJECT', 'OTHERWISE: EXECUTE AIRSTART'] },
      { title: 'Airstart', category: 'Immediate Action', steps: ['EMERGENCY OXYGEN GREEN RING(S) - PULL', 'THROTTLE - OFF', 'GTS START BUTTON - PRESS', 'THROTTLE - IDLE', 'THROTTLE - OFF (ALLOW 30 SECONDS TO DRAIN IF PRACTICAL)', 'IF ABOVE 13% RPM AND 250 KIAS, REPEAT GTS START BUTTON AND THROTTLE IDLE'] },
      { title: 'Compressor Stall or EGT/RPM Warning Light', category: 'Immediate Action', steps: ['THROTTLE - IDLE', 'EGT/RPM - CHECK', 'EXECUTE ENGINE FAILURE PROCEDURE', 'THROTTLE - SLOWLY ADVANCE TO MINIMUM FOR SAFE FLIGHT', 'MINIMIZE THROTTLE MOVEMENTS'] },
      { title: 'Abort', category: 'Immediate Action', steps: ['THROTTLE - IDLE', 'SPEED BRAKES - EXTEND', 'BRAKES - APPLY', 'HOOK - DOWN (IF REQUIRED)', 'BRAKES - RELEASE PRIOR TO CROSSING THE ARRESTING GEAR'] },
      { title: 'Emergency Catapult Flyaway', category: 'Immediate Action', steps: ['THROTTLE - MRT', 'MAINTAIN 24 UNITS AOA', 'IF ENGINE FAILED OR UNABLE TO STOP SETTLE: EJECT'] },
      { title: 'Brake Failure - Ashore / Skid Caution', category: 'Immediate Action', steps: ['GO AROUND', 'THROTTLE - IDLE', 'BRAKES - RELEASE', 'ANTI-SKID SWITCH - OFF', 'BRAKES - APPLY GRADUALLY', 'HOOK - DOWN (IF REQUIRED)', 'PARKING BRAKE HANDLE - PULL (IF REQUIRED)'] },
      { title: 'Brake Failure - Afloat', category: 'Immediate Action', steps: ['THROTTLE - IDLE', 'PARKING BRAKE HANDLE - PULL', 'HOOK - DOWN', 'TRANSMIT'] },
      { title: 'Loss of Directional Control', category: 'Immediate Action', steps: ['GO-AROUND', 'ABORT', 'BRAKES - RELEASE', 'ANTI-SKID SWITCH - OFF', 'BRAKES - APPLY GRADUALLY', 'PADDLE SWITCH - PRESS'] },
      { title: 'Asymmetric Flaps / Slats', category: 'Immediate Action', steps: ['FLAPS / SLATS LEVER - RETURN TO PREVIOUS SETTING'] },
      { title: 'Departure / Spin Procedure', category: 'Immediate Action', steps: ['CONTROLS - NEUTRALIZE / FORCIBLY CENTER RUDDER PEDALS', 'SPEED BRAKES - RETRACT', 'THROTTLE - IDLE', 'CHECK ALTITUDE, AOA, AIRSPEED, AND TURN NEEDLE', 'RUDDER PEDAL - FULL OPPOSITE TURN NEEDLE', 'LATERAL STICK - FULL OPPOSITE TURN NEEDLE OR WITH TURN NEEDLE', 'LONGITUDINAL STICK - NEUTRALIZE', 'LATERAL STICK - NEUTRALIZE', 'RUDDER PEDALS - SMOOTHLY CENTER', 'IF OUT OF CONTROL PASSING THROUGH 10,000 FEET AGL: EJECT'] },
      { title: 'Total Electrical Failure', category: 'Immediate Action', steps: ['EMERGENCY OXYGEN GREEN RING(S) - PULL'] },
      { title: 'Adverse Physiological Symptoms', category: 'Immediate Action', steps: ['EMERGENCY OXYGEN GREEN RING(S) - PULL', 'OBOGS FLOW SELECTOR(S) - OFF', 'DESCEND BELOW 10,000 FEET CABIN ALTITUDE'] },
      { title: 'Rapid Decompression', category: 'Immediate Action', steps: ['EMERGENCY OXYGEN GREEN RING(S) - PULL', 'OBOGS FLOW SELECTOR(S) - OFF', 'DESCEND BELOW 10,000 FEET CABIN ALTITUDE'] },
      { title: 'Electrical Fire', category: 'Immediate Action', steps: ['GEN SWITCH - OFF'] },
      { title: 'Smoke or Fumes in Cockpit', category: 'Immediate Action', steps: ['MASK - ON / TIGHT', 'INITIATE CONTROLLED DESCENT TO BELOW 18,000 FEET MSL', 'AIR FLOW KNOB - OFF (BELOW 18,000 FEET MSL IF POSSIBLE)', 'AIRSPEED - REDUCE (AS PRACTICAL)', 'WARN OTHER COCKPIT OCCUPANT / SECURE LOOSE ITEMS', 'SEAT - LOWER', 'MDC FIRING HANDLE - PULL'] },
      { title: 'Fire Warning Light', category: 'Immediate Action', steps: ['GROUND: EXECUTE EMERGENCY SHUTDOWN / EGRESS', 'TAKEOFF: ABORT', 'IF FIRE IS CONFIRMED AND UNABLE TO ABORT: EJECT', 'IN-FLIGHT: THROTTLE - MINIMUM FOR SAFE FLIGHT', 'CHECK FOR SECONDARY INDICATIONS OF FIRE', 'IF FIRE CONFIRMED OR FLIGHT CONTROL LOST: EJECT', 'IF FIRE NOT CONFIRMED AND CONTROL EFFECTIVENESS REMAINS: LAND AS SOON AS POSSIBLE'] },
      { title: 'GTS Fire Warning Light', category: 'Immediate Action', steps: ['GROUND: EXECUTE EMERGENCY SHUTDOWN / EGRESS', 'IN-FLIGHT: ENGINE SWITCH - OFF'] },
      { title: 'Oil Press Warning Light', category: 'Immediate Action', steps: ['THROTTLE - SET AND MAINTAIN 78 TO 87% RPM', 'MINIMIZE THROTTLE MOVEMENTS'] },
      { title: 'Oxygen Warning Light', category: 'Immediate Action', steps: ['THROTTLE - SET MINIMUM 80% RPM', 'EXECUTE ADVERSE PHYSIOLOGICAL SYMPTOMS (AS REQUIRED)'] },
      { title: 'TP HOT Caution Light', category: 'Immediate Action', steps: ['GROUND: EXECUTE EMERGENCY SHUTDOWN / EGRESS', 'IN-FLIGHT: THROTTLE - MINIMUM FOR SAFE FLIGHT'] },
    ],
    limits: [
      { label: 'Solo Flying', value: 'SOLO FLYING SHALL BE CONDUCTED ONLY FROM THE FORWARD COCKPIT.' },
      { label: 'Altitude Limit', value: 'MAXIMUM ALTITUDE IS 41,000 FEET MSL.' },
      { label: 'Icing', value: 'FLIGHT IN KNOWN ICING CONDITIONS SHALL BE AVOIDED. WHEN AIRFRAME ICING IS VISIBLE, INTENTIONAL STALLS OR USE OF FULL FLAPS IS NOT AUTHORIZED.' },
      { label: 'Engine Handling Limits', value: 'THROTTLE SHALL BE AT IDLE FOR ABRUPT PULLS TO FULL BACK STICK, ABRUPT FULL LATERAL STICK INPUTS AT FULL BACK STICK, AND AIRSPEEDS LESS THAN 85 KIAS ABOVE 15,000 FEET MSL.' },
      { label: 'Engine Operating Limits', value: 'MRT 104% N2 / 610 C FOR 30 MINUTES PER FLIGHT HOUR. TRANSIENT 106% N2 / 645 C FOR LESS THAN 20 SECONDS. MAX CONTINUOUS 100% N2 / 550 C. IDLE 56.5 +/- 2% N2 / 450 C.' },
      { label: 'GTS Start Limits', value: 'GTS START WITH EXTERNAL POWER IS PROHIBITED. MINIMUM INTERVAL BETWEEN EACH GTS START ATTEMPT IS 3 MINUTES. AFTER THREE CONSECUTIVE START ATTEMPTS, WAIT 30 MINUTES.' },
      { label: 'Fuel Temperature Limits', value: 'DO NOT ALLOW INDICATED TAT TO DWELL AT OR BELOW THE FUEL FREEZE POINT PLUS 3 C. OPERATION IS RESTRICTED TO AMBIENT TEMPERATURES ABOVE 0 C WHEN USING FUEL WITHOUT FSII.' },
      { label: 'System Airspeed Limits', value: 'LANDING GEAR TRANSITION / EXTENDED 200 KIAS OR LESS. FLAPS / SLATS TRANSITION / EXTENDED 200 KIAS OR LESS. ARRESTING HOOK TRANSITION / EXTENDED 450 KIAS OR LESS.' },
      { label: 'Canopy and Deck Limits', value: 'CANOPY FULL OPEN FOR TAXI 20 KNOTS OR LESS. STATIONARY OR TOWING WITH CANOPY FULL OPEN 32 KNOTS OR LESS. TIRES AND NOSEWHEEL STEERING ON DECK 176 KNOTS GROUNDSPEED OR LESS.' },
      { label: 'Hot Refueling', value: 'HOT REFUELING FUEL LEVEL 2,800 POUNDS OR LESS IF PRECHECK UNSUCCESSFUL.' },
      { label: 'Crosswind Limits', value: 'SINGLE AIRCRAFT DRY RUNWAY 20 KNOTS, WET RUNWAY 15 KNOTS, SECTION TAKEOFF 10 KNOTS, BANNER TOW 10 KNOTS, NWS OFF / FAILED 15 KNOTS.' },
      { label: 'High Gain Nosewheel Steering', value: 'HIGH GAIN NOSEWHEEL STEERING SHALL BE USED FOR LOW SPEED TAXI OPERATIONS ONLY, LESS THAN 10 KNOTS GROUNDSPEED.' },
      { label: 'FCLP Landing Configurations', value: 'FCLP LANDINGS ARE AUTHORIZED ONLY WITH CLEAN LOADING AND FULL FLAPS, OR PYLONS ALONE / PYLONS WITH EMPTY PMBRS OR BRU-38A AND FULL FLAPS.' },
      { label: 'Landing Sink Rate', value: 'FOR LANDINGS IN A CONFIGURATION OTHER THAN AUTHORIZED FCLP CONFIGURATIONS, SINK RATE SHALL NOT EXCEED 600 FPM.' },
      { label: 'Banner Tow Limits', value: 'MAX ALTITUDE 20,000 FEET MSL. MAX AIRSPEED 220 KIAS. MAX BANK ANGLE 45 DEGREES. MAX AOA 18 UNITS.' },
      { label: 'Banner Release Limits', value: 'MINIMUM BANNER RELEASE ALTITUDE 500 FEET AGL. BANNER RELEASE AIRSPEED 140 TO 200 KIAS. FOR RELEASE BETWEEN 140 AND 150 KIAS USE ONE-HALF FLAPS.' },
      { label: 'Prohibited Maneuvers', value: 'INTENTIONAL SPINS OR TAILSLIDES ARE PROHIBITED. SUSTAINED ZERO OR NEGATIVE G FLIGHT FOR MORE THAN 30 SECONDS IS PROHIBITED.' },
    ],
  },
};

document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  initializeApp();
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (['discussion', 'documents', 'boldface'].includes(hash)) {
      switchPanel(hash);
    }
  });
});

async function initializeApp() {
  loadAndSwitch('T-6B');
}

async function loadAndSwitch(ac) {
  const key = ac.toLowerCase().replace('-', '');
  if (!acData[ac]) {
    showLoading(true);
    try {
      const discussRes = await fetch(`data/${key}/discuss-data.json?v=20260429d`, { cache: 'no-store' });
      if (!discussRes.ok) throw new Error(`discussion ${discussRes.status}`);
      acData[ac] = await discussRes.json();
    } catch (error) {
      console.error('Failed to load', ac, error);
      showLoading(false);
      const message = `<div class="empty-state">Could not load data for ${ac}.<br>Make sure <code>data/${key}/discuss-data.json</code> is reachable from the browser.<br>If you opened <code>index.html</code> directly, use a local web server or the published site instead of <code>file://</code>.</div>`;
      document.getElementById('discussion-content').innerHTML = message;
      const studyEl = document.getElementById('boldface-content');
      if (studyEl) {
        studyEl.innerHTML = message;
      }
      return;
    }
  }

  currentAC = ac;
  blockFilter = 'ALL';
  mediaFilter = 'ALL';
  searchTerm = '';
  quizState = {
    mode: 'procedure',
    question: null,
    revealed: false,
    checked: false,
  };
  showLoading(false);

  document.querySelectorAll('.ac-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.ac === ac);
  });

  const statusEl = document.getElementById('header-status');
  if (statusEl) statusEl.textContent = `A/C: ${ac}`;
  renderPanel(currentPanel);
}

function showLoading(on) {
  const el = document.getElementById('loading-overlay');
  if (el) el.style.display = on ? 'flex' : 'none';
}

function buildNav() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = PANEL_NAV.map(link => `
    <a class="nav-link${link.id === currentPanel ? ' active' : ''}" href="#${link.id}" id="nav-${link.id}"
       onclick="switchPanel('${link.id}'); return false;">${link.icon}${link.label}</a>
  `).join('');
}

function switchPanel(panel) {
  currentPanel = panel;
  blockFilter = 'ALL';
  mediaFilter = 'ALL';
  searchTerm = '';
  document.querySelectorAll('.content-panel').forEach(node => node.classList.remove('active'));
  document.getElementById(`panel-${panel}`)?.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(node => node.classList.toggle('active', node.id === `nav-${panel}`));
  renderPanel(panel);
  window.location.hash = panel;
  document.getElementById('sidebar')?.classList.remove('mobile-open');
}

function renderPanel(panel) {
  const data = acData[currentAC];
  if (!data) return;
  if (panel === 'discussion') renderDiscussion(data);
  if (panel === 'documents') renderDocuments(data);
  if (panel === 'boldface') renderStudyPanel();
}

function renderDiscussion(data) {
  const el = document.getElementById('discussion-content');
  const filterBar = document.getElementById('disc-filter-bar');
  const countEl = document.getElementById('disc-count');
  if (!el) return;

  const items = normalizeDiscussionItems(applyDiscussionOverrides(preprocessDiscussionItems(data.discussionItems || [])));
  const blocksSeen = new Set();
  const blocks = [];
  items.forEach(item => {
    if (item.blockCode && !blocksSeen.has(item.blockCode)) {
      blocksSeen.add(item.blockCode);
      blocks.push({ code: item.blockCode, title: item.blockTitle || item.blockCode });
    }
  });

  const mediaTypes = [...new Set(items.map(item => item.media).filter(Boolean))].sort();

  if (filterBar) {
    const searchEl = document.getElementById('disc-search');
    if (searchEl) searchEl.value = searchTerm;
    filterBar.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <span style="font-family:var(--mono);font-size:9px;color:var(--text-muted);letter-spacing:2px;margin-right:2px;">BLOCK</span>
        <button class="filter-btn${blockFilter === 'ALL' ? ' active' : ''}" onclick="setBlockFilter('ALL')">ALL</button>
        ${blocks.map(block => `<button class="filter-btn${blockFilter === block.code ? ' active' : ''}" title="${block.title}" onclick="setBlockFilter('${block.code}')">${block.code}</button>`).join('')}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:8px;">
        <span style="font-family:var(--mono);font-size:9px;color:var(--text-muted);letter-spacing:2px;margin-right:2px;">MEDIA</span>
        <button class="filter-btn${mediaFilter === 'ALL' ? ' active' : ''}" onclick="setMediaFilter('ALL')">ALL</button>
        ${mediaTypes.map(media => `<button class="filter-btn${mediaFilter === media ? ' active' : ''}" onclick="setMediaFilter('${media}')">${media}</button>`).join('')}
      </div>`;
  }

  let filtered = items;
  if (blockFilter !== 'ALL') filtered = filtered.filter(item => item.blockCode === blockFilter);
  if (mediaFilter !== 'ALL') filtered = filtered.filter(item => item.media === mediaFilter);
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.discussText?.toLowerCase().includes(term) ||
      item.blockTitle?.toLowerCase().includes(term) ||
      item.eventCode?.toLowerCase().includes(term) ||
      item.resolvedEventCode?.toLowerCase().includes(term) ||
      item.resolvedEventTitle?.toLowerCase().includes(term) ||
      item.topics?.some(topic => topic.toLowerCase().includes(term)) ||
      item.sourceRefs?.some(ref =>
        ref.location?.toLowerCase().includes(term) ||
        ref.shortName?.toLowerCase().includes(term) ||
        ref.docId?.toLowerCase().includes(term)
      )
    );
  }

  if (countEl) {
    const parts = [];
    if (blockFilter !== 'ALL') parts.push(`Block: ${blockFilter}`);
    if (mediaFilter !== 'ALL') parts.push(`Media: ${mediaFilter}`);
    if (searchTerm) parts.push(`"${searchTerm}"`);
    countEl.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}${parts.length ? ` - ${parts.join(' - ')}` : ' total'}`;
  }

  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state">NO DISCUSSION ITEMS MATCH YOUR FILTER<br>Try adjusting the block, media type, or search.</div>`;
    return;
  }

  const grouped = groupDiscussionForDisplay(filtered);
  let globalIdx = 0;
  el.innerHTML = grouped.map(group => `
    <div class="phase-block">
      <div class="phase-label">${group.blockCode} - ${group.title}</div>
      <div class="discussion-list">
        ${group.events.map(eventGroup => renderEventGroup(eventGroup, () => ++globalIdx)).join('')}
      </div>
    </div>
  `).join('');
}

function renderEventGroup(eventGroup, nextIndex) {
  const eventId = slugifyEventId(eventGroup.eventCode);
  const previewText = eventGroup.items
    .map(item => getDiscussDisplayText(item))
    .filter(Boolean)
    .join(', ');
  return `
    <section class="event-section" id="event-${eventId}">
      <button class="event-section-header" type="button" onclick="toggleEventSection('${eventId}')">
        <div class="event-section-code">${highlight(eventGroup.eventCode, searchTerm)}</div>
        <div class="event-section-title">${highlight(previewText || eventGroup.eventTitle, searchTerm)}</div>
        <div class="event-section-chevron" aria-hidden="true"></div>
      </button>
      <ul class="event-bullet-list event-bullet-list-hidden" id="event-list-${eventId}">
        ${eventGroup.items.map(item => renderDiscussRow(item, nextIndex())).join('')}
      </ul>
    </section>
  `;
}

function renderDiscussRow(item, idx) {
  const hasRefs = Array.isArray(item.sourceRefs) && item.sourceRefs.length > 0;
  const primaryRef = hasRefs ? item.sourceRefs[0] : null;
  const additionalRefs = hasRefs ? item.sourceRefs.slice(1) : [];
  const displayText = getDiscussDisplayText(item);
  const itemText = highlight(displayText, searchTerm);
  const primaryUrl = primaryRef ? getPdfUrl(primaryRef.docId, primaryRef.file, primaryRef.pageStart) : '';

  return `
    <li class="discuss-bullet-item" id="disc-${item.id}">
      <div class="discuss-list-main">
        <div class="discuss-list-content">
          ${primaryUrl
            ? `<a class="discuss-item-link" href="${primaryUrl}" target="_blank" rel="noopener">${itemText}</a>`
            : `<div class="discuss-item-link missing-link">${itemText}</div>`}
        </div>
      </div>
      <div class="discuss-list-actions">
        ${additionalRefs.length ? `
          <button class="more-sources-btn" type="button" onclick="toggleMoreSources('${item.id}')">MORE SOURCES (${additionalRefs.length})</button>
          <div class="source-ref-list source-ref-list-hidden more-sources-panel" id="more-sources-${item.id}">
            ${additionalRefs.map(ref => renderSourceRef(ref, false)).join('')}
          </div>
        ` : ''}
      </div>
    </li>
  `;
}

function renderSourceRef(ref, isPrimary = false) {
  const pdfUrl = getPdfUrl(ref.docId, ref.file, ref.pageStart);
  return `
    <div class="source-ref${isPrimary ? ' primary' : ''}">
      <div class="source-ref-header">
        <span class="source-ref-doc">${escHtml(ref.shortName || ref.docId)}</span>
        ${ref.score ? `<span class="source-ref-score">SCORE ${Math.round(ref.score)}</span>` : ''}
      </div>
      <div class="source-ref-location">${escHtml(ref.location || ref.heading || '')}</div>
      ${ref.snippet ? `<div class="source-ref-snippet">${escHtml(ref.snippet.trim().substring(0, 240))}${ref.snippet.length > 240 ? '...' : ''}</div>` : ''}
      ${pdfUrl ? `<a class="source-ref-link" href="${pdfUrl}" target="_blank" rel="noopener">OPEN PDF - page ${ref.pageStart} -></a>` : ''}
    </div>
  `;
}

function toggleMoreSources(id) {
  const el = document.getElementById(`more-sources-${id}`);
  if (!el) return;
  el.classList.toggle('source-ref-list-hidden');
}

function toggleEventSection(eventId) {
  const section = document.getElementById(`event-${eventId}`);
  const list = document.getElementById(`event-list-${eventId}`);
  if (!section || !list) return;
  const isOpen = section.classList.contains('open');
  section.classList.toggle('open', !isOpen);
  list.classList.toggle('event-bullet-list-hidden', isOpen);
}

function setBlockFilter(code) {
  blockFilter = code;
  renderDiscussion(acData[currentAC]);
}

function setMediaFilter(media) {
  mediaFilter = media;
  renderDiscussion(acData[currentAC]);
}

function handleSearch(value) {
  searchTerm = value;
  renderDiscussion(acData[currentAC]);
}

function renderDocuments(data) {
  const el = document.getElementById('documents-content');
  if (!el) return;

  const refCounts = {};
  data.discussionItems.forEach(item => {
    item.sourceRefs?.forEach(ref => {
      refCounts[ref.docId] = (refCounts[ref.docId] || 0) + 1;
    });
  });

  const byType = {};
  data.documents.forEach(doc => {
    const type = (doc.type || 'other').toLowerCase();
    if (!byType[type]) byType[type] = [];
    byType[type].push(doc);
  });

  const typeOrder = ['natops', 'fti', 'mcg', 'cnatrainst', 'checklist', 'supporting', 'other'];
  const sortedTypes = Object.keys(byType).sort((a, b) => {
    const ai = typeOrder.indexOf(a);
    const bi = typeOrder.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });

  el.innerHTML = sortedTypes.map(type => `
    <div class="section-divider">${type.toUpperCase()}</div>
    <div class="docs-grid">${byType[type].map(doc => {
      const count = refCounts[doc.id] || 0;
      const pdfPath = getPdfUrl(doc.id, doc.file);
      return `
        <div class="doc-row">
          <div class="doc-icon">${ICONS.doc}</div>
          <div class="doc-info">
            <div class="doc-name">${escHtml(doc.fullName || doc.shortName || doc.id)}</div>
            <div class="doc-pub">${escHtml(doc.pubNumber || doc.id)}</div>
            ${count ? `<div class="doc-ref-count">Referenced in ${count} discussion item${count !== 1 ? 's' : ''}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;align-items:flex-end;">
            ${pdfPath
              ? `<a class="doc-open-btn" href="${pdfPath}" target="_blank" rel="noopener">OPEN PDF -></a>`
              : `<span class="doc-open-btn disabled">NOT LINKED</span>`}
            ${count ? `<button class="doc-open-btn" onclick="filterByDoc('${doc.id}')">VIEW REFS</button>` : ''}
          </div>
        </div>
      `;
    }).join('')}</div>
  `).join('');
}

function getPdfUrl(docId, file, pageStart) {
  const data = acData[currentAC];
  const document = data?.documents?.find(doc => doc.id === docId);
  const baseUrl = document?.url || (file ? `pdfs/raw/${file}` : '');
  if (!baseUrl) return '';
  return pageStart ? `${baseUrl}#page=${pageStart}` : baseUrl;
}

function filterByDoc(docId) {
  switchPanel('discussion');
  searchTerm = docId;
  renderDiscussion(acData[currentAC]);
}

function normalizeDiscussionItems(items) {
  const currentEventByBlock = {};
  return items.map((item, index) => {
    const blockCode = item.blockCode || 'OTHER';
    const explicitCode = normalizeEventCode(item.eventCode);
    const textCode = extractEventCode(item.discussText);
    const refCode = extractEventCodeList(item.eventRefs || [], blockCode, currentEventByBlock[blockCode]);
    const resolvedEventCode = explicitCode || textCode || refCode || currentEventByBlock[blockCode] || blockCode;
    currentEventByBlock[blockCode] = resolvedEventCode;

    const resolvedEventTitle = explicitCode || textCode
      ? cleanEventTitle(item.discussText, resolvedEventCode, item.blockTitle)
      : cleanEventTitle(item.discussText, null, item.blockTitle);

    return {
      ...item,
      _originalIndex: index,
      resolvedEventCode,
      resolvedEventTitle: resolvedEventTitle || resolvedEventCode,
    };
  });
}

function preprocessDiscussionItems(items) {
  const expanded = [];

  items.forEach((item, index) => {
    const split = splitEmbeddedEventTransition(item);
    if (!split) {
      expanded.push({ ...item, _sourceIndex: index });
      return;
    }

    if (split.currentText) {
      expanded.push({
        ...item,
        discussText: split.currentText,
        _sourceIndex: index,
      });
    }

    expanded.push({
      ...item,
      id: `${item.id || `item-${index}`}-split-${split.nextCode.toLowerCase()}`,
      discussText: `${split.nextCode} ${split.nextText}`.trim(),
      eventCode: split.nextCode,
      topics: split.nextText ? [split.nextText] : item.topics,
      _sourceIndex: index + 0.1,
      _syntheticSplit: true,
    });
  });

  return expanded;
}

function applyDiscussionOverrides(items) {
  const overrides = DISCUSSION_OVERRIDES[currentAC];
  if (!overrides) return items;

  let result = [...items];
  Object.entries(overrides).forEach(([blockCode, replacementItems]) => {
    const matching = result
      .map((item, index) => ({ item, index }))
      .filter(entry => entry.item.blockCode === blockCode);

    if (!matching.length) return;

    const firstIndex = matching[0].index;
    const template = matching[0].item;
    const originalByText = new Map();
    matching.forEach(({ item }) => {
      const key = String(item.discussText || '').trim().toUpperCase();
      if (!originalByText.has(key)) {
        originalByText.set(key, item);
      }
    });

    const synthetic = replacementItems.map((replacement, idx) => {
      const matchedOriginal = originalByText.get(String(replacement.discussText || '').trim().toUpperCase()) || template;
      return {
        ...matchedOriginal,
        id: `${matchedOriginal.id || `${blockCode}-${idx}`}-override-${replacement.eventCode.toLowerCase()}-${idx}`,
        eventCode: replacement.eventCode,
        eventRefs: [replacement.eventCode],
        discussText: `${replacement.eventCode} ${replacement.discussText}`.trim(),
        topics: [replacement.discussText],
        _overrideBlock: blockCode,
        _sourceIndex: (template._sourceIndex ?? firstIndex) + idx * 0.001,
      };
    });

    const before = result.slice(0, firstIndex);
    const after = result.slice(firstIndex).filter(item => item.blockCode !== blockCode);
    result = [...before, ...synthetic, ...after];
  });

  return result;
}

function splitEmbeddedEventTransition(item) {
  const text = String(item.discussText || '').trim();
  if (!text) return null;

  const matches = [...text.toUpperCase().matchAll(/\b([A-Z]{1,5}[0-9]{2,}[A-Z0-9]*)\b/g)];
  if (!matches.length) return null;

  const first = matches[0];
  if (first.index === 0) return null;

  const nextCode = first[1];
  const currentText = text.slice(0, first.index).trim().replace(/[;,:-]\s*$/, '').trim();
  const nextText = text.slice(first.index + nextCode.length).trim();

  if (!currentText || !nextText) return null;
  return { currentText, nextCode, nextText };
}

function groupDiscussionForDisplay(items) {
  const blockMap = new Map();

  items.forEach(item => {
    const blockCode = item.blockCode || 'OTHER';
    if (!blockMap.has(blockCode)) {
      blockMap.set(blockCode, {
        blockCode,
        title: item.blockTitle || blockCode,
        order: item._originalIndex ?? 0,
        events: [],
        eventMap: new Map(),
      });
    }

    const blockGroup = blockMap.get(blockCode);
    const eventKey = item.resolvedEventCode || blockCode;
    if (!blockGroup.eventMap.has(eventKey)) {
      const eventGroup = {
        eventCode: eventKey,
        eventTitle: item.resolvedEventTitle || eventKey,
        order: item._originalIndex ?? 0,
        media: new Set(),
        items: [],
      };
      blockGroup.eventMap.set(eventKey, eventGroup);
      blockGroup.events.push(eventGroup);
    }

    const eventGroup = blockGroup.eventMap.get(eventKey);
    if ((!eventGroup.eventTitle || eventGroup.eventTitle === eventKey) && item.resolvedEventTitle) {
      eventGroup.eventTitle = item.resolvedEventTitle;
    }
    if (item.media) eventGroup.media.add(item.media);
    eventGroup.items.push(item);
  });

  return [...blockMap.values()]
    .sort((a, b) => a.order - b.order)
    .map(blockGroup => ({
      blockCode: blockGroup.blockCode,
      title: blockGroup.title,
      events: blockGroup.events
        .sort((a, b) => a.order - b.order)
        .map(eventGroup => ({
          ...eventGroup,
          media: [...eventGroup.media],
        })),
    }));
}

function getDiscussDisplayText(item) {
  const text = (item.discussText || '').trim();
  const eventCode = item.resolvedEventCode || normalizeEventCode(item.eventCode);
  if (!text) return item.resolvedEventTitle || eventCode || 'Discussion item';

  if (eventCode) {
    const leadingPattern = new RegExp(`^(?:HUD\\s+)?${escapeRegExp(eventCode)}\\b\\s*[-:]*\\s*`, 'i');
    const cleaned = text.replace(leadingPattern, '').trim();
    if (cleaned) return cleaned;
  }

  return text;
}

function normalizeEventCode(value) {
  if (!value) return '';
  const trimmed = String(value).trim().toUpperCase();
  return /^[A-Z]{1,5}[0-9]{2,}[A-Z0-9]*$/.test(trimmed) ? trimmed : '';
}

function extractEventCode(text) {
  if (!text) return '';
  const match = String(text).toUpperCase().match(/\b[A-Z]{1,5}[0-9]{2,}[A-Z0-9]*\b/);
  return match ? match[0] : '';
}

function extractEventCodeList(values, blockCode = '', activeCode = '') {
  const codes = values
    .map(value => normalizeEventCode(value))
    .filter(Boolean);

  const normalizedBlock = normalizeEventCode(blockCode);
  const normalizedActive = normalizeEventCode(activeCode);

  if (normalizedActive && codes.includes(normalizedActive)) {
    return normalizedActive;
  }

  const specificCandidates = codes.filter(code => code !== normalizedBlock && code.length > normalizedBlock.length);
  if (specificCandidates.length) {
    return specificCandidates[0];
  }

  return codes.find(code => code !== normalizedBlock) || normalizedBlock || '';
}

function cleanEventTitle(text, eventCode, fallback) {
  const raw = (text || '').trim();
  if (!raw) return fallback || eventCode || '';
  if (!eventCode) return raw;
  const leadingPattern = new RegExp(`^(?:HUD\\s+)?${escapeRegExp(eventCode)}\\b\\s*[-:]*\\s*`, 'i');
  const cleaned = raw.replace(leadingPattern, '').trim();
  return cleaned || fallback || eventCode;
}

function renderStudyPanel() {
  const el = document.getElementById('boldface-content');
  if (!el) return;

  const study = STUDY_DATA[currentAC];
  if (!study) {
    el.innerHTML = `<div class="empty-state">No study data found for ${currentAC}.<br>Check the hardcoded study dataset in <code>js/app.js</code>.</div>`;
    return;
  }

  el.innerHTML = `
    <div class="study-shell">
      <div class="study-tab-row">
        <button class="study-tab${studyTab === 'procedures' ? ' active' : ''}" type="button" onclick="setStudyTab('procedures')">EPs</button>
        <button class="study-tab${studyTab === 'limits' ? ' active' : ''}" type="button" onclick="setStudyTab('limits')">Limits</button>
        <button class="study-tab${studyTab === 'quiz' ? ' active' : ''}" type="button" onclick="setStudyTab('quiz')">Quiz</button>
      </div>
      <div class="study-pane">
        ${studyTab === 'procedures' ? renderStudyProcedures(study) : ''}
        ${studyTab === 'limits' ? renderStudyLimits(study) : ''}
        ${studyTab === 'quiz' ? renderStudyQuiz(study) : ''}
      </div>
    </div>
  `;
}

function setStudyTab(tab) {
  studyTab = tab;
  if (tab === 'quiz' && !quizState.question) {
    buildQuizQuestion('procedure');
  }
  renderStudyPanel();
}

function renderStudyProcedures(study) {
  return `
    <div class="study-summary">
      <div class="study-summary-copy">
        <div class="study-summary-title">${study.title} emergency procedures</div>
        <div class="study-summary-text">Memorize from the cited NATOPS or checklist page. Use the quiz tab to practice the sequence from memory.</div>
      </div>
      <div class="study-summary-badge">${study.emergencyProcedures.length} procedures</div>
    </div>
    <div class="study-card-grid">
      ${study.emergencyProcedures.map(proc => renderProcedureCard(proc)).join('')}
    </div>
  `;
}

function renderProcedureCard(proc) {
  const sourceLink = getStudySourceUrl(proc.source);
  return `
    <article class="study-card">
      <div class="study-card-head">
        <div>
          <div class="study-card-kicker">${escHtml(proc.category || 'Emergency Procedure')}</div>
          <h3 class="study-card-title">${escHtml(proc.title)}</h3>
        </div>
        ${sourceLink ? `<a class="study-source-link" href="${sourceLink}" target="_blank" rel="noopener">${escHtml(proc.source.label || 'Source')} p.${proc.source.page}</a>` : ''}
      </div>
      <ol class="study-steps">
        ${proc.steps.map(step => `<li>${escHtml(step)}</li>`).join('')}
      </ol>
      ${proc.note ? `<div class="study-note">${escHtml(proc.note)}</div>` : ''}
      ${proc.source?.location ? `<div class="study-source-meta">${escHtml(proc.source.location)}</div>` : ''}
    </article>
  `;
}

function renderStudyLimits(study) {
  return `
    <div class="study-summary">
      <div class="study-summary-copy">
        <div class="study-summary-title">${study.title} operating limits</div>
        <div class="study-summary-text">Compact NATOPS-backed reference for high-frequency numbers and configuration limits.</div>
      </div>
      <div class="study-summary-badge">${study.limits.length} limit items</div>
    </div>
    <div class="limits-grid">
      ${study.limits.map(limit => renderLimitCard(limit)).join('')}
    </div>
  `;
}

function renderLimitCard(limit) {
  const sourceLink = getStudySourceUrl(limit.source);
  return `
    <article class="limit-card">
      <div class="limit-label">${escHtml(limit.label)}</div>
      <div class="limit-value">${escHtml(limit.value)}</div>
      <div class="limit-footer">
        ${limit.source?.location ? `<span>${escHtml(limit.source.location)}</span>` : '<span></span>'}
        ${sourceLink ? `<a class="study-source-link" href="${sourceLink}" target="_blank" rel="noopener">${escHtml(limit.source.label || 'Source')} p.${limit.source.page}</a>` : ''}
      </div>
    </article>
  `;
}

function renderStudyQuiz(study) {
  const question = quizState.question;
  const isProcedure = quizState.mode === 'procedure';
  return `
    <div class="quiz-toolbar">
      <div class="quiz-toggle">
        <button class="study-tab${quizState.mode === 'procedure' ? ' active' : ''}" type="button" onclick="buildQuizQuestion('procedure')">EP Quiz</button>
        <button class="study-tab${quizState.mode === 'limit' ? ' active' : ''}" type="button" onclick="buildQuizQuestion('limit')">Limits Quiz</button>
      </div>
      <button class="doc-open-btn" type="button" onclick="buildQuizQuestion('${quizState.mode}')">Next Question</button>
    </div>
    ${question ? `
      <div class="quiz-card">
        <div class="quiz-card-head">
          <div class="quiz-kicker">${isProcedure ? 'Procedure Sequence' : 'Limits Recall'}</div>
          <h3 class="quiz-title">${escHtml(question.title)}</h3>
          ${question.prompt ? `<div class="quiz-prompt">${escHtml(question.prompt)}</div>` : ''}
        </div>
        ${isProcedure ? renderProcedureQuizBody(question) : renderLimitQuizBody(question)}
        <div class="quiz-actions">
          <button class="doc-open-btn" type="button" onclick="checkQuizAnswers()">Check Answers</button>
          <button class="doc-open-btn" type="button" onclick="revealQuizAnswers()">Reveal Answers</button>
          ${question.source ? `<a class="doc-open-btn" href="${getStudySourceUrl(question.source)}" target="_blank" rel="noopener">Open Source</a>` : ''}
        </div>
      </div>
    ` : `<div class="empty-state">No quiz items available for ${currentAC}.</div>`}
  `;
}

function renderProcedureQuizBody(question) {
  return `
    <div class="quiz-answer-list">
      ${question.steps.map((step, index) => `
        <div class="quiz-row">
          <label class="quiz-row-label">${index + 1}.</label>
          <div class="quiz-row-main">
            <input class="quiz-input" type="text" id="quiz-procedure-${index}" placeholder="Type step ${index + 1}">
            <div class="quiz-feedback" id="quiz-feedback-${index}">${quizState.revealed ? escHtml(step) : ''}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLimitQuizBody(question) {
  return `
    <div class="quiz-answer-list">
      <div class="quiz-row">
        <label class="quiz-row-label">A.</label>
        <div class="quiz-row-main">
          <input class="quiz-input" type="text" id="quiz-limit-answer" placeholder="Type the limit or value">
          <div class="quiz-feedback" id="quiz-feedback-limit">${quizState.revealed ? escHtml(question.answer) : ''}</div>
        </div>
      </div>
    </div>
  `;
}

function buildQuizQuestion(mode = 'procedure') {
  const study = STUDY_DATA[currentAC];
  if (!study) return;
  const bank = mode === 'procedure' ? study.emergencyProcedures : study.limits;
  if (!bank.length) return;

  const picked = bank[Math.floor(Math.random() * bank.length)];
  quizState = {
    mode,
    revealed: false,
    checked: false,
    question: mode === 'procedure'
      ? { ...picked }
      : {
          title: picked.label,
          prompt: 'State the limit as published.',
          answer: picked.value,
          source: picked.source,
        },
  };
  renderStudyPanel();
}

function revealQuizAnswers() {
  quizState.revealed = true;
  renderStudyPanel();
}

function checkQuizAnswers() {
  if (!quizState.question) return;
  quizState.checked = true;

  if (quizState.mode === 'procedure') {
    quizState.question.steps.forEach((step, index) => {
      const input = document.getElementById(`quiz-procedure-${index}`);
      const feedback = document.getElementById(`quiz-feedback-${index}`);
      if (!input || !feedback) return;
      const result = gradeAnswer(step, input.value);
      feedback.textContent = `${result.label}: ${step}`;
      feedback.className = `quiz-feedback ${result.className}`;
    });
    return;
  }

  const input = document.getElementById('quiz-limit-answer');
  const feedback = document.getElementById('quiz-feedback-limit');
  if (!input || !feedback) return;
  const result = gradeAnswer(quizState.question.answer, input.value);
  feedback.textContent = `${result.label}: ${quizState.question.answer}`;
  feedback.className = `quiz-feedback ${result.className}`;
}

function gradeAnswer(expected, actual) {
  const normalizedExpected = normalizeQuizText(expected);
  const normalizedActual = normalizeQuizText(actual);

  if (!normalizedActual) {
    return { label: 'No answer', className: 'quiz-feedback-miss' };
  }
  if (normalizedActual === normalizedExpected) {
    return { label: 'Correct', className: 'quiz-feedback-correct' };
  }

  const expectedTokens = normalizedExpected.split(' ').filter(Boolean);
  const actualTokens = normalizedActual.split(' ').filter(Boolean);
  const overlap = expectedTokens.filter(token => actualTokens.includes(token)).length;
  const ratio = expectedTokens.length ? overlap / expectedTokens.length : 0;

  if (ratio >= 0.65) {
    return { label: 'Close', className: 'quiz-feedback-close' };
  }
  return { label: 'Incorrect', className: 'quiz-feedback-miss' };
}

function normalizeQuizText(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function getStudySourceUrl(source) {
  if (!source) return '';
  if (source.url) return source.url;
  const baseUrl = source.file ? `pdfs/raw/${source.file}` : '';
  return source.page ? `${baseUrl}#page=${source.page}` : baseUrl;
}

function highlight(text, term) {
  if (!term || !text) return text || '';
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(escaped, 'gi'), match => `<mark>${match}</mark>`);
}

function escHtml(value) {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugifyEventId(value) {
  return String(value || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function toggleMobileMenu() {
  document.getElementById('sidebar')?.classList.toggle('mobile-open');
}
