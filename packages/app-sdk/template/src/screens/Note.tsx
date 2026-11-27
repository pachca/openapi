import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useJob, useMutation, useQuery } from "@pachca/app-react";
import type { Id } from "@pachca/app-sdk";
import { api } from "../../_generated/api";

export function NoteScreen() {
  const { id } = useParams({ from: "/notes/$id" });
  const noteId = Number(id) as Id<"notes">;
  const note = useQuery(api.notes.get, { id: noteId });
  const remove = useMutation(api.notes.remove);
  const send = useJob(api.notes.send);
  const navigate = useNavigate();

  if (note === undefined) return <p className="muted">Загрузка…</p>;
  if (note === null) return <p>Заметки нет. <Link to="/">К заметкам</Link></p>;

  return (
    <section>
      <h1>{note.text}</h1>
      <p>
        <button disabled={send.isRunning} onClick={() => send.start({ text: note.text })}>
          {send.isRunning ? "Отправляется…" : "Отправить"}
        </button>{" "}
        {send.state === "pending" && <button onClick={() => send.cancel()}>Отменить</button>}
        <button
          onClick={async () => {
            await remove({ id: noteId });
            await navigate({ to: "/" });
          }}
        >
          Удалить
        </button>
      </p>
      {send.state === "success" && <p>Отправлено: {send.result?.words} слов</p>}
      {send.state === "canceled" && <p className="muted">Отправка отменена</p>}
      {send.error && <p className="err">{send.error.message}</p>}
    </section>
  );
}
