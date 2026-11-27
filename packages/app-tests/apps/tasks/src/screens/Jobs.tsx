import { useState } from "react";
import { useJob, useMutation, useQuery } from "@pachca/app-react";
import { api } from "../../_generated/api";

export function JobsScreen() {
  const send = useJob(api.tasks.sendJob);
  const later = useMutation(api.tasks.sendJobLater);
  const all = useQuery(api.tasks.jobs);
  const [text, setText] = useState("Письмо клиенту");
  const [mode, setMode] = useState("ok");

  return (
    <section>
      <h1>Задания</h1>
      <p>
        <input value={text} onChange={(e) => setText(e.target.value)} />{" "}
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="ok">успех</option>
          <option value="app">отказ AppError</option>
          <option value="crash">падение</option>
        </select>
      </p>
      <p>
        <button disabled={send.isRunning} onClick={() => send.start({ text, mode, ms: 1500 })}>
          Отправить
        </button>
        <button disabled={send.state !== "pending"} onClick={() => send.cancel()}>
          Отменить
        </button>
        <button onClick={() => void later({ text, afterMs: 5000 })}>Отправить через 5 с</button>
      </p>
      <p>
        Состояние: <b>{send.state ?? "не запускалось"}</b>
        {send.state === "success" && <> · отправлено «{send.result?.text}»</>}
        {send.error && <span className="err"> · {send.error.message} ({send.error.code})</span>}
      </p>
      <h2>Все задания</h2>
      <ul>
        {all?.map((j) => (
          <li key={j.id}>
            #{j.id} {j.fn}: {j.state} {j.errorCode && <span className="err">{j.errorCode}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
