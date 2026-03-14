export interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  isPro: boolean;
  fonts: {
    heading: string;
    body: string;
    googleFontsUrl: string;
  };
  colors: {
    background: string;
    cardBackground: string;
    primaryDark: string;
    primaryAccent: string;
    secondaryAccent: string;
    textPrimary: string;
    textBody: string;
    textMuted: string;
    textFaint: string;
    border: string;
  };
  style: {
    cardRadius: string;
    badgeRadius: string;
    borderStyle: 'solid' | 'dashed';
    borderWidth: string;
    shadowStyle: 'subtle' | 'offset' | 'none';
    hasDecorativeElements: boolean;
    sectionNumberStyle: 'badge' | 'faded-large' | 'inline';
  };
}

export const templates: Record<string, ProposalTemplate> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Clean and professional with warm tones.',
    isPro: false,
    fonts: {
      heading: "'DM Serif Display', serif",
      body: "'DM Sans', sans-serif",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap",
    },
    colors: {
      background: '#F4F1EB',
      cardBackground: '#FFFFFF',
      primaryDark: '#0A0A0A',
      primaryAccent: '#E8825C',
      secondaryAccent: '#f9b564',
      textPrimary: '#0A0A0A',
      textBody: '#444444',
      textMuted: '#888888',
      textFaint: '#BBBBBB',
      border: '#E0DDD6',
    },
    style: {
      cardRadius: '16px',
      badgeRadius: '12px',
      borderStyle: 'solid',
      borderWidth: '1px',
      shadowStyle: 'subtle',
      hasDecorativeElements: false,
      sectionNumberStyle: 'inline',
    },
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Bold and energetic with blue accents.',
    isPro: true,
    fonts: {
      heading: "'Fraunces', serif",
      body: "'Outfit', sans-serif",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800&display=swap",
    },
    colors: {
      background: '#FAFAF8',
      cardBackground: '#FFFFFF',
      primaryDark: '#1E1B4B',
      primaryAccent: '#2563EB',
      secondaryAccent: '#34D399',
      textPrimary: '#1E1B4B',
      textBody: '#6B7280',
      textMuted: '#9CA3AF',
      textFaint: '#D1D5DB',
      border: '#E5E7EB',
    },
    style: {
      cardRadius: '24px',
      badgeRadius: '16px',
      borderStyle: 'dashed',
      borderWidth: '2px',
      shadowStyle: 'offset',
      hasDecorativeElements: true,
      sectionNumberStyle: 'badge',
    },
  },
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    description: 'Refined and understated with soft purple tones.',
    isPro: true,
    fonts: {
      heading: "'Fraunces', serif",
      body: "'DM Sans', sans-serif",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=DM+Sans:wght@300;400;500;600;700&display=swap",
    },
    colors: {
      background: '#FAFAF8',
      cardBackground: '#FFFFFF',
      primaryDark: '#2D2A3E',
      primaryAccent: '#7C5CFC',
      secondaryAccent: '#C47A5A',
      textPrimary: '#2D2A3E',
      textBody: '#706D80',
      textMuted: '#8A8698',
      textFaint: '#C5C1D0',
      border: '#EDEBF0',
    },
    style: {
      cardRadius: '24px',
      badgeRadius: '16px',
      borderStyle: 'solid',
      borderWidth: '1px',
      shadowStyle: 'none',
      hasDecorativeElements: false,
      sectionNumberStyle: 'badge',
    },
  },
  soft: {
    id: 'soft',
    name: 'Soft',
    description: 'Warm and approachable with soft tones.',
    isPro: true,
    fonts: {
      heading: "'DM Sans', sans-serif",
      body: "'DM Sans', sans-serif",
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
    },
    colors: {
      background: '#F5EFE7',
      cardBackground: '#FFFFFF',
      primaryDark: '#2D2A3E',
      primaryAccent: '#E879A6',
      secondaryAccent: '#E879A6',
      textPrimary: '#2D2A3E',
      textBody: '#706D80',
      textMuted: '#8A8698',
      textFaint: '#C5C1D0',
      border: '#E5E0D8',
    },
    style: {
      cardRadius: '16px',
      badgeRadius: '12px',
      borderStyle: 'solid',
      borderWidth: '1px',
      shadowStyle: 'none',
      hasDecorativeElements: false,
      sectionNumberStyle: 'badge',
    },
  },
};
