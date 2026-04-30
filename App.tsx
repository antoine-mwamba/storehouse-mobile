import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, SafeAreaView, ActivityIndicator, KeyboardAvoidingView,
  Platform, Modal, FlatList, Linking, Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Lora_400Regular, Lora_400Regular_Italic, Lora_700Bold } from '@expo-google-fonts/lora';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

// ── API ──────────────────────────────────────────────────────────────────────
const BASE = 'http://localhost:8000';

async function apiWithToken<T>(path: string, token: string | null, opts?: RequestInit): Promise<T | null> {
  try {
    const headers: any = { 'Content-Type': 'application/json', ...(opts?.headers ?? {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await fetch(`${BASE}${path}`, { ...opts, headers });
    if (!r.ok) return null;
    return r.json() as Promise<T>;
  } catch { return null; }
}

async function api<T>(path: string, opts?: RequestInit): Promise<T | null> {
  try {
    const r = await fetch(`${BASE}${path}`, opts);
    if (!r.ok) return null;
    return r.json() as Promise<T>;
  } catch { return null; }
}

// ── Auth Context ──────────────────────────────────────────────────────────────
const TOKEN_KEY = 'storehouse_jwt';

type AuthUser = { id: number; name: string; email: string; avatar_url?: string; is_paid?: boolean };
type AuthCtxType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (identityToken: string, userData?: any) => Promise<void>;
  logout: () => void;
};

const AuthCtx = createContext<AuthCtxType>({
  user: null, token: null, loading: true,
  loginWithGoogle: async () => {}, loginWithApple: async () => {}, logout: () => {},
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]   = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
      if (saved) {
        const me = await apiWithToken<any>('/auth/me', saved);
        if (me?.user) { setToken(saved); setUser(me.user); }
        else await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      }
      setLoading(false);
    })();
  }, []);

  const _saveLogin = async (data: any) => {
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const loginWithGoogle = async (idToken: string) => {
    const r = await fetch(`${BASE}/auth/google`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });
    if (r.ok) await _saveLogin(await r.json());
  };

  const loginWithApple = async (identityToken: string, userData?: any) => {
    const r = await fetch(`${BASE}/auth/apple`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity_token: identityToken, user_data: userData ?? {} }),
    });
    if (r.ok) await _saveLogin(await r.json());
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    setToken(null); setUser(null);
  };

  return <AuthCtx.Provider value={{ user, token, loading, loginWithGoogle, loginWithApple, logout }}>{children}</AuthCtx.Provider>;
}

const useAuth = () => useContext(AuthCtx);

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  royal: '#002366', denim: '#1560BD', capri: '#00BFFF',
  bg: '#FFFFFF', bg2: '#EFF5FF', border: '#C4D4EE',
  text: '#0D1B3E', muted: '#5A6A8A',
  green: '#22C55E', amber: '#D97706', purple: '#7C3AED', red: '#EF4444',
};

// ── Bible books (static, all 66) ──────────────────────────────────────────────
const OT_BOOKS = [
  { name: 'Genesis', c: 50 }, { name: 'Exodus', c: 40 }, { name: 'Leviticus', c: 27 },
  { name: 'Numbers', c: 36 }, { name: 'Deuteronomy', c: 34 }, { name: 'Joshua', c: 24 },
  { name: 'Judges', c: 21 }, { name: 'Ruth', c: 4 }, { name: '1 Samuel', c: 31 },
  { name: '2 Samuel', c: 24 }, { name: '1 Kings', c: 22 }, { name: '2 Kings', c: 25 },
  { name: '1 Chronicles', c: 29 }, { name: '2 Chronicles', c: 36 }, { name: 'Ezra', c: 10 },
  { name: 'Nehemiah', c: 13 }, { name: 'Esther', c: 10 }, { name: 'Job', c: 42 },
  { name: 'Psalms', c: 150 }, { name: 'Proverbs', c: 31 }, { name: 'Ecclesiastes', c: 12 },
  { name: 'Song of Solomon', c: 8 }, { name: 'Isaiah', c: 66 }, { name: 'Jeremiah', c: 52 },
  { name: 'Lamentations', c: 5 }, { name: 'Ezekiel', c: 48 }, { name: 'Daniel', c: 12 },
  { name: 'Hosea', c: 14 }, { name: 'Joel', c: 3 }, { name: 'Amos', c: 9 },
  { name: 'Obadiah', c: 1 }, { name: 'Jonah', c: 4 }, { name: 'Micah', c: 7 },
  { name: 'Nahum', c: 3 }, { name: 'Habakkuk', c: 3 }, { name: 'Zephaniah', c: 3 },
  { name: 'Haggai', c: 2 }, { name: 'Zechariah', c: 14 }, { name: 'Malachi', c: 4 },
];
const NT_BOOKS = [
  { name: 'Matthew', c: 28 }, { name: 'Mark', c: 16 }, { name: 'Luke', c: 24 },
  { name: 'John', c: 21 }, { name: 'Acts', c: 28 }, { name: 'Romans', c: 16 },
  { name: '1 Corinthians', c: 16 }, { name: '2 Corinthians', c: 13 }, { name: 'Galatians', c: 6 },
  { name: 'Ephesians', c: 6 }, { name: 'Philippians', c: 4 }, { name: 'Colossians', c: 4 },
  { name: '1 Thessalonians', c: 5 }, { name: '2 Thessalonians', c: 3 }, { name: '1 Timothy', c: 6 },
  { name: '2 Timothy', c: 4 }, { name: 'Titus', c: 3 }, { name: 'Philemon', c: 1 },
  { name: 'Hebrews', c: 13 }, { name: 'James', c: 5 }, { name: '1 Peter', c: 5 },
  { name: '2 Peter', c: 3 }, { name: '1 John', c: 5 }, { name: '2 John', c: 1 },
  { name: '3 John', c: 1 }, { name: 'Jude', c: 1 }, { name: 'Revelation', c: 22 },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type Sermon = { id: number; title: string; date_code: string; location: string; year: number; duration_minutes?: number };
type Para   = { number: string | number; text: string; start_time?: number; end_time?: number };
type Verse  = { verse: number; text: string; references_count?: number; speaker?: string };
type Msg    = { role: 'user' | 'assistant'; text: string; sources?: any[] };

// ── Entry-range segment helpers ───────────────────────────────────────────────
type Seg = { text: string; startChar: number; endChar: number; startTime: number; endTime: number; isExact: boolean };

function _normText(s: string): string {
  return s.replace(/['']/g, "'").replace(/[""]/g, '"').replace(/—/g, '--');
}
function _stripParaPrefix(text: string): string {
  return text.replace(/^\d+(?:-\d+)?\s+/, '').trim();
}

/**
 * Build per-paragraph char-range segments from sentence_times entries.
 * Returns { paraSegs: Map<paraIdx, Seg[]>, flat: {paraIdx,segIdx,startTime,endTime}[] }
 */
function buildParagraphSegments(
  paras: Para[],
  sentenceTimes: any[] | null,
): { paraSegs: Map<number, Seg[]>; flat: Array<{ paraIdx: number; segIdx: number; startTime: number; endTime: number }> } {
  const paraSegs = new Map<number, Seg[]>();
  const flat: Array<{ paraIdx: number; segIdx: number; startTime: number; endTime: number }> = [];

  if (!sentenceTimes || sentenceTimes.length === 0) {
    paras.forEach((para, paraIdx) => {
      if (para.start_time != null && para.end_time != null) {
        paraSegs.set(paraIdx, [{ text: para.text, startChar: 0, endChar: para.text.length, startTime: para.start_time, endTime: para.end_time, isExact: false }]);
        flat.push({ paraIdx, segIdx: 0, startTime: para.start_time, endTime: para.end_time });
      }
    });
    flat.sort((a, b) => a.startTime - b.startTime);
    return { paraSegs, flat };
  }

  const paraNumToIdx = new Map<string, number>();
  paras.forEach((para, idx) => { if (para.number != null) paraNumToIdx.set(String(para.number), idx); });

  const entriesByPara = new Map<number, Array<{ startTime: number; endTime: number; stripped: string }>>();
  sentenceTimes.forEach((entry: any) => {
    const stripped = _stripParaPrefix(entry.text || '');
    if (!stripped) return;
    let paraIdx = -1;
    if (entry.para_num != null) {
      const idx = paraNumToIdx.get(String(entry.para_num));
      if (idx != null) paraIdx = idx;
    }
    if (paraIdx === -1) {
      const needle = _normText(stripped.slice(0, 40));
      for (let i = 0; i < paras.length; i++) {
        if (_normText(paras[i].text || '').includes(needle)) { paraIdx = i; break; }
      }
    }
    if (paraIdx === -1) return;
    if (!entriesByPara.has(paraIdx)) entriesByPara.set(paraIdx, []);
    entriesByPara.get(paraIdx)!.push({ startTime: entry.start_time, endTime: entry.end_time, stripped });
  });

  paras.forEach((para, paraIdx) => {
    const bodyText = para.text || '';
    const normBody = _normText(bodyText);
    const paraStart = para.start_time;
    const paraEnd   = para.end_time;
    const entries = (entriesByPara.get(paraIdx) ?? []).sort((a, b) => a.startTime - b.startTime);

    if (entries.length === 0) {
      if (paraStart != null && paraEnd != null) {
        paraSegs.set(paraIdx, [{ text: bodyText, startChar: 0, endChar: bodyText.length, startTime: paraStart, endTime: paraEnd, isExact: false }]);
        flat.push({ paraIdx, segIdx: 0, startTime: paraStart, endTime: paraEnd });
      }
      return;
    }

    const located: Array<{ startChar: number; endChar: number; startTime: number; endTime: number }> = [];
    for (const entry of entries) {
      const normStripped = _normText(entry.stripped);
      let idx = normBody.indexOf(normStripped);
      if (idx === -1) idx = normBody.indexOf(normStripped.slice(0, 50));
      if (idx !== -1) located.push({ startChar: idx, endChar: idx + entry.stripped.length, startTime: entry.startTime, endTime: entry.endTime });
    }

    if (located.length === 0) {
      if (paraStart != null && paraEnd != null) {
        paraSegs.set(paraIdx, [{ text: bodyText, startChar: 0, endChar: bodyText.length, startTime: paraStart, endTime: paraEnd, isExact: false }]);
        flat.push({ paraIdx, segIdx: 0, startTime: paraStart, endTime: paraEnd });
      }
      return;
    }

    located.sort((a, b) => a.startChar - b.startChar);
    const deduped = [located[0]];
    for (let i = 1; i < located.length; i++) {
      if (located[i].startChar >= deduped[deduped.length - 1].endChar) deduped.push(located[i]);
    }

    const paraSeg: Seg[] = [];
    let cursor = 0;
    deduped.forEach((loc, i) => {
      if (loc.startChar > cursor) {
        const gapText = bodyText.slice(cursor, loc.startChar);
        const gapStart = i === 0 ? (paraStart ?? loc.startTime) : deduped[i - 1].endTime;
        if (gapText.trim()) paraSeg.push({ text: gapText, startChar: cursor, endChar: loc.startChar, startTime: gapStart, endTime: loc.startTime, isExact: false });
      }
      const eEnd = Math.min(loc.endChar, bodyText.length);
      paraSeg.push({ text: bodyText.slice(loc.startChar, eEnd), startChar: loc.startChar, endChar: eEnd, startTime: loc.startTime, endTime: loc.endTime, isExact: true });
      cursor = eEnd;
    });
    if (cursor < bodyText.length) {
      const gapText = bodyText.slice(cursor);
      const last = deduped[deduped.length - 1];
      if (gapText.trim()) paraSeg.push({ text: gapText, startChar: cursor, endChar: bodyText.length, startTime: last.endTime, endTime: paraEnd ?? last.endTime, isExact: false });
    }

    if (paraSeg.length > 0) {
      paraSegs.set(paraIdx, paraSeg);
      paraSeg.forEach((seg, segIdx) => flat.push({ paraIdx, segIdx, startTime: seg.startTime, endTime: seg.endTime }));
    }
  });

  flat.sort((a, b) => a.startTime - b.startTime);
  return { paraSegs, flat };
}

// ── Session state (persists across tab switches) ───────────────────────────────
let lastReadSermon: { id: number; title: string; paraIndex: number } | null = null;
let lastReadBible:  { book: string; chapter: number } | null = null;
let chatToday = false;

// ── Shared UI ─────────────────────────────────────────────────────────────────
function RoyalHeader({ title, sub, onBack }: { title: string; sub?: string; onBack?: () => void }) {
  return (
    <View style={s.header}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backBtnText}>‹</Text>
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={s.headerSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function SecLabel({ t: text }: { t: string }) {
  return <Text style={s.sectionLabel}>{text}</Text>;
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const [daily, setDaily]     = useState<any>(null);
  const [stats, setStats]     = useState<any>(null);
  const [profile, setProfile] = useState(false);
  const [, forceRender]       = useState(0);
  const [carouselSlide, setCarouselSlide] = useState(0);

  useEffect(() => {
    api('/quotes/daily').then(d => setDaily(d));
    api('/stats').then(d => setStats(d));
  }, []);

  // re-render when returning to home so "continue" cards show updated state
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => forceRender(n => n + 1));
    return unsub;
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>The Storehouse</Text>
          <Text style={s.headerSub}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={s.avatar} onPress={() => setProfile(true)}>
          <Text style={s.avatarText}>A</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={s.greeting}>{greeting}</Text>

        {/* Daily Card */}
        <View style={s.dailyCard}>
          <View style={s.dailyDecor1} /><View style={s.dailyDecor2} />
          <Text style={s.verseRef}>{daily?.verse?.ref?.toUpperCase() ?? 'JOHN 3:16'}</Text>
          <Text style={s.verseText}>"{daily?.verse?.text ?? 'For God so loved the world…'}"</Text>
          <View style={s.dailyDivider} />
          <Text style={s.quoteText} numberOfLines={5}>"{(daily?.quote?.text ?? 'Faith is the evidence of things not seen.').slice(0, 220).replace(/\s\S+$/, '…')}"</Text>
          <Text style={s.quoteAttr}>— Brother Branham · {daily?.quote?.sermon_title ?? 'Leadership, 1965'}</Text>
          <View style={s.ghostBtns}>
            <TouchableOpacity style={s.ghostBtn}><Text style={s.ghostBtnText}>Save</Text></TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn}><Text style={s.ghostBtnText}>Share</Text></TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.navigate('Sermons')}>
              <Text style={s.ghostBtnText}>Sermon</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Carousel Indicators */}
        <View style={s.carouselIndicators}>
          {[0, 1].map(i => (
            <View key={i} style={[s.carouselDot, carouselSlide === i && s.carouselDotActive]} />
          ))}
        </View>

        {/* Customize Daily Notifications CTA */}
        <TouchableOpacity style={s.notificationsCTA} onPress={() => setProfile(true)}>
          <Text style={s.notificationsCTAText}>Customize Daily Notifications</Text>
        </TouchableOpacity>

        {/* Continue */}
        {(lastReadSermon || lastReadBible) && (
          <>
            <SecLabel t="CONTINUE" />
            <View style={s.card}>
              {lastReadSermon && (
                <TouchableOpacity style={s.resumeRow} onPress={() => navigation.navigate('Sermons')}>
                  <View style={[s.iconBox, { backgroundColor: '#ede9fe' }]}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#7c3aed' }}>S</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.resumeTitle} numberOfLines={1}>{lastReadSermon.title}</Text>
                    <Text style={[s.resumeMeta, { color: T.purple }]}>▶ Resume at ¶{lastReadSermon.paraIndex + 1}</Text>
                  </View>
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>
              )}
              {lastReadSermon && lastReadBible && <View style={s.cardDivider} />}
              {lastReadBible && (
                <TouchableOpacity style={s.resumeRow} onPress={() => navigation.navigate('Bible')}>
                  <View style={[s.iconBox, { backgroundColor: '#fef3c7' }]}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#d97706' }}>B</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.resumeTitle}>{lastReadBible.book} · Ch {lastReadBible.chapter}</Text>
                    <Text style={[s.resumeMeta, { color: T.amber }]}>Continue reading</Text>
                  </View>
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Goals */}
        <SecLabel t="TODAY'S GOALS" />
        <View style={s.goalsGrid}>
          {[
            { label: 'Read a Sermon',  done: !!lastReadSermon },
            { label: 'Daily Quote',    done: !!daily },
            { label: 'Bible Chapter',  done: !!lastReadBible },
            { label: 'Chat Session',   done: chatToday },
          ].map((g, i) => (
            <View key={i} style={[s.goalChip, g.done && s.goalChipDone]}>
              <Text style={[s.goalText, g.done && s.goalTextDone]}>{g.done ? '✓ ' : ''}{g.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Access */}
        <SecLabel t="QUICK ACCESS" />
        <View style={s.quickGrid}>
          {[
            { label: 'Search',  bg: '#eef4ff', color: T.denim,    tab: 'Search' },
            { label: 'Sermons', bg: '#ede9fe', color: T.purple,   tab: 'Sermons' },
            { label: 'Bible',   bg: '#fef3c7', color: T.amber,    tab: 'Bible' },
            { label: 'Chat',    bg: '#dcfce7', color: '#16a34a',  tab: 'Chat' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={[s.quickCard, { backgroundColor: item.bg }]}
              onPress={() => navigation.navigate(item.tab)}>
              <Text style={[s.quickLabel, { color: item.color }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={profile} transparent animationType="slide" onRequestClose={() => setProfile(false)}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setProfile(false)}>
          <View style={s.sheet} onStartShouldSetResponder={() => true}>
            <View style={s.sheetHandle} />
            <View style={s.profileCard}>
              <View style={s.avatar}><Text style={s.avatarText}>{(user?.name?.[0] ?? 'G').toUpperCase()}</Text></View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.resumeTitle}>{user?.name ?? 'Guest'}</Text>
                <Text style={[s.resumeMeta, { color: T.muted }]}>{user?.email ?? ''}</Text>
              </View>
            </View>
            <View style={[s.statsRow, { marginHorizontal: 0 }]}>
              {[
                { stat: stats ? `${Math.round(stats.quotes / 1000)}K+` : '…', label: 'Quotes' },
                { stat: stats ? String(stats.sermons) : '…', label: 'Sermons' },
                { stat: stats ? `${Math.round(stats.verses / 1000)}K+` : '…', label: 'Verses' },
                { stat: stats ? String(stats.streak ?? 0) : '…', label: 'Streak' },
              ].map((item, i) => (
                <View key={i} style={[s.statCell, i < 3 && { borderRightWidth: 1, borderRightColor: T.border }]}>
                  <Text style={s.statNumber}>{item.stat}</Text>
                  <Text style={s.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
            {[
              { label: 'Daily Themes & Nuggets', icon: 'T', iconBg: '#fef3c7', iconColor: '#d97706' },
              { label: 'Analytics',              icon: 'A', iconBg: '#eef4ff', iconColor: T.denim   },
              { label: 'Settings',               icon: 'S', iconBg: T.bg2,     iconColor: T.muted   },
            ].map(item => (
              <TouchableOpacity key={item.label} style={s.settingsRow}>
                <View style={[s.settingsIcon, { backgroundColor: item.iconBg, borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: item.iconColor }}>{item.icon}</Text>
                </View>
                <Text style={s.settingsLabel}>{item.label}</Text>
                <Text style={[s.chevron, { color: T.muted }]}>›</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.settingsRow, { borderBottomWidth: 0, marginTop: 4 }]} onPress={() => { logout(); setProfile(false); }}>
              <Text style={[s.settingsLabel, { color: T.red }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ── SEARCH ────────────────────────────────────────────────────────────────────
function SearchScreen() {
  const [query, setQuery]     = useState('');
  const [mode, setMode]       = useState<'sermons' | 'bible'>('sermons');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<any>(null);

  const SUGGESTIONS = ['faith that moves mountains', 'seven seals', 'holy spirit baptism',
    'pillar of fire', 'serpent seed', 'rapture', 'healing', 'second coming'];

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const path = mode === 'sermons'
      ? `/quotes/search?q=${encodeURIComponent(q)}&limit=30`
      : `/bible/search?q=${encodeURIComponent(q)}&limit=30`;
    const data = await api<any>(path);
    setLoading(false);
    if (mode === 'sermons') setResults(data?.results ?? data?.quotes ?? []);
    else setResults(data?.results ?? []);
  }, [mode]);

  const onType = (v: string) => {
    setQuery(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(v), 400);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Search</Text>
        <View style={s.scopeToggle}>
          <TouchableOpacity style={mode === 'sermons' ? s.scopeActive : undefined}
            onPress={() => { setMode('sermons'); setResults([]); }}>
            <Text style={mode === 'sermons' ? s.scopeActiveText : s.scopeInactiveText}>Sermons</Text>
          </TouchableOpacity>
          <TouchableOpacity style={mode === 'bible' ? s.scopeActive : undefined}
            onPress={() => { setMode('bible'); setResults([]); }}>
            <Text style={mode === 'bible' ? s.scopeActiveText : s.scopeInactiveText}>Bible</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <View style={s.searchBarWrap}>
          <Text style={s.searchIcon}>⊙</Text>
          <TextInput style={s.searchInput} value={query} onChangeText={onType}
            placeholder={`Search ${mode === 'sermons' ? 'sermons & quotes' : 'Bible verses'}…`}
            placeholderTextColor={T.muted} autoCorrect={false} />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <Text style={{ color: T.muted, fontSize: 16, paddingHorizontal: 8 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && <ActivityIndicator style={{ margin: 24 }} color={T.denim} />}

        {!loading && results.length === 0 && query.length === 0 && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            <SecLabel t="SUGGESTIONS" />
            <View style={s.chipRow}>
              {SUGGESTIONS.map(sg => (
                <TouchableOpacity key={sg} style={s.suggChip} onPress={() => { setQuery(sg); search(sg); }}>
                  <Text style={s.suggChipText}>{sg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {!loading && results.length > 0 && (
          <FlatList data={results} keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View style={s.resultCard}>
                {mode === 'sermons' ? (
                  <>
                    <Text style={s.resultText} numberOfLines={4}>{item.text}</Text>
                    {item.sermon_title && (
                      <Text style={s.resultMeta}>— {item.sermon_title}</Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={s.resultMeta}>{item.book} {item.chapter}:{item.verse}</Text>
                    <Text style={s.resultText}>{item.text}</Text>
                  </>
                )}
              </View>
            )}
          />
        )}

        {!loading && results.length === 0 && query.length > 0 && (
          <Text style={{ color: T.muted, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 40 }}>
            No results for "{query}"
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── SERMONS ───────────────────────────────────────────────────────────────────
type SermonFilter = 'All' | 'By Year' | 'By Location' | 'Recent' | 'Long' | 'Short' | 'Saved';

const SERMON_BOOKMARK_KEY = 'storehouse_sermon_bookmarks';

function SermonsScreen() {
  const [view,   setView]   = useState<'list' | 'reader'>('list');
  const [all,    setAll]    = useState<Sermon[]>([]);
  const [filter, setFilter] = useState<SermonFilter>('All');
  const [query,  setQuery]  = useState('');
  const [byYear, setByYear] = useState<Record<string, Sermon[]>>({});
  const [years,  setYears]  = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());

  useEffect(() => {
    SecureStore.getItemAsync(SERMON_BOOKMARK_KEY)
      .then(v => { if (v) setBookmarks(new Set(JSON.parse(v))); })
      .catch(() => {});
  }, []);

  const toggleBookmark = (id: number) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      SecureStore.setItemAsync(SERMON_BOOKMARK_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  };

  // Reader state
  const [selSermon, setSelSermon] = useState<Sermon | null>(null);
  const [paras,     setParas]     = useState<Para[]>([]);
  const [loadingReader, setLoadingReader] = useState(false);
  const [activePara,    setActivePara]    = useState(-1);
  const readerRef      = useRef<ScrollView>(null);
  const paraYPositions = useRef<Record<number, number>>({});

  // Segment-level state (entry-range approach)
  const [activeSegKey, setActiveSegKey] = useState<string | null>(null);
  const activeSegKeyRef  = useRef<string | null>(null);
  const activeParaRef    = useRef<number>(-1);
  const paraSegsRef      = useRef<Map<number, Seg[]>>(new Map());
  const flatSegsRef      = useRef<Array<{ paraIdx: number; segIdx: number; startTime: number; endTime: number }>>([]);

  // Audio player state
  const [audioUrl, setAudioUrl]     = useState<string | null>(null);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [audioCur, setAudioCur]     = useState(0);
  const [audioDur, setAudioDur]     = useState(0);
  const [audioRate, setAudioRate]   = useState(1);
  const [showSpeeds, setShowSpeeds] = useState(false);
  const [scrubW, setScrubW]         = useState(1);
  const soundRef = useRef<Audio.Sound | null>(null);
  const rafRef   = useRef<any>(null);

  // Sermon summary state
  const [sermonSummary, setSermonSummary] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    api<any>('/sermons').then(d => {
      if (!d) { setLoading(false); return; }
      setAll(d.all ?? []);
      setByYear(d.by_year ?? {});
      setYears((d.years ?? []).slice().reverse()); // newest first
      setLoading(false);
    });
  }, []);

  const openSermon = async (s: Sermon) => {
    setSelSermon(s);
    setActiveSegKey(null);
    activeSegKeyRef.current = null;
    activeParaRef.current = -1;
    paraYPositions.current = {};
    paraSegsRef.current = new Map();
    flatSegsRef.current = [];
    setSermonSummary(null);
    setSummaryExpanded(false);
    setView('reader');
    setLoadingReader(true);
    const data = await api<any>(`/sermons/${s.id}/full-text`);
    if (data?.paragraphs) {
      setParas(data.paragraphs);
      const { paraSegs, flat } = buildParagraphSegments(data.paragraphs, data.sentence_times ?? null);
      paraSegsRef.current = paraSegs;
      flatSegsRef.current = flat;
    } else {
      const pages = await api<any>(`/sermons/${s.id}/pages`);
      const fallback: Para[] = [];
      (pages?.pages ?? []).forEach((p: any, pi: number) => {
        (p.paragraphs ?? p.page_text?.split('\n\n') ?? []).forEach((t: any, ti: number) => {
          if (typeof t === 'string' && t.trim()) fallback.push({ number: pi * 100 + ti + 1, text: t.trim() });
          else if (t?.text?.trim()) fallback.push({ number: t.number ?? ti + 1, text: t.text.trim() });
        });
      });
      const fb = fallback.length > 0 ? fallback : [{ number: 1, text: 'Sermon text not yet available.' }];
      setParas(fb);
      const { paraSegs, flat } = buildParagraphSegments(fb, null);
      paraSegsRef.current = paraSegs;
      flatSegsRef.current = flat;
    }
    setLoadingReader(false);

    // Fetch sermon summary
    setLoadingSummary(true);
    const sumData = await api<any>(`/sermons/${s.id}/summary`);
    setSermonSummary(sumData?.summary ?? null);
    setLoadingSummary(false);
  };

  const goBack = () => {
    soundRef.current?.unloadAsync().catch(() => {});
    soundRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setAudioUrl(null);
    setSermonSummary(null);
    setSummaryExpanded(false);
    setView('list'); setSelSermon(null); setParas([]);
  };

  // Load audio URL when sermon opens
  useEffect(() => {
    if (!selSermon) return;
    setAudioUrl(null); setIsPlaying(false); setAudioCur(0); setAudioDur(0);
    api<any>(`/sermons/${selSermon.id}/audio`).then(d => {
      if (d?.audio_url) setAudioUrl(d.audio_url);
    });
  }, [selSermon?.id]);

  // Playback status handler — drives scrubber + segment highlighting (replaces RAF loop)
  const onPlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    const t = status.positionMillis / 1000;
    setAudioCur(t);
    if (status.durationMillis) setAudioDur(status.durationMillis / 1000);
    if (status.didJustFinish) { setIsPlaying(false); return; }

    const flat = flatSegsRef.current;
    if (flat.length > 0) {
      let lo = 0, hi = flat.length - 1, bestIdx = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (flat[mid].startTime <= t) { bestIdx = mid; lo = mid + 1; }
        else hi = mid - 1;
      }
      const { paraIdx, segIdx } = flat[bestIdx];
      const newKey = `${paraIdx}-${segIdx}`;
      if (newKey !== activeSegKeyRef.current) {
        const oldPara = activeParaRef.current;
        activeSegKeyRef.current = newKey;
        activeParaRef.current = paraIdx;
        setActiveSegKey(newKey);
        lastReadSermon = selSermon ? { id: selSermon.id, title: selSermon.title, paraIndex: paraIdx } : null;
        if (paraIdx !== oldPara && paraIdx >= 0) {
          const y = paraYPositions.current[paraIdx];
          if (y !== undefined)
            readerRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
        }
      }
    }
  }, [selSermon]);

  // Load/reload expo-av Sound when URL changes
  useEffect(() => {
    if (!audioUrl) return;
    let cancelled = false;
    (async () => {
      // Configure audio session (iOS: play in silent mode + background)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      }).catch(() => {});

      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false, progressUpdateIntervalMillis: 100, rate: audioRate, shouldCorrectPitch: true },
        onPlaybackStatus,
      );
      if (cancelled) { sound.unloadAsync().catch(() => {}); return; }
      soundRef.current = sound;
    })();
    return () => { cancelled = true; };
  }, [audioUrl]);

  // Sync playback rate
  useEffect(() => {
    soundRef.current?.setRateAsync(audioRate, true).catch(() => {});
  }, [audioRate]);

  // Seek to a specific segment and start playback
  const seekToSegment = (paraIdx: number, segIdx: number) => {
    const segs = paraSegsRef.current.get(paraIdx);
    if (!segs?.[segIdx] || !soundRef.current) return;
    const ms = segs[segIdx].startTime * 1000;
    soundRef.current.setPositionAsync(ms).catch(() => {});
    const newKey = `${paraIdx}-${segIdx}`;
    activeSegKeyRef.current = newKey;
    activeParaRef.current = paraIdx;
    setActiveSegKey(newKey);
    if (!isPlaying) {
      soundRef.current.playAsync().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Advance by one paragraph (Prev/Next buttons)
  const advance = (dir: 1 | -1) => {
    const curPara = activeParaRef.current >= 0 ? activeParaRef.current : (dir === 1 ? -1 : 0);
    const nextPara = Math.max(0, Math.min(paras.length - 1, curPara + dir));
    const firstSegs = paraSegsRef.current.get(nextPara);
    const startTime = firstSegs?.[0]?.startTime ?? paras[nextPara]?.start_time;
    if (startTime != null && soundRef.current)
      soundRef.current.setPositionAsync(startTime * 1000).catch(() => {});
    const newKey = `${nextPara}-0`;
    activeSegKeyRef.current = newKey;
    activeParaRef.current = nextPara;
    setActiveSegKey(newKey);
    lastReadSermon = selSermon ? { id: selSermon.id, title: selSermon.title, paraIndex: nextPara } : null;
    const y = paraYPositions.current[nextPara];
    if (y !== undefined)
      readerRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
  };

  const togglePlay = () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      soundRef.current.pauseAsync().catch(() => {});
      setIsPlaying(false);
    } else {
      soundRef.current.playAsync().catch(() => {});
      setIsPlaying(true);
    }
  };

  const seekAudio = (x: number) => {
    if (!soundRef.current || !audioDur || scrubW <= 0) return;
    const ms = Math.max(0, Math.min(audioDur, (x / scrubW) * audioDur)) * 1000;
    soundRef.current.setPositionAsync(ms).catch(() => {});
  };

  const fmtAudio = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Filtered list ──
  const visible = (() => {
    let list = all;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(s => s.title.toLowerCase().includes(q) || s.date_code.includes(q) || s.location?.toLowerCase().includes(q));
    }
    if (filter === 'Recent') return list.slice(0, 50);
    if (filter === 'Long')   return list.filter(s => (s.duration_minutes ?? 0) > 60);
    if (filter === 'Short')  return list.filter(s => (s.duration_minutes ?? 0) > 0 && (s.duration_minutes ?? 0) < 30);
    if (filter === 'Saved')  return list.filter(s => bookmarks.has(s.id));
    return list;
  })();

  const groupedByYear = filter === 'By Year' ? years.map(yr => ({ yr, items: (byYear[yr] ?? []).filter(s => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.location?.toLowerCase().includes(q);
  }) })).filter(g => g.items.length > 0) : [];

  const groupedByLoc = filter === 'By Location' ? (() => {
    const map: Record<string, Sermon[]> = {};
    visible.forEach(s => { const k = s.location || 'Unknown'; (map[k] = map[k] ?? []).push(s); });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  })() : [];

  if (view === 'reader' && selSermon) {
    const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
        <RoyalHeader title={selSermon.title} sub={`${selSermon.date_code} · ${selSermon.location}`} onBack={goBack} />

        {/* Audio player */}
        {audioUrl && (
          <View style={s.audioPlayer}>
            <TouchableOpacity style={s.audioPlayBtn} onPress={togglePlay}>
              <Text style={s.audioPlayBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}
              onLayout={e => setScrubW(e.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => true}
              onResponderGrant={e => seekAudio(e.nativeEvent.locationX)}
              onResponderMove={e => seekAudio(e.nativeEvent.locationX)}>
              <View style={s.scrubTrack}>
                <View style={[s.scrubFill, { width: audioDur ? audioCur / audioDur * scrubW : 0 }]} />
                <View style={[s.scrubThumb, { left: audioDur ? Math.max(0, audioCur / audioDur * scrubW - 6) : 0 }]} />
              </View>
            </View>
            <Text style={s.audioTime}>{fmtAudio(audioCur)} / {fmtAudio(audioDur)}</Text>
            <TouchableOpacity onPress={() => setShowSpeeds(v => !v)} style={s.speedBtn}>
              <Text style={s.speedBtnText}>{audioRate}×</Text>
            </TouchableOpacity>
            {showSpeeds && (
              <View style={s.speedMenu}>
                {SPEEDS.map(r => (
                  <TouchableOpacity key={r} style={[s.speedItem, audioRate === r && s.speedItemActive]}
                    onPress={() => { setAudioRate(r); setShowSpeeds(false); }}>
                    <Text style={[s.speedItemText, audioRate === r && s.speedItemTextActive]}>{r}×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {loadingReader ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg }}>
            <ActivityIndicator color={T.denim} size="large" />
            <Text style={{ fontFamily: 'Inter_400Regular', color: T.muted, marginTop: 12 }}>Loading sermon…</Text>
          </View>
        ) : (
          <>
            {/* Read-along controls */}
            {(() => {
              const hasTiming = flatSegsRef.current.length > 0;
              const curPara   = activeParaRef.current;
              return (
                <View style={s.readerControls}>
                  <TouchableOpacity style={s.readerBtn} onPress={() => advance(-1)}
                    disabled={curPara <= 0 && !activeSegKey}>
                    <Text style={[s.readerBtnText, (curPara <= 0 && !activeSegKey) && { opacity: 0.3 }]}>‹ Prev</Text>
                  </TouchableOpacity>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={s.readerProgress}>
                      {curPara >= 0 ? `¶ ${curPara + 1} / ${paras.length}` : 'Tap a phrase to begin'}
                    </Text>
                    {hasTiming && (
                      <Text style={s.readerTimingBadge}>⏱ synced · tap any phrase</Text>
                    )}
                  </View>
                  <TouchableOpacity style={s.readerBtn} onPress={() => advance(1)}
                    disabled={curPara >= paras.length - 1}>
                    <Text style={[s.readerBtnText, curPara >= paras.length - 1 && { opacity: 0.3 }]}>Next ›</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
            <ScrollView ref={readerRef} style={{ flex: 1, backgroundColor: T.bg }}
              contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: 100 }}>
              {/* Sermon summary card - collapsible */}
              {sermonSummary && (
                <TouchableOpacity style={s.summaryCard} onPress={() => setSummaryExpanded(!summaryExpanded)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.summaryLabel}>SERMON SUMMARY</Text>
                    <Text style={{ fontSize: 16, color: T.denim }}>{summaryExpanded ? '▼' : '▶'}</Text>
                  </View>
                  {summaryExpanded && (
                    <Text style={[s.summaryText, { marginTop: 10 }]}>{sermonSummary}</Text>
                  )}
                </TouchableOpacity>
              )}
              {paras.map((para, paraIdx) => {
                const paraSegs = paraSegsRef.current.get(paraIdx);
                const isParaActive = !!activeSegKey?.startsWith(`${paraIdx}-`);
                return (
                  <View key={paraIdx}
                    onLayout={e => { paraYPositions.current[paraIdx] = e.nativeEvent.layout.y; }}
                    style={[s.paraRow, isParaActive && s.paraRowActive]}>
                    <Text style={s.paraText}>
                      {para.number != null && para.number !== '' && (
                        <Text style={s.paraNumber}>{para.number}{'  '}</Text>
                      )}
                      {paraSegs && paraSegs.length > 0
                        ? paraSegs.map((seg, segIdx) => {
                            const isActive = `${paraIdx}-${segIdx}` === activeSegKey;
                            return (
                              <Text key={segIdx}
                                style={[
                                  s.sentenceSpan,
                                  isActive && s.activeSentence,
                                  !seg.isExact && s.sentenceUntimed,
                                ]}
                                onPress={() => seekToSegment(paraIdx, segIdx)}>
                                {seg.text}{' '}
                              </Text>
                            );
                          })
                        : <Text style={s.sentenceSpan}>{para.text}</Text>
                      }
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
      <RoyalHeader title="Sermons" />
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <View style={s.searchBarWrap}>
          <Text style={s.searchIcon}>⊙</Text>
          <TextInput style={s.searchInput} value={query} onChangeText={setQuery}
            placeholder="Search sermons…" placeholderTextColor={T.muted} />
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: T.border }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 0 }}>
          {(['All', 'By Year', 'By Location', 'Recent', 'Long', 'Short', 'Saved'] as SermonFilter[]).map(f => (
            <TouchableOpacity key={f} style={[s.filterTab, filter === f && s.filterTabActive]}
              onPress={() => setFilter(f)}>
              <Text style={[s.filterTabText, filter === f && s.filterTabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator style={{ margin: 24 }} color={T.denim} />
        ) : filter === 'All' || filter === 'Recent' || filter === 'Long' || filter === 'Short' || filter === 'Saved' ? (
          <>
            {filter === 'Saved' && visible.length === 0
              ? <Text style={[s.resultCount, { textAlign: 'center', marginTop: 40 }]}>No bookmarked sermons yet.{'\n'}Tap 🔖 on any sermon to save it.</Text>
              : <Text style={s.resultCount}>{visible.length} sermon{visible.length !== 1 ? 's' : ''}</Text>
            }
            <FlatList data={visible} keyExtractor={s2 => String(s2.id)}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item }) => <SermonRow sermon={item} onPress={() => openSermon(item)} bookmarked={bookmarks.has(item.id)} onBookmark={() => toggleBookmark(item.id)} />}
            />
          </>
        ) : filter === 'By Year' ? (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {groupedByYear.map(({ yr, items }) => (
              <View key={yr}>
                <Text style={s.groupLabel}>{yr}</Text>
                {items.map(item => <SermonRow key={item.id} sermon={item} onPress={() => openSermon(item)} bookmarked={bookmarks.has(item.id)} onBookmark={() => toggleBookmark(item.id)} />)}
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {groupedByLoc.map(([loc, items]) => (
              <View key={loc}>
                <Text style={s.groupLabel}>{loc} ({items.length})</Text>
                {items.map(item => <SermonRow key={item.id} sermon={item} onPress={() => openSermon(item)} bookmarked={bookmarks.has(item.id)} onBookmark={() => toggleBookmark(item.id)} />)}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function SermonRow({ sermon, onPress, bookmarked, onBookmark }: { sermon: Sermon; onPress: () => void; bookmarked?: boolean; onBookmark?: () => void }) {
  const inProgress = lastReadSermon?.id === sermon.id;
  return (
    <TouchableOpacity style={[s.sermonRow, inProgress && s.sermonRowActive]} onPress={onPress}>
      <View style={[s.iconBox, { backgroundColor: inProgress ? '#ede9fe' : T.bg2 }]}>
        <Text style={{ fontSize: 17 }}>{inProgress ? '🎤' : '🎙'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.sermonTitle} numberOfLines={2}>{sermon.title}</Text>
        <Text style={s.sermonMeta}>{sermon.date_code} · {sermon.location || '—'}</Text>
        {inProgress && <Text style={s.resumeLabel}>▶ Resume at ¶{lastReadSermon!.paraIndex + 1}</Text>}
      </View>
      {onBookmark && (
        <TouchableOpacity onPress={onBookmark} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 4, marginRight: 4 }}>
          <Text style={{ fontSize: 17, color: bookmarked ? T.capri : T.muted }}>{bookmarked ? '🔖' : '🏷'}</Text>
        </TouchableOpacity>
      )}
      <View style={s.yearBadge}><Text style={s.yearBadgeText}>{sermon.year}</Text></View>
    </TouchableOpacity>
  );
}

// ── BIBLE ─────────────────────────────────────────────────────────────────────
type BibleView = 'books' | 'chapters' | 'reader';

const isDivine = (speaker?: string) => !!speaker && /god|jesus|lord|christ|holy.?spirit/i.test(speaker);

function BibleScreen() {
  const [view,       setView]       = useState<BibleView>('books');
  const [testament,  setTestament]  = useState<'OT' | 'NT'>('OT');
  const [selBook,    setSelBook]    = useState<{ name: string; c: number } | null>(null);
  const [selChapter, setSelChapter] = useState(0);
  const [verses,     setVerses]     = useState<Verse[]>([]);
  const [totalCh,    setTotalCh]    = useState(0);
  const [loadingVerse, setLoadingVerse] = useState(false);
  const [activeVerse,  setActiveVerse]  = useState(-1);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // AI summary
  const [chSummary, setChSummary]       = useState<string | null>(null);

  // TTS
  const [ttsVoices,      setTtsVoices]      = useState<any[]>([]);
  const [ttsVoice,       setTtsVoice]       = useState<any>(null);
  const [ttsSpeaking,    setTtsSpeaking]    = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  // Cross-references
  const [showCrossRefs,   setShowCrossRefs]   = useState(false);
  const [crossRefVerse,   setCrossRefVerse]   = useState<number | null>(null);
  const [crossRefs,       setCrossRefs]       = useState<{ to_book: string; to_chapter: number; to_verse: number; votes: number }[]>([]);
  const [crossRefLoading, setCrossRefLoading] = useState(false);

  const books = testament === 'OT' ? OT_BOOKS : NT_BOOKS;

  // Load TTS voices
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const synth = (window as any).speechSynthesis;
    if (!synth) return;
    const load = () => { const v = synth.getVoices(); if (v.length > 0) setTtsVoices(v); };
    load();
    if ('onvoiceschanged' in synth) synth.onvoiceschanged = load;
  }, []);

  const ttsSpeak = (voice?: any) => {
    if (typeof window === 'undefined') return;
    const synth = (window as any).speechSynthesis;
    if (!synth || verses.length === 0) return;
    synth.cancel();
    const text = verses.map(v => `Verse ${v.verse}. ${v.text}`).join(' ');
    const u = new (window as any).SpeechSynthesisUtterance(text);
    const activeVoice = voice ?? ttsVoice;
    if (activeVoice) u.voice = activeVoice;
    u.rate = 0.9;
    u.onstart = () => setTtsSpeaking(true);
    u.onend   = () => setTtsSpeaking(false);
    u.onerror = () => setTtsSpeaking(false);
    synth.speak(u);
  };

  const ttsStop = () => {
    if (typeof window === 'undefined') return;
    (window as any).speechSynthesis?.cancel();
    setTtsSpeaking(false);
  };

  const openBook = (book: { name: string; c: number }) => {
    setSelBook(book);
    setView('chapters');
    lastReadBible = { book: book.name, chapter: 1 };
  };

  const openChapter = async (ch: number, book?: { name: string; c: number }) => {
    const activeBook = book ?? selBook;
    if (!activeBook) return;
    if (book) setSelBook(book);
    setSelChapter(ch);
    setView('reader');
    setActiveVerse(-1);
    setChSummary(null);
    ttsStop();
    setLoadingVerse(true);
    lastReadBible = { book: activeBook.name, chapter: ch };
    const [data, sumData] = await Promise.all([
      api<any>(`/bible/${encodeURIComponent(activeBook.name)}/${ch}`),
      api<any>('/bible/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book: activeBook.name, chapter: ch }),
      }),
    ]);
    setVerses(data?.verses ?? []);
    setTotalCh(data?.total_chapters ?? activeBook.c);
    setChSummary(sumData?.summary ?? null);
    setLoadingVerse(false);
  };

  const openCrossRefs = async (verseNum: number) => {
    if (!selBook) return;
    setCrossRefVerse(verseNum);
    setCrossRefs([]);
    setCrossRefLoading(true);
    setShowCrossRefs(true);
    const data = await api<any>(`/bible/${encodeURIComponent(selBook.name)}/${selChapter}/${verseNum}/crossrefs`);
    setCrossRefs(data?.crossrefs ?? []);
    setCrossRefLoading(false);
  };

  const prevChapter = () => { if (selChapter > 1) openChapter(selChapter - 1); };
  const nextChapter = () => { if (selChapter < totalCh) openChapter(selChapter + 1); };

  if (view === 'reader' && selBook) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
        <RoyalHeader title={`${selBook.name} ${selChapter}`}
          sub={testament === 'OT' ? 'Old Testament' : 'New Testament'}
          onBack={() => { ttsStop(); setView('chapters'); }} />

        {/* Chapter nav + TTS */}
        <View style={s.chapterNav}>
          <TouchableOpacity onPress={prevChapter} disabled={selChapter <= 1}
            style={[s.chNavBtn, selChapter <= 1 && { opacity: 0.3 }]}>
            <Text style={s.chNavBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={s.chNavLabel}>Chapter {selChapter} of {totalCh}</Text>
          <TouchableOpacity onPress={nextChapter} disabled={selChapter >= totalCh}
            style={[s.chNavBtn, selChapter >= totalCh && { opacity: 0.3 }]}>
            <Text style={s.chNavBtnText}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ttsBtn}
            onPress={() => ttsSpeaking ? ttsStop() : setShowVoicePicker(true)}>
            <Text style={s.ttsBtnText}>{ttsSpeaking ? '⏹' : '🔊'}</Text>
          </TouchableOpacity>
        </View>

        {loadingVerse ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg }}>
            <ActivityIndicator color={T.denim} size="large" />
          </View>
        ) : (
          <ScrollView style={{ flex: 1, backgroundColor: T.bg }}
            contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
            <Text style={s.chapterHeader}>{selBook.name}</Text>
            <Text style={s.chapterNum}>Chapter {selChapter}</Text>

            {/* AI Summary card - collapsible */}
            {chSummary && (
              <TouchableOpacity style={s.summaryCard} onPress={() => setSummaryExpanded(!summaryExpanded)}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.summaryLabel}>
                    {selChapter === 1 ? `Context · ${selBook.name}` : `Recap · ${selBook.name} 1–${selChapter - 1}`}
                  </Text>
                  <Text style={{ fontSize: 16, color: T.denim }}>{summaryExpanded ? '▼' : '▶'}</Text>
                </View>
                {summaryExpanded && (
                  <Text style={[s.summaryText, { marginTop: 10 }]}>{chSummary}</Text>
                )}
              </TouchableOpacity>
            )}

            {verses.map((v, i) => (
              <TouchableOpacity key={i} activeOpacity={0.85}
                onPress={() => setActiveVerse(activeVerse === i ? -1 : i)}
                style={[s.verseRow, activeVerse === i && s.verseRowActive]}>
                <Text style={s.verseNumber}>{v.verse}</Text>
                <Text style={[
                  s.verseBody,
                  activeVerse === i && s.verseBodyActive,
                  isDivine(v.speaker) && s.verseBodyDivine,
                ]}>{v.text}</Text>
                {(v.references_count ?? 0) > 0 && (
                  <TouchableOpacity style={s.refBadge} onPress={() => openCrossRefs(v.verse)}>
                    <Text style={s.refBadgeText}>{v.references_count}</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Voice picker modal */}
        <Modal visible={showVoicePicker} transparent animationType="slide"
          onRequestClose={() => setShowVoicePicker(false)}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1}
            onPress={() => setShowVoicePicker(false)}>
            <View style={s.sheet} onStartShouldSetResponder={() => true}>
              <View style={s.sheetHandle} />
              <Text style={[s.sectionLabel, { marginBottom: 12 }]}>CHOOSE A VOICE</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {[null, ...ttsVoices].map((v, i) => (
                  <TouchableOpacity key={i}
                    style={[s.settingsRow, ttsVoice === v && { backgroundColor: T.bg2 }]}
                    onPress={() => {
                      setTtsVoice(v);
                      setShowVoicePicker(false);
                      setTimeout(() => ttsSpeak(v), 100);
                    }}>
                    <View style={s.settingsIcon}><Text>🎙</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.settingsLabel}>{v ? (v as any).name : 'Default Voice'}</Text>
                      {v && <Text style={s.resumeMeta}>{(v as any).lang}</Text>}
                    </View>
                    {ttsVoice === v && <Text style={{ color: T.capri, fontSize: 16 }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Cross-references modal */}
        <Modal visible={showCrossRefs} transparent animationType="slide"
          onRequestClose={() => setShowCrossRefs(false)}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1}
            onPress={() => setShowCrossRefs(false)}>
            <View style={s.sheet} onStartShouldSetResponder={() => true}>
              <View style={s.sheetHandle} />
              <Text style={[s.sectionLabel, { marginBottom: 12 }]}>
                CROSS-REFERENCES · {selBook?.name} {selChapter}:{crossRefVerse}
              </Text>
              {crossRefLoading ? (
                <ActivityIndicator color={T.denim} style={{ marginVertical: 24 }} />
              ) : crossRefs.length === 0 ? (
                <Text style={[s.resumeMeta, { textAlign: 'center', marginVertical: 24 }]}>
                  No cross-references found.
                </Text>
              ) : (
                <ScrollView style={{ maxHeight: 340 }}>
                  {crossRefs.map((cr, i) => (
                    <TouchableOpacity key={i} style={s.settingsRow}
                      onPress={() => {
                        setShowCrossRefs(false);
                        const target = OT_BOOKS.find(b => b.name === cr.to_book) ?? NT_BOOKS.find(b => b.name === cr.to_book);
                        if (target) {
                          setTestament(OT_BOOKS.some(b => b.name === cr.to_book) ? 'OT' : 'NT');
                          openChapter(cr.to_chapter, target);
                        }
                      }}>
                      <View style={[s.settingsIcon, { backgroundColor: T.bg2 }]}>
                        <Text style={{ color: T.denim, fontSize: 13, fontWeight: '700' }}>✦</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.settingsLabel}>{cr.to_book} {cr.to_chapter}:{cr.to_verse}</Text>
                        <Text style={s.resumeMeta}>{cr.votes} vote{cr.votes !== 1 ? 's' : ''}</Text>
                      </View>
                      <Text style={{ color: T.capri, fontSize: 16 }}>›</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  if (view === 'chapters' && selBook) {
    const cols: number[][] = [];
    for (let i = 1; i <= selBook.c; i++) { const row = Math.ceil(i / 6) - 1; (cols[row] = cols[row] ?? []).push(i); }
    const chNums = Array.from({ length: selBook.c }, (_, i) => i + 1);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
        <RoyalHeader title={selBook.name}
          sub={`${selBook.c} chapter${selBook.c !== 1 ? 's' : ''}`}
          onBack={() => setView('books')} />
        <ScrollView style={{ flex: 1, backgroundColor: T.bg }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <Text style={[s.sectionLabel, { marginBottom: 12 }]}>SELECT A CHAPTER</Text>
          <View style={s.chapterGrid}>
            {chNums.map(n => (
              <TouchableOpacity key={n} style={[s.chapterBtn,
                lastReadBible?.book === selBook.name && lastReadBible?.chapter === n && s.chapterBtnActive]}
                onPress={() => openChapter(n)}>
                <Text style={[s.chapterBtnText,
                  lastReadBible?.book === selBook.name && lastReadBible?.chapter === n && s.chapterBtnTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Bible</Text>
        <View style={s.scopeToggle}>
          <TouchableOpacity style={testament === 'OT' ? s.scopeActive : undefined}
            onPress={() => setTestament('OT')}>
            <Text style={testament === 'OT' ? s.scopeActiveText : s.scopeInactiveText}>Old Testament</Text>
          </TouchableOpacity>
          <TouchableOpacity style={testament === 'NT' ? s.scopeActive : undefined}
            onPress={() => setTestament('NT')}>
            <Text style={testament === 'NT' ? s.scopeActiveText : s.scopeInactiveText}>New Testament</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: T.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={[s.sectionLabel, { marginBottom: 12 }]}>
          {testament === 'OT' ? 'OLD TESTAMENT — 39 BOOKS' : 'NEW TESTAMENT — 27 BOOKS'}
        </Text>
        <View style={s.bookGrid}>
          {books.map(book => (
            <TouchableOpacity key={book.name} style={[s.bookChip,
              lastReadBible?.book === book.name && s.bookChipActive]}
              onPress={() => openBook(book)}>
              <Text style={[s.bookChipText, lastReadBible?.book === book.name && s.bookChipTextActive]}
                numberOfLines={2}>{book.name}</Text>
              <Text style={s.bookChipSub}>{book.c} ch</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── CHAT ──────────────────────────────────────────────────────────────────────
const GREETING: Msg = {
  role: 'assistant',
  text: "Peace be with you. Share what's on your heart, and I'll find words from Brother Branham's sermons to encourage you.",
};

function ChatScreen() {
  const [messages,  setMessages]  = useState<Msg[]>([GREETING]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const bottomRef = useRef<ScrollView>(null);
  const { token } = useAuth();

  const STARTERS = [
    "What does Brother Branham say about faith?",
    "Tell me about the seven seals",
    "What is the rapture?",
    "How should I pray?",
  ];

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    const history = messages.slice(1).map(m => ({ role: m.role, content: m.text }));
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    let replyText = 'Could not reach the server. Check your connection.';
    let sources: any = null;
    let remainingCount: number | undefined;

    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(`${BASE}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: msg, history }),
      });
      const body = await r.json().catch(() => null);
      if (r.ok && body?.reply) {
        replyText = body.reply;
        sources = body.quotes_used ?? null;
        remainingCount = body.remaining;
        chatToday = true;
      } else if (body?.detail) {
        replyText = typeof body.detail === 'string' ? body.detail : `Server error (${r.status}).`;
      } else if (!r.ok) {
        replyText = `Server error (${r.status}). Please try again.`;
      }
    } catch {
      replyText = 'Could not reach the server. Check your connection.';
    }

    setLoading(false);
    if (remainingCount !== undefined) setRemaining(remainingCount);
    setMessages(prev => [...prev, { role: 'assistant', text: replyText, sources }]);
  };

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const isInitial = messages.length === 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
      <View style={[s.header, { justifyContent: 'space-between' }]}>
        <Text style={s.headerTitle}>Ask the Sermons</Text>
        {messages.length > 1 && (
          <TouchableOpacity onPress={() => { setMessages([GREETING]); setRemaining(null); }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>New Chat</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <ScrollView ref={bottomRef} style={{ flex: 1, backgroundColor: T.bg }}
          contentContainerStyle={{ padding: 16, paddingBottom: 16 }}>

          {isInitial && (
            <View style={s.chatEmpty}>
              <Text style={s.chatEmptyIcon}>💬</Text>
              <Text style={s.chatEmptyTitle}>Ask the Sermons</Text>
              <Text style={s.chatEmptyDesc}>{GREETING.text}</Text>
              <View style={s.starterGrid}>
                {STARTERS.map(st => (
                  <TouchableOpacity key={st} style={s.starterPill} onPress={() => send(st)}>
                    <Text style={s.starterPillText}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {!isInitial && messages.map((m, i) => (
            <View key={i} style={m.role === 'user' ? s.userBubble : s.assistantBubble}>
              <Text style={m.role === 'user' ? s.userBubbleText : s.assistantBubbleText}>{m.text}</Text>
              {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
                <View style={s.sourcesRow}>
                  <Text style={s.sourcesLabel}>📚 </Text>
                  {m.sources.map((src: any, j: number) => (
                    <View key={j} style={s.sourceChip}>
                      <Text style={s.sourceChipText} numberOfLines={1}>{src.sermon_title || src.sermon}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          {loading && (
            <View style={s.assistantBubble}>
              <View style={s.typingDots}>
                <View style={s.typingDot} /><View style={s.typingDot} /><View style={s.typingDot} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={s.chatFooter}>
          <View style={s.inputRow}>
            <TextInput style={s.chatInput} value={input} onChangeText={setInput}
              placeholder="What are you going through today?" placeholderTextColor={T.muted}
              multiline maxLength={1000} editable={!loading} />
            <TouchableOpacity style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
              onPress={() => send()} disabled={!input.trim() || loading}>
              <Text style={s.sendBtnText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── GIVE SCREEN ───────────────────────────────────────────────────────────────
function GiveScreen() {
  const options = [
    { label: 'Ko-fi (one-time tip)', icon: '☕', url: 'https://ko-fi.com/thestorehouse', desc: 'Quick one-time support' },
    { label: 'PayPal', icon: '💳', url: 'https://paypal.me/thestorehouse', desc: 'Secure PayPal payment' },
    { label: 'Cash App', icon: '💵', url: 'https://cash.app/$thestorehouse', desc: 'Pay with Cash App' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Support The Storehouse</Text>
          <Text style={s.headerSub}>Free · forever · reader-supported</Text>
        </View>
      </View>
      <ScrollView style={s.screen} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Mission card */}
        <View style={[s.dailyCard, { marginBottom: 24 }]}>
          <View style={s.dailyDecor1} /><View style={s.dailyDecor2} />
          <Text style={[s.verseRef, { marginBottom: 8 }]}>OUR MISSION</Text>
          <Text style={[s.verseText, { fontSize: 15, fontStyle: 'italic' }]}>
            "Making the voice of Brother William Marrion Branham freely accessible to every soul on earth."
          </Text>
          <View style={s.dailyDivider} />
          <Text style={[s.quoteAttr, { fontSize: 13, lineHeight: 20 }]}>
            The Storehouse is completely free — no subscriptions, no ads. Your donations keep the servers running and the sermons flowing.
          </Text>
        </View>

        {/* Donation options */}
        <Text style={[s.greeting, { fontSize: 16, marginBottom: 12 }]}>Choose how to give</Text>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.label}
            style={[s.card, { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 16 }]}
            onPress={() => Linking.openURL(opt.url)}
          >
            <Text style={{ fontSize: 28, marginRight: 14 }}>{opt.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.resumeTitle, { marginBottom: 2 }]}>{opt.label}</Text>
              <Text style={[s.resumeMeta, { color: T.muted }]}>{opt.desc}</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        ))}

        {/* What your support covers */}
        <View style={[s.card, { marginTop: 8, padding: 16 }]}>
          <Text style={[s.resumeTitle, { marginBottom: 12 }]}>What your support covers</Text>
          {[
            ['🖥', 'Server hosting & storage'],
            ['🔊', 'Sermon audio streaming'],
            ['🤖', 'AI chat & search (Claude / NVIDIA)'],
            ['📱', 'Free iOS & Android apps'],
          ].map(([icon, label]) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 }}>
              <Text style={{ fontSize: 18 }}>{icon}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: T.text }}>{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── ACCOUNT SCREEN ─────────────────────────────────────────────────────────────
function AccountScreen() {
  const { user, loading: authLoading, loginWithGoogle, loginWithApple, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState<string | null>(null);

  // Google Sign-In via expo-auth-session
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '148577576223-1sm0u32rpg6jh4va5ocmnbch85u9dop5.apps.googleusercontent.com',
    iosClientId: '148577576223-kss4ju6581o4htgdkkcqh171ha3hp4s4.apps.googleusercontent.com',
    androidClientId: '148577576223-h1qtn107ebljumt0lotbg02700d66ca1.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (idToken) {
        setBusy(true);
        loginWithGoogle(idToken)
          .catch(() => setErr('Google sign-in failed. Try again.'))
          .finally(() => setBusy(false));
      }
    }
  }, [response]);

  const handleApple = async () => {
    setBusy(true); setErr(null);
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const userData = cred.fullName
        ? { name: `${cred.fullName.givenName ?? ''} ${cred.fullName.familyName ?? ''}`.trim(), email: cred.email }
        : {};
      await loginWithApple(cred.identityToken!, userData);
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') setErr('Apple sign-in failed. Try again.');
    } finally { setBusy(false); }
  };

  const handleGoogle = () => {
    setErr(null);
    promptAsync();
  };

  if (authLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg }}>
          <ActivityIndicator color={T.denim} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{user ? 'My Account' : 'Sign In'}</Text>
          <Text style={s.headerSub}>{user ? user.email : 'Access your personal library'}</Text>
        </View>
        {user && (
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(user.name?.[0] ?? 'A').toUpperCase()}</Text>
          </View>
        )}
      </View>

      <ScrollView style={s.screen} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {user ? (
          /* ── Signed in ─────────────────────────── */
          <>
            <View style={[s.profileCard, { marginBottom: 20 }]}>
              <View style={s.avatar}><Text style={s.avatarText}>{(user.name?.[0] ?? 'A').toUpperCase()}</Text></View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[s.resumeTitle, { fontSize: 16 }]}>{user.name}</Text>
                <Text style={[s.resumeMeta, { color: T.muted }]}>{user.email}</Text>
                {user.is_paid && (
                  <View style={{ marginTop: 4, backgroundColor: T.capri, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: T.royal }}>SUPPORTER</Text>
                  </View>
                )}
              </View>
            </View>

            {[
              { icon: '📖', label: 'Reading History', sub: 'Sermons you have visited' },
              { icon: '🔖', label: 'Saved Highlights', sub: 'Your personal notes' },
              { icon: '🔔', label: 'Notifications', sub: 'Manage daily reminders' },
            ].map(row => (
              <TouchableOpacity key={row.label} style={[s.settingsRow, { marginBottom: 0 }]}
                onPress={() => Alert.alert(row.label, 'Coming soon — this feature is in development.')}>
                <View style={s.settingsIcon}><Text style={{ fontSize: 16 }}>{row.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.settingsLabel}>{row.label}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: T.muted }}>{row.sub}</Text>
                </View>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={{ marginTop: 32, borderWidth: 1.5, borderColor: '#EF4444', borderRadius: 12, padding: 14, alignItems: 'center' }}
              onPress={logout}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#EF4444' }}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ── Not signed in ─────────────────────── */
          <>
            <View style={[s.dailyCard, { marginBottom: 28 }]}>
              <View style={s.dailyDecor1} /><View style={s.dailyDecor2} />
              <Text style={[s.verseRef, { marginBottom: 8 }]}>YOUR PERSONAL LIBRARY</Text>
              <Text style={[s.verseText, { fontSize: 14, fontStyle: 'italic' }]}>
                Sign in to save highlights, sync reading progress, and unlock unlimited chat across all your devices.
              </Text>
            </View>

            {err && (
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: T.red, textAlign: 'center', marginBottom: 16 }}>{err}</Text>
            )}

            {busy ? (
              <ActivityIndicator color={T.denim} style={{ marginVertical: 20 }} />
            ) : (
              <>
                {/* Google */}
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: T.border, borderRadius: 12, padding: 15, marginBottom: 12 }}
                  onPress={handleGoogle}
                  disabled={!request}
                >
                  <Text style={{ fontSize: 20 }}>G</Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: T.text }}>Continue with Google</Text>
                </TouchableOpacity>

                {/* Apple (iOS only) */}
                {Platform.OS === 'ios' && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={12}
                    style={{ width: '100%', height: 50, marginBottom: 12 }}
                    onPress={handleApple}
                  />
                )}

                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: T.muted, textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
                  By signing in you agree to our{' '}
                  <Text style={{ color: T.denim }} onPress={() => Linking.openURL('https://thestorehouse.app/privacy')}>
                    Privacy Policy
                  </Text>
                </Text>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── TAB ICONS ─────────────────────────────────────────────────────────────────
function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '⌂', Sermons: '◎', Bible: '✝', Chat: '✉', Give: '♡', Account: '⊙',
  };
  return (
    <Text style={{ fontSize: focused ? 20 : 18, color, fontFamily: 'Inter_700Bold' }}>
      {icons[name] ?? '•'}
    </Text>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    Lora_400Regular, Lora_400Regular_Italic, Lora_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, focused }) =>
                  <TabIcon name={route.name} color={color} focused={focused} />,
                tabBarActiveTintColor: T.royal,
                tabBarInactiveTintColor: T.muted,
                tabBarStyle: {
                  backgroundColor: T.bg,
                  borderTopColor: T.border,
                  borderTopWidth: 1,
                  height: 68,
                  paddingBottom: 10,
                  paddingTop: 6,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 10,
                },
                tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 2 },
              })}>
              <Tab.Screen name="Home"    component={HomeScreen} />
              <Tab.Screen name="Search"  component={SearchScreen} />
              <Tab.Screen name="Sermons" component={SermonsScreen} />
              <Tab.Screen name="Bible"   component={BibleScreen} />
              <Tab.Screen name="Chat"    component={ChatScreen} />
              <Tab.Screen name="Give"    component={GiveScreen} />
              <Tab.Screen name="Account" component={AccountScreen} />
            </Tab.Navigator>
          </View>
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Layout
  screen: { flex: 1, backgroundColor: T.bg, paddingHorizontal: 16 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: T.royal,
  },
  headerTitle: { fontFamily: 'Lora_700Bold', fontSize: 17, color: '#fff' },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  backBtn: { marginRight: 10, padding: 4 },
  backBtnText: { fontFamily: 'Inter_400Regular', fontSize: 26, color: '#fff', lineHeight: 30 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: T.capri, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: T.royal },

  // Greeting
  greeting: { fontFamily: 'Lora_700Bold', fontSize: 22, color: T.text, marginTop: 20, marginBottom: 16 },

  // Daily card
  dailyCard: {
    backgroundColor: T.royal, borderRadius: 20, padding: 22, marginBottom: 20,
    overflow: 'hidden', shadowColor: T.royal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  dailyDecor1: { position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(0,191,255,0.06)' },
  dailyDecor2: { position: 'absolute', bottom: -20, left: -10, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,191,255,0.04)' },
  verseRef: { fontFamily: 'Inter_700Bold', fontSize: 10, color: T.capri, letterSpacing: 1.5, marginBottom: 8 },
  verseText: { fontFamily: 'Lora_400Regular_Italic', fontSize: 14.5, color: 'rgba(255,255,255,0.92)', lineHeight: 22, marginBottom: 14 },
  dailyDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 14 },
  quoteText: { fontFamily: 'Lora_400Regular_Italic', fontSize: 13.5, color: 'rgba(255,255,255,0.78)', lineHeight: 20, marginBottom: 8 },
  quoteAttr: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16 },
  ghostBtns: { flexDirection: 'row', gap: 8 },
  ghostBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  ghostBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  // Carousel indicators
  carouselIndicators: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  carouselDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,191,255,0.3)' },
  carouselDotActive: { backgroundColor: T.capri, width: 24 },

  // Notifications CTA
  notificationsCTA: { backgroundColor: T.capri, borderRadius: 12, padding: 14, marginBottom: 20, alignItems: 'center', shadowColor: T.capri, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  notificationsCTAText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: T.royal },

  // Section label
  sectionLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, color: T.muted, letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },

  // Card / resume
  card: { backgroundColor: T.bg, borderRadius: 14, borderWidth: 1, borderColor: T.border, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardDivider: { height: 1, backgroundColor: T.border },
  resumeRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  resumeTitle: { fontFamily: 'Lora_700Bold', fontSize: 14, color: T.text, marginBottom: 2 },
  resumeMeta: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  chevron: { fontFamily: 'Inter_400Regular', fontSize: 20, color: T.muted, marginLeft: 4 },

  // Goals
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  goalChip: { borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: T.bg },
  goalChipDone: { borderColor: T.green, backgroundColor: '#f0fdf4' },
  goalText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: T.muted },
  goalTextDone: { color: '#16a34a' },

  // Stats
  statsRow: { flexDirection: 'row', backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 14, marginBottom: 20, overflow: 'hidden' },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  statNumber: { fontFamily: 'Lora_700Bold', fontSize: 18, color: T.denim, marginBottom: 2 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, color: T.muted },

  // Quick access
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  quickCard: { width: '47%', borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: 60 },
  quickLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  // Search bar
  searchBarWrap: { flexDirection: 'row', alignItems: 'center', margin: 12, paddingHorizontal: 12, borderWidth: 1.5, borderColor: T.border, borderRadius: 12, backgroundColor: T.bg },
  searchIcon: { fontSize: 16, marginRight: 8, color: T.muted },
  searchInput: { flex: 1, paddingVertical: 11, fontFamily: 'Inter_400Regular', fontSize: 14, color: T.text },

  // Scope toggle (header)
  scopeToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99, padding: 2 },
  scopeActive: { backgroundColor: '#fff', borderRadius: 99 },
  scopeActiveText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: T.text, paddingHorizontal: 10, paddingVertical: 5 },
  scopeInactiveText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)', paddingHorizontal: 10, paddingVertical: 5 },

  // Search results
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggChip: { backgroundColor: T.bg2, borderWidth: 1, borderColor: T.border, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7 },
  suggChipText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: T.muted },
  resultCard: { marginHorizontal: 12, marginVertical: 6, padding: 14, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 12 },
  resultText: { fontFamily: 'Lora_400Regular', fontSize: 14, color: T.text, lineHeight: 21, marginBottom: 6 },
  resultMeta: { fontFamily: 'Inter_500Medium', fontSize: 11, color: T.muted },
  resultCount: { fontFamily: 'Inter_400Regular', fontSize: 12, color: T.muted, paddingHorizontal: 16, paddingVertical: 6 },

  // Sermons list
  filterTab: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabActive: { borderBottomColor: T.capri },
  filterTabText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: T.muted },
  filterTabTextActive: { fontFamily: 'Inter_600SemiBold', color: T.royal },
  groupLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, color: T.muted, letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6, backgroundColor: T.bg2 },
  sermonRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border, gap: 12 },
  sermonRowActive: { backgroundColor: '#f5f3ff' },
  sermonTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: T.text, marginBottom: 2 },
  sermonMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, color: T.muted },
  resumeLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: T.purple, marginTop: 2 },
  yearBadge: { backgroundColor: T.bg2, borderWidth: 1, borderColor: T.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  yearBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: T.denim },

  // Sermon reader
  readerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: T.border },
  readerBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: T.bg2, borderRadius: 8, borderWidth: 1, borderColor: T.border },
  readerBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: T.denim },
  readerProgress: { fontFamily: 'Inter_400Regular', fontSize: 12, color: T.muted },
  readerTimingBadge: { fontFamily: 'Inter_500Medium', fontSize: 9, color: T.capri, letterSpacing: 0.5, marginTop: 2 },
  // Paragraph container
  paraRow: { paddingVertical: 6, paddingHorizontal: 4, marginBottom: 4 },
  paraRowActive: { backgroundColor: 'rgba(0,191,255,0.05)', borderRadius: 6 },
  // Inline paragraph number (like the website's .paraNumber)
  paraNumber: { fontFamily: 'Inter_700Bold', fontSize: 10, color: T.capri, letterSpacing: 0.3 },
  // Paragraph body text container
  paraText: { fontFamily: 'Lora_400Regular', fontSize: 15, color: T.text, lineHeight: 26 },
  // Individual sentences
  sentenceSpan: { fontFamily: 'Lora_400Regular', fontSize: 15, color: T.text, lineHeight: 26 },
  // Active sentence: blue highlight (consistent with app design language)
  activeSentence: { backgroundColor: 'rgba(0,191,255,0.18)', color: T.royal },
  // Untimed sentence: 75% opacity, not pressable (matches website)
  sentenceUntimed: { opacity: 0.75 },

  // Bible books grid
  bookGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bookChip: { width: '31%', borderWidth: 1.5, borderColor: T.border, borderRadius: 10, padding: 10, backgroundColor: T.bg, alignItems: 'center' },
  bookChipActive: { borderColor: T.capri, backgroundColor: '#EFF9FF' },
  bookChipText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: T.text, textAlign: 'center', lineHeight: 16 },
  bookChipTextActive: { fontFamily: 'Inter_600SemiBold', color: T.royal },
  bookChipSub: { fontFamily: 'Inter_400Regular', fontSize: 9, color: T.muted, marginTop: 3 },

  // Chapter picker
  chapterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chapterBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center', backgroundColor: T.bg },
  chapterBtnActive: { backgroundColor: T.denim, borderColor: T.denim },
  chapterBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: T.text },
  chapterBtnTextActive: { color: '#fff' },

  // Chapter reader
  chapterNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: T.border },
  chNavBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: T.bg2, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  chNavBtnText: { fontFamily: 'Inter_700Bold', fontSize: 18, color: T.denim },
  chNavLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: T.muted },
  chapterHeader: { fontFamily: 'Lora_700Bold', fontSize: 22, color: T.royal, textAlign: 'center', marginBottom: 4 },
  chapterNum: { fontFamily: 'Inter_400Regular', fontSize: 12, color: T.muted, textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
  verseRow: { flexDirection: 'row', paddingVertical: 8, borderRadius: 6, paddingHorizontal: 4, marginBottom: 2 },
  verseRowActive: { backgroundColor: '#EFF9FF' },
  verseNumber: { fontFamily: 'Inter_700Bold', fontSize: 7, color: T.capri, width: 12, marginRight: 2, marginTop: 0 },
  verseBody: { fontFamily: 'Lora_400Regular', fontSize: 17, color: T.text, lineHeight: 28, flex: 1 },
  verseBodyActive: { fontFamily: 'Lora_700Bold', color: T.royal },
  refBadge: { backgroundColor: T.bg2, borderWidth: 1, borderColor: T.capri, borderRadius: 99, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4, marginLeft: 6 },
  refBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 8, color: T.denim },

  // Chat
  chatEmpty: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  chatEmptyIcon: { fontSize: 48, marginBottom: 12 },
  chatEmptyTitle: { fontFamily: 'Lora_700Bold', fontSize: 22, color: T.text, marginBottom: 8 },
  chatEmptyDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, color: T.muted, textAlign: 'center', lineHeight: 20, maxWidth: 280, marginBottom: 24 },
  starterGrid: { gap: 8, width: '100%' },
  starterPill: { backgroundColor: T.bg2, borderWidth: 1, borderColor: T.border, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10 },
  starterPillText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: T.muted },
  userBubble: { alignSelf: 'flex-end', backgroundColor: T.denim, borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10, maxWidth: '80%' },
  userBubbleText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#fff', lineHeight: 20 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: T.bg2, borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10, maxWidth: '85%', borderWidth: 1, borderColor: T.border },
  assistantBubbleText: { fontFamily: 'Lora_400Regular_Italic', fontSize: 14, color: T.text, lineHeight: 22 },
  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  sourcesLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, color: T.muted },
  sourceChip: { backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 160 },
  sourceChipText: { fontFamily: 'Inter_500Medium', fontSize: 10, color: T.denim },
  typingDots: { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.denim, opacity: 0.6 },
  chatFooter: { backgroundColor: T.bg, borderTopWidth: 1, borderTopColor: T.border, padding: 12, paddingBottom: 16 },
  remainText: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  chatInput: { flex: 1, borderWidth: 1.5, borderColor: T.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontFamily: 'Inter_400Regular', fontSize: 14, color: T.text, maxHeight: 100, backgroundColor: T.bg },
  sendBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: T.denim, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: T.border },
  sendBtnText: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#fff', lineHeight: 28 },

  // Profile modal / bottom sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: T.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: T.border, alignSelf: 'center', marginBottom: 16 },
  profileCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, padding: 16, backgroundColor: T.bg2, borderRadius: 14, borderWidth: 1, borderColor: T.border },

  // Settings rows
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border, gap: 12 },
  settingsIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: T.text, flex: 1 },

  // Audio player
  audioPlayer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: T.royal, position: 'relative',
  },
  audioPlayBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: T.capri, alignItems: 'center', justifyContent: 'center' },
  audioPlayBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: T.royal },
  scrubTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, position: 'relative', justifyContent: 'center' },
  scrubFill: { position: 'absolute', left: 0, top: 0, height: 4, backgroundColor: T.capri, borderRadius: 2 },
  scrubThumb: { position: 'absolute', top: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff' },
  audioTime: { fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.7)', minWidth: 70, textAlign: 'right' },
  speedBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  speedBtnText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#fff' },
  speedMenu: {
    position: 'absolute', right: 12, bottom: 52, backgroundColor: T.bg,
    borderRadius: 10, borderWidth: 1, borderColor: T.border,
    zIndex: 100, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 8,
  },
  speedItem: { paddingHorizontal: 20, paddingVertical: 10 },
  speedItemActive: { backgroundColor: T.bg2 },
  speedItemText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: T.muted },
  speedItemTextActive: { fontFamily: 'Inter_700Bold', color: T.royal },

  // Bible red letter & divine speech
  verseBodyDivine: { color: '#C0392B' },

  // TTS button in chapter nav
  ttsBtn: { marginLeft: 8, width: 34, height: 34, borderRadius: 8, backgroundColor: T.bg2, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  ttsBtnText: { fontSize: 16 },

  // Chapter AI summary card
  summaryCard: {
    backgroundColor: '#FAFBFF', borderWidth: 1, borderColor: T.border,
    borderRadius: 12, padding: 14, marginBottom: 20,
    borderLeftWidth: 3, borderLeftColor: T.capri,
  },
  summaryLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, color: T.capri, letterSpacing: 1, marginBottom: 6 },
  summaryText: { fontFamily: 'Lora_400Regular_Italic', fontSize: 13.5, color: T.muted, lineHeight: 20 },
});
