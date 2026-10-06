export interface ThemePalette {
  id: string;
  name: string;
  group: "Catppuccin" | "Dracula" | "Gruvbox" | "Solarized" | "Tomorrow";
  isDark: boolean;
  windowBackground: string;
  cardBackground: string;
  cardBorder: string;
  cardHover: string;
  inputBackground: string;
  textPrimary: string;
  textSecondary: string;
  textDim: string;
  accentPrimary: string;
  accentCyan: string;
  accentBlue: string;
  networkBitColor: string;
  subnetBitColor: string;
  hostBitColor: string;
  separatorBitColor: string;
  rfc1918Bg: string;
  rfc1918Fg: string;
  publicBg: string;
  publicFg: string;
  cgnatBg: string;
  cgnatFg: string;
  loopbackBg: string;
  loopbackFg: string;
  reservedBg: string;
  reservedFg: string;
}

export const THEMES: ThemePalette[] = [
  // 1. Catppuccin Mocha (Default Dark)
  {
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    group: "Catppuccin",
    isDark: true,
    windowBackground: "#11111b",
    cardBackground: "#1e1e2e",
    cardBorder: "#313244",
    cardHover: "#28283d",
    inputBackground: "#181825",
    textPrimary: "#cdd6f4",
    textSecondary: "#a6adc8",
    textDim: "#6c7086",
    accentPrimary: "#89b4fa",
    accentCyan: "#74c7ec",
    accentBlue: "#89b4fa",
    networkBitColor: "#74c7ec",
    subnetBitColor: "#cba6f7",
    hostBitColor: "#a6e3a1",
    separatorBitColor: "#6c7086",
    rfc1918Bg: "rgba(166, 227, 161, 0.15)",
    rfc1918Fg: "#a6e3a1",
    publicBg: "rgba(137, 180, 250, 0.15)",
    publicFg: "#89b4fa",
    cgnatBg: "rgba(250, 179, 135, 0.15)",
    cgnatFg: "#fab387",
    loopbackBg: "rgba(148, 226, 213, 0.15)",
    loopbackFg: "#94e2d5",
    reservedBg: "rgba(203, 166, 247, 0.15)",
    reservedFg: "#cba6f7",
  },
  // 2. Catppuccin Macchiato
  {
    id: "catppuccin-macchiato",
    name: "Catppuccin Macchiato",
    group: "Catppuccin",
    isDark: true,
    windowBackground: "#181926",
    cardBackground: "#24273a",
    cardBorder: "#363a4f",
    cardHover: "#2d3148",
    inputBackground: "#1e2030",
    textPrimary: "#cad3f5",
    textSecondary: "#a5adcb",
    textDim: "#6e738d",
    accentPrimary: "#8aadf4",
    accentCyan: "#7dc4e4",
    accentBlue: "#8aadf4",
    networkBitColor: "#7dc4e4",
    subnetBitColor: "#c6a0f6",
    hostBitColor: "#a6da95",
    separatorBitColor: "#6e738d",
    rfc1918Bg: "rgba(166, 218, 149, 0.15)",
    rfc1918Fg: "#a6da95",
    publicBg: "rgba(138, 173, 244, 0.15)",
    publicFg: "#8aadf4",
    cgnatBg: "rgba(245, 169, 127, 0.15)",
    cgnatFg: "#f5a97f",
    loopbackBg: "rgba(139, 213, 202, 0.15)",
    loopbackFg: "#8bd5ca",
    reservedBg: "rgba(198, 160, 246, 0.15)",
    reservedFg: "#c6a0f6",
  },
  // 3. Catppuccin Frappé
  {
    id: "catppuccin-frappe",
    name: "Catppuccin Frappé",
    group: "Catppuccin",
    isDark: true,
    windowBackground: "#232634",
    cardBackground: "#303446",
    cardBorder: "#414559",
    cardHover: "#393d52",
    inputBackground: "#292c3c",
    textPrimary: "#c6d0f5",
    textSecondary: "#a5adce",
    textDim: "#737994",
    accentPrimary: "#8caaee",
    accentCyan: "#85c1dc",
    accentBlue: "#8caaee",
    networkBitColor: "#85c1dc",
    subnetBitColor: "#ca9ee6",
    hostBitColor: "#a6d189",
    separatorBitColor: "#737994",
    rfc1918Bg: "rgba(166, 209, 137, 0.15)",
    rfc1918Fg: "#a6d189",
    publicBg: "rgba(140, 170, 238, 0.15)",
    publicFg: "#8caaee",
    cgnatBg: "rgba(239, 159, 118, 0.15)",
    cgnatFg: "#ef9f76",
    loopbackBg: "rgba(129, 200, 190, 0.15)",
    loopbackFg: "#81c8be",
    reservedBg: "rgba(202, 158, 230, 0.15)",
    reservedFg: "#ca9ee6",
  },
  // 4. Catppuccin Latte (Light)
  {
    id: "catppuccin-latte",
    name: "Catppuccin Latte",
    group: "Catppuccin",
    isDark: false,
    windowBackground: "#dce0e8",
    cardBackground: "#eff1f5",
    cardBorder: "#ccd0da",
    cardHover: "#e6e9ef",
    inputBackground: "#ffffff",
    textPrimary: "#4c4f69",
    textSecondary: "#6c6f85",
    textDim: "#9ca0b0",
    accentPrimary: "#1e66f5",
    accentCyan: "#209fb5",
    accentBlue: "#1e66f5",
    networkBitColor: "#209fb5",
    subnetBitColor: "#8839ef",
    hostBitColor: "#40a02b",
    separatorBitColor: "#9ca0b0",
    rfc1918Bg: "rgba(64, 160, 43, 0.12)",
    rfc1918Fg: "#40a02b",
    publicBg: "rgba(30, 102, 245, 0.12)",
    publicFg: "#1e66f5",
    cgnatBg: "rgba(254, 100, 11, 0.12)",
    cgnatFg: "#fe640b",
    loopbackBg: "rgba(23, 146, 153, 0.12)",
    loopbackFg: "#179299",
    reservedBg: "rgba(136, 57, 239, 0.12)",
    reservedFg: "#8839ef",
  },
  // 5. Dracula
  {
    id: "dracula",
    name: "Dracula",
    group: "Dracula",
    isDark: true,
    windowBackground: "#1e1f29",
    cardBackground: "#282a36",
    cardBorder: "#44475a",
    cardHover: "#343746",
    inputBackground: "#21222c",
    textPrimary: "#f8f8f2",
    textSecondary: "#bd93f9",
    textDim: "#6272a4",
    accentPrimary: "#bd93f9",
    accentCyan: "#8be9fd",
    accentBlue: "#bd93f9",
    networkBitColor: "#8be9fd",
    subnetBitColor: "#bd93f9",
    hostBitColor: "#50fa7b",
    separatorBitColor: "#6272a4",
    rfc1918Bg: "rgba(80, 250, 123, 0.15)",
    rfc1918Fg: "#50fa7b",
    publicBg: "rgba(139, 233, 253, 0.15)",
    publicFg: "#8be9fd",
    cgnatBg: "rgba(255, 184, 108, 0.15)",
    cgnatFg: "#ffb86c",
    loopbackBg: "rgba(139, 233, 253, 0.15)",
    loopbackFg: "#8be9fd",
    reservedBg: "rgba(255, 121, 198, 0.15)",
    reservedFg: "#ff79c6",
  },
  // 6. Gruvbox Dark
  {
    id: "gruvbox-dark",
    name: "Gruvbox Dark",
    group: "Gruvbox",
    isDark: true,
    windowBackground: "#1d2021",
    cardBackground: "#282828",
    cardBorder: "#3c3836",
    cardHover: "#32302f",
    inputBackground: "#1d2021",
    textPrimary: "#ebdbb2",
    textSecondary: "#a89984",
    textDim: "#928374",
    accentPrimary: "#83a598",
    accentCyan: "#8ec07c",
    accentBlue: "#458588",
    networkBitColor: "#8ec07c",
    subnetBitColor: "#d3869b",
    hostBitColor: "#b8bb26",
    separatorBitColor: "#928374",
    rfc1918Bg: "rgba(184, 187, 38, 0.15)",
    rfc1918Fg: "#b8bb26",
    publicBg: "rgba(131, 165, 152, 0.15)",
    publicFg: "#83a598",
    cgnatBg: "rgba(254, 128, 25, 0.15)",
    cgnatFg: "#fe8019",
    loopbackBg: "rgba(142, 192, 124, 0.15)",
    loopbackFg: "#8ec07c",
    reservedBg: "rgba(211, 134, 155, 0.15)",
    reservedFg: "#d3869b",
  },
  // 7. Gruvbox Light
  {
    id: "gruvbox-light",
    name: "Gruvbox Light",
    group: "Gruvbox",
    isDark: false,
    windowBackground: "#f2e5bc",
    cardBackground: "#fbf1c7",
    cardBorder: "#ebdbb2",
    cardHover: "#f4e8ba",
    inputBackground: "#ffffff",
    textPrimary: "#3c3836",
    textSecondary: "#7c6f64",
    textDim: "#928374",
    accentPrimary: "#076678",
    accentCyan: "#427b58",
    accentBlue: "#458588",
    networkBitColor: "#427b58",
    subnetBitColor: "#8f3f71",
    hostBitColor: "#79740e",
    separatorBitColor: "#928374",
    rfc1918Bg: "rgba(121, 116, 14, 0.15)",
    rfc1918Fg: "#79740e",
    publicBg: "rgba(7, 102, 120, 0.15)",
    publicFg: "#076678",
    cgnatBg: "rgba(175, 58, 3, 0.15)",
    cgnatFg: "#af3a03",
    loopbackBg: "rgba(66, 123, 88, 0.15)",
    loopbackFg: "#427b58",
    reservedBg: "rgba(143, 63, 113, 0.15)",
    reservedFg: "#8f3f71",
  },
  // 8. Solarized Dark
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    group: "Solarized",
    isDark: true,
    windowBackground: "#00212b",
    cardBackground: "#002b36",
    cardBorder: "#073642",
    cardHover: "#053a48",
    inputBackground: "#001e26",
    textPrimary: "#839496",
    textSecondary: "#93a1a1",
    textDim: "#586e75",
    accentPrimary: "#268bd2",
    accentCyan: "#2aa198",
    accentBlue: "#268bd2",
    networkBitColor: "#2aa198",
    subnetBitColor: "#6c71c4",
    hostBitColor: "#859900",
    separatorBitColor: "#586e75",
    rfc1918Bg: "rgba(133, 153, 0, 0.15)",
    rfc1918Fg: "#859900",
    publicBg: "rgba(38, 139, 210, 0.15)",
    publicFg: "#268bd2",
    cgnatBg: "rgba(203, 75, 22, 0.15)",
    cgnatFg: "#cb4b16",
    loopbackBg: "rgba(42, 161, 152, 0.15)",
    loopbackFg: "#2aa198",
    reservedBg: "rgba(108, 113, 196, 0.15)",
    reservedFg: "#6c71c4",
  },
  // 9. Solarized Light
  {
    id: "solarized-light",
    name: "Solarized Light",
    group: "Solarized",
    isDark: false,
    windowBackground: "#eee8d5",
    cardBackground: "#fdf6e3",
    cardBorder: "#e0d8c3",
    cardHover: "#f5edd6",
    inputBackground: "#ffffff",
    textPrimary: "#657b83",
    textSecondary: "#586e75",
    textDim: "#93a1a1",
    accentPrimary: "#268bd2",
    accentCyan: "#2aa198",
    accentBlue: "#268bd2",
    networkBitColor: "#2aa198",
    subnetBitColor: "#6c71c4",
    hostBitColor: "#859900",
    separatorBitColor: "#93a1a1",
    rfc1918Bg: "rgba(133, 153, 0, 0.15)",
    rfc1918Fg: "#859900",
    publicBg: "rgba(38, 139, 210, 0.15)",
    publicFg: "#268bd2",
    cgnatBg: "rgba(203, 75, 22, 0.15)",
    cgnatFg: "#cb4b16",
    loopbackBg: "rgba(42, 161, 152, 0.15)",
    loopbackFg: "#2aa198",
    reservedBg: "rgba(108, 113, 196, 0.15)",
    reservedFg: "#6c71c4",
  },
  // 10. Tomorrow Night Blue
  {
    id: "tomorrow-night-blue",
    name: "Tomorrow Night Blue",
    group: "Tomorrow",
    isDark: true,
    windowBackground: "#001b3d",
    cardBackground: "#002451",
    cardBorder: "#00346e",
    cardHover: "#002d64",
    inputBackground: "#001a3a",
    textPrimary: "#ffffff",
    textSecondary: "#bbdaff",
    textDim: "#7285b7",
    accentPrimary: "#bbdaff",
    accentCyan: "#99ffff",
    accentBlue: "#bbdaff",
    networkBitColor: "#99ffff",
    subnetBitColor: "#ebbbff",
    hostBitColor: "#d1f1a9",
    separatorBitColor: "#7285b7",
    rfc1918Bg: "rgba(209, 241, 169, 0.18)",
    rfc1918Fg: "#d1f1a9",
    publicBg: "rgba(187, 218, 255, 0.18)",
    publicFg: "#bbdaff",
    cgnatBg: "rgba(255, 197, 143, 0.18)",
    cgnatFg: "#ffc58f",
    loopbackBg: "rgba(153, 255, 255, 0.18)",
    loopbackFg: "#99ffff",
    reservedBg: "rgba(235, 187, 255, 0.18)",
    reservedFg: "#ebbbff",
  },
  // 11. Tomorrow Night
  {
    id: "tomorrow-night",
    name: "Tomorrow Night",
    group: "Tomorrow",
    isDark: true,
    windowBackground: "#151718",
    cardBackground: "#1d1f21",
    cardBorder: "#282a2e",
    cardHover: "#25282b",
    inputBackground: "#181a1b",
    textPrimary: "#c5c8c6",
    textSecondary: "#969896",
    textDim: "#707880",
    accentPrimary: "#81a2be",
    accentCyan: "#8abeb7",
    accentBlue: "#81a2be",
    networkBitColor: "#8abeb7",
    subnetBitColor: "#b294bb",
    hostBitColor: "#b5bd68",
    separatorBitColor: "#969896",
    rfc1918Bg: "rgba(181, 189, 104, 0.15)",
    rfc1918Fg: "#b5bd68",
    publicBg: "rgba(129, 162, 190, 0.15)",
    publicFg: "#81a2be",
    cgnatBg: "rgba(222, 147, 95, 0.15)",
    cgnatFg: "#de935f",
    loopbackBg: "rgba(138, 190, 183, 0.15)",
    loopbackFg: "#8abeb7",
    reservedBg: "rgba(178, 148, 187, 0.15)",
    reservedFg: "#b294bb",
  },
  // 12. Tomorrow Night Eighties
  {
    id: "tomorrow-night-eighties",
    name: "Tomorrow Night Eighties",
    group: "Tomorrow",
    isDark: true,
    windowBackground: "#232323",
    cardBackground: "#2d2d2d",
    cardBorder: "#393939",
    cardHover: "#353535",
    inputBackground: "#252525",
    textPrimary: "#cccccc",
    textSecondary: "#999999",
    textDim: "#777777",
    accentPrimary: "#6699cc",
    accentCyan: "#66cccc",
    accentBlue: "#6699cc",
    networkBitColor: "#66cccc",
    subnetBitColor: "#cc99cc",
    hostBitColor: "#99cc99",
    separatorBitColor: "#999999",
    rfc1918Bg: "rgba(153, 204, 153, 0.15)",
    rfc1918Fg: "#99cc99",
    publicBg: "rgba(102, 153, 204, 0.15)",
    publicFg: "#6699cc",
    cgnatBg: "rgba(249, 145, 87, 0.15)",
    cgnatFg: "#f99157",
    loopbackBg: "rgba(102, 204, 204, 0.15)",
    loopbackFg: "#66cccc",
    reservedBg: "rgba(204, 153, 204, 0.15)",
    reservedFg: "#cc99cc",
  },
  // 13. Tomorrow Night Bright
  {
    id: "tomorrow-night-bright",
    name: "Tomorrow Night Bright",
    group: "Tomorrow",
    isDark: true,
    windowBackground: "#000000",
    cardBackground: "#101010",
    cardBorder: "#2a2a2a",
    cardHover: "#1c1c1c",
    inputBackground: "#080808",
    textPrimary: "#eaeaea",
    textSecondary: "#969896",
    textDim: "#707070",
    accentPrimary: "#7aa6da",
    accentCyan: "#70c0b1",
    accentBlue: "#7aa6da",
    networkBitColor: "#70c0b1",
    subnetBitColor: "#c397d8",
    hostBitColor: "#b9ca4a",
    separatorBitColor: "#969896",
    rfc1918Bg: "rgba(185, 202, 74, 0.15)",
    rfc1918Fg: "#b9ca4a",
    publicBg: "rgba(122, 166, 218, 0.15)",
    publicFg: "#7aa6da",
    cgnatBg: "rgba(231, 140, 69, 0.15)",
    cgnatFg: "#e78c45",
    loopbackBg: "rgba(112, 192, 177, 0.15)",
    loopbackFg: "#70c0b1",
    reservedBg: "rgba(195, 151, 216, 0.15)",
    reservedFg: "#c397d8",
  },
  // 14. Tomorrow Day (Light)
  {
    id: "tomorrow-day",
    name: "Tomorrow Day",
    group: "Tomorrow",
    isDark: false,
    windowBackground: "#f5f5f5",
    cardBackground: "#ffffff",
    cardBorder: "#d6d6d6",
    cardHover: "#f0f0f0",
    inputBackground: "#ffffff",
    textPrimary: "#4d4d4c",
    textSecondary: "#8e908c",
    textDim: "#a0a0a0",
    accentPrimary: "#4271ae",
    accentCyan: "#3e999f",
    accentBlue: "#4271ae",
    networkBitColor: "#3e999f",
    subnetBitColor: "#8959a8",
    hostBitColor: "#718c00",
    separatorBitColor: "#8e908c",
    rfc1918Bg: "rgba(113, 140, 0, 0.12)",
    rfc1918Fg: "#718c00",
    publicBg: "rgba(66, 113, 174, 0.12)",
    publicFg: "#4271ae",
    cgnatBg: "rgba(234, 183, 0, 0.12)",
    cgnatFg: "#eab700",
    loopbackBg: "rgba(62, 153, 159, 0.12)",
    loopbackFg: "#3e999f",
    reservedBg: "rgba(137, 89, 168, 0.12)",
    reservedFg: "#8959a8",
  },
];

export const DEFAULT_THEME_ID = "catppuccin-mocha";

export function getThemeById(id: string): ThemePalette {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

export function applyThemeToDocument(theme: ThemePalette): void {
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.dataset.themeMode = theme.isDark ? "dark" : "light";

  // Apply CSS custom properties
  root.style.setProperty("--bg-app", theme.windowBackground);
  root.style.setProperty("--bg-card", theme.cardBackground);
  root.style.setProperty("--bg-card-hover", theme.cardHover);
  root.style.setProperty("--bg-input", theme.inputBackground);
  root.style.setProperty("--border-color", theme.cardBorder);
  root.style.setProperty("--border-color-focus", theme.accentPrimary);

  root.style.setProperty("--text-main", theme.textPrimary);
  root.style.setProperty("--text-muted", theme.textSecondary);
  root.style.setProperty("--text-dim", theme.textDim);

  root.style.setProperty("--accent-primary", theme.accentPrimary);
  root.style.setProperty("--accent-primary-hover", theme.accentBlue);
  root.style.setProperty("--accent-cyan", theme.accentCyan);
  root.style.setProperty("--accent-blue", theme.accentBlue);

  // Bit visualizer colors from ThemeManager.swift
  root.style.setProperty("--bit-net-color", theme.networkBitColor);
  root.style.setProperty("--bit-net-bg", `${theme.networkBitColor}26`);
  root.style.setProperty("--bit-net-border", `${theme.networkBitColor}66`);

  root.style.setProperty("--bit-subnet-color", theme.subnetBitColor);
  root.style.setProperty("--bit-subnet-bg", `${theme.subnetBitColor}26`);
  root.style.setProperty("--bit-subnet-border", `${theme.subnetBitColor}66`);

  root.style.setProperty("--bit-host-color", theme.hostBitColor);
  root.style.setProperty("--bit-host-bg", `${theme.hostBitColor}26`);
  root.style.setProperty("--bit-host-border", `${theme.hostBitColor}66`);

  root.style.setProperty("--bit-sep-color", theme.separatorBitColor);

  // Pill badge colors
  root.style.setProperty("--badge-rfc1918-bg", theme.rfc1918Bg);
  root.style.setProperty("--badge-rfc1918-fg", theme.rfc1918Fg);
  root.style.setProperty("--badge-public-bg", theme.publicBg);
  root.style.setProperty("--badge-public-fg", theme.publicFg);
  root.style.setProperty("--badge-cgnat-bg", theme.cgnatBg);
  root.style.setProperty("--badge-cgnat-fg", theme.cgnatFg);
  root.style.setProperty("--badge-loopback-bg", theme.loopbackBg);
  root.style.setProperty("--badge-loopback-fg", theme.loopbackFg);
  root.style.setProperty("--badge-reserved-bg", theme.reservedBg);
  root.style.setProperty("--badge-reserved-fg", theme.reservedFg);
}
