import { StrictMode } from 'react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ExternalLink, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react';
import './styles.css';

type Entry = {
  id: string;
  discoveredAt: string;
  senderName: string;
  url: string;
  genre: string;
  reason: string;
  pointsToImitate: string;
  memo: string;
};

type EntryForm = Omit<Entry, 'id'>;

const storageKey = 'substack-labo-entries';

const emptyForm: EntryForm = {
  discoveredAt: new Date().toISOString().slice(0, 10),
  senderName: '',
  url: '',
  genre: '',
  reason: '',
  pointsToImitate: '',
  memo: '',
};

const loadEntries = (): Entry[] => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Entry[]) : [];
  } catch {
    return [];
  }
};

function App() {
  const [entries, setEntries] = useStoredEntries();
  const [form, setForm] = useState<EntryForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filteredEntries = entries.filter((entry) => {
    const target = [
      entry.discoveredAt,
      entry.senderName,
      entry.url,
      entry.genre,
      entry.reason,
      entry.pointsToImitate,
      entry.memo,
    ]
      .join(' ')
      .toLowerCase();
    return target.includes(query.toLowerCase());
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.senderName.trim() && !form.url.trim()) return;

    const cleanedForm: EntryForm = {
      discoveredAt: form.discoveredAt,
      senderName: form.senderName.trim(),
      url: form.url.trim(),
      genre: form.genre.trim(),
      reason: form.reason.trim(),
      pointsToImitate: form.pointsToImitate.trim(),
      memo: form.memo.trim(),
    };

    if (editingId) {
      setEntries((current) => current.map((entry) => (entry.id === editingId ? { ...cleanedForm, id: editingId } : entry)));
      setEditingId(null);
    } else {
      setEntries((current) => [{ ...cleanedForm, id: crypto.randomUUID() }, ...current]);
    }

    setForm({ ...emptyForm, discoveredAt: cleanedForm.discoveredAt });
  };

  const updateField = (field: keyof EntryForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const startEditing = (entry: Entry) => {
    setEditingId(entry.id);
    setForm({
      discoveredAt: entry.discoveredAt,
      senderName: entry.senderName,
      url: entry.url,
      genre: entry.genre,
      reason: entry.reason,
      pointsToImitate: entry.pointsToImitate,
      memo: entry.memo,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const deleteEntry = (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    if (editingId === id) {
      cancelEditing();
    }
  };

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Newsletter research notebook</p>
          <h1>Substack Labo</h1>
        </div>
        <div className="counter">
          <span>{entries.length}</span>
          <small>件</small>
        </div>
      </section>

      <section className="workspace">
        <form className="entry-form" onSubmit={handleSubmit}>
          <div className="form-heading">
            {editingId ? <Pencil size={20} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}
            <h2>{editingId ? '記録を編集' : '発見を記録'}</h2>
          </div>

          <label>
            発見日
            <input
              type="date"
              value={form.discoveredAt}
              onChange={(event) => updateField('discoveredAt', event.target.value)}
            />
          </label>

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
            URL
            <input
              type="url"
              value={form.url}
              onChange={(event) => updateField('url', event.target.value)}
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
            気になった理由
            <textarea
              value={form.reason}
              onChange={(event) => updateField('reason', event.target.value)}
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
            メモ
            <textarea value={form.memo} onChange={(event) => updateField('memo', event.target.value)} rows={4} />
          </label>

          <div className="form-actions">
            <button className="primary-button" type="submit">
              <Save size={18} aria-hidden="true" />
              {editingId ? '更新' : '保存'}
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
              placeholder="記録を検索"
            />
          </div>

          <div className="entries-list">
            {filteredEntries.length === 0 ? (
              <div className="empty-state">
                <h2>まだ記録がありません</h2>
                <p>気になったSubstackを見つけたら、左のフォームから残していきましょう。</p>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <article className="entry-card" key={entry.id}>
                  <div className="entry-card-header">
                    <div>
                      <time>{entry.discoveredAt}</time>
                      <h2>{entry.senderName || '名前未入力'}</h2>
                    </div>
                    <div className="card-actions">
                      <button className="icon-button edit-button" type="button" onClick={() => startEditing(entry)} aria-label="編集">
                        <Pencil size={18} aria-hidden="true" />
                      </button>
                      <button className="icon-button" type="button" onClick={() => deleteEntry(entry.id)} aria-label="削除">
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="entry-meta">
                    {entry.genre && <span>{entry.genre}</span>}
                    {entry.url && (
                      <a href={entry.url} target="_blank" rel="noreferrer">
                        <ExternalLink size={15} aria-hidden="true" />
                        開く
                      </a>
                    )}
                  </div>

                  <EntryDetail label="気になった理由" value={entry.reason} />
                  <EntryDetail label="真似したいポイント" value={entry.pointsToImitate} />
                  <EntryDetail label="メモ" value={entry.memo} />
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

function useStoredEntries() {
  const [entries, setEntries] = useState<Entry[]>(loadEntries);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries]);

  return [entries, setEntries] as const;
}

export default App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
