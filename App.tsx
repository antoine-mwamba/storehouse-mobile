import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Lora_400Regular, Lora_400Regular_Italic, Lora_700Bold } from '@expo-google-fonts/lora';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

// ── Design tokens ──
const T = {
  royal:  '#002366',
  denim:  '#1560BD',
  capri:  '#00BFFF',
  bg:     '#FFFFFF',
  bg2:    '#EFF5FF',
  border: '#C4D4EE',
  text:   '#0D1B3E',
  muted:  '#5A6A8A',
  green:  '#22C55E',
  amber:  '#D97706',
  purple: '#7C3AED',
  red:    '#EF4444',
};

// ── Home Screen ──
function HomeScreen() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>The Storehouse</Text>
          <Text style={s.headerSub}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
        <View style={s.avatar}><Text style={s.avatarText}>A</Text></View>
      </View>

      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Greeting */}
        <Text style={s.greeting}>{greeting}</Text>

        {/* Daily Card */}
        <View style={s.dailyCard}>
          <View style={s.dailyDecorCircle1} />
          <View style={s.dailyDecorCircle2} />
          <View style={s.dailyDecorCircle3} />
          <Text style={s.verseRef}>JOHN 1:1</Text>
          <Text style={s.verseText}>
            "In the beginning was the Word, and the Word was with God, and the Word was God."
          </Text>
          <View style={s.dailyDivider} />
          <Text style={s.quoteText}>
            "God doesn't change His mind. God changes the scene, but never His Word."
          </Text>
          <Text style={s.quoteAttr}>— Brother Branham · Leadership, 1965</Text>
          <View style={s.ghostBtns}>
            <TouchableOpacity style={s.ghostBtn}><Text style={s.ghostBtnText}>Save</Text></TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn}><Text style={s.ghostBtnText}>Share</Text></TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn}><Text style={s.ghostBtnText}>Sermon</Text></TouchableOpacity>
          </View>
        </View>

        {/* Continue Reading */}
        <Text style={s.sectionLabel}>CONTINUE</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.resumeRow}>
            <View style={[s.iconBox, { backgroundColor: '#ede9fe' }]}>
              <Text style={{ fontFamily: 'Inter_700Bold', color: T.purple, fontSize: 17 }}>S</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.resumeTitle}>Leadership</Text>
              <Text style={[s.resumeMeta, { color: T.purple }]}>▶ Resume at ¶24</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <View style={s.cardDivider} />
          <TouchableOpacity style={s.resumeRow}>
            <View style={[s.iconBox, { backgroundColor: '#fef3c7' }]}>
              <Text style={{ fontFamily: 'Inter_700Bold', color: T.denim, fontSize: 17 }}>B</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.resumeTitle}>John · Chapter 14</Text>
              <Text style={[s.resumeMeta, { color: T.amber }]}>Last read: verse 6</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Goals */}
        <Text style={s.sectionLabel}>TODAY'S GOALS</Text>
        <View style={s.goalsGrid}>
          {[
            { label: 'Read a Sermon', done: true },
            { label: 'Daily Quote', done: true },
            { label: 'Bible Chapter', done: false },
            { label: 'Chat Session', done: false },
          ].map((goal, i) => (
            <View key={i} style={[s.goalChip, goal.done && s.goalChipDone]}>
              <Text style={[s.goalText, goal.done && s.goalTextDone]}>{goal.label}</Text>
            </View>
          ))}
        </View>

        {/* Library Stats */}
        <View style={s.statsRow}>
          {[
            { stat: '0', label: 'Sermons' },
            { stat: '0', label: 'Chapters' },
            { stat: '0', label: 'Quotes' },
            { stat: '0', label: 'Days' },
          ].map((item, i) => (
            <View key={i} style={[s.statCell, i < 3 && { borderRightWidth: 1, borderRightColor: T.border }]}>
              <Text style={s.statNumber}>{item.stat}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Recently Viewed */}
        <Text style={s.sectionLabel}>RECENTLY VIEWED</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ paddingRight: 4 }}>
          {[
            { title: 'Leadership', ref: '65-1207 · ¶24' },
            { title: 'Shalom', ref: '64-0112 · ¶6' },
            { title: 'Seven Seals', ref: '63-0318 · ¶51' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={s.recentCard}>
              <Text style={s.recentTitle}>{item.title}</Text>
              <Text style={s.recentRef}>{item.ref}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Access */}
        <Text style={s.sectionLabel}>QUICK ACCESS</Text>
        <View style={s.quickGrid}>
          {[
            { label: 'Search', bg: '#eef4ff', color: T.denim },
            { label: 'Sermons', bg: '#ede9fe', color: T.purple },
            { label: 'Bible', bg: '#fef3c7', color: T.amber },
            { label: 'Chat', bg: '#dcfce7', color: '#16a34a' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[s.quickCard, { backgroundColor: item.bg }]}>
              <Text style={[s.quickLabel, { color: item.color }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Search Screen ──
function SearchScreen() {
  const suggestions = ['Seal of God', 'Holy Spirit', 'Rapture', 'Seven Seals', 'Pillar of Fire', 'Godhead'];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Search</Text>
        <View style={s.scopeToggle}>
          <View style={s.scopeActive}><Text style={s.scopeActiveText}>Sermons</Text></View>
          <TouchableOpacity><Text style={s.scopeInactive}>Bible</Text></TouchableOpacity>
        </View>
      </View>
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <View style={s.searchBarWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search sermons, quotes, verses…"
            placeholderTextColor={T.muted}
          />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <Text style={s.sectionLabel}>SUGGESTIONS</Text>
          <View style={s.chipRow}>
            {suggestions.map((s2, i) => (
              <TouchableOpacity key={i} style={s.suggChip}>
                <Text style={s.suggChipText}>{s2}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Sermons Screen ──
function SermonsScreen() {
  const sermons = [
    { title: 'Leadership', code: '65-1207', loc: 'Covina, CA', inProgress: true },
    { title: 'Shalom', code: '64-0112', loc: 'Phoenix, AZ', inProgress: false },
    { title: 'The Spoken Word Is The Original Seed', code: '62-0318', loc: 'Jeffersonville, IN', inProgress: false },
    { title: 'Recognizing Your Day And Its Message', code: '64-0726', loc: 'Jeffersonville, IN', inProgress: false },
    { title: "God's Only Provided Place Of Worship", code: '65-1128', loc: 'Shreveport, LA', inProgress: false },
    { title: 'Spiritual Food In Due Season', code: '65-0718', loc: 'Jeffersonville, IN', inProgress: false },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Sermons</Text>
      </View>
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <View style={s.searchBarWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput style={s.searchInput} placeholder="Search sermons…" placeholderTextColor={T.muted} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {sermons.map((sermon, i) => (
            <TouchableOpacity key={i} style={[s.sermonRow, sermon.inProgress && s.sermonRowActive]}>
              <View style={[s.iconBox, { backgroundColor: sermon.inProgress ? '#ede9fe' : T.bg2 }]}>
                <Text style={{ fontSize: 18 }}>{sermon.inProgress ? '🎤' : '📜'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.sermonTitle}>{sermon.title}</Text>
                <Text style={s.sermonMeta}>{sermon.code} · {sermon.loc}</Text>
                {sermon.inProgress && <Text style={s.resumeLabel}>▶ Resume at ¶24</Text>}
              </View>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Bible Screen ──
function BibleScreen() {
  const otBooks = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', 'Psalms', 'Proverbs', 'Isaiah', 'Jeremiah', 'Ezekiel', 'Daniel'];
  const ntBooks = ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Revelation'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.royal }}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Bible</Text>
        <View style={s.scopeToggle}>
          <View style={s.scopeActive}><Text style={s.scopeActiveText}>OT</Text></View>
          <TouchableOpacity><Text style={s.scopeInactive}>NT</Text></TouchableOpacity>
        </View>
      </View>
      <ScrollView style={{ backgroundColor: T.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={s.bookGrid}>
          {otBooks.map((book, i) => (
            <TouchableOpacity key={i} style={s.bookChip}>
              <Text style={s.bookChipText}>{book}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── More Screen ──
function MoreScreen() {
  const sections = [
    { label: 'CONTENT', items: [
      { icon: '⭐', label: 'Daily Nuggets' },
      { icon: '🔖', label: 'Bookmarks' },
      { icon: '📝', label: 'Notes' },
      { icon: '📚', label: 'Reading History' },
    ]},
    { label: 'APP SETTINGS', items: [
      { icon: '🔔', label: 'Notifications' },
      { icon: '🎨', label: 'Display' },
      { icon: '🌐', label: 'Language' },
    ]},
    { label: 'ACCOUNT', items: [
      { icon: '👤', label: 'Profile' },
    ]},
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={[s.header, { backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: T.border }]}>
        <Text style={[s.headerTitle, { color: T.text }]}>More</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {sections.map((section, si) => (
          <View key={si}>
            <Text style={s.settingsSection}>{section.label}</Text>
            {section.items.map((item, ii) => (
              <TouchableOpacity key={ii} style={s.settingsRow}>
                <View style={s.settingsIcon}><Text style={{ fontSize: 16 }}>{item.icon}</Text></View>
                <Text style={s.settingsLabel}>{item.label}</Text>
                <Text style={[s.chevron, { color: T.muted }]}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <TouchableOpacity style={s.settingsRow}>
          <Text style={[s.settingsLabel, { color: T.red, flex: 1 }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Tab icons ──
function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const icons: Record<string, string> = {
    Home: '⌂', Search: '⌕', Sermons: '⏺', Bible: '⊞', More: '···',
  };
  return <Text style={{ fontSize: size - 2, color, fontWeight: '600' }}>{icons[name] ?? '•'}</Text>;
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
    <SafeAreaProvider>
      <NavigationContainer>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ color, size }) => <TabIcon name={route.name} color={color} size={size} />,
              tabBarActiveTintColor: T.royal,
              tabBarInactiveTintColor: T.muted,
              tabBarStyle: {
                backgroundColor: T.bg,
                borderTopColor: T.border,
                borderTopWidth: 1,
                height: 56,
                paddingBottom: 6,
              },
              tabBarLabelStyle: {
                fontFamily: 'Inter_500Medium',
                fontSize: 10,
              },
            })}
          >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Search" component={SearchScreen} />
            <Tab.Screen name="Sermons" component={SermonsScreen} />
            <Tab.Screen name="Bible" component={BibleScreen} />
            <Tab.Screen name="More" component={MoreScreen} />
          </Tab.Navigator>
        </View>
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

// ── Styles ──
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: T.royal,
  },
  headerTitle: { fontFamily: 'Lora_700Bold', fontSize: 17, color: '#fff' },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: T.capri,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: T.royal },

  greeting: { fontFamily: 'Lora_700Bold', fontSize: 22, color: T.text, marginTop: 20, marginBottom: 16 },

  // Daily card
  dailyCard: {
    backgroundColor: T.royal,
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: T.royal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  dailyDecorCircle1: {
    position: 'absolute', top: -30, right: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(0,191,255,0.06)',
  },
  dailyDecorCircle2: {
    position: 'absolute', bottom: -20, left: -10,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0,191,255,0.04)',
  },
  verseRef: {
    fontFamily: 'Inter_700Bold', fontSize: 10, color: T.capri,
    letterSpacing: 1.5, marginBottom: 8,
  },
  verseText: {
    fontFamily: 'Lora_400Regular_Italic', fontSize: 14.5,
    color: 'rgba(255,255,255,0.92)', lineHeight: 22, marginBottom: 14,
  },
  dailyDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 14 },
  quoteText: {
    fontFamily: 'Lora_400Regular_Italic', fontSize: 13.5,
    color: 'rgba(255,255,255,0.78)', lineHeight: 20, marginBottom: 8,
  },
  quoteAttr: { fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16 },
  ghostBtns: { flexDirection: 'row', gap: 8 },
  ghostBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  ghostBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  // Section labels
  sectionLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 11, color: T.muted,
    letterSpacing: 0.8, marginBottom: 10, marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: T.bg, borderRadius: 14, borderWidth: 1, borderColor: T.border,
    marginBottom: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardDivider: { height: 1, backgroundColor: T.border },
  resumeRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  resumeTitle: { fontFamily: 'Lora_700Bold', fontSize: 14, color: T.text, marginBottom: 2 },
  resumeMeta: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  chevron: { fontFamily: 'Inter_400Regular', fontSize: 20, color: T.muted, marginLeft: 4 },

  // Goals
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  goalChip: {
    borderWidth: 1, borderColor: T.border, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 9, backgroundColor: T.bg,
  },
  goalChipDone: { borderColor: T.green, backgroundColor: '#f0fdf4' },
  goalText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: T.muted },
  goalTextDone: { color: '#16a34a' },

  // Quick access
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  quickCard: { width: '47%', borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: 60 },
  quickLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  // Search
  searchBarWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: 12, paddingHorizontal: 12,
    borderWidth: 1.5, borderColor: T.border, borderRadius: 12,
    backgroundColor: T.bg,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1, paddingVertical: 11, fontFamily: 'Inter_400Regular',
    fontSize: 14, color: T.text,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggChip: {
    backgroundColor: T.bg2, borderWidth: 1, borderColor: T.border,
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7,
  },
  suggChipText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: T.muted },

  // Scope toggle
  scopeToggle: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 99, padding: 2,
  },
  scopeActive: { backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  scopeActiveText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: T.text },
  scopeInactive: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)', paddingHorizontal: 12, paddingVertical: 5 },

  // Sermons
  sermonRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: T.border, gap: 12,
  },
  sermonRowActive: { backgroundColor: '#f5f3ff' },
  sermonTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: T.text, marginBottom: 2 },
  sermonMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, color: T.muted },
  resumeLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: T.purple, marginTop: 2 },

  // Bible
  bookGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bookChip: {
    borderWidth: 1.5, borderColor: T.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: T.bg,
  },
  bookChipText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: T.text },

  // Daily card third circle
  dailyDecorCircle3: {
    position: 'absolute', bottom: -40, right: 20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(0,191,255,0.03)',
  },

  // Library stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  statNumber: {
    fontFamily: 'Lora_700Bold',
    fontSize: 20,
    color: T.denim,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: T.muted,
  },

  // Recently Viewed cards
  recentCard: {
    backgroundColor: T.bg2,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    width: 150,
    minHeight: 44,
    justifyContent: 'center',
  },
  recentTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: T.text,
    marginBottom: 4,
  },
  recentRef: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: T.muted,
  },

  // Settings/More
  settingsSection: {
    fontFamily: 'Inter_700Bold', fontSize: 11, color: T.muted,
    letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6,
  },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: T.border, gap: 12,
  },
  settingsIcon: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: T.bg2,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: T.text, flex: 1 },
});
