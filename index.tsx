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
  Radar, AreaChart, ArrowUpRight, TrendingDown, Repeat, ListFilter, Kanban, Package, CreditCard
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- 型定義 & 定数 ---

type Rank = 'S' | 'A' | 'B' | 'C';
type EventType = 'visit' | 'meeting' | 'demo' | 'call' | 'maintenance';
type LeadStage = '見込み顧客' | 'デモ実施' | '見積提示' | '最終交渉' | '成約';

interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  type: EventType;
  rep: string;
  customer?: string;
  isAiGenerated?: boolean;
  memo?: string;
}

// --- モックデータ ---

const MOCK_SALES_REPS = ['山田 太郎', '佐藤 美咲', '田中 健一'];

const MOCK_PRODUCTS = [
  { id: 'P01', name: 'HIFU Pro-Max 2025 (次世代ハイフ)', category: '美容機器', price: 5500000, margin: '45%', stock: 3, tags: ['ハイエンド', '売れ筋'] },
  { id: 'P02', name: 'LaseWave XL (多機能脱毛器)', category: '美容機器', price: 8200000, margin: '40%', stock: 1, tags: ['レーザー', '新製品'] },
  { id: 'P03', name: 'V-Line セラム (30ml)', category: '専売品', price: 12000, margin: '60%', stock: 450, tags: ['リピート率高', 'スキンケア'] },
  { id: 'P04', name: 'Aqua Glow フェイスマスク', category: '専売品', price: 4500, margin: '65%', stock: 1200, tags: ['導入用'] },
];

const MOCK_CUSTOMERS = [
  { 
    id: 1, 
    name: 'サロン・ド・ヴィーナス 銀座店', 
    rank: 'S' as Rank,
    type: 'ハイエンドサロン', 
    address: '東京都中央区銀座 5-X-X', 
    owner: '佐藤 栞',
    rep: '山田 太郎',
    installedDevices: [{ name: 'HIFU Pro-Max', date: '2024-01-10', price: 5500000 }],
    consumables: ['V-Line セラム'],
    totalLTV: 14500000,
    aiSummary: '最新トレンドへの投資意欲が非常に高い。リピートサイクル分析により、次回来店時の店販品受注確度は92%と予測されます。',
    salesPhases: [{ phase: '成約・導入', date: '2024-01-10', note: 'HIFU Pro-Max 導入完了。スタッフ研修済み。' }],
    memo: 'オーナーは結果重視。エビデンス資料を好む。毎月第3水曜日の訪問がベスト。'
  },
  { 
    id: 2, 
    name: 'メンズ脱毛クリア 大阪梅田店', 
    rank: 'A' as Rank,
    type: '多店舗チェーン', 
    address: '大阪府大阪市北区梅田', 
    owner: '鈴木 拓海',
    rep: '佐藤 美咲',
    installedDevices: [{ name: 'LaseWave XL (3台)', date: '2023-11-01', price: 24000000 }],
    consumables: ['アフターケアジェル'],
    totalLTV: 28000000,
    aiSummary: '多店舗展開を加速中。オペレーション安定化のための追加技術研修の提案が有効です。',
    salesPhases: [{ phase: '成約', date: '2023-11-01', note: '3店舗同時導入決定。リース審査通過。' }],
    memo: '意思決定が早い。現場マネージャーとの信頼関係構築が鍵。'
  }
];

const MOCK_LEADS = [
  { id: 'L01', name: 'グレース銀座本店', stage: 'デモ実施' as LeadStage, potential: 6000000, rep: '山田 太郎', lastAction: '実機デモ実施済み・高評価', score: 85 },
  { id: 'L02', name: 'ビューティーラボ 新宿', stage: '見込み顧客' as LeadStage, potential: 4500000, rep: '佐藤 美咲', lastAction: '資料送付済み・追客中', score: 62 },
  { id: 'L03', name: 'アロマスパ 麻布', stage: '見積提示' as LeadStage, potential: 12000000, rep: '田中 健一', lastAction: '最終見積提示中・役員決済待ち', score: 91 },
  { id: 'L04', name: 'メンズサロン 表参道', stage: '最終交渉' as LeadStage, potential: 7800000, rep: '山田 太郎', lastAction: 'リース審査中・ほぼ確定', score: 78 },
];

const MOCK_INVOICES = [
  { id: 'INV-2045', customer: 'サロン・ド・ヴィーナス 銀座店', amount: 1200000, status: '支払い済み', date: '2024-05-10' },
  { id: 'INV-2046', customer: 'メンズ脱毛クリア 大阪梅田店', amount: 5500000, status: '支払い遅延', date: '2024-05-01' },
  { id: 'INV-2047', customer: 'サロン・ド・ヴィーナス 銀座店', amount: 850000, status: '未請求', date: '2024-05-25' },
];

const INITIAL_EVENTS: CalendarEvent[] = [
  { id: 1, title: 'サロン・ド・ヴィーナス 定期訪問', start: '2024-05-22T10:00:00', type: 'visit', rep: '山田 太郎', customer: 'サロン・ド・ヴィーナス' },
  { id: 2, title: 'メンズ脱毛クリア 経営会議', start: '2024-05-22T14:00:00', type: 'meeting', rep: '佐藤 美咲', customer: 'メンズ脱毛クリア' },
  { id: 3, title: 'グレース銀座 実機デモ', start: '2024-05-23T11:00:00', type: 'demo', rep: '山田 太郎', customer: 'グレース銀座' },
  { id: 4, title: '【AI推奨】追客フォロー連絡', start: '2024-05-22T16:00:00', type: 'call', rep: '田中 健一', isAiGenerated: true, memo: '成約率向上のためのアフターフォロー推奨' },
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
  <div className="mb-10">
    <h2 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase flex items-center gap-4">
      {title}
    </h2>
    <p className="text-xs text-gray-400 mt-2 font-bold tracking-widest uppercase italic">{subtitle}</p>
  </div>
);

// --- コンテンツセクション ---

const LeadKanban = () => {
  const stages: LeadStage[] = ['見込み顧客', 'デモ実施', '見積提示', '最終交渉', '成約'];
  return (
    <div className="animate-in fade-in space-y-8">
      <div className="flex justify-between items-end">
        <SectionTitle title="商談進捗 カンバン" subtitle="全リードのステータス管理と成約予測" icon={Kanban} />
        <button className="px-8 py-4 gold-gradient text-white rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 mb-10"><Plus size={18} /> 新規リードを登録</button>
      </div>
      <div className="grid grid-cols-5 gap-6">
        {stages.map(stage => (
          <div key={stage} className="bg-white/40 p-5 rounded-[2.5rem] border border-gray-100 min-h-[600px] flex flex-col">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-4 flex justify-between">
              {stage} <span className="text-rose-400">{MOCK_LEADS.filter(l => l.stage === stage).length}</span>
            </h3>
            <div className="space-y-4 flex-1">
              {MOCK_LEADS.filter(l => l.stage === stage).map(lead => (
                <div key={lead.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-grab group">
                  <div className="flex justify-between mb-3">
                    <span className="text-[9px] font-black bg-rose-50 text-rose-500 px-2 py-0.5 rounded italic">スコア {lead.score}</span>
                    <MoreVertical size={14} className="text-gray-300" />
                  </div>
                  <h4 className="text-sm font-black text-gray-800 mb-1 group-hover:text-rose-500">{lead.name}</h4>
                  <p className="text-xl font-black text-gray-900 italic tracking-tighter mb-4">¥{(lead.potential / 10000).toLocaleString()}万円</p>
                  <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase italic border-t border-gray-50 pt-4">
                    <span>担当: {lead.rep.split(' ')[0]}</span>
                    <span className="text-rose-300">{lead.lastAction}</span>
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

const ProductCatalog = () => (
  <div className="animate-in fade-in space-y-10">
    <SectionTitle title="商品カタログ ・ 在庫" subtitle="美容機器から専売品までの最新スペックと流通管理" icon={Package} />
    <div className="grid grid-cols-4 gap-6">
      {MOCK_PRODUCTS.map(p => (
        <div key={p.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 gold-gradient opacity-10 rounded-bl-full -mr-8 -mt-8 group-hover:scale-150 transition-transform" />
          <div className="mb-6"><span className="px-3 py-1 bg-gray-900 text-white text-[9px] font-black rounded-full uppercase tracking-tighter">{p.category}</span></div>
          <h4 className="text-lg font-black text-gray-800 mb-2 leading-tight">{p.name}</h4>
          <div className="flex flex-wrap gap-2 mb-6">
            {p.tags.map(t => <span key={t} className="text-[8px] font-black text-rose-400 uppercase border border-rose-100 px-2 py-0.5 rounded-full">#{t}</span>)}
          </div>
          <div className="border-t border-gray-50 pt-6 flex justify-between items-end">
            <div>
              <p className="text-[9px] font-black text-gray-300 uppercase italic">標準単価</p>
              <p className="text-xl font-black text-gray-900 italic tracking-tighter">¥{p.price.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-gray-300 uppercase italic">在庫数</p>
              <p className={`text-sm font-black italic ${p.stock < 5 ? 'text-rose-500' : 'text-emerald-500'}`}>{p.stock} 点</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const BillingManager = () => (
  <div className="animate-in fade-in space-y-10">
    <SectionTitle title="請求 ・ 支払管理" subtitle="売上回収状況のリアルタイムモニタリング" icon={CreditCard} />
    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
          <tr>
            <th className="px-10 py-6">伝票番号</th>
            <th className="px-10 py-6">顧客名</th>
            <th className="px-10 py-6">請求金額</th>
            <th className="px-10 py-6">支払期限</th>
            <th className="px-10 py-6">ステータス</th>
            <th className="px-10 py-6"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {MOCK_INVOICES.map(inv => (
            <tr key={inv.id} className="hover:bg-rose-50/20 transition-all group">
              <td className="px-10 py-7 text-xs font-black text-gray-400">#{inv.id}</td>
              <td className="px-10 py-7 text-sm font-black text-gray-800 italic">{inv.customer}</td>
              <td className="px-10 py-7 text-lg font-black text-gray-900 italic tracking-tighter">¥{inv.amount.toLocaleString()}</td>
              <td className="px-10 py-7 text-xs font-bold text-gray-500">{inv.date}</td>
              <td className="px-10 py-7">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  inv.status === '支払い済み' ? 'bg-emerald-50 text-emerald-500' :
                  inv.status === '支払い遅延' ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-amber-50 text-amber-500'
                }`}>
                  {inv.status}
                </span>
              </td>
              <td className="px-10 py-7 text-right">
                <button className="p-3 bg-white rounded-2xl border border-gray-100 text-gray-300 group-hover:text-rose-500 hover:border-rose-100 transition-all"><Download size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const InboxAI = () => (
  <div className="animate-in fade-in max-w-5xl mx-auto space-y-10">
    <SectionTitle title="インボックス AI" subtitle="メール・チャットから重要アクションを自動抽出" icon={MessageSquare} />
    <div className="grid grid-cols-1 gap-6">
      {[
        { from: '佐藤 栞 (サロン・ド・ヴィーナス)', title: '専売品の追加発注について', time: '10分前', body: 'いつもお世話になっております。セラムの在庫が少なくなってきたので、30本ほど追加発注したいのですが可能でしょうか？', aiAction: '発注依頼書を自動作成', importance: '高' },
        { from: '鈴木 拓海 (メンズ脱毛クリア)', title: '新規店舗の図面送付について', time: '1時間前', body: '来月オープンの梅田2号店の図面が確定しましたのでお送りします。機器配置の提案をお願いします。', aiAction: 'AIによる配置提案を作成', importance: '最優先' },
        { from: '高橋 (ビューティーラボ)', title: 'デモの日程調整', time: '3時間前', body: '先日の展示会で拝見したHIFUのデモを、来週水曜日の14時頃にお願いしたいのですが。', aiAction: 'カレンダーへ自動登録', importance: '中' }
      ].map((mail, i) => (
        <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex gap-8 items-start group">
          <div className={`w-3 h-3 rounded-full mt-4 ${mail.importance === '最優先' ? 'bg-rose-500 animate-ping' : 'bg-gray-200'}`} />
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-black text-gray-800 mb-1">{mail.from}</h4>
                <p className="text-base font-black text-gray-900 italic tracking-tight group-hover:text-rose-500 transition-colors">{mail.title}</p>
              </div>
              <span className="text-[10px] font-black text-gray-300 uppercase italic">{mail.time}</span>
            </div>
            <p className="text-xs text-gray-500 font-medium leading-relaxed italic border-l-4 border-rose-50 pl-6 py-2">{mail.body}</p>
            <div className="pt-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="px-4 py-1.5 bg-[#1A1A1A] text-white text-[9px] font-black rounded-full uppercase flex items-center gap-2 shadow-xl">
                  <Sparkles size={12} className="text-rose-500" /> AIアクション: {mail.aiAction}
                </div>
              </div>
              <div className="flex gap-4">
                <button className="text-[10px] font-black text-gray-400 uppercase hover:text-rose-500 transition-colors">アーカイブ</button>
                <button className="text-[10px] font-black text-rose-500 uppercase hover:underline transition-all">実行する</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- メインコンポーネント ---

const Dashboard = () => {
  const salesData = [38, 45, 62, 55, 84, 72, 95];
  return (
    <div className="space-y-12 animate-in fade-in">
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: '見込み売上', value: '¥1,420万', icon: TrendingUp, color: 'text-amber-500', sub: '前月比 +12.4%' },
          { label: '平均成約率', value: '68%', icon: Target, color: 'text-emerald-500', sub: '業界トップ 5% 以内' },
          { label: '最重要顧客 (ランクS)', value: '12 店舗', icon: Building2, color: 'text-rose-500', sub: '3店舗が離脱リスクあり' },
          { label: '未対応アラート', value: '4 件', icon: Clock, color: 'text-indigo-500', sub: '2件の重要メッセージあり' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm card-hover flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{stat.label}</p><h3 className="text-3xl font-black text-gray-800 mt-2 tracking-tighter">{stat.value}</h3></div>
              <div className={`p-4 rounded-2xl bg-gray-50 ${stat.color} shadow-inner`}><stat.icon size={22} /></div>
            </div>
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-tighter mt-6 italic">{stat.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm relative overflow-hidden h-[450px]">
          <div className="absolute top-0 right-0 w-80 h-80 gold-gradient opacity-5 rounded-bl-[10rem]" />
          <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter italic flex items-center gap-3 mb-10"><BarChart3 size={24} className="text-rose-500" /> 売上予測推移 (ウィークリー)</h3>
          <div className="h-64 flex items-end justify-between gap-8 px-4">
            {salesData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div className="w-full relative flex items-end justify-center h-full">
                  <div className="w-full gold-gradient rounded-t-3xl transition-all group-hover:scale-105 origin-bottom shadow-lg" style={{ height: `${val}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 mt-5 font-black uppercase tracking-tighter italic">{['月','火','水','木','金','土','日'][i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-4 bg-[#1A1A1A] p-10 rounded-[3.5rem] shadow-2xl text-white relative group flex flex-col justify-center overflow-hidden">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl" />
           <h3 className="text-sm font-black italic tracking-widest uppercase mb-8 flex items-center gap-2"><Sparkles size={16} className="text-rose-500" /> AI 戦略ログ</h3>
           <div className="space-y-6">
             <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
               <p className="text-[11px] font-bold text-gray-300 leading-relaxed italic">港区エリアで「次世代ハイフ」の需要が急増中。銀座エリアの成功事例を資料化し、配布準備が完了しました。</p>
             </div>
             <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
               <p className="text-[11px] font-bold text-rose-300 leading-relaxed italic">重要: サロン・ド・ヴィーナスのリピート注文サイクルまであと3日です。本日の定期訪問での提案を推奨。</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const CustomerManager = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [filterRank, setFilterRank] = useState<Rank | 'ALL'>('ALL');

  const filteredCustomers = useMemo(() => {
    if (filterRank === 'ALL') return MOCK_CUSTOMERS;
    return MOCK_CUSTOMERS.filter(c => c.rank === filterRank);
  }, [filterRank]);

  return (
    <div className="space-y-10 animate-in fade-in pb-20">
      <SectionTitle title="顧客カルテ / CRM" subtitle="重要顧客の抽出・攻略フェーズの可視化・AI経営サマリー" icon={Building2} />
      <div className="flex gap-4 justify-end">
          <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm">
            {['ALL', 'S', 'A', 'B', 'C'].map(r => (
              <button key={r} onClick={() => setFilterRank(r as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${filterRank === r ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}>{r === 'ALL' ? '全サロン' : `ランク ${r}`}</button>
            ))}
          </div>
      </div>
      <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
            <tr>
              <th className="px-10 py-6">ランク</th>
              <th className="px-10 py-6">サロン名 / 所在地</th>
              <th className="px-10 py-6 text-right">生涯売上 (LTV)</th>
              <th className="px-10 py-6">導入機器 / リピート品</th>
              <th className="px-10 py-6">担当営業</th>
              <th className="px-10 py-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredCustomers.map(c => (
              <tr key={c.id} onClick={() => setSelectedCustomer(c)} className="hover:bg-rose-50/30 transition-all cursor-pointer group">
                <td className="px-10 py-9"><RankBadge rank={c.rank} /></td>
                <td className="px-10 py-9">
                  <div className="flex flex-col">
                    <span className="text-base font-black text-gray-800 tracking-tight group-hover:text-rose-500 transition-colors">{c.name}</span>
                    <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold italic tracking-wider flex items-center gap-1"><MapPin size={12} className="text-rose-300"/> {c.address}</span>
                  </div>
                </td>
                <td className="px-10 py-9 text-right"><span className="text-xl font-black text-gray-900 italic tracking-tighter">¥{(c.totalLTV/10000).toLocaleString()}万円</span></td>
                <td className="px-10 py-9">
                  <div className="flex flex-wrap gap-2">
                    {c.installedDevices.map((d: any, i: number) => <span key={i} className="px-3 py-1 bg-gray-900 text-white text-[9px] font-black rounded-full uppercase tracking-tighter">{d.name}</span>)}
                  </div>
                </td>
                <td className="px-10 py-9 text-xs font-black text-gray-600 italic uppercase">{c.rep.split(' ')[0]}</td>
                <td className="px-10 py-9 text-right"><div className="p-3 bg-white rounded-2xl border border-gray-100 text-gray-300 group-hover:text-rose-500 group-hover:border-rose-100 transition-all"><ChevronRight size={18} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-[950px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
             <div className="p-10 gold-gradient text-white relative overflow-hidden shrink-0 flex justify-between items-center">
                <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center text-[12rem] font-black italic">{selectedCustomer.rank}</div>
                <div className="relative z-10 flex items-center gap-8">
                   <RankBadge rank={selectedCustomer.rank} />
                   <div>
                      <h3 className="text-5xl font-black tracking-tighter italic">{selectedCustomer.name}</h3>
                      <p className="text-xs font-bold uppercase tracking-widest mt-2 opacity-80 italic">{selectedCustomer.type} | 担当者: {selectedCustomer.rep}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="relative z-10 p-5 bg-white/20 hover:bg-white/40 rounded-full transition-all"><X size={24} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-gray-50/30">
                <div className="grid grid-cols-12 gap-10">
                   <div className="col-span-7 space-y-10">
                      <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                         <h4 className="text-xs font-black text-gray-800 uppercase italic flex items-center gap-2"><Info size={18} className="text-rose-500"/> 基本マスター情報</h4>
                         <div className="grid grid-cols-2 gap-8 border-b border-gray-50 pb-8">
                            <div className="space-y-1"><p className="text-[9px] font-black text-gray-400 uppercase italic">オーナー / 代表者</p><p className="text-sm font-black text-gray-800 italic">{selectedCustomer.owner} 様</p></div>
                            <div className="space-y-1"><p className="text-[9px] font-black text-gray-400 uppercase italic">所在地</p><p className="text-sm font-black text-gray-800 italic">{selectedCustomer.address}</p></div>
                         </div>
                         <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100/50"><p className="text-xs font-bold text-gray-600 italic leading-relaxed">特記事項: {selectedCustomer.memo}</p></div>
                      </section>
                      <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                         <h4 className="text-xs font-black text-gray-800 uppercase italic flex items-center gap-2"><Trophy size={18} className="text-rose-500"/> 商談タイムライン</h4>
                         <div className="relative pl-8 border-l-2 border-gray-50 space-y-10">
                            {selectedCustomer.salesPhases.map((phase: any, i: number) => (
                              <div key={i} className="relative">
                                 <div className="absolute -left-[41px] top-1 w-4 h-4 rounded-full border-4 border-white bg-rose-500 shadow-sm"></div>
                                 <div className="flex justify-between mb-2"><span className="text-[10px] font-black text-rose-500 uppercase italic">{phase.phase}</span><span className="text-[10px] font-black text-gray-300 italic">{phase.date}</span></div>
                                 <p className="text-xs font-bold text-gray-600 leading-relaxed italic">{phase.note}</p>
                              </div>
                            ))}
                         </div>
                      </section>
                   </div>
                   <div className="col-span-5 space-y-10">
                      <section className="bg-[#1A1A1A] p-10 rounded-[3rem] shadow-2xl text-white space-y-8 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-10"><BrainCircuit size={100} /></div>
                         <h4 className="text-xs font-black italic uppercase flex items-center gap-2"><Sparkles size={18} className="text-rose-500" /> AI 戦略診断</h4>
                         <div className="p-6 bg-white/5 border border-white/10 rounded-3xl relative z-10">
                           <p className="text-xs font-bold text-gray-300 leading-relaxed italic">{selectedCustomer.aiSummary}</p>
                         </div>
                         <div className="pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">サロン・ヘルススコア</span>
                            <span className="text-2xl font-black text-rose-500 italic">92%</span>
                         </div>
                      </section>
                      <button className="w-full py-6 gold-gradient text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">提案用プレゼン資料を自動生成 (AI)</button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SalesMeetingAnalysis = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiLeads, setAiLeads] = useState<any[]>([]);
  const generatePlan = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setAiLeads([
      { id: 'AL-01', name: 'セレステスパ 麻布十番', location: '東京都港区麻布十番', score: 94, potential: '¥600万円', rep: '山田 太郎', product: 'HIFU Pro-Max', reason: '周辺サロンの店販売上が飽和状態にあり、独占契約によるリプレイス提案の余地が極めて高い。' },
      { id: 'AL-02', name: '恵比寿 スキンクリニック', location: '東京都渋谷区恵比寿', score: 88, potential: '¥850万円', rep: '佐藤 美咲', product: 'LaseWave XL', reason: '多店舗展開データの傾向から、恵比寿エリアの客層への機器適合率が91%と分析されます。' }
    ]);
    setIsGenerating(false);
  };
  return (
    <div className="space-y-12 animate-in fade-in pb-20">
      <div className="flex justify-between items-end">
        <SectionTitle title="営業戦略 ・ 分析" subtitle="データから導き出す新規攻略とリピート最大化戦略" icon={Radar} />
        <button onClick={generatePlan} disabled={isGenerating} className="px-10 py-5 gold-gradient text-white rounded-[2.5rem] font-black text-xs shadow-xl flex items-center gap-3 hover:scale-105 transition-all active:scale-95 disabled:opacity-50">
          {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Radar size={20} />}AI 攻略プランを生成
        </button>
      </div>
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-4 bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm space-y-8">
          <h3 className="text-xs font-black text-gray-800 uppercase italic flex items-center gap-2"><AreaChart size={18} className="text-rose-500" /> マーケット・インテリジェンス</h3>
          <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100"><p className="text-[10px] font-black text-rose-500 uppercase italic">最注力地域</p><p className="text-base font-black text-gray-800 mt-2 italic">東京都 港区・目黒区</p></div>
          <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100"><p className="text-[10px] font-black text-amber-500 uppercase italic">高需要プロダクト</p><p className="text-base font-black text-gray-800 mt-2 italic">次世代HIFU (2025年モデル)</p></div>
        </div>
        <div className="col-span-8 space-y-6">
          {aiLeads.length > 0 ? aiLeads.map(lead => (
            <div key={lead.id} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-rose-100 transition-all group flex gap-10">
              <div className="flex flex-col items-center justify-center border-r border-gray-50 pr-10 min-w-[120px]">
                <div className="text-5xl font-black text-gray-900 italic tracking-tighter group-hover:text-rose-500 transition-colors">{lead.score}%</div>
                <div className="mt-4 px-3 py-1 bg-rose-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest shadow-sm italic">高成約確度</div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                   <div><h4 className="text-2xl font-black text-gray-800 tracking-tight">{lead.name}</h4><p className="text-[10px] text-gray-400 mt-1 uppercase font-bold italic"><MapPin size={12} className="inline mr-1" />{lead.location}</p></div>
                   <div className="text-right"><p className="text-[10px] font-black text-gray-300 uppercase italic">見込み収益</p><p className="text-2xl font-black text-rose-600 italic tracking-tighter">{lead.potential}</p></div>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-xs font-bold text-gray-600 italic leading-relaxed"><span className="text-rose-500 font-black mr-2">AI推論ロジック:</span> {lead.reason}</div>
              </div>
            </div>
          )) : (
            <div className="h-64 flex flex-col items-center justify-center bg-gray-50/50 border-4 border-dashed border-gray-100 rounded-[3.5rem] text-gray-300 font-black italic uppercase">
               Strategic Engine Ready
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QAAssistant = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([{ role: 'ai', text: 'AestheTechコンシェルジュです。最新の営業指標、サロン分析、またはシステムの操作方法についてお答えします。' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const handleAsk = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: input,
        config: {
          systemInstruction: "あなたは美容機器販売CRM『AestheTech』のAIアシスタントです。ユーザーの質問に日本語で、プロフェッショナルかつ丁寧、そして知的なトーンで回答してください。"
        }
      });
      setMessages(prev => [...prev, { role: 'ai', text: response.text || '申し訳ありません、回答を生成できませんでした。' }]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col animate-in fade-in">
      <SectionTitle title="AI コンシェルジュ" subtitle="システム操作からデータ分析までリアルタイム回答" icon={BrainCircuit} />
      <div className="flex-1 bg-white rounded-[3.5rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-12 space-y-8 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[80%] p-7 rounded-[2.5rem] text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-gray-900 text-white font-medium italic' : 'bg-gray-50 text-gray-700 font-bold italic'}`}>{m.text}</div>
            </div>
          ))}
          {loading && <div className="flex justify-start animate-pulse"><div className="bg-gray-50 p-6 rounded-[2rem] text-xs font-black text-gray-300">回答を生成中...</div></div>}
        </div>
        <div className="p-10 border-t border-gray-50 bg-gray-50/20"><div className="relative"><input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAsk()} placeholder="AIに質問する..." className="w-full p-6 bg-white border border-gray-200 rounded-full text-sm outline-none shadow-lg focus:ring-2 focus:ring-rose-100 transition-all font-bold italic" /><button onClick={handleAsk} className="absolute right-3 top-1/2 -translate-y-1/2 p-4 gold-gradient text-white rounded-full shadow-lg active:scale-95 transition-all"><SendHorizontal size={20} /></button></div></div>
      </div>
    </div>
  );
};

const ScheduleManager = () => {
  const [events] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [selectedDay, setSelectedDay] = useState(22);
  const [selectedRep, setSelectedRep] = useState('ALL');
  const getEventColor = (type: string, isAi?: boolean) => {
    if (isAi) return 'bg-indigo-500 shadow-indigo-200 animate-pulse';
    switch(type) {
      case 'visit': return 'bg-rose-500';
      case 'meeting': return 'bg-amber-400';
      case 'demo': return 'bg-emerald-400';
      default: return 'bg-indigo-400';
    }
  };
  const filteredEvents = events.filter(e => (selectedRep === 'ALL' || e.rep === selectedRep) && new Date(e.start).getDate() === selectedDay);
  return (
    <div className="animate-in fade-in space-y-12 pb-20">
      <div className="flex justify-between items-end">
        <SectionTitle title="カレンダー ・ 行動管理" subtitle="チーム全体の活動俯瞰とAI自動リマインド" icon={CalendarIcon} />
        <div className="flex bg-white p-1.5 rounded-full border border-gray-100 shadow-sm mb-10">
          <button onClick={() => setSelectedRep('ALL')} className={`px-6 py-2.5 rounded-full text-[10px] font-black transition-all ${selectedRep === 'ALL' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400'}`}>全員を表示</button>
          {MOCK_SALES_REPS.map(rep => (<button key={rep} onClick={() => setSelectedRep(rep)} className={`px-6 py-2.5 rounded-full text-[10px] font-black transition-all ${selectedRep === rep ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400'}`}>{rep.split(' ')[0]}</button>))}
        </div>
      </div>
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-8 bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm">
          <div className="grid grid-cols-7 gap-6">
            {['月', '火', '水', '木', '金', '土', '日'].map(d => <div key={d} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest pb-4 italic">{d}</div>)}
            {Array.from({ length: 31 }).map((_, i) => {
              const d = i + 1;
              const hasEvents = events.some(e => new Date(e.start).getDate() === d);
              return (
                <div key={d} onClick={() => setSelectedDay(d)} className={`h-28 p-4 rounded-[2rem] border transition-all cursor-pointer flex flex-col items-center justify-between ${selectedDay === d ? 'bg-rose-50 border-rose-100 shadow-inner' : 'bg-white border-gray-50 hover:shadow-md'}`}>
                   <span className={`text-[11px] font-black ${selectedDay === d ? 'text-rose-500' : 'text-gray-300'}`}>{d}</span>
                   {hasEvents && <div className="flex gap-1">{events.filter(e => new Date(e.start).getDate() === d).slice(0, 3).map(e => <div key={e.id} className={`w-2 h-2 rounded-full ${getEventColor(e.type, e.isAiGenerated)}`}></div>)}</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="col-span-4 bg-[#1A1A1A] p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col group h-full">
           <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform"><CalendarIcon size={120} /></div>
           <h3 className="text-4xl font-black italic tracking-tighter italic mb-12">5月 {selectedDay}日</h3>
           <div className="flex-1 space-y-6 overflow-y-auto scrollbar-hide">
              {filteredEvents.length > 0 ? filteredEvents.map(e => (
                <div key={e.id} className={`p-6 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all ${e.isAiGenerated ? 'ring-2 ring-rose-500/50' : ''}`}>
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase italic">{new Date(e.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <div className={`w-3 h-3 rounded-full ${getEventColor(e.type, e.isAiGenerated)} shadow-lg`}></div>
                   </div>
                   <h4 className="text-base font-black text-gray-100 leading-snug">{e.title}</h4>
                   <p className="text-[10px] text-gray-500 font-bold uppercase italic mt-4">担当: {e.rep}</p>
                </div>
              )) : <div className="h-full flex flex-col items-center justify-center opacity-20"><Zap size={64} className="mb-4" /><p className="text-xs font-black uppercase tracking-widest italic">予定なし</p></div>}
           </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ currentTab, setTab }: { currentTab: string, setTab: (t: string) => void }) => {
  const menu = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'ダッシュボード' },
    { id: 'customers', icon: Building2, label: '顧客カルテ (CRM)' },
    { id: 'leads', icon: Kanban, label: 'リード管理' },
    { id: 'calendar', icon: CalendarIcon, label: 'スケジュール' },
    { id: 'sales-meeting', icon: Radar, label: '営業分析・戦略' },
    { id: 'prices', icon: Package, label: '商品・価格表' },
    { id: 'billing', icon: CreditCard, label: '請求・支払管理' },
    { id: 'inbox', icon: MessageSquare, label: 'インボックス AI' },
    { id: 'qa', icon: BrainCircuit, label: 'コンシェルジュ' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1A1A1A] text-white p-8 flex flex-col z-50">
      <div className="mb-12 flex items-center gap-3">
        <div className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center italic font-black shadow-2xl">A</div>
        <span className="text-xl font-black italic tracking-tighter">AESTHETECH</span>
      </div>
      <nav className="flex-1 space-y-1">
        {menu.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
              currentTab === item.id 
                ? 'bg-white text-[#1A1A1A] font-black italic shadow-xl' 
                : 'text-gray-500 hover:text-white'
            }`}
          >
            <item.icon size={20} className={currentTab === item.id ? 'text-rose-500' : 'group-hover:text-rose-400'} />
            <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-8 border-t border-white/5">
        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 italic">
          <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center font-black text-xs">山</div>
          <div><p className="text-[10px] font-black uppercase">山田 太郎</p><p className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">シニア マネージャー</p></div>
        </div>
      </div>
    </aside>
  );
};

// --- アプリケーションルート ---

const App = () => {
  const [currentTab, setTab] = useState('dashboard');
  return (
    <div className="min-h-screen bg-[#FDFBFB]">
      <Sidebar currentTab={currentTab} setTab={setTab} />
      <main className="ml-64 p-16 min-h-screen relative overflow-x-hidden">
        <header className="flex items-center justify-between mb-16 relative z-10">
          <div onClick={() => setTab('dashboard')} className="cursor-pointer group">
            <div className="flex items-center gap-2 mb-3"><div className="px-3 py-1 bg-rose-50 text-rose-500 text-[10px] font-black rounded uppercase tracking-tighter border border-rose-100 italic">Enterprise 5.0 Professional Edition</div><p className="text-[11px] font-black text-gray-400 uppercase tracking-widest italic">{new Date().toLocaleDateString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter group-hover:text-rose-500 transition-all italic">AestheTech Premium Intelligence</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative"><input type="text" placeholder="顧客、商品、請求を検索..." className="bg-white/50 border border-gray-100 p-4 pl-12 rounded-full text-xs font-bold italic outline-none focus:ring-2 focus:ring-rose-100 w-80 shadow-sm"/><Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" /></div>
            <div className="w-12 h-12 rounded-2xl gold-gradient shadow-lg flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform border-4 border-white"><Settings size={20} /></div>
          </div>
        </header>

        <div className="max-w-[1600px] mx-auto pb-20 relative z-10">
          {currentTab === 'dashboard' && <Dashboard />}
          {currentTab === 'customers' && <CustomerManager />}
          {currentTab === 'calendar' && <ScheduleManager />}
          {currentTab === 'sales-meeting' && <SalesMeetingAnalysis />}
          {currentTab === 'leads' && <LeadKanban />}
          {currentTab === 'prices' && <ProductCatalog />}
          {currentTab === 'billing' && <BillingManager />}
          {currentTab === 'inbox' && <InboxAI />}
          {currentTab === 'qa' && <QAAssistant />}
          {['estimates', 'orders'].includes(currentTab) && (<div className="p-40 text-center text-gray-100 font-black italic border-8 border-dotted border-gray-50 rounded-[5rem] animate-pulse text-4xl uppercase italic">開発中: {currentTab} セグメント</div>)}
        </div>
        
        {/* 背景の装飾 */}
        <div className="fixed top-0 right-0 w-[50vw] h-screen gold-gradient opacity-[0.02] -skew-x-12 translate-x-1/2 pointer-events-none z-0"></div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);