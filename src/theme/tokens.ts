export const colors = {
  bg: "#f6f8fa",
  paper: "#ffffff",
  ink: "#0e1c2e",
  muted: "#5a6878",
  line: "rgba(14,28,46,0.12)",
  blue: "#16497e",
  blueDeep: "#0d2c50",
  blueInk: "#081c36",
  blueSoft: "#e7eef6",
  gold: "#a98439",
  goldBright: "#c8a154",
  goldSoft: "#f4ecda",
  error: "#b3463c",

  // Dark panel text (on blueInk)
  darkHeading: "#fdfeff",
  darkBody: "#d6e2ef",
  darkSecondary: "#9bb3ce",
  darkHairline: "rgba(214,226,239,0.14)",

  // Placeholder
  placeholder: "#94a0ae",

  // Scrim
  scrim: "rgba(8,24,45,0.4)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 22,
  xl: 28,
  xxl: 34,
  section: 44,
  hero: 60,
} as const;

export const radii = {
  card: 20,
  sheet: 30,
  button: 999,
  chip: 999,
  hero: 28,
} as const;

export const fontSizes = {
  display: 32,
  h2: 24,
  h3: 20,
  bodyLg: 17,
  body: 15,
  bodySm: 13,
  label: 11,
  button: 15,
  tab: 10.5,
} as const;

export const lineHeights = {
  display: 36,
  h2: 28,
  h3: 24,
  bodyLg: 25,
  body: 22,
  bodySm: 18,
  label: 14,
  button: 20,
  tab: 12,
} as const;

export const fontWeights = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const fonts = {
  fraunces: "Fraunces_500Medium",
  frauncesItalic: "Fraunces_500Medium_Italic",
  hankenRegular: "HankenGrotesk_400Regular",
  hankenMedium: "HankenGrotesk_500Medium",
  hankenSemibold: "HankenGrotesk_600SemiBold",
  hankenBold: "HankenGrotesk_700Bold",
} as const;

export const shadows = {
  card: {
    shadowColor: "#0a1e37",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 8,
  },
  cardContact: {
    shadowColor: "#0a1e37",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  hero: {
    shadowColor: "#0a1e37",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.28,
    shadowRadius: 48,
    elevation: 16,
  },
} as const;

export const animation = {
  micro: 150,
  state: 220,
  press: 120,
  sheet: 280,
} as const;
