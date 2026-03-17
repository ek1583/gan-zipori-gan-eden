// ===== Default Data Tree =====
const DEFAULT_DATA = {
  folders: [
    {
      id: 'holidays',
      name: 'חגי ישראל',
      icon: '🕎',
      ttsText: 'חגי ישראל',
      colorTheme: 'holidays',
      children: [
        {
          id: 'tishrei',
          name: 'חגי תשרי',
          icon: '🍯',
          ttsText: 'חגי תשרי',
          colorTheme: 'holidays',
          children: [
            { id: 'rosh-hashana', name: 'ראש השנה', icon: '🍎', ttsText: 'ראש השנה', colorTheme: 'holidays', children: [], content: [] },
            { id: 'yom-kippur', name: 'יום כיפור', icon: '🕊️', ttsText: 'יום כיפור', colorTheme: 'holidays', children: [], content: [] },
            { id: 'sukkot', name: 'סוכות', icon: '🛖', ttsText: 'סוכות', colorTheme: 'holidays', children: [], content: [] },
            { id: 'simchat-torah', name: 'שמחת תורה', icon: '📜', ttsText: 'שמחת תורה', colorTheme: 'holidays', children: [], content: [] }
          ],
          content: []
        },
        { id: 'hanukkah', name: 'חנוכה', icon: '🕯️', ttsText: 'חנוכה', colorTheme: 'holidays', children: [], content: [] },
        { id: 'tu-bishvat', name: 'ט"ו בשבט', icon: '🌳', ttsText: 'טו בשבט', colorTheme: 'holidays', children: [], content: [] },
        { id: 'family-day', name: 'יום המשפחה', icon: '👨‍👩‍👧‍👦', ttsText: 'יום המשפחה', colorTheme: 'holidays', children: [], content: [] },
        { id: 'pesach', name: 'פסח', icon: '🫓', ttsText: 'פסח', colorTheme: 'holidays', children: [], content: [] },
        { id: 'lag-baomer', name: 'ל"ג בעומר', icon: '🔥', ttsText: 'לג בעומר', colorTheme: 'holidays', children: [], content: [] },
        { id: 'shavuot', name: 'שבועות', icon: '🌾', ttsText: 'שבועות', colorTheme: 'holidays', children: [], content: [] }
      ],
      content: []
    },
    {
      id: 'seasons',
      name: 'עונות השנה',
      icon: '🌍',
      ttsText: 'עונות השנה',
      colorTheme: 'seasons',
      children: [
        { id: 'autumn', name: 'סתיו', icon: '🍂', ttsText: 'סתיו', colorTheme: 'seasons', seasonEffect: 'leaves', children: [], content: [] },
        { id: 'winter', name: 'חורף', icon: '🌧️', ttsText: 'חורף', colorTheme: 'seasons', seasonEffect: 'rain', children: [], content: [] },
        { id: 'spring', name: 'אביב', icon: '🌸', ttsText: 'אביב', colorTheme: 'seasons', seasonEffect: 'flowers', children: [], content: [] },
        { id: 'summer', name: 'קיץ', icon: '☀️', ttsText: 'קיץ', colorTheme: 'seasons', seasonEffect: 'sun', children: [], content: [] }
      ],
      content: []
    },
    {
      id: 'learning',
      name: 'מרכז למידה',
      icon: '📚',
      ttsText: 'מרכז למידה',
      colorTheme: 'learning',
      children: [
        { id: 'letters', name: 'קסם האותיות', icon: '✨', ttsText: 'קסם האותיות', colorTheme: 'learning', activityType: 'tracing-letters', children: [], content: [] },
        { id: 'numbers', name: 'עולם המספרים', icon: '🔢', ttsText: 'עולם המספרים', colorTheme: 'learning', activityType: 'tracing-numbers', children: [], content: [] }
      ],
      content: []
    },
    {
      id: 'resilience',
      name: 'חוסן - שאגת הארי',
      icon: '🦁',
      ttsText: 'חוסן, שאגת הארי',
      colorTheme: 'resilience',
      children: [
        { id: 'bravery', name: 'גבורה', icon: '💪', ttsText: 'גבורה', colorTheme: 'resilience', children: [], content: [] },
        { id: 'unity', name: 'אחדות', icon: '🤝', ttsText: 'אחדות', colorTheme: 'resilience', children: [], content: [] },
        { id: 'calm', name: 'פעילויות הפגה', icon: '🧘', ttsText: 'פעילויות הפגה', colorTheme: 'resilience', children: [], content: [] }
      ],
      content: []
    }
  ]
};

// Hebrew letters for tracing
const HEBREW_LETTERS = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'];
const HEBREW_FINAL_LETTERS = ['ך','ם','ן','ף','ץ'];
const DIGITS = ['0','1','2','3','4','5','6','7','8','9'];

// Icon options for editor
const ICON_OPTIONS = [
  '🎨','🖍️','📚','📖','🎵','🎶','🎮','🧩','🎲','🎯',
  '⭐','🌟','💫','✨','🌈','🦋','🐝','🐞','🐣','🐠',
  '🌻','🌺','🌸','🌼','🍀','🌳','🌴','🎄','🍎','🍇',
  '🎂','🎁','🎈','🎉','🎊','🏠','🏫','🚌','✈️','🚀',
  '❤️','💖','💝','🧡','💛','💚','💙','💜','🤎','🖤',
  '🕎','🕯️','📜','🍯','🛖','🌾','🔥','🫓','🕊️','🍂',
  '🌧️','☀️','🌸','🦁','💪','🤝','🧘','👨‍👩‍👧‍👦','🎓','🔢'
];

// Coloring outline templates (SVG path data for themed coloring pages)
const COLORING_TEMPLATES = {
  'default': {
    name: 'כוכב',
    viewBox: '0 0 400 400',
    paths: [
      'M200,50 L230,150 L340,150 L250,210 L280,320 L200,260 L120,320 L150,210 L60,150 L170,150 Z'
    ]
  },
  'rosh-hashana': {
    name: 'תפוח ודבש',
    viewBox: '0 0 400 400',
    paths: [
      'M200,80 C140,80 80,130 80,200 C80,280 140,340 200,340 C260,340 320,280 320,200 C320,130 260,80 200,80 Z',
      'M200,80 C200,80 190,40 210,30 C230,20 220,60 200,80 Z',
      'M130,360 L130,380 L270,380 L270,360 C270,350 130,350 130,360 Z'
    ]
  },
  'sukkot': {
    name: 'סוכה',
    viewBox: '0 0 400 400',
    paths: [
      'M60,160 L340,160 L340,350 L60,350 Z',
      'M40,140 L360,140 L360,170 L40,170 Z',
      'M50,120 L200,60 L350,120 Z',
      'M150,350 L150,250 L250,250 L250,350'
    ]
  },
  'hanukkah': {
    name: 'חנוכייה',
    viewBox: '0 0 400 400',
    paths: [
      'M200,100 L200,300',
      'M80,140 L80,300','M120,140 L120,300','M160,140 L160,300',
      'M240,140 L240,300','M280,140 L280,300','M320,140 L320,300',
      'M60,300 L340,300 L340,330 L60,330 Z',
      'M160,330 L240,330 L230,360 L170,360 Z'
    ]
  },
  'tu-bishvat': {
    name: 'עץ',
    viewBox: '0 0 400 400',
    paths: [
      'M180,220 L220,220 L220,360 L180,360 Z',
      'M200,60 C120,60 60,120 60,200 C60,260 120,280 200,280 C280,280 340,260 340,200 C340,120 280,60 200,60 Z'
    ]
  },
  'pesach': {
    name: 'מצה',
    viewBox: '0 0 400 400',
    paths: [
      'M80,120 L320,120 C340,120 350,130 350,150 L350,280 C350,300 340,310 320,310 L80,310 C60,310 50,300 50,280 L50,150 C50,130 60,120 80,120 Z',
      'M120,160 L120,165','M180,180 L180,185','M250,150 L250,155','M150,250 L150,255','M220,230 L220,235','M300,200 L300,205','M100,210 L100,215'
    ]
  }
};
