import { useRef, useState, type FormEvent } from "react";
import { isFunctionError, useMutation, useQuery } from "@pachca/app-react";
import { api } from "../../_generated/api";

export function TasksScreen() {
  // rows типизированы из схемы: text, done, owner, note?, _id, _creationTime
  const tasks = useQuery(api.tasks.list);
  const stats = useQuery(api.tasks.stats);
  const add = useMutation(api.tasks.add);
  // галочка ставится сразу, сервер подтвердит или откатит
  const toggle = useMutation(api.tasks.toggle).withOptimisticUpdate((store, { id }) => {
    const list = store.getQuery(api.tasks.list, {});
    if (list) store.setQuery(api.tasks.list, {}, list.map((t) => (t._id === id ? { ...t, done: !t.done } : t)));
  });
  const [text, setText] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      // сначала файл (сессия по правилам приложения, uuid на выходе), потом мутация с uuid
      const file = picker.current?.files?.[0];
      const image = file ? await pachca.files.upload(file, { createSession: api.tasks.uploadUrl, onProgress: setProgress }) : undefined;
      await add({ text, image });
      setText("");
      if (picker.current) picker.current.value = "";
    } catch (err) {
      // AppError сервера: e.code (bad_text) и e.message
      setError(isFunctionError(err) ? `${err.message} (${err.code})` : String(err));
    } finally {
      setProgress(null);
    }
  };

  return (
    <section>
      <h1>
        Задачи {stats && <small>{stats.done} из {stats.total}</small>}
      </h1>
      <form onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Новая задача" autoComplete="off" />
        <input type="file" accept="image/*" ref={picker} />
        <button>Добавить</button>
        {progress !== null && <small> {progress}%</small>}
      </form>
      {error && <p className="err">{error}</p>}
      {tasks === undefined ? (
        <p className="muted">Загрузка…</p>
      ) : (
        <ul>
          {tasks.map((t) => (
            <li key={t._id} onClick={() => void toggle({ id: t._id }).catch((e: Error) => setError(e.message))}>
              {t.done ? "✓" : "○"} {t.text}
              {t.imageUrl && <img src={t.imageUrl} alt="" style={{ display: "block", maxHeight: 80 }} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
