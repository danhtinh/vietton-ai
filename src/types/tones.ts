export type ToneId = 'ngang' | 'sac' | 'huyen' | 'hoi' | 'nga' | 'nang';

export interface ToneColorTheme {
  primary: string; // Tailwind color class or hex
  borderDefault: string;
  borderActive: string;
  bgCard: string;
  bgCardActive: string;
  badgeBg: string;
  badgeText: string;
  arrowBg: string;
  arrowText: string;
  glowColor: string;
  hexAccent: string;
  strokeHex: string;
}

export interface ToneDefinition {
  id: ToneId;
  order: number;
  name: string; // "Thanh Ngang"
  shortName: string; // "Ngang"
  diacriticName: string; // "Không dấu"
  diacriticSymbol: string; // "—"
  arrowSymbol: string; // "➔", "↗", "↘", "⤹", "⤻↗", "⤓"
  arrowDirectionLabel: string; // "Giọng đi ngang"
  instruction: string; // Câu hướng dẫn cách đọc
  shortTip: string; // Mẹo ngắn dễ nhớ cho trẻ em & người nước ngoài
  pitchContourDescription: string;
  pitchPoints: number[]; // e.g. [3, 3, 3] for mid flat, [3, 4, 5] for rising
  audioPitchConfig: {
    baseFreq: number;
    endFreq: number;
    midFreq?: number;
    duration: number;
    hasGlottalBreak?: boolean;
    hasAbruptStop?: boolean;
  };
  theme: ToneColorTheme;
  examples: {
    ma: { word: string; meaning: string; emoji: string };
    ba: { word: string; meaning: string; emoji: string };
    ca: { word: string; meaning: string; emoji: string };
    la: { word: string; meaning: string; emoji: string };
  };
}

export type SyllableBase = 'ma' | 'ba' | 'ca' | 'la';
