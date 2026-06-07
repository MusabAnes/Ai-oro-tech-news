import { useState, useEffect, useRef, useCallback } from "react";

// ── Real RSS feeds via public proxy (no API key needed) ──
const RSS_SOURCES = [
  { name: "TechCrunch AI", url: "https://api.rss2json.com/v1/api.json?rss_url=https://techcrunch.com/feed/", cat: "ai-models" },
  { name: "The Verge", url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.theverge.com/rss/index.xml", cat: "ai-tools" },
  { name: "Wired", url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.wired.com/feed/rss", cat: "ai-research" },
  { name: "VentureBeat", url: "https://api.rss2json.com/v1/api.json?rss_url=https://venturebeat.com/feed/", cat: "startups" },
  { name: "Ars Technica", url: "https://api.rss2json.com/v1/api.json?rss_url=http://feeds.arstechnica.com/arstechnica/index", cat: "tech-edu" },
];

const CATEGORIES = [
  { id: "all",         label: "🌐 Hunda",        keywords: ["ai","tech","software","model","llm","robot","data","cyber","startup"] },
  { id: "ai-models",   label: "🤖 AI Haaraa",     keywords: ["gpt","gemini","claude","llm","model","openai","anthropic","mistral","ai model"] },
  { id: "ai-tools",    label: "🛠️ AI Tools",      keywords: ["tool","app","launch","product","feature","update","release","platform"] },
  { id: "tech-edu",    label: "📚 Barsiisa",      keywords: ["learn","tutorial","beginner","course","education","how to","guide","programming"] },
  { id: "ai-research", label: "🔬 Qorannoo",      keywords: ["research","paper","study","breakthrough","science","published","university"] },
  { id: "startups",    label: "🚀 Startups",      keywords: ["startup","funding","raise","million","billion","invest","series","venture"] },
  { id: "security",    label: "🔐 Nageenyaa",     keywords: ["security","hack","cyber","breach","privacy","threat","malware","vulnerability"] },
];

const LANGUAGES = [
  { code: "om", label: "🇪🇹 Oromoo" },
  { code: "am", label: "🇪🇹 Amharic" },
  { code: "ti", label: "🇪🇹 Tigrinya" },
  { code: "so", label: "🇸🇴 Somali" },
  { code: "ar", label: "🇸🇦 Arabic" },
  { code: "en", label: "🇬🇧 English" },
];

// Translations for UI text
const T = {
  om: { home:"🏠 Mana", saved:"🔖 Kuusamee", search:"Oduu barbaadi...", refresh:"🔄 Haaroomsi", readMore:"Caalaatti →", noSaved:"Oduu kuusamee hin jiru", lesson:"💡 Barsiisa", listen:"🔊 Dhaggeeffadhu", stop:"⏹ Dhaabi", tts:"📢 Dubbisi", share:"📤 Share", loading:"Oduu dhugaa sassaabuuf...", noResult:"Oduu hin argamne", allNews:"Oduu Hunda", today:"Har'a", summary:"Cuunfaa" },
  am: { home:"🏠 ቤት", saved:"🔖 ተቀምጧል", search:"ዜና ፈልግ...", refresh:"🔄 አድስ", readMore:"ተጨማሪ →", noSaved:"የተቀመጠ ዜና የለም", lesson:"💡 ትምህርት", listen:"🔊 አዳምጥ", stop:"⏹ አቁም", tts:"📢 አንብብ", share:"📤 አጋራ", loading:"ዜናዎችን እየሰበሰቡ...", noResult:"ዜና አልተገኘም", allNews:"ሁሉም ዜናዎች", today:"ዛሬ", summary:"ማጠቃለያ" },
  ti: { home:"🏠 ገዛ", saved:"🔖 ዝተዓቀበ", search:"ዜና ድለዩ...", refresh:"🔄 ሓድስ", readMore:"ተወሳኺ →", noSaved:"ዝተዓቀበ ዜና የለን", lesson:"💡 ትምህርቲ", listen:"🔊 ስምዑ", stop:"⏹ ኣቋርጽ", tts:"📢 ኣንብብ", share:"📤 ካፍል", loading:"ሓቀኛ ዜናታት ይእከቡ...", noResult:"ዜና ኣይተረኽበን", allNews:"ኩሉ ዜናታት", today:"ሎሚ", summary:"ጭብጢ" },
  so: { home:"🏠 Guriga", saved:"🔖 La kaydiyay", search:"Wararka raadi...", refresh:"🔄 Cusboonaysii", readMore:"Wax badan →", noSaved:"Waran la kaydiyay ma jiro", lesson:"💡 Cashar", listen:"🔊 Dhageyso", stop:"⏹ Jooji", tts:"📢 Akhri", share:"📤 La wadaag", loading:"Wararka run ah uruurineynaa...", noResult:"Waran lama helin", allNews:"Dhammaan Wararka", today:"Maanta", summary:"Kooban" },
  ar: { home:"🏠 الرئيسية", saved:"🔖 المحفوظة", search:"ابحث في الأخبار...", refresh:"🔄 تحديث", readMore:"اقرأ أكثر ←", noSaved:"لا توجد مقالات محفوظة", lesson:"💡 درس", listen:"🔊 استمع", stop:"⏹ إيقاف", tts:"📢 اقرأ", share:"📤 مشاركة", loading:"جمع الأخبار الحقيقية...", noResult:"لم يتم العثور على أخبار", allNews:"كل الأخبار", today:"اليوم", summary:"ملخص" },
  en: { home:"🏠 Home", saved:"🔖 Saved", search:"Search news...", refresh:"🔄 Refresh", readMore:"Read more →", noSaved:"No saved articles", lesson:"💡 Lesson", listen:"🔊 Listen", stop:"⏹ Stop", tts:"📢 Read", share:"📤 Share", loading:"Gathering real news...", noResult:"No articles found", allNews:"All News", today:"Today", summary:"Summary" },
};

// Strip HTML tags from RSS descriptions
function stripHtml(html) {
  return (html || "").replace(/<[^>]*>/g, "").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g," ").replace(/&#\d+;/g,"").trim().slice(0, 280);
}

function timeAgo(dateStr) {
  try {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  } catch { return ""; }
}

function matchesCategory(item, catId) {
  if (catId === "all") return true;
  const cat = CATEGORIES.find(c => c.id === catId);
  if (!cat) return true;
  const text = ((item.title || "") + " " + (item.description || "")).toLowerCase();
  return cat.keywords.some(k => text.includes(k));
}

const CACHE = {};

export default function AiOroTechNews() {
  const [lang, setLang] = useState("om");
  const [category, setCategory] = useState("all");
  const [allArticles, setAllArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aoro_saved") || "[]"); } catch { return []; }
  });
  const [view, setView] = useState("home");
  const [expanded, setExpanded] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [speaking, setSpeaking] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  // Persist saved
  useEffect(() => {
    try { localStorage.setItem("aoro_saved", JSON.stringify(saved)); } catch {}
  }, [saved]);

  // Fetch all RSS feeds
  const fetchAllNews = useCallback(async (force = false) => {
    const cacheKey = "all_news";
    if (!force && CACHE[cacheKey] && Date.now() - CACHE[cacheKey].ts < 30 * 60 * 1000) {
      setAllArticles(CACHE[cacheKey].data);
      setLastUpdated(new Date(CACHE[cacheKey].ts));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        RSS_SOURCES.map(src =>
          fetch(src.url + "&count=15", { signal: AbortSignal.timeout(8000) })
            .then(r => r.json())
            .then(d => (d.items || []).map(item => ({
              id: item.guid || item.link,
              title: item.title || "",
              summary: stripHtml(item.description || item.content || ""),
              source: src.name,
              url: item.link || null,
              date: item.pubDate || "",
              timeAgo: timeAgo(item.pubDate),
              image: item.thumbnail || item.enclosure?.link || null,
              cat: src.cat,
            })))
        )
      );

      const articles = results
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value)
        .filter(a => a.title && a.title.length > 5)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (articles.length === 0) throw new Error("empty");

      CACHE[cacheKey] = { data: articles, ts: Date.now() };
      setAllArticles(articles);
      setLastUpdated(new Date());
    } catch (e) {
      setError(T[lang]?.noResult || "No articles found");
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => { fetchAllNews(); }, []);

  // Auto refresh every hour
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchAllNews(true), 60 * 60 * 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, fetchAllNews]);

  // Filter articles
  const filtered = allArticles.filter(a => {
    const inCat = matchesCategory(a, category);
    const q = search.toLowerCase();
    const inSearch = !q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q);
    return inCat && inSearch;
  });

  const display = view === "saved" ? saved : filtered;
  const t = T[lang] || T.en;

  // Text-to-speech
  const speak = (article) => {
    window.speechSynthesis.cancel();
    if (speaking === article.id) { setSpeaking(null); return; }
    const text = `${article.title}. ${article.summary}`;
    const utt = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const langMap = { om:"en", am:"am", ti:"ti", so:"so", ar:"ar", en:"en" };
    const voice = voices.find(v => v.lang.startsWith(langMap[lang])) || voices[0];
    if (voice) utt.voice = voice;
    utt.rate = 0.9;
    utt.onend = () => setSpeaking(null);
    utt.onerror = () => setSpeaking(null);
    window.speechSynthesis.speak(utt);
    setSpeaking(article.id);
  };

  const toggleSave = (a) => {
    setSaved(prev => prev.find(x => x.id === a.id) ? prev.filter(x => x.id !== a.id) : [...prev, a]);
  };

  const shareArticle = (a) => {
    if (navigator.share) {
      navigator.share({ title: a.title, url: a.url || window.location.href });
    } else if (a.url) {
      navigator.clipboard?.writeText(a.url);
    }
  };

  const isRTL = lang === "ar";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#06060f 0%,#0d1117 55%,#0a0a1e 100%)",
      fontFamily: lang === "ar" ? "'Cairo','Segoe UI',sans-serif" : "'Syne','Exo 2',sans-serif",
      color: "#e2e8f0", overflowX: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Exo+2:wght@300;400;600&family=Cairo:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:#6d28d9;border-radius:2px}
        .btn{transition:all .18s ease;cursor:pointer;border:none;font-family:inherit}
        .btn:hover{opacity:.82;transform:translateY(-1px)}
        .btn:active{transform:scale(.97)}
        .card{transition:transform .22s ease,box-shadow .22s ease}
        .card:hover{transform:translateY(-3px);box-shadow:0 14px 36px rgba(109,40,217,.2)!important}
        .fade{animation:fadeUp .3s ease both}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .spin{animation:spin 1s linear infinite;display:inline-block}
        @keyframes spin{to{transform:rotate(360deg)}}
        .pulse{animation:pulse 1.6s ease infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .tag{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;background:rgba(255,255,255,.06);color:#94a3b8;margin:2px}
        .nowrap{white-space:nowrap}
        input:focus{outline:none;border-color:#7c3aed!important}
      `}</style>

      {/* ── STICKY HEADER ── */}
      <header style={{
        background:"rgba(6,6,16,.94)", backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(109,40,217,.2)",
        position:"sticky", top:0, zIndex:60, padding:"0 14px"
      }}>
        {/* Row 1: Logo + Lang */}
        <div style={{ maxWidth:860, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:52, gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#7c3aed,#2563eb)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🧠</div>
            <div>
              <div style={{ fontWeight:800, fontSize:13, letterSpacing:"-.4px" }}>Ai Oro Tech News</div>
              <div style={{ fontSize:9, color: loading ? "#f59e0b" : "#22c55e", letterSpacing:"1.2px", textTransform:"uppercase" }}>
                {loading ? "● Sassaabaa..." : `● Live · ${allArticles.length} Oduu`}
              </div>
            </div>
          </div>
          {/* Language pills */}
          <div style={{ display:"flex", gap:4, overflowX:"auto", scrollbarWidth:"none" }}>
            {LANGUAGES.map(l => (
              <button key={l.code} className="btn nowrap" onClick={() => setLang(l.code)} style={{
                padding:"3px 9px", borderRadius:20, fontSize:11,
                background: lang===l.code ? "rgba(124,58,237,.4)" : "rgba(255,255,255,.05)",
                border:`1px solid ${lang===l.code ? "#7c3aed" : "rgba(255,255,255,.09)"}`,
                color: lang===l.code ? "#c4b5fd" : "#6b7280"
              }}>{l.label}</button>
            ))}
          </div>
        </div>

        {/* Row 2: Nav + auto-refresh toggle */}
        <div style={{ maxWidth:860, margin:"0 auto", display:"flex", alignItems:"center", gap:8, paddingBottom:10 }}>
          {["home","saved"].map(v => (
            <button key={v} className="btn" onClick={() => setView(v)} style={{
              padding:"6px 14px", borderRadius:9, fontSize:13,
              background: view===v ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(255,255,255,.05)",
              border:`1px solid ${view===v ? "transparent" : "rgba(255,255,255,.1)"}`,
              color: view===v ? "white" : "#9ca3af", fontWeight: view===v ? 700 : 400
            }}>
              {v==="home" ? t.home : `${t.saved} (${saved.length})`}
            </button>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11, color: autoRefresh ? "#22c55e" : "#6b7280" }}>⏰ Auto</span>
            <div onClick={() => setAutoRefresh(p=>!p)} style={{
              width:34, height:18, borderRadius:9, cursor:"pointer",
              background: autoRefresh ? "#16a34a" : "#374151", position:"relative", transition:"background .2s"
            }}>
              <div style={{ position:"absolute", top:2, left: autoRefresh?16:2, width:14, height:14, borderRadius:7, background:"white", transition:"left .2s" }} />
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"16px 12px" }}>

        {view === "home" && <>
          {/* ── SEARCH BAR ── */}
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if(e.key==="Enter"){ setSearch(searchInput); }}}
              placeholder={t.search}
              style={{
                flex:1, background:"rgba(255,255,255,.05)", border:"1px solid rgba(109,40,217,.3)",
                borderRadius:11, padding:"10px 14px", color:"#e2e8f0", fontSize:14, fontFamily:"inherit"
              }}
            />
            <button className="btn" onClick={() => setSearch(searchInput)} style={{
              background:"linear-gradient(135deg,#7c3aed,#2563eb)", borderRadius:11,
              padding:"10px 16px", color:"white", fontSize:15, fontWeight:700
            }}>🔍</button>
            {search && <button className="btn" onClick={() => { setSearch(""); setSearchInput(""); }} style={{
              background:"rgba(255,71,87,.15)", border:"1px solid rgba(255,71,87,.3)",
              borderRadius:11, padding:"10px 12px", color:"#ff6b7a", fontSize:13
            }}>✕</button>}
          </div>

          {/* ── CATEGORY PILLS ── */}
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8, marginBottom:14, scrollbarWidth:"none" }}>
            {CATEGORIES.map(c => (
              <button key={c.id} className="btn nowrap" onClick={() => setCategory(c.id)} style={{
                padding:"7px 13px", borderRadius:20, fontSize:12,
                background: category===c.id ? "linear-gradient(135deg,#7c3aed,#2563eb)" : "rgba(255,255,255,.05)",
                border:`1px solid ${category===c.id ? "transparent" : "rgba(255,255,255,.08)"}`,
                color: category===c.id ? "white" : "#9ca3af", fontWeight: category===c.id ? 600 : 400
              }}>{c.label}</button>
            ))}
          </div>

          {/* ── STATUS ── */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <span style={{ fontSize:11, color:"#4f46e5" }}>
              {lastUpdated ? `⏱ ${lastUpdated.toLocaleTimeString()} · ${display.length} oduu` : ""}
              {search ? ` · "${search}"` : ""}
            </span>
            <button className="btn" onClick={() => fetchAllNews(true)} style={{
              background:"transparent", border:"1px solid rgba(109,40,217,.35)",
              color:"#a78bfa", padding:"4px 11px", borderRadius:7, fontSize:11
            }}>{t.refresh}</button>
          </div>
        </>}

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ textAlign:"center", padding:"50px 20px" }}>
            <div className="spin" style={{ fontSize:34, display:"block", marginBottom:14 }}>⚙️</div>
            <div className="pulse" style={{ color:"#a78bfa", fontSize:14 }}>{t.loading}</div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && !loading && (
          <div style={{ background:"rgba(255,71,87,.08)", border:"1px solid rgba(255,71,87,.22)", borderRadius:12, padding:16, color:"#fca5a5", fontSize:13, textAlign:"center" }}>
            {error}
            <button className="btn" onClick={() => fetchAllNews(true)} style={{ display:"block", margin:"10px auto 0", background:"rgba(255,255,255,.08)", border:"none", color:"#e2e8f0", padding:"6px 14px", borderRadius:8, fontSize:12 }}>
              {t.refresh}
            </button>
          </div>
        )}

        {/* ── EMPTY SAVED ── */}
        {view==="saved" && saved.length===0 && (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#374151" }}>
            <div style={{ fontSize:38, marginBottom:10 }}>🔖</div>
            <div>{t.noSaved}</div>
          </div>
        )}

        {/* ── ARTICLE CARDS ── */}
        {!loading && display.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {display.map((a, i) => {
              const isExp = expanded === a.id;
              const isSpeaking = speaking === a.id;
              const isSv = saved.find(x => x.id === a.id);
              return (
                <div key={a.id || i} className="card fade" style={{
                  background:"rgba(255,255,255,.033)", border:"1px solid rgba(255,255,255,.07)",
                  borderRadius:14, padding:"16px 14px", position:"relative", overflow:"hidden",
                  animationDelay:`${Math.min(i,8)*0.05}s`
                }}>
                  {/* top accent */}
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px", background:"linear-gradient(90deg,#7c3aed,transparent)" }} />

                  {/* Meta row */}
                  <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:8, flexWrap:"wrap" }}>
                    <span style={{ background:"rgba(124,58,237,.15)", color:"#a78bfa", border:"1px solid rgba(124,58,237,.3)", padding:"1px 8px", borderRadius:20, fontSize:10, fontWeight:700 }}>
                      📰 {a.source}
                    </span>
                    {a.timeAgo && <span style={{ color:"#6b7280", fontSize:10 }}>🕐 {a.timeAgo}</span>}
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize:14, fontWeight:700, lineHeight:1.45, color:"#f1f5f9", marginBottom:8 }}>
                    {a.title}
                  </h3>

                  {/* Summary (expand/collapse) */}
                  {a.summary && (
                    <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.65, marginBottom:10 }}>
                      {isExp ? a.summary : a.summary.slice(0, 130) + (a.summary.length > 130 ? "..." : "")}
                    </p>
                  )}

                  {/* Action bar */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                    {/* Expand */}
                    {a.summary?.length > 130 && (
                      <button className="btn" onClick={() => setExpanded(isExp ? null : a.id)} style={{
                        background:"rgba(99,102,241,.12)", border:"1px solid rgba(99,102,241,.22)",
                        color:"#818cf8", padding:"4px 10px", borderRadius:7, fontSize:11
                      }}>
                        {isExp ? "▲" : "▼ " + t.summary}
                      </button>
                    )}

                    {/* TTS */}
                    <button className="btn" onClick={() => speak(a)} style={{
                      background: isSpeaking ? "rgba(59,130,246,.25)" : "rgba(255,255,255,.06)",
                      border:`1px solid ${isSpeaking ? "#3b82f6" : "rgba(255,255,255,.1)"}`,
                      color: isSpeaking ? "#93c5fd" : "#9ca3af",
                      padding:"4px 10px", borderRadius:7, fontSize:11
                    }}>
                      {isSpeaking ? t.stop : t.listen}
                    </button>

                    {/* Save */}
                    <button className="btn" onClick={() => toggleSave(a)} style={{
                      background: isSv ? "rgba(124,58,237,.25)" : "rgba(255,255,255,.06)",
                      border:`1px solid ${isSv ? "#7c3aed" : "rgba(255,255,255,.1)"}`,
                      color: isSv ? "#c4b5fd" : "#9ca3af",
                      padding:"4px 10px", borderRadius:7, fontSize:11
                    }}>
                      {isSv ? "🔖" : "📌"}
                    </button>

                    {/* Share */}
                    {(navigator.share || a.url) && (
                      <button className="btn" onClick={() => shareArticle(a)} style={{
                        background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)",
                        color:"#9ca3af", padding:"4px 10px", borderRadius:7, fontSize:11
                      }}>{t.share}</button>
                    )}

                    {/* Read original */}
                    {a.url && (
                      <a href={a.url} target="_blank" rel="noopener noreferrer" style={{
                        marginLeft:"auto", fontSize:11, color:"#6366f1",
                        textDecoration:"none", display:"flex", alignItems:"center", gap:3
                      }}>{t.readMore}</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No results */}
        {!loading && !error && display.length === 0 && allArticles.length > 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#4b5563" }}>
            <div style={{ fontSize:34, marginBottom:10 }}>🔍</div>
            <div>{t.noResult}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign:"center", padding:"32px 0 14px", color:"#1f2937", fontSize:11 }}>
          Ai Oro Tech News · RSS Live · TechCrunch · Verge · Wired · VentureBeat · ArsTechnica
        </div>
      </div>
    </div>
  );
}
