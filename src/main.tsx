import { StrictMode } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown,
  ArrowUp,
  BookOpenText,
  Edit3,
  ExternalLink,
  FileText,
  Home,
  Lightbulb,
  Mail,
  Pencil,
  Plus,
  Save,
  Search,
  Send,
  Star,
  StickyNote,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import './styles.css';

type PageKey = 'home' | 'notes' | 'articles' | 'emailList' | 'follows' | 'followers' | 'ideas' | 'quickMemos';
type WritingKey = 'notes' | 'articles';
type PeopleKey = 'follows' | 'followers';

type WritingStatus = '候補' | '執筆中' | '予約投稿' | '下書き' | '投稿完了';
type IdeaCategory = 'アイデア保管' | 'Threads候補' | 'note候補（回復期）' | 'note候補（AI実験室）' | 'X候補' | 'Substack候補';

type WritingItem = {
  id: string;
  title: string;
  body: string;
  status: WritingStatus;
  publishDate: string;
  publishUrl: string;
  memo: string;
};

type PersonItem = {
  id: string;
  senderName: string;
  email: string;
  url: string;
  genre: string;
  rating: 1 | 2 | 3;
  followedAt: string;
  interestingPoint: string;
  pointsToImitate: string;
  learned: string;
  idea: string;
  memo: string;
};

type IdeaItem = {
  id: string;
  category: IdeaCategory;
  title: string;
  memo: string;
};

type QuickMemoItem = {
  id: string;
  title: string;
  memo: string;
  createdAt: string;
};

type EmailListItem = {
  id: string;
  name: string;
  email: string;
  genre: string;
  acquiredAt: string;
  memo: string;
};

type AppData = {
  writings: Record<WritingKey, WritingItem[]>;
  people: Record<PeopleKey, PersonItem[]>;
  emailList: EmailListItem[];
  ideas: IdeaItem[];
  quickMemos: QuickMemoItem[];
};

const storageKey = 'substack-labo-workspace-v2';

const writingStatuses: WritingStatus[] = ['候補', '執筆中', '予約投稿', '下書き', '投稿完了'];
const ideaCategories: IdeaCategory[] = [
  'アイデア保管',
  'Threads候補',
  'note候補（回復期）',
  'note候補（AI実験室）',
  'X候補',
  'Substack候補',
];

const today = () => new Date().toISOString().slice(0, 10);

const emptyWriting = (): Omit<WritingItem, 'id'> => ({
  title: '',
  body: '',
  status: '候補',
  publishDate: '',
  publishUrl: '',
  memo: '',
});

const emptyPerson = (): Omit<PersonItem, 'id'> => ({
  senderName: '',
  email: '',
  url: '',
  genre: '',
  rating: 1,
  followedAt: today(),
  interestingPoint: '',
  pointsToImitate: '',
  learned: '',
  idea: '',
  memo: '',
});

const emptyIdea = (): Omit<IdeaItem, 'id'> => ({
  category: 'アイデア保管',
  title: '',
  memo: '',
});

const emptyQuickMemo = (): Omit<QuickMemoItem, 'id'> => ({
  title: '',
  memo: '',
  createdAt: today(),
});

const emptyEmailListItem = (): Omit<EmailListItem, 'id'> => ({
  name: '',
  email: '',
  genre: '',
  acquiredAt: today(),
  memo: '',
});

const emptyData = (): AppData => ({
  writings: {
    notes: [],
    articles: [],
  },
  people: {
    follows: [],
    followers: [],
  },
  emailList: [],
  ideas: [],
  quickMemos: [],
});

const navigationItems: Array<{ key: PageKey; label: string; icon: typeof Home }> = [
  { key: 'home', label: 'トップ', icon: Home },
  { key: 'notes', label: 'ノート', icon: BookOpenText },
  { key: 'articles', label: '記事', icon: FileText },
  { key: 'emailList', label: 'メールリスト', icon: Mail },
  { key: 'follows', label: 'フォロー', icon: UserCheck },
  { key: 'followers', label: 'フォロワー', icon: Users },
  { key: 'ideas', label: 'アイデア保管', icon: Lightbulb },
  { key: 'quickMemos', label: '仮メモ', icon: StickyNote },
];

const writingPageLabels: Record<WritingKey, string> = {
  notes: 'ノートページ',
  articles: '記事ページ',
};

const getWritingDisplayText = (item: WritingItem, pageKey: WritingKey) => {
  if (pageKey === 'notes') return item.body || item.memo || '本文未入力';
  return item.title || 'タイトル未入力';
};

const peoplePageLabels: Record<PeopleKey, string> = {
  follows: 'フォローページ',
  followers: 'フォロワーページ',
};

function App() {
  const [data, setData] = useStoredData();
  const [activePage, setActivePage] = useState<PageKey>('home');
  const [query, setQuery] = useState('');

  const totals = useMemo(() => {
    const writingTotal = Object.values(data.writings).reduce((sum, items) => sum + items.length, 0);
    const peopleTotal = Object.values(data.people).reduce((sum, items) => sum + items.length, 0);
    return {
      writingTotal,
      peopleTotal,
      emailListTotal: data.emailList.length,
      ideaTotal: data.ideas.length,
      quickMemoTotal: data.quickMemos.length,
      completedTotal: Object.values(data.writings)
        .flat()
        .filter((item) => item.status === '投稿完了').length,
    };
  }, [data]);

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Substack production workspace</p>
          <h1>Substack Labo</h1>
          <p className="subtitle">制作、発信者、候補メモをまとめて管理する場所</p>
        </div>
        <div className="summary-strip" aria-label="全体サマリー">
          <SummaryStat label="制作" value={totals.writingTotal} />
          <SummaryStat label="人" value={totals.peopleTotal} />
          <SummaryStat label="案" value={totals.ideaTotal} />
        </div>
      </header>

      <div className="app-layout">
        <nav className="side-nav" aria-label="ページ">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activePage === item.key ? 'active' : ''}
                key={item.key}
                type="button"
                onClick={() => setActivePage(item.key)}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <section className="page-surface">
          {activePage === 'home' && <HomePage data={data} totals={totals} setActivePage={setActivePage} />}
          {isWritingPage(activePage) && (
            <WritingPage
              items={data.writings[activePage]}
              pageKey={activePage}
              query={query}
              setQuery={setQuery}
              setItems={(items) =>
                setData((current) => ({
                  ...current,
                  writings: { ...current.writings, [activePage]: items },
                }))
              }
            />
          )}
          {isPeoplePage(activePage) && (
            <PeoplePage
              items={data.people[activePage]}
              pageKey={activePage}
              query={query}
              setQuery={setQuery}
              setItems={(items) =>
                setData((current) => ({
                  ...current,
                  people: { ...current.people, [activePage]: items },
                }))
              }
            />
          )}
          {activePage === 'emailList' && (
            <EmailListPage
              items={data.emailList}
              query={query}
              setQuery={setQuery}
              setItems={(emailList) => setData((current) => ({ ...current, emailList }))}
            />
          )}
          {activePage === 'ideas' && (
            <IdeasPage items={data.ideas} query={query} setQuery={setQuery} setItems={(ideas) => setData((current) => ({ ...current, ideas }))} />
          )}
          {activePage === 'quickMemos' && (
            <QuickMemosPage
              items={data.quickMemos}
              query={query}
              setQuery={setQuery}
              setItems={(quickMemos) => setData((current) => ({ ...current, quickMemos }))}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function HomePage({
  data,
  totals,
  setActivePage,
}: {
  data: AppData;
  totals: { writingTotal: number; peopleTotal: number; emailListTotal: number; ideaTotal: number; quickMemoTotal: number; completedTotal: number };
  setActivePage: (page: PageKey) => void;
}) {
  const recentWritings = Object.entries(data.writings)
    .flatMap(([key, items]) => items.map((item) => ({ ...item, pageKey: key as WritingKey })))
    .slice(0, 5);

  return (
    <div className="home-grid">
      <section className="overview-band">
        <SummaryStat label="制作メモ" value={totals.writingTotal} />
        <SummaryStat label="投稿完了" value={totals.completedTotal} />
        <SummaryStat label="メールリスト" value={totals.emailListTotal} />
        <SummaryStat label="フォロー/フォロワー" value={totals.peopleTotal} />
        <SummaryStat label="アイデア" value={totals.ideaTotal} />
        <SummaryStat label="仮メモ" value={totals.quickMemoTotal} />
      </section>

      <section className="quick-links">
        {navigationItems
          .filter((item) => item.key !== 'home')
          .map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} type="button" onClick={() => setActivePage(item.key)}>
                <Icon size={20} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
      </section>

      <section className="summary-section">
        <div className="section-title">
          <Send size={20} aria-hidden="true" />
          <h2>制作のまとめ</h2>
        </div>
        <div className="status-grid">
          {writingStatuses.map((status) => (
            <SummaryStat
              key={status}
              label={status}
              value={Object.values(data.writings)
                .flat()
                .filter((item) => item.status === status).length}
            />
          ))}
        </div>
      </section>

      <section className="summary-section">
        <div className="section-title">
          <Edit3 size={20} aria-hidden="true" />
          <h2>最近の制作</h2>
        </div>
        {recentWritings.length === 0 ? (
          <p className="muted">まだ制作メモがありません。</p>
        ) : (
          <div className="compact-list">
            {recentWritings.map((item) => (
              <button key={item.id} type="button" onClick={() => setActivePage(item.pageKey)}>
                <strong>{getWritingDisplayText(item, item.pageKey)}</strong>
                <span>
                  {writingPageLabels[item.pageKey]} / {item.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WritingPage({
  pageKey,
  items,
  setItems,
  query,
  setQuery,
}: {
  pageKey: WritingKey;
  items: WritingItem[];
  setItems: (items: WritingItem[]) => void;
  query: string;
  setQuery: (query: string) => void;
}) {
  const [form, setForm] = useState<Omit<WritingItem, 'id'>>(emptyWriting);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isNotesPage = pageKey === 'notes';
  const filteredItems = filterItems(items, query, (item) => [item.title, item.body, item.status, item.publishDate, item.publishUrl, item.memo]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isNotesPage) {
      if (!form.body.trim() && !form.memo.trim()) return;
    } else if (!form.title.trim() && !form.memo.trim()) {
      return;
    }

    const cleaned = {
      title: isNotesPage ? '' : form.title.trim(),
      body: form.body.trim(),
      status: form.status,
      publishDate: form.publishDate,
      publishUrl: form.publishUrl.trim(),
      memo: form.memo.trim(),
    };

    if (editingId) {
      setItems(items.map((item) => (item.id === editingId ? { ...cleaned, id: editingId } : item)));
      setEditingId(null);
    } else {
      setItems([{ ...cleaned, id: crypto.randomUUID() }, ...items]);
    }
    setForm(emptyWriting());
  };

  const edit = (item: WritingItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      body: item.body || '',
      status: item.status,
      publishDate: item.publishDate,
      publishUrl: item.publishUrl,
      memo: item.memo,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyWriting());
  };

  return (
    <PageFrame
      title={writingPageLabels[pageKey]}
      subtitle={isNotesPage ? '本文、ステータス、公開日、公開URL、メモを管理します。' : 'タイトル、ステータス、公開日、公開URL、メモを管理します。'}
      query={query}
      setQuery={setQuery}
      searchPlaceholder={isNotesPage ? '本文、ステータス、URL、メモを検索' : 'タイトル、ステータス、URL、メモを検索'}
    >
      <form className="editor-panel" onSubmit={save}>
        <FormHeading editing={Boolean(editingId)} editingText="制作メモを編集" newText="制作メモを追加" />
        {isNotesPage ? (
          <label>
            本文
            <textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} rows={7} />
          </label>
        ) : (
          <label>
            タイトル
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
        )}
        <label>
          ステータス
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as WritingStatus })}>
            {writingStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          公開日
          <input type="date" value={form.publishDate} onChange={(event) => setForm({ ...form, publishDate: event.target.value })} />
        </label>
        <label>
          公開URL
          <input type="url" value={form.publishUrl} onChange={(event) => setForm({ ...form, publishUrl: event.target.value })} />
        </label>
        <label>
          メモ
          <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} rows={5} />
        </label>
        <FormActions editing={Boolean(editingId)} saveText={editingId ? '更新' : '追加'} onCancel={cancel} />
      </form>

      <div className="list-panel">
        {filteredItems.length === 0 ? (
          <EmptyState title="まだ登録がありません" text="候補や下書きを追加すると、ここに一覧で表示されます。" />
        ) : (
          filteredItems.map((item) => (
            <article className="item-card" key={item.id}>
              <div className="card-header">
                <div>
                  <span className={`status-pill status-${item.status}`}>{item.status}</span>
                  {!isNotesPage && <h3>{item.title || 'タイトル未入力'}</h3>}
                </div>
                <CardActions onEdit={() => edit(item)} onDelete={() => setItems(items.filter((target) => target.id !== item.id))} />
              </div>
              <div className="meta-row">
                {item.publishDate && <span>公開日 {item.publishDate}</span>}
                {item.publishUrl && (
                  <a href={item.publishUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={15} aria-hidden="true" />
                    開く
                  </a>
                )}
              </div>
              {isNotesPage && <Detail label="本文" value={item.body} />}
              <Detail label="メモ" value={item.memo} />
            </article>
          ))
        )}
      </div>
    </PageFrame>
  );
}

function PeoplePage({
  pageKey,
  items,
  setItems,
  query,
  setQuery,
}: {
  pageKey: PeopleKey;
  items: PersonItem[];
  setItems: (items: PersonItem[]) => void;
  query: string;
  setQuery: (query: string) => void;
}) {
  const [form, setForm] = useState<Omit<PersonItem, 'id'>>(emptyPerson);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredItems = filterItems(items, query, (item) => [
    item.senderName,
    item.email,
    item.url,
    item.genre,
    item.followedAt,
    item.interestingPoint,
    item.pointsToImitate,
    item.learned,
    item.idea,
    item.memo,
  ]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.senderName.trim() && !form.url.trim() && !form.email.trim()) return;

    const cleaned = {
      senderName: form.senderName.trim(),
      email: form.email.trim(),
      url: form.url.trim(),
      genre: form.genre.trim(),
      rating: form.rating,
      followedAt: form.followedAt,
      interestingPoint: form.interestingPoint.trim(),
      pointsToImitate: form.pointsToImitate.trim(),
      learned: form.learned.trim(),
      idea: form.idea.trim(),
      memo: form.memo.trim(),
    };

    if (editingId) {
      setItems(items.map((item) => (item.id === editingId ? { ...cleaned, id: editingId } : item)));
      setEditingId(null);
    } else {
      setItems([{ ...cleaned, id: crypto.randomUUID() }, ...items]);
    }
    setForm(emptyPerson());
  };

  const edit = (item: PersonItem) => {
    setEditingId(item.id);
    setForm({
      senderName: item.senderName,
      email: item.email || '',
      url: item.url,
      genre: item.genre,
      rating: item.rating,
      followedAt: item.followedAt,
      interestingPoint: item.interestingPoint,
      pointsToImitate: item.pointsToImitate,
      learned: item.learned,
      idea: item.idea,
      memo: item.memo,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyPerson());
  };

  return (
    <PageFrame
      title={peoplePageLabels[pageKey]}
      subtitle="発信者名、URL、ジャンル、評価、観察メモを管理します。"
      query={query}
      setQuery={setQuery}
      searchPlaceholder="発信者名、ジャンル、ポイント、メモを検索"
    >
      <form className="editor-panel" onSubmit={save}>
        <FormHeading editing={Boolean(editingId)} editingText="発信者を編集" newText="発信者を追加" />
        <label>
          発信者名
          <input value={form.senderName} onChange={(event) => setForm({ ...form, senderName: event.target.value })} />
        </label>
        {pageKey === 'followers' && (
          <label>
            メールアドレス
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
        )}
        <label>
          URL
          <input type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
        </label>
        <label>
          ジャンル
          <input value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })} />
        </label>
        <div className="field-group">
          <span>気になる評価</span>
          <div className="rating-control" role="group" aria-label="気になる評価">
            {[1, 2, 3].map((rating) => (
              <button
                className={form.rating >= rating ? 'selected' : ''}
                key={rating}
                type="button"
                onClick={() => setForm({ ...form, rating: rating as 1 | 2 | 3 })}
                aria-label={`${rating}つ星`}
              >
                <Star size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
        <label>
          {pageKey === 'followers' ? 'フォロワー日' : 'フォロー日'}
          <input type="date" value={form.followedAt} onChange={(event) => setForm({ ...form, followedAt: event.target.value })} />
        </label>
        <label>
          気になったポイント
          <textarea value={form.interestingPoint} onChange={(event) => setForm({ ...form, interestingPoint: event.target.value })} rows={3} />
        </label>
        <label>
          真似したいポイント
          <textarea value={form.pointsToImitate} onChange={(event) => setForm({ ...form, pointsToImitate: event.target.value })} rows={3} />
        </label>
        <label>
          学んだこと
          <textarea value={form.learned} onChange={(event) => setForm({ ...form, learned: event.target.value })} rows={3} />
        </label>
        <label>
          アイデア
          <textarea value={form.idea} onChange={(event) => setForm({ ...form, idea: event.target.value })} rows={3} />
        </label>
        <label>
          メモ
          <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} rows={4} />
        </label>
        <FormActions editing={Boolean(editingId)} saveText={editingId ? '更新' : '追加'} onCancel={cancel} />
      </form>

      <div className="list-panel">
        {filteredItems.length === 0 ? (
          <EmptyState title="まだ登録がありません" text="気になる発信者やつながりを追加すると、ここに一覧で表示されます。" />
        ) : (
          filteredItems.map((item) => (
            <article className="item-card" key={item.id}>
              <div className="card-header">
                <div>
                  <div className="stars" aria-label={`評価 ${item.rating}`}>
                    {Array.from({ length: item.rating }).map((_, index) => (
                      <Star key={index} size={16} aria-hidden="true" />
                    ))}
                  </div>
                  <h3>{item.senderName || '名前未入力'}</h3>
                </div>
                <CardActions onEdit={() => edit(item)} onDelete={() => setItems(items.filter((target) => target.id !== item.id))} />
              </div>
              <div className="meta-row">
                {item.genre && <span>{item.genre}</span>}
                {pageKey === 'followers' && item.email && (
                  <a href={`mailto:${item.email}`}>
                    <Mail size={15} aria-hidden="true" />
                    {item.email}
                  </a>
                )}
                {item.followedAt && <span>{pageKey === 'followers' ? 'フォロワー日' : 'フォロー日'} {item.followedAt}</span>}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    <ExternalLink size={15} aria-hidden="true" />
                    開く
                  </a>
                )}
              </div>
              <Detail label="気になったポイント" value={item.interestingPoint} />
              <Detail label="真似したいポイント" value={item.pointsToImitate} />
              <Detail label="学んだこと" value={item.learned} />
              <Detail label="アイデア" value={item.idea} />
              <Detail label="メモ" value={item.memo} />
            </article>
          ))
        )}
      </div>
    </PageFrame>
  );
}

function IdeasPage({
  items,
  setItems,
  query,
  setQuery,
}: {
  items: IdeaItem[];
  setItems: (items: IdeaItem[]) => void;
  query: string;
  setQuery: (query: string) => void;
}) {
  const [form, setForm] = useState<Omit<IdeaItem, 'id'>>(emptyIdea);
  const [editingId, setEditingId] = useState<string | null>(null);
  const filteredItems = filterItems(items, query, (item) => [item.category, item.title, item.memo]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() && !form.memo.trim()) return;
    const cleaned = { category: form.category, title: form.title.trim(), memo: form.memo.trim() };

    if (editingId) {
      setItems(items.map((item) => (item.id === editingId ? { ...cleaned, id: editingId } : item)));
      setEditingId(null);
    } else {
      setItems([{ ...cleaned, id: crypto.randomUUID() }, ...items]);
    }
    setForm(emptyIdea());
  };

  const edit = (item: IdeaItem) => {
    setEditingId(item.id);
    setForm({ category: item.category, title: item.title, memo: item.memo });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageFrame title="アイデア保管ページ" subtitle="投稿先候補ごとにアイデアを保管します。" query={query} setQuery={setQuery} searchPlaceholder="カテゴリ、タイトル、メモを検索">
      <form className="editor-panel" onSubmit={save}>
        <FormHeading editing={Boolean(editingId)} editingText="アイデアを編集" newText="アイデアを追加" />
        <label>
          種類
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as IdeaCategory })}>
            {ideaCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          タイトル
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label>
          メモ
          <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} rows={6} />
        </label>
        <FormActions
          editing={Boolean(editingId)}
          saveText={editingId ? '更新' : '追加'}
          onCancel={() => {
            setEditingId(null);
            setForm(emptyIdea());
          }}
        />
      </form>

      <div className="list-panel">
        {filteredItems.length === 0 ? (
          <EmptyState title="まだアイデアがありません" text="Threads、note、X、Substackなどの候補をここに置いておけます。" />
        ) : (
          filteredItems.map((item) => (
            <article className="item-card" key={item.id}>
              <div className="card-header">
                <div>
                  <span className="category-pill">{item.category}</span>
                  <h3>{item.title || 'タイトル未入力'}</h3>
                </div>
                <CardActions onEdit={() => edit(item)} onDelete={() => setItems(items.filter((target) => target.id !== item.id))} />
              </div>
              <Detail label="メモ" value={item.memo} />
            </article>
          ))
        )}
      </div>
    </PageFrame>
  );
}

function EmailListPage({
  items,
  setItems,
  query,
  setQuery,
}: {
  items: EmailListItem[];
  setItems: (items: EmailListItem[]) => void;
  query: string;
  setQuery: (query: string) => void;
}) {
  const [form, setForm] = useState<Omit<EmailListItem, 'id'>>(emptyEmailListItem);
  const [editingId, setEditingId] = useState<string | null>(null);
  const filteredItems = filterItems(items, query, (item) => [item.name, item.email, item.genre, item.acquiredAt, item.memo]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() && !form.email.trim()) return;

    const cleaned = {
      name: form.name.trim(),
      email: form.email.trim(),
      genre: form.genre.trim(),
      acquiredAt: form.acquiredAt,
      memo: form.memo.trim(),
    };

    if (editingId) {
      setItems(items.map((item) => (item.id === editingId ? { ...cleaned, id: editingId } : item)));
      setEditingId(null);
    } else {
      setItems([{ ...cleaned, id: crypto.randomUUID() }, ...items]);
    }
    setForm(emptyEmailListItem());
  };

  const edit = (item: EmailListItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      email: item.email,
      genre: item.genre,
      acquiredAt: item.acquiredAt,
      memo: item.memo,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const moveItem = (id: string, direction: -1 | 1) => {
    const currentIndex = items.findIndex((item) => item.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) return;
    const nextItems = [...items];
    const [movedItem] = nextItems.splice(currentIndex, 1);
    nextItems.splice(nextIndex, 0, movedItem);
    setItems(nextItems);
  };

  const cancel = () => {
    setEditingId(null);
    setForm(emptyEmailListItem());
  };

  return (
    <PageFrame
      title="メールリストページ"
      subtitle="名前、メールアドレス、ジャンル、獲得日、メモを管理します。"
      query={query}
      setQuery={setQuery}
      searchPlaceholder="名前、メールアドレス、ジャンル、メモを検索"
    >
      <form className="editor-panel" onSubmit={save}>
        <FormHeading editing={Boolean(editingId)} editingText="メールリストを編集" newText="メールリストを追加" />
        <label>
          名前
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label>
          メールアドレス
          <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </label>
        <label>
          ジャンル
          <input value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })} />
        </label>
        <label>
          獲得日
          <input type="date" value={form.acquiredAt} onChange={(event) => setForm({ ...form, acquiredAt: event.target.value })} />
        </label>
        <label>
          メモ
          <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} rows={5} />
        </label>
        <FormActions editing={Boolean(editingId)} saveText={editingId ? '更新' : '追加'} onCancel={cancel} />
      </form>

      <div className="list-panel">
        {filteredItems.length === 0 ? (
          <EmptyState title="まだメールリストがありません" text="名前やメールアドレスを追加すると、ここに一覧で表示されます。" />
        ) : (
          filteredItems.map((item) => {
            const itemIndex = items.findIndex((target) => target.id === item.id);
            return (
              <article className="item-card" key={item.id}>
                <div className="card-header">
                  <div>
                    <span className="category-pill">{item.genre || 'ジャンル未入力'}</span>
                    <h3>{item.name || '名前未入力'}</h3>
                  </div>
                  <div className="card-actions">
                    <button
                      className="icon-button sort-button"
                      type="button"
                      onClick={() => moveItem(item.id, -1)}
                      disabled={itemIndex <= 0}
                      aria-label="上に移動"
                    >
                      <ArrowUp size={18} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button sort-button"
                      type="button"
                      onClick={() => moveItem(item.id, 1)}
                      disabled={itemIndex === -1 || itemIndex >= items.length - 1}
                      aria-label="下に移動"
                    >
                      <ArrowDown size={18} aria-hidden="true" />
                    </button>
                    <button className="icon-button edit-button" type="button" onClick={() => edit(item)} aria-label="編集">
                      <Pencil size={18} aria-hidden="true" />
                    </button>
                    <button className="icon-button danger-button" type="button" onClick={() => setItems(items.filter((target) => target.id !== item.id))} aria-label="削除">
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="meta-row">
                  {item.email && (
                    <a href={`mailto:${item.email}`}>
                      <Mail size={15} aria-hidden="true" />
                      {item.email}
                    </a>
                  )}
                  {item.acquiredAt && <span>獲得日 {item.acquiredAt}</span>}
                </div>
                <Detail label="メモ" value={item.memo} />
              </article>
            );
          })
        )}
      </div>
    </PageFrame>
  );
}

function QuickMemosPage({
  items,
  setItems,
  query,
  setQuery,
}: {
  items: QuickMemoItem[];
  setItems: (items: QuickMemoItem[]) => void;
  query: string;
  setQuery: (query: string) => void;
}) {
  const [form, setForm] = useState<Omit<QuickMemoItem, 'id'>>(emptyQuickMemo);
  const [editingId, setEditingId] = useState<string | null>(null);
  const filteredItems = filterItems(items, query, (item) => [item.title, item.memo, item.createdAt]);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() && !form.memo.trim()) return;
    const cleaned = { title: form.title.trim(), memo: form.memo.trim(), createdAt: form.createdAt };

    if (editingId) {
      setItems(items.map((item) => (item.id === editingId ? { ...cleaned, id: editingId } : item)));
      setEditingId(null);
    } else {
      setItems([{ ...cleaned, id: crypto.randomUUID() }, ...items]);
    }
    setForm(emptyQuickMemo());
  };

  const edit = (item: QuickMemoItem) => {
    setEditingId(item.id);
    setForm({ title: item.title, memo: item.memo, createdAt: item.createdAt });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageFrame title="仮メモページ" subtitle="まだ分類しきれない断片を一時保管します。" query={query} setQuery={setQuery} searchPlaceholder="タイトル、メモを検索">
      <form className="editor-panel" onSubmit={save}>
        <FormHeading editing={Boolean(editingId)} editingText="仮メモを編集" newText="仮メモを追加" />
        <label>
          タイトル
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label>
          日付
          <input type="date" value={form.createdAt} onChange={(event) => setForm({ ...form, createdAt: event.target.value })} />
        </label>
        <label>
          メモ
          <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} rows={7} />
        </label>
        <FormActions
          editing={Boolean(editingId)}
          saveText={editingId ? '更新' : '追加'}
          onCancel={() => {
            setEditingId(null);
            setForm(emptyQuickMemo());
          }}
        />
      </form>

      <div className="list-panel">
        {filteredItems.length === 0 ? (
          <EmptyState title="まだ仮メモがありません" text="あとで整理したい断片をここに置いておけます。" />
        ) : (
          filteredItems.map((item) => (
            <article className="item-card" key={item.id}>
              <div className="card-header">
                <div>
                  <time>{item.createdAt}</time>
                  <h3>{item.title || 'タイトル未入力'}</h3>
                </div>
                <CardActions onEdit={() => edit(item)} onDelete={() => setItems(items.filter((target) => target.id !== item.id))} />
              </div>
              <Detail label="メモ" value={item.memo} />
            </article>
          ))
        )}
      </div>
    </PageFrame>
  );
}

function PageFrame({
  title,
  subtitle,
  query,
  setQuery,
  searchPlaceholder,
  children,
}: {
  title: string;
  subtitle: string;
  query: string;
  setQuery: (query: string) => void;
  searchPlaceholder: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="search-box">
          <Search size={18} aria-hidden="true" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} />
        </div>
      </div>
      <div className="workspace">{children}</div>
    </>
  );
}

function FormHeading({ editing, editingText, newText }: { editing: boolean; editingText: string; newText: string }) {
  return (
    <div className="form-heading">
      {editing ? <Pencil size={20} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}
      <h2>{editing ? editingText : newText}</h2>
    </div>
  );
}

function FormActions({ editing, saveText, onCancel }: { editing: boolean; saveText: string; onCancel: () => void }) {
  return (
    <div className="form-actions">
      <button className="primary-button" type="submit">
        <Save size={18} aria-hidden="true" />
        {saveText}
      </button>
      {editing && (
        <button className="secondary-button" type="button" onClick={onCancel}>
          <X size={18} aria-hidden="true" />
          キャンセル
        </button>
      )}
    </div>
  );
}

function CardActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="card-actions">
      <button className="icon-button edit-button" type="button" onClick={onEdit} aria-label="編集">
        <Pencil size={18} aria-hidden="true" />
      </button>
      <button className="icon-button danger-button" type="button" onClick={onDelete} aria-label="削除">
        <Trash2 size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="summary-stat">
      <span>{value}</span>
      <small>{label}</small>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <div className="entry-detail">
      <strong>{label}</strong>
      <p>{value}</p>
    </div>
  );
}

function useStoredData() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? normalizeData(JSON.parse(raw) as Partial<AppData>) : emptyData();
    } catch {
      return emptyData();
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data]);

  return [data, setData] as const;
}

function normalizeData(rawData: Partial<AppData>): AppData {
  const base = emptyData();
  return {
    writings: {
      notes: rawData.writings?.notes ?? base.writings.notes,
      articles: rawData.writings?.articles ?? base.writings.articles,
    },
    people: {
      follows: rawData.people?.follows ?? base.people.follows,
      followers: rawData.people?.followers ?? base.people.followers,
    },
    emailList: rawData.emailList ?? base.emailList,
    ideas: rawData.ideas ?? base.ideas,
    quickMemos: rawData.quickMemos ?? base.quickMemos,
  };
}

function filterItems<Item>(items: Item[], query: string, collect: (item: Item) => Array<string | number>) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;
  return items.filter((item) => collect(item).join(' ').toLowerCase().includes(normalizedQuery));
}

function isWritingPage(page: PageKey): page is WritingKey {
  return page === 'notes' || page === 'articles';
}

function isPeoplePage(page: PageKey): page is PeopleKey {
  return page === 'follows' || page === 'followers';
}

export default App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
