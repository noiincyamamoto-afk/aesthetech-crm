import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, Users, Monitor, Activity, Settings, Search, Plus, 
  MoreVertical, Calendar as CalendarIcon, Sparkles, ChevronRight, 
  TrendingUp, Mail, Smartphone, AlertCircle, Clock, Briefcase, 
  DollarSign, MessageSquare, FileText, Download, Send, CheckCircle2,
  Filter, ChevronLeft, ChevronRight as ChevronRightIcon, Trash2,
  BarChart3, UserCheck, PieChart, Info, BookOpen, Tag, ShoppingCart, 
  Layers, ExternalLink, Edit3, Save, File, Box, BrainCircuit, Target, Zap,
  MessageCircleQuestion, SendHorizontal, History, Star, Building2, MapPin, User, X,
  Trophy, Medal, Award, ClipboardList, Map, ShoppingBag, Eye, UserPlus, Lightbulb,
  Radar, AreaChart, ArrowUpRight, TrendingDown, Repeat, ListFilter, Kanban, Package, CreditCard,
  Rocket, ShieldCheck, Cpu, Globe, Share2, PlayCircle, Sparkle, DownloadCloud
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- API 初期化 ---
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// --- 型定義 ---
type Rank = 'S' | 'A' | 'B' | 'C';
type LeadStage = '見込み顧客' | 'デモ実施' | '見積提示' | '最終交渉' | '成約';

// --- モックデータ ---
const MOCK_PRODUCTS = [
  { id: 'P01', name: 'HIFU Pro-Max 2025', category: '美容機器', price: 5500000, margin: '45%', stock: 3, tags: ['売れ筋'] },
  { id: 'P02', name: 'LaseWave XL', category: '美容機器', price: 8200000, margin: '40%', stock: 1, tags: ['新製品'] },
  { id: 'P03', name: 'V-Line セラム', category: '専売品', price: 12000, margin: '60%', stock: 450, tags: ['スキンケア'] },
  { id: 'P04', name: 'Aqua Glow マスク', category: '専売品', price: 4500, margin: '65%', stock: 1200, tags: ['導入用'] },
];

const MOCK_CUSTOMERS = [
  { 
    id: 1, name: 'サロン・ド・ヴィーナス 銀座店', rank: 'S' as Rank, type: 'ハイエンドサロン', 
    address: '東京都中央区銀座 5-X-X', owner: '佐藤 栞', rep: '山田 太郎',
    installedDevices: [{ name: 'HIFU Pro-Max', date: '2024-01-10', price: 5500000 }],
    totalLTV: 14500000, aiSummary: '最新トレンドへの投資意欲が非常に高い。次回来店時の店販品受注確度は92%と予測。',
    memo: 'オーナーは結果重視。エビデンス資料を好む。'
  },
  { 
    id: 2, name: 'メンズ脱毛クリア 大阪梅田店', rank: 'A' as Rank, type: '多店舗チェーン', 
    address: '大阪府大阪市北区梅田', owner: '鈴木 拓海', rep: '佐藤 美咲',
    installedDevices: [{ name: 'LaseWave XL', date: '2023-11-01', price: 24000000 }],
    totalLTV: 28000000, aiSummary: '多店舗展開を加速中。追加技術研修の提案が有効。',
    memo: '意思決定が早い。'
  }
];

const MOCK_LEADS = [
  { id: 'L01', name: 'グレース銀座本店', stage: 'デモ実施' as LeadStage, potential: 6000000, rep: '山田 太郎', score: 85 },
  { id: 'L02', name: 'ビューティーラボ 新宿', stage: '見込み顧客' as LeadStage, potential: 4500000, rep: '佐藤 美咲', score: 62 },
  { id: 'L03', name: 'アロマスパ 麻布', stage: '見積提示' as LeadStage, potential: 12000000, rep: '田中 健一', score: 91 },
  { id: 'L04', name: 'メンズサロン 表参道', stage: '最終交渉' as LeadStage, potential: 7800000, rep: '山田 太郎', score: 78 },
];

const MOCK_INVOICES = [
  { id: 'INV-2045', customer: 'サロン・ド・ヴィーナス 銀座店', amount: 1200000, status: '支払い済み', date: '2024-05-10' },
  { id: 'INV-2046', customer: 'メンズ脱毛クリア 大阪梅田店', amount: 5500000, status: '支払い遅延', date: '2024-05-01' },
  { id: 'INV-2047', customer: 'ビューティーラボ 新宿', amount: 850000, status: '未請求', date: '2024-05-25' },
];

// --- 共通コンポーネント ---

const RankBadge = ({ rank }: { rank: Rank }) => {
  const styles: Record<Rank, string> = {
    S: 'bg-rose-500 text-white shadow-rose-200 border-rose-400',
    A: 'bg-amber-400 text-white shadow-amber-100 border-amber-300',
    B: 'bg-indigo-400 text-white shadow-indigo-100 border-indigo-300',
    C: 'bg-gray-400 text-white shadow-gray-100 border-gray-300',
  };
  return <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black italic shadow-lg border-2 ${styles[rank]}`}>{rank}</div>;
};

const SectionTitle = ({ title, subtitle, icon: Icon }: { title: string, subtitle: string, icon: any }) => (
  <div className="mb-6 md:mb-10">
    <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter italic uppercase flex items-center gap-4">
      {Icon && <Icon size={32} className="text-rose-500" />} {title}
    </h2>
    <p className="text-[10px] md:text-xs text-gray-400 mt-2 font-bold tracking-widest uppercase italic">{subtitle}</p>
  </div>
);

const InstallGuide = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
    <div className="bg-white rounded-[3rem] p-10 max-w-md w-full space-y-8 animate-in zoom-in-95">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 gold-gradient rounded-3xl mx-auto flex items-center justify-center shadow-2xl">
          <Smartphone size={40} className="text-white" />
        </div>
        <h3 className="text-2xl font-black italic tracking-tighter">アプリとしてインストール</h3>
        <p className="text-sm font-bold text-gray-500 italic">ホーム画面に追加して、PCやスマホからいつでも起動可能になります。</p>
      </div>
      <div className="space-y-4">
        <div className="flex gap-4 items-center p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
          <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-black">PC</div>
          <p className="text-xs font-bold text-gray-600 italic">ブラウザ右上の「インストール」をクリック</p>
        </div>
        <div className="flex gap-4 items-center p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
          <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black">iOS</div>
          <p className="text-xs font-bold text-gray-600 italic">共有メニューから「ホーム画面に追加」を選択</p>
        </div>
      </div>
      <button onClick={onClose} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">閉じる</button>
    </div>
  </div>
);

// --- 各セクションの実装 ---

const Dashboard = () => (
  <div className="space-y-12 animate-in fade-in">
    <SectionTitle title="OVERVIEW" subtitle="営業概況とAIリアルタイム・インテリジェンス" icon={LayoutDashboard} />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: '見込み売上', value: '¥1,420万', icon: TrendingUp, color: 'text-amber-500' },
        { label: '成約率', value: '68%', icon: Target, color: 'text-emerald-500' },
        { label: '重要顧客', value: '12 店舗', icon: Building2, color: 'text-rose-500' },
        { label: '未対応', value: '4 件', icon: Clock, color: 'text-indigo-500' },
      ].map((stat, i) => (
        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between h-full card-hover">
          <div className="flex justify-between items-start">
            <div><p className="text-[10px] font-black text-gray-400 uppercase italic">{stat.label}</p><h3 className="text-3xl font-black text-gray-800 mt-2 tracking-tighter">{stat.value}</h3></div>
            <div className={`p-4 rounded-2xl bg-gray-50 ${stat.color}`}><stat.icon size={22} /></div>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm min-h-[350px]">
        <h3 className="text-lg font-black text-gray-800 uppercase italic flex items-center gap-3 mb-10"><BarChart3 size={24} className="text-rose-500" /> 売上予測推移</h3>
        <div className="h-48 flex items-end justify-between gap-4">
          {[40, 60, 45, 90, 75, 85, 100].map((v, i) => (
            <div key={i} className="flex-1 gold-gradient rounded-t-2xl shadow-lg" style={{ height: `${v}%` }} />
          ))}
        </div>
      </div>
      <div className="lg:col-span-4 bg-[#1A1A1A] p-10 rounded-[3.5rem] shadow-2xl text-white">
        <h3 className="text-sm font-black italic uppercase mb-8 flex items-center gap-2"><Sparkles size={16} className="text-rose-500" /> AI 戦略ログ</h3>
        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-2xl text-[11px] italic leading-relaxed border border-white/5">「次世代ハイフ」の需要が港区で急増。導入事例の送付を推奨。</div>
          <div className="p-4 bg-rose-500/10 rounded-2xl text-[11px] italic leading-relaxed border border-rose-500/10">サロン・ド・ヴィーナスのリピート注文サイクルまであと3日。</div>
        </div>
      </div>
    </div>
  </div>
);

const LeadKanban = () => {
  const stages: LeadStage[] = ['見込み顧客', 'デモ実施', '見積提示', '最終交渉', '成約'];
  return (
    <div className="space-y-10 animate-in fade-in">
      <SectionTitle title="LEAD PIPELINE" subtitle="営業プロセスの可視化と進捗管理" icon={Kanban} />
      <div className="flex gap-6 overflow-x-auto pb-10 no-scrollbar">
        {stages.map(stage => (
          <div key={stage} className="min-w-[300px] flex-1">
            <div className="mb-6 flex justify-between items-center px-4">
              <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest italic">{stage}</h4>
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 text-[10px] flex items-center justify-center font-bold">
                {MOCK_LEADS.filter(l => l.stage === stage).length}
              </span>
            </div>
            <div className="space-y-4">
              {MOCK_LEADS.filter(l => l.stage === stage).map(lead => (
                <div key={lead.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm card-hover">
                  <h5 className="font-black text-gray-800 italic">{lead.name}</h5>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-rose-500 italic">¥{(lead.potential/10000).toLocaleString()}万</span>
                    <div className="flex items-center gap-1 text-[9px] font-black text-gray-300">
                      <Zap size={10} className="text-amber-400" /> {lead.score}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BillingManager = () => (
  <div className="space-y-10 animate-in fade-in">
    <SectionTitle title="BILLING" subtitle="請求ステータス・回収管理・LTV追跡" icon={CreditCard} />
    <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b">
          <tr><th className="px-10 py-6">請求番号</th><th className="px-10 py-6">サロン名</th><th className="px-10 py-6 text-right">金額</th><th className="px-10 py-6">状態</th><th className="px-10 py-6">期日</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {MOCK_INVOICES.map(inv => (
            <tr key={inv.id} className="hover:bg-gray-50 transition-all">
              <td className="px-10 py-8 text-xs font-bold text-gray-400">{inv.id}</td>
              <td className="px-10 py-8 font-black text-gray-800">{inv.customer}</td>
              <td className="px-10 py-8 text-right font-black italic">¥{inv.amount.toLocaleString()}</td>
              <td className="px-10 py-8">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${
                  inv.status === '支払い済み' ? 'bg-emerald-50 text-emerald-500' :
                  inv.status === '支払い遅延' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                }`}>{inv.status}</span>
              </td>
              <td className="px-10 py-8 text-[10px] font-bold text-gray-400">{inv.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const QAAssistant = () => {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([{ role: 'ai', text: '美容機器のスペック比較や、最新の専売品トレンドについてお答えします。何をお手伝いしましょうか？' }]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSend = async () => {
    if (!msg.trim()) return;
    const userMsg = msg;
    setMsg("");
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: 'あなたは美容サロン向けの卸売会社の超有能な営業コンシェルジュです。機器のスペック、導入メリット、専売品のトレンドについてプロフェッショナルかつ熱意を持って回答してください。回答は簡潔に、しかし専門性を感じさせるトーン（ですます調、時には戦略的なアドバイスを含む）でお願いします。',
        }
      });
      setChat(prev => [...prev, { role: 'ai', text: response.text || "申し訳ありません、情報を取得できませんでした。" }]);
    } catch (e) {
      setChat(prev => [...prev, { role: 'ai', text: "接続エラーが発生しました。APIキーを確認してください。" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[75vh] flex flex-col bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in zoom-in-95">
      <div className="p-8 bg-[#1A1A1A] text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500 rounded-2xl shadow-lg shadow-rose-500/20"><BrainCircuit size={24} /></div>
          <div><h3 className="font-black italic tracking-tighter">AI CONCIERGE</h3><p className="text-[9px] font-black text-gray-500 uppercase">Expert Knowledge Base</p></div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black text-emerald-500 uppercase">System Online</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-gray-50/30">
        {chat.map((c, i) => (
          <div key={i} className={`flex ${c.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] p-6 rounded-[2rem] text-sm italic leading-relaxed ${c.role === 'ai' ? 'bg-white text-gray-800 shadow-sm border border-gray-100' : 'gold-gradient text-white shadow-xl'}`}>
              {c.text}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-pulse flex gap-2"><div className="w-2 h-2 rounded-full bg-gray-200" /><div className="w-2 h-2 rounded-full bg-gray-200" /><div className="w-2 h-2 rounded-full bg-gray-200" /></div></div>}
        <div ref={chatEndRef} />
      </div>
      <div className="p-8 border-t border-gray-100 flex gap-4 bg-white">
        <input 
          value={msg} 
          onChange={e => setMsg(e.target.value)} 
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="AIに営業戦略や機器詳細を質問..." 
          className="flex-1 bg-gray-50 rounded-2xl px-6 py-4 text-sm font-bold border border-transparent focus:border-rose-500 outline-none italic transition-all" 
        />
        <button onClick={handleSend} disabled={loading} className="p-4 bg-gray-900 text-white rounded-2xl shadow-xl hover:bg-rose-600 transition-all disabled:opacity-50">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

// --- メインアプリ構造 ---

const Sidebar = ({ currentTab, setTab, isOpen, setIsOpen }: any) => {
  const menu = [
    { id: 'dashboard', icon: LayoutDashboard, label: '概況' },
    { id: 'customers', icon: Users, label: '顧客カルテ' },
    { id: 'leads', icon: Kanban, label: 'リード管理' },
    { id: 'products', icon: Package, label: '在庫・商品' },
    { id: 'billing', icon: CreditCard, label: '請求・売上' },
    { id: 'qa', icon: BrainCircuit, label: 'AI相談室' },
    { id: 'roadmap', icon: Rocket, label: '導入計画' },
  ];
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-[200] lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-[#1A1A1A] text-white p-8 flex flex-col z-[210] transition-transform duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="mb-12 flex items-center gap-3">
          <div className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center italic font-black shadow-lg">A</div>
          <span className="text-xl font-black italic tracking-tighter">AESTHETECH</span>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {menu.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setIsOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${currentTab === item.id ? 'bg-white text-[#1A1A1A] font-black italic shadow-xl' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              <item.icon size={20} className={currentTab === item.id ? 'text-rose-500' : ''} />
              <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center font-black text-xs">Y</div>
           <div className="flex-1 overflow-hidden"><p className="text-[10px] font-black uppercase truncate italic">Yamada Taro</p></div>
           <Settings size={14} className="text-gray-600" />
        </div>
      </aside>
    </>
  );
};

const App = () => {
  const [currentTab, setTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFBFB]">
      <Sidebar currentTab={currentTab} setTab={setTab} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="lg:ml-64 p-6 md:p-16 min-h-screen relative overflow-x-hidden">
        <header className="flex items-center justify-between mb-12 gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"><ListFilter size={20} /></button>
            <div onClick={() => setTab('dashboard')} className="cursor-pointer group">
              <h1 className="text-xl md:text-3xl font-black text-gray-900 italic tracking-tighter group-hover:text-rose-500 transition-all">AestheTech Premium</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase italic mt-1 tracking-widest">Enterprise Edition 5.0</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowInstall(true)} className="px-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
              <DownloadCloud size={16} className="text-rose-500" /> <span className="hidden sm:inline">アプリ保存</span>
            </button>
          </div>
        </header>

        <div className="max-w-[1400px] mx-auto pb-20 relative z-10">
          {currentTab === 'dashboard' && <Dashboard />}
          {currentTab === 'customers' && <CustomerManager />}
          {currentTab === 'leads' && <LeadKanban />}
          {currentTab === 'products' && <ProductCatalog />}
          {currentTab === 'billing' && <BillingManager />}
          {currentTab === 'qa' && <QAAssistant />}
          {currentTab === 'roadmap' && <RoadmapView />}
        </div>

        {/* Decorative elements */}
        <div className="fixed top-0 right-0 w-[50vw] h-screen gold-gradient opacity-[0.02] -skew-x-12 translate-x-1/2 pointer-events-none z-0"></div>
      </main>

      {showInstall && <InstallGuide onClose={() => setShowInstall(false)} />}
    </div>
  );
};

// --- CustomerManager, ProductCatalog, RoadmapView などの未掲出分を再掲 ---
// (容量の関係で簡易化して再掲しますが、すべて動作するように調整)

const CustomerManager = () => {
  const [selected, setSelected] = useState<any>(null);
  return (
    <div className="space-y-10 animate-in fade-in">
      <SectionTitle title="CUSTOMER LIST" subtitle="重要顧客カルテとLTV分析" icon={Users} />
      <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase border-b">
            <tr><th className="px-10 py-6">ランク</th><th className="px-10 py-6">サロン名</th><th className="px-10 py-6 text-right">生涯売上</th><th className="px-10 py-6"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {MOCK_CUSTOMERS.map(c => (
              <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-rose-50/30 cursor-pointer group transition-all">
                <td className="px-10 py-8"><RankBadge rank={c.rank} /></td>
                <td className="px-10 py-8 font-black text-gray-800 group-hover:text-rose-500">{c.name}</td>
                <td className="px-10 py-8 text-right font-black italic">¥{(c.totalLTV/10000).toLocaleString()}万</td>
                <td className="px-10 py-8 text-right"><ChevronRight className="text-gray-300 group-hover:text-rose-500" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full md:w-[600px] bg-white h-full shadow-2xl animate-in slide-in-from-right overflow-y-auto">
             <div className="p-10 gold-gradient text-white flex justify-between items-center">
               <h3 className="text-3xl font-black italic tracking-tighter">{selected.name}</h3>
               <button onClick={() => setSelected(null)} className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-all"><X /></button>
             </div>
             <div className="p-10 space-y-8">
               <div className="bg-[#1A1A1A] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/20 blur-3xl rounded-full" />
                 <p className="text-xs font-black uppercase text-rose-500 mb-4 tracking-widest flex items-center gap-2"><Sparkles size={14}/> AI Summary</p>
                 <p className="text-sm italic leading-relaxed text-gray-300">{selected.aiSummary}</p>
               </div>
               <div className="space-y-4">
                 <h4 className="text-xs font-black uppercase text-gray-400 italic">導入履歴</h4>
                 {selected.installedDevices.map((d: any, i: number) => (
                   <div key={i} className="p-6 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100">
                     <span className="font-black text-gray-800 italic">{d.name}</span>
                     <span className="text-[10px] text-gray-400 font-black italic uppercase">{d.date}</span>
                   </div>
                 ))}
               </div>
               <div className="pt-8 border-t border-gray-100 space-y-4">
                 <h4 className="text-xs font-black uppercase text-gray-400 italic">基本情報</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[9px] font-black text-gray-300 uppercase">代表者</p><p className="text-sm font-black italic">{selected.owner}</p></div>
                   <div className="p-4 bg-gray-50 rounded-xl"><p className="text-[9px] font-black text-gray-300 uppercase">エリア</p><p className="text-sm font-black italic">{selected.address}</p></div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductCatalog = () => (
  <div className="space-y-10 animate-in fade-in">
    <SectionTitle title="INVENTORY" subtitle="機器在庫・専売品マスター・利益率管理" icon={Package} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {MOCK_PRODUCTS.map(p => (
        <div key={p.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex gap-6 items-center card-hover relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 gold-gradient opacity-[0.03] group-hover:scale-150 transition-all rounded-bl-full" />
          <div className="w-24 h-24 shrink-0 bg-gray-50 rounded-[2rem] flex items-center justify-center text-rose-500 border border-gray-100 group-hover:bg-rose-50 transition-all">
            {p.category === '美容機器' ? <Monitor size={40} /> : <Box size={40} />}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{p.category}</span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-500 text-[9px] font-black rounded-full italic border border-emerald-100 shadow-sm">利益率 {p.margin}</span>
            </div>
            <h4 className="text-xl font-black text-gray-800 mt-2 tracking-tighter italic group-hover:text-rose-500 transition-all">{p.name}</h4>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-lg font-black italic text-rose-500">¥{p.price.toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-gray-400 uppercase">Stock:</span>
                <span className={`text-xs font-black ${p.stock < 5 ? 'text-rose-500 animate-pulse' : 'text-gray-800'}`}>{p.stock}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RoadmapView = () => (
  <div className="space-y-12 animate-in fade-in">
    <SectionTitle title="ROADMAP" subtitle="実運用に向けた実装フェーズと現在地" icon={Rocket} />
    <div className="space-y-6 max-w-4xl mx-auto">
      {[
        { phase: 'Phase 1', title: 'PWA & 基礎インフラ', status: 'COMPLETED', desc: 'モバイルアプリ化とオフラインキャッシュの土台構築' },
        { phase: 'Phase 2', title: 'AIチャット & 営業支援機能', status: 'COMPLETED', desc: 'Gemini APIによる専門知識ベースの構築' },
        { phase: 'Phase 3', title: '外部連携 (LINE/リース/決済)', status: 'PLANNED', desc: 'LINE APIとリース会社基幹システムとのAPI連携' },
        { phase: 'Phase 4', title: '高度な売上予測 (RAG)', status: 'FUTURE', desc: '自社の成功提案書を学習させたRAGによる自動提案' },
      ].map((p, i) => (
        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row gap-8 items-center card-hover">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black italic text-xl shadow-lg ${p.status === 'COMPLETED' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-gray-100 text-gray-300 shadow-gray-50'}`}>{i+1}</div>
          <div className="flex-1 text-center md:text-left">
            <span className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'COMPLETED' ? 'text-emerald-500' : 'text-gray-400'}`}>{p.phase}</span>
            <h4 className="text-2xl font-black text-gray-900 italic tracking-tighter mt-1">{p.title}</h4>
            <p className="text-xs text-gray-400 font-bold italic mt-2 leading-relaxed">{p.desc}</p>
          </div>
          <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
            p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 
            p.status === 'PLANNED' ? 'bg-amber-50 text-amber-500 border-amber-100 animate-pulse' : 'bg-gray-50 text-gray-400 border-gray-100'
          }`}>{p.status}</div>
        </div>
      ))}
    </div>
  </div>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);