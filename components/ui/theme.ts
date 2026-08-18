export const C = {
  bg: "#F5F1E8",
  card: "#FBF9F5",
  cardDim: "#EFEAE0",
  ink: "#1A1917",
  body: "#6E6A5F",
  bodyLight: "#94907F",
  border: "#DBD4C4",
  borderStrong: "#C7BFA9",
  accent: "#C1502E",
  accentDark: "#9C3E22",
  accentTint: "#F4E3DB",
  green: "#4B7A5C",
  greenTint: "#E4ECE3",
  amber: "#B4802C",
  amberTint: "#F1E7D3",
  red: "#C1502E",
  redTint: "#F4E0D8",
  gray: "#9B9686",
  grayTint: "#EAE6DA",
};

export const HEALTH_COLOR = {
  NORMAL: C.green,
  "BUILDING UP": C.amber,
  CRITICAL: C.red,
  green: C.green,
  amber: C.amber,
  red: C.red,
  gray: C.gray,
} as const;

export const HEALTH_TINT = {
  NORMAL: C.greenTint,
  "BUILDING UP": C.amberTint,
  CRITICAL: C.redTint,
  green: C.greenTint,
  amber: C.amberTint,
  red: C.redTint,
  gray: C.grayTint,
} as const;
