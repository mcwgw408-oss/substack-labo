import { StrictMode } from 'react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ExternalLink, Pencil, Plus, Save, Search, Star, Trash2, X } from 'lucide-react';
import './styles.css';

type Creator = {
  id: string;
  senderName: string;
  substackUrl: string;
  genre: string;
  followedAt: string;
  followReason: string;
  interestingPoint: string;
  pointsToImitate: string;
  learned: string;
  memo: string;
  favorite: boolean;
  tags: string;
};

type CreatorForm = Omit<Creator, 'id'>;

type LegacyEntry = {
  id?: string;
  discoveredAt?: string;
  senderName?: string;
  url?: string;
  genre?: string;
  reason?: string;
  pointsToImitate?: string;
  memo?: string;
};

const storageKey = 'substack-labo-entries';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: CreatorForm = {
  senderName: '',
  substackUrl: '',
  genre: '',
  followedAt: today(),
  followReason: '',
  interestingPoint: '',
  pointsToImitate: '',
  learned: '',
  memo: '',
  favorite: false,
  tags: '',
};

const normalizeCreator = (entry: Partial<Creator> & LegacyEntry): Creator => ({
  id: entry.id || crypto.randomUUID(),
  senderName: entry.senderName || '',
  substackUrl: entry.substackUrl || entry.url || '',
  genre: entry.genre || '',
  followedAt: entry.followedAt || entry.discoveredAt || today(),
  followReason: entry.followReason || entry.reason || '',
  interestingPoint: entry.interestingPoint || '',
  pointsToImitate: entry.pointsToImitate || '',
  learned: entry.learned || '',
  memo: entry.memo || '',
  favorite: Boolean(entry.favorite),
  tags: entry.tags || '',
});

const loadCreators = (): Creator[] => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<Creator> & LegacyEntry>;
    return parsed.map(normalizeCreator);
  } catch {
    return [];
  }
};

function App() {
  const [creators, setCreators] = useStoredCreators();
  const [form, setForm] = useState<CreatorForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filteredCreators = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return creators;

    return creators.filter((creator) => {
      const target = [
        creator.senderName,
        creator.substackUrl,
        creator.genre,
        creator.followedAt,
        creator.followReason,
        creator.interestingPoint,
        creator.pointsToImitate,
        creator.learned,
        creator.memo,
        creator.tags,
      ]
        .join(' ')
        .toLowerCase();
      return target.includes(normalizedQuery);
    });
  }, [creators, query]);

  const favoriteCount = creators.filter((creator) => creator.favorite).length;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.senderName.trim() && !form.substackUrl.trim()) return;

    const cleanedForm: CreatorForm = {
      senderName: form.senderName.trim(),
      substackUrl: form.substackUrl.trim(),
      genre: form.genre.trim(),
      followedAt: form.followedAt,
      followReason: form.followReason.trim(),
      interestingPoint: form.interestingPoint.trim(),
      pointsToImitate: form.pointsToImitate.trim(),
      learned: form.learned.trim(),
      memo: form.memo.trim(),
      favorite: form.favorite,
      tags: form.tags.trim(),
    };

    if (editingId) {
      setCreators((current) =>
        current.map((creator) => (creator.id === editingId ? { ...cleanedForm, id: editingId } : creator)),
      );
      setEditingId(null);
    } else {
      setCreators((current) => [{ ...cleanedForm, id: crypto.randomUUID() }, ...current]);
    }

    setForm({ ...emptyForm, followedAt: cleanedForm.followedAt });
  };

  const updateField = <Field extends keyof CreatorForm>(field: Field, value: CreatorForm[Field]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const startEditing = (creator: Creator) => {
    setEditingId(creator.id);
    setForm({
      senderName: creator.senderName,
      substackUrl: creator.substackUrl,
      genre: creator.genre,
      followedAt: creator.followedAt,
      followReason: creator.followReason,
      interestingPoint: creator.interestingPoint,
      pointsToImitate: creator.pointsToImitate,
      learned: creator.learned,
      memo: creator.memo,
      favorite: creator.favorite,
      tags: creator.tags,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const deleteCreator = (id: string) => {
    setCreators((current) => current.filter((creator) => creator.id !== id));
    if (editingId === id) {
      cancelEditing();
    }
  };

  const toggleFavorite = (id: string) => {
    setCreators((current) =>
      current.map((creator) => (creator.id === id ? { ...creator, favorite: !creator.favorite } : creator)),
    );
  };

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Creator database</p>
          <h1>Substack Labo</h1>
          <p className="subtitle">Substack発信者データベース</p>
        </div>
        <div className="counter-grid" aria-label="登録状況">
          <div className="counter">
            <span>{creators.length}</span>
            <small>登録</small>
          </div>
          <div className="counter favorite-counter">
            <span>{favoriteCount}</span>
            <small>★</small>
          </div>
        </div>
      </section>

      <section className="workspace">
        <form className="entry-form" onSubmit={handleSubmit}>
          <div className="form-heading">
            {editingId ? <Pencil size={20} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}
            <h2>{editingId ? '発信者を編集' : '発信者を登録'}</h2>
          </div>

          <fieldset>
            <legend>基本情報</legend>

            <label>
              発信者名
              <input
                type="text"
                value={form.senderName}
                onChange={(event) => updateField('senderName', event.target.value)}
                placeholder="例: Sakura Notes"
              />
            </label>

            <label>
              Substack URL
              <input
                type="url"
                value={form.substackUrl}
                onChange={(event) => updateField('substackUrl', event.target.value)}
                placeholder="https://example.substack.com"
              />
            </label>

            <label>
              ジャンル
              <input
                type="text"
                value={form.genre}
                onChange={(event) => updateField('genre', event.target.value)}
                placeholder="エッセイ、ビジネス、創作など"
              />
            </label>

            <label>
              フォロー日
              <input
                type="date"
                value={form.followedAt}
                onChange={(event) => updateField('followedAt', event.target.value)}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>観察メモ</legend>

            <label>
              フォローした理由
              <textarea
                value={form.followReason}
                onChange={(event) => updateField('followReason', event.target.value)}
                rows={3}
              />
            </label>

            <label>
              気になったポイント
              <textarea
                value={form.interestingPoint}
                onChange={(event) => updateField('interestingPoint', event.target.value)}
                rows={3}
              />
            </label>

            <label>
              真似したいポイント
              <textarea
                value={form.pointsToImitate}
                onChange={(event) => updateField('pointsToImitate', event.target.value)}
                rows={3}
              />
            </label>

            <label>
              学んだこと
              <textarea value={form.learned} onChange={(event) => updateField('learned', event.target.value)} rows={3} />
            </label>

            <label>
              メモ
              <textarea value={form.memo} onChange={(event) => updateField('memo', event.target.value)} rows={4} />
            </label>
          </fieldset>

          <fieldset>
            <legend>整理用</legend>

            <label className="check-row">
              <input
                type="checkbox"
                checked={form.favorite}
                onChange={(event) => updateField('favorite', event.target.checked)}
              />
              お気に入り
            </label>

            <label>
              タグ
              <input
                type="text"
                value={form.tags}
                onChange={(event) => updateField('tags', event.target.value)}
                placeholder="例: 文章術, 有料導線, 海外"
              />
            </label>
          </fieldset>

          <div className="form-actions">
            <button className="primary-button" type="submit">
              <Save size={18} aria-hidden="true" />
              {editingId ? '更新' : '登録'}
            </button>
            {editingId && (
              <button className="secondary-button" type="button" onClick={cancelEditing}>
                <X size={18} aria-hidden="true" />
                キャンセル
              </button>
            )}
          </div>
        </form>

        <section className="entries-panel">
          <div className="search-box">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="発信者名、ジャンル、タグ、メモを検索"
            />
          </div>

          <div className="entries-list">
            {filteredCreators.length === 0 ? (
              <div className="empty-state">
                <h2>まだ発信者が登録されていません</h2>
                <p>フォローしているSubstack発信者を登録して、観察メモを育てていきましょう。</p>
              </div>
            ) : (
              filteredCreators.map((creator) => (
                <article className="entry-card" key={creator.id}>
                  <div className="entry-card-header">
                    <div>
                      <time>フォロー日 {creator.followedAt}</time>
                      <h2>{creator.senderName || '名前未入力'}</h2>
                    </div>
                    <div className="card-actions">
                      <button
                        className={`icon-button favorite-button ${creator.favorite ? 'is-favorite' : ''}`}
                        type="button"
                        onClick={() => toggleFavorite(creator.id)}
                        aria-label={creator.favorite ? 'お気に入りを外す' : 'お気に入りにする'}
                      >
                        <Star size={18} aria-hidden="true" />
                      </button>
                      <button className="icon-button edit-button" type="button" onClick={() => startEditing(creator)} aria-label="編集">
                        <Pencil size={18} aria-hidden="true" />
                      </button>
                      <button className="icon-button" type="button" onClick={() => deleteCreator(creator.id)} aria-label="削除">
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="entry-meta">
                    {creator.genre && <span>{creator.genre}</span>}
                    {creator.substackUrl && (
                      <a href={creator.substackUrl} target="_blank" rel="noreferrer">
                        <ExternalLink size={15} aria-hidden="true" />
                        Substackを開く
                      </a>
                    )}
                  </div>

                  {creator.tags && (
                    <div className="tag-list" aria-label="タグ">
                      {creator.tags.split(',').map((tag) => {
                        const trimmedTag = tag.trim();
                        return trimmedTag ? <span key={trimmedTag}>{trimmedTag}</span> : null;
                      })}
                    </div>
                  )}

                  <EntryDetail label="フォローした理由" value={creator.followReason} />
                  <EntryDetail label="気になったポイント" value={creator.interestingPoint} />
                  <EntryDetail label="真似したいポイント" value={creator.pointsToImitate} />
                  <EntryDetail label="学んだこと" value={creator.learned} />
                  <EntryDetail label="メモ" value={creator.memo} />
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function EntryDetail({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <div className="entry-detail">
      <strong>{label}</strong>
      <p>{value}</p>
    </div>
  );
}

function useStoredCreators() {
  const [creators, setCreators] = useState<Creator[]>(loadCreators);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(creators));
  }, [creators]);

  return [creators, setCreators] as const;
}

export default App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
