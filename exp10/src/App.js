import React, { useState, useEffect } from "react";

// React Quiz App (single-file)
// Save this as src/App.jsx in a Create React App project (or use as your main component).
// No external CSS frameworks used. Styling is included via a small injected stylesheet.

export default function App() {
  // App modes: "teacher" to build quizzes, "student" to take quizzes
  const [mode, setMode] = useState("teacher");

  // Quiz state (array of {id, question, choices:[], correctIndex})
  const [quiz, setQuiz] = useState(() => {
    try {
      const raw = localStorage.getItem("quiz-data");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Temporary form state for teacher to add a question
  const emptyForm = { question: "", choices: ["", "", "", ""], correctIndex: 0 };
  const [form, setForm] = useState(emptyForm);

  // Student answers: map questionId -> { selectedIndex, correct }
  const [studentAnswers, setStudentAnswers] = useState({});

  // UI/UX small helpers
  useEffect(() => {
    document.title = "QuickQuiz — Teacher & Student";

    // inject minimal styles into document
    const styleId = "quickquiz-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        *{box-sizing:border-box}
        body{font-family:Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0; padding:0; background:#f6f8fb}
        .app{max-width:1000px;margin:28px auto;padding:20px}
        header{display:flex;align-items:center;justify-content:space-between}
        h1{margin:0;font-size:20px}
        .modes button{margin-left:8px;padding:8px 12px;border-radius:8px;border:1px solid #ccc;background:white;cursor:pointer}
        .modes button.active{background:#0b5cff;color:white;border-color:#0b5cff}
        .container{display:grid;grid-template-columns:1fr 380px;gap:18px;margin-top:18px}
        .card{background:white;padding:16px;border-radius:10px;box-shadow:0 6px 18px rgba(20,20,50,0.06)}
        .full{grid-column:1/-1}
        label{display:block;margin-top:12px;font-weight:600}
        input[type=text], textarea{width:100%;padding:10px;margin-top:6px;border-radius:8px;border:1px solid #e3e6ee}
        .choices{display:flex;gap:8px;flex-direction:column}
        .choice-row{display:flex;gap:8px;align-items:center}
        .small{font-size:13px;color:#555}
        .btn{display:inline-block;padding:8px 12px;border-radius:8px;border:none;background:#0b5cff;color:#fff;cursor:pointer}
        .btn.secondary{background:#6b7280}
        .question-list{max-height:420px;overflow:auto;margin-top:12px}
        .ql-item{padding:10px;border-radius:8px;border:1px dashed #eef2ff;margin-bottom:8px}
        .take-quiz .q{margin-bottom:14px;padding:12px;border-radius:8px;border:1px solid #eef2ff}
        .option{display:block;padding:8px;border-radius:8px;margin-top:6px;border:1px solid #eee;cursor:pointer}
        .option.correct{border-color: #16a34a;background:rgba(34,197,94,0.08)}
        .option.incorrect{border-color:#ef4444;background:rgba(239,68,68,0.06)}
        .summary{display:flex;gap:12px;align-items:center;margin-top:12px}
        .badge{padding:8px 12px;border-radius:999px;background:#f3f4f6}
        .center{display:flex;align-items:center;justify-content:center}
        @media(max-width:880px){.container{grid-template-columns:1fr;}.card{padding:12px}}
      `;
      document.head.appendChild(style);
    }
  }, []);

  // persist quiz into localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("quiz-data", JSON.stringify(quiz));
    } catch (e) {
      // ignore storage errors
    }
  }, [quiz]);

  // Teacher form handlers
  function updateFormField(path, value) {
    if (path === "question") setForm((f) => ({ ...f, question: value }));
    else if (path.startsWith("choice")) {
      const idx = Number(path.split(".")[1]);
      setForm((f) => {
        const choices = [...f.choices];
        choices[idx] = value;
        return { ...f, choices };
      });
    } else if (path === "correctIndex") setForm((f) => ({ ...f, correctIndex: Number(value) }));
  }

  function addQuestion() {
    // basic validation
    if (!form.question.trim()) return alert("Please enter the question text.");
    const filledChoices = form.choices.map((c) => c.trim());
    if (filledChoices.some((c) => !c)) return alert("Please fill in all 4 choices.");
    if (form.correctIndex < 0 || form.correctIndex > 3) return alert("Select the correct answer.");

    const newQ = {
      id: Date.now().toString(),
      question: form.question.trim(),
      choices: filledChoices,
      correctIndex: form.correctIndex,
    };
    setQuiz((q) => [...q, newQ]);
    setForm(emptyForm);
  }

  function deleteQuestion(id) {
    if (!window.confirm("Delete this question?")) return;
    setQuiz((q) => q.filter((x) => x.id !== id));
  }

  function editQuestion(id) {
    const q = quiz.find((x) => x.id === id);
    if (!q) return;
    setForm({ question: q.question, choices: q.choices.slice(), correctIndex: q.correctIndex });
    // remove the old one (teacher can re-add)
    setQuiz((arr) => arr.filter((x) => x.id !== id));
    setMode("teacher");
  }

  // Student handlers
  function handleSelect(questionId, choiceIndex) {
    setStudentAnswers((prev) => {
      const correct = quiz.find((q) => q.id === questionId)?.correctIndex === choiceIndex;
      return { ...prev, [questionId]: { selectedIndex: choiceIndex, correct } };
    });
  }

  function computeScore() {
    const total = quiz.length;
    const correctCount = quiz.reduce((acc, q) => acc + (studentAnswers[q.id]?.correct ? 1 : 0), 0);
    return { total, correctCount, percent: total ? Math.round((correctCount / total) * 100) : 0 };
  }

  function resetStudent() {
    setStudentAnswers({});
  }

  function clearQuiz() {
    if (!window.confirm("Clear entire quiz (all questions)?")) return;
    setQuiz([]);
    setStudentAnswers({});
  }

  const score = computeScore();

  // Simple performance summary text
  function performanceSummary() {
    if (score.total === 0) return "No questions in the quiz.";
    const p = score.percent;
    let grade = "Needs Improvement";
    if (p >= 90) grade = "Excellent";
    else if (p >= 75) grade = "Good";
    else if (p >= 50) grade = "Average";
    return `${score.correctCount}/${score.total} correct — ${p}% — ${grade}`;
  }

  return (
    <div className="app">
      <header>
        <h1>QuickQuiz — Rapid MCQ assessments</h1>
        <div className="modes">
          <button className={mode === "teacher" ? "active" : ""} onClick={() => setMode("teacher")}>Teacher</button>
          <button className={mode === "student" ? "active" : ""} onClick={() => setMode("student")}>Student</button>
        </div>
      </header>

      <div className="container">
        <div className="card">
          {mode === "teacher" ? (
            <>
              <h2>Teacher — Create / Edit Quiz</h2>
              <div style={{ marginTop: 8 }} className="small">Build short quizzes quickly. Data is stored locally in your browser.</div>

              <label>Question</label>
              <textarea rows={3} value={form.question} onChange={(e) => updateFormField("question", e.target.value)} />

              <label>Choices (4)</label>
              <div className="choices">
                {form.choices.map((c, idx) => (
                  <div className="choice-row" key={idx}>
                    <input type="radio" name="correct" checked={form.correctIndex === idx} onChange={() => updateFormField("correctIndex", idx)} />
                    <input type="text" placeholder={`Choice ${idx + 1}`} value={c} onChange={(e) => updateFormField(`choice.${idx}`, e.target.value)} />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12 }}>
                <button className="btn" onClick={addQuestion}>Add Question</button>
                <button className="btn secondary" style={{ marginLeft: 8 }} onClick={() => setForm(emptyForm)}>Reset</button>
                <button className="btn secondary" style={{ marginLeft: 8 }} onClick={clearQuiz}>Clear Quiz</button>
              </div>

              <div className="question-list">
                <h3 style={{ marginTop: 12 }}>Questions ({quiz.length})</h3>
                {quiz.length === 0 && <div className="small">No questions yet. Add some to get started.</div>}
                {quiz.map((q, i) => (
                  <div key={q.id} className="ql-item">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>Q{ i + 1}:</strong> {q.question}
                        <div className="small">Correct: Choice {q.correctIndex + 1}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn secondary" onClick={() => editQuestion(q.id)}>Edit</button>
                        <button className="btn" onClick={() => deleteQuestion(q.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2>Student — Take Quiz</h2>
              <div className="small">Select answers; you'll see immediately if each choice is correct. Submit at the end to view final score.</div>

              <div style={{ marginTop: 12 }} className="take-quiz">
                {quiz.length === 0 ? (
                  <div className="card full">No quiz is available. Ask your teacher to create questions first.</div>
                ) : (
                  quiz.map((q, qi) => {
                    const ans = studentAnswers[q.id];
                    return (
                      <div key={q.id} className="q">
                        <div style={{ fontWeight: 700 }}>Q{qi + 1}. {q.question}</div>
                        <div className="small">Choose one option</div>
                        <div style={{ marginTop: 8 }}>
                          {q.choices.map((ch, idx) => {
                            const selected = ans?.selectedIndex === idx;
                            const showCorrect = ans !== undefined; // once student chose an option, show correctness for that question
                            const isCorrect = q.correctIndex === idx;
                            const classNames = ["option"];
                            if (showCorrect && isCorrect) classNames.push("correct");
                            if (selected && showCorrect && !isCorrect) classNames.push("incorrect");

                            return (
                              <label key={idx} className={classNames.join(" ")} onClick={() => handleSelect(q.id, idx)}>
                                <input type="radio" name={`q-${q.id}`} checked={selected || false} readOnly style={{ marginRight: 8 }} />
                                {ch}
                                {showCorrect && isCorrect && <span style={{ marginLeft: 8, fontWeight: 700 }}>(Answer)</span>}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ marginTop: 12 }} className="center">
                <div>
                  <div className="summary">
                    <div className="badge">Score: {score.correctCount} / {score.total}</div>
                    <div className="badge">Percent: {score.percent}%</div>
                    <div className="badge">Summary: {performanceSummary()}</div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button className="btn" onClick={resetStudent}>Reset Answers</button>
                    <button className="btn secondary" style={{ marginLeft: 8 }} onClick={() => { setMode("teacher"); }}>Go to Teacher</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="card">
          <h3>Quick controls</h3>
          <div style={{ marginTop: 8 }} className="small">Switch between teacher and student modes using the buttons at the top.</div>

          <div style={{ marginTop: 12 }}>
            <strong>Saved quizzes:</strong>
            <div className="small">Your quiz is stored in this browser's local storage. It will stay on this device unless you clear site data.</div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Tips:</strong>
            <ul style={{ paddingLeft: 18 }}>
              <li>Create clear, short questions for quick in-class checks.</li>
              <li>Keep 3–6 questions for a fast 5-minute quiz.</li>
              <li>Use the Edit button to modify any question you added.</li>
            </ul>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Export / Import</strong>
            <div style={{ marginTop: 8 }}>
              <ExportImport quiz={quiz} setQuiz={setQuiz} />
            </div>
          </div>
        </aside>

        <div className="card full">
          <strong>How it works</strong>
          <ol>
            <li>Teacher: add questions with 4 choices and mark which is correct.</li>
            <li>Student: choose answers and see immediate feedback per question.</li>
            <li>Score is shown live; use the Reset button to try again.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}


// Small Export/Import component
function ExportImport({ quiz, setQuiz }) {
  const [jsonText, setJsonText] = useState("");

  useEffect(() => {
    setJsonText(JSON.stringify(quiz, null, 2));
  }, [quiz]);

  function doExport() {
    const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quickquiz-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function doImport() {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) return alert("Imported JSON must be an array of questions.");
      // basic validation
      for (const q of parsed) {
        if (!q.question || !Array.isArray(q.choices) || q.choices.length < 2) return alert("Each question must have text and at least 2 choices.");
      }
      setQuiz(parsed.map((x) => ({ ...x, id: x.id || Date.now().toString() + Math.random() }))); // ensure ids
      alert("Imported quiz successfully.");
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJsonText(ev.target.result);
    };
    reader.readAsText(f);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" onClick={doExport}>Export JSON</button>
        <label style={{ display: "inline-block", padding: "8px 12px", borderRadius: 8, background: "#f3f4f6", cursor: "pointer" }}>
          Import File
          <input type="file" accept="application/json" onChange={handleFile} style={{ display: "none" }} />
        </label>
      </div>

      <div style={{ marginTop: 8 }}>
        <textarea rows={5} value={jsonText} onChange={(e) => setJsonText(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 8 }} />
        <div style={{ marginTop: 8 }}>
          <button className="btn" onClick={doImport}>Import JSON</button>
        </div>
      </div>
    </div>
  );
}
