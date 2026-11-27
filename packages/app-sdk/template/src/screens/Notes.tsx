import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { isFunctionError, useMutation, useQuery } from "@pachca/app-react";
import { api } from "../../_generated/api";

export function NotesScreen() {
  const notes = useQuery(api.notes.list);
  const add = useMutation(api.notes.add).withOptimisticUpdate((store, { text }) => {
    const list = store.getQuery(api.notes.list, {});
    if (list) store.setQuery(api.notes.list, {}, [{ _id: -Date.now(), _creationTime: Date.now(), text, owner: "" } as (typeof list)[number], ...list]);
  });
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await add({ text });
      setText("");
    } catch (err) {
      setError(isFunctionError(err) ? err.message : String(err));
    }
  };

  return (
    <section>
      <h1>__NAME__</h1>
      <form onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Новая заметка" autoComplete="off" />
        <button disabled={!text.trim()}>Добавить</button>
      </form>
      {error && <p className="err">{error}</p>}
      {notes === undefined ? (
        <p className="muted">Загрузка…</p>
      ) : notes.length === 0 ? (
        <p className="muted">Заметок пока нет</p>
      ) : (
        <ul>
          {notes.map((n) => (
            <li key={n._id}>
              <Link to="/notes/$id" params={{ id: String(n._id) }}>{n.text}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
