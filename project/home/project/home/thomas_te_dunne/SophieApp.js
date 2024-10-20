import React, { useState } from "react";
import Papa from "papaparse";
import "./styles.css"; // Assure-toi d'importer le fichier CSS

function App() {
  const [csvData, setCsvData] = useState([]);
  const [studentNames, setStudentNames] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [responses, setResponses] = useState({});
  const [questions, setQuestions] = useState([]);
  const [coefData, setCoefData] = useState({});
  const [notes, setNotes] = useState({});
  const [exportData, setExportData] = useState("");
  const [descriptors, setDescriptors] = useState({});
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const handleCsvInput = (event) => {
    const csvText = event.target.value;

    Papa.parse(csvText, {
      complete: (result) => {
        const parsedData = result.data;
        const dataWithoutLastRow = parsedData.slice(0, -1);
        setCsvData(dataWithoutLastRow);

        const names = dataWithoutLastRow
          .map((row) => Object.values(row)[0])
          .filter(Boolean);
        setStudentNames(names);
      },
      header: true,
      encoding: "UTF-8",
    });
  };

  const handleImportEval = (event) => {
    const file = event.target.files[0];

    Papa.parse(file, {
      complete: (result) => {
        const parsedEvalData = result.data.slice(1);
        const uniqueQuestions = [
          ...new Set(parsedEvalData.map((row) => row[0]).filter(Boolean)),
        ];
        setQuestions(uniqueQuestions);

        const questionCoef = {};
        const questionDescripteurs = {};

        parsedEvalData.forEach((row) => {
          if (row[0] && row[1]) {
            questionCoef[row[0]] = Number(row[1]);
            questionDescripteurs[row[0]] = {
              0: row[2],
              1: row[3],
              2: row[4],
              3: row[5],
            };
          }
        });

        setCoefData(questionCoef);
        setDescriptors(questionDescripteurs);
      },
      encoding: "UTF-8",
    });
  };

  const handleStudentChange = (event) => {
    setSelectedStudent(event.target.value);
  };

  const handleCheckboxChange = (question, value) => {
    setResponses((prevResponses) => ({
      ...prevResponses,
      [selectedStudent]: {
        ...prevResponses[selectedStudent],
        [question]: value,
      },
    }));

    const currentResponses = {
      ...responses[selectedStudent],
      [question]: value,
    };

    let totalPoints = 0;
    let totalCoef = 0;

    questions.forEach((q) => {
      if (currentResponses[q] !== undefined && coefData[q] !== undefined) {
        totalPoints += currentResponses[q] * coefData[q];
        totalCoef += coefData[q];
      }
    });

    const noteFinale = totalCoef > 0 ? (totalPoints / (totalCoef * 3)) * 20 : 0;

    setNotes((prevNotes) => ({
      ...prevNotes,
      [selectedStudent]: noteFinale.toFixed(2).replace(".", ","),
    }));
  };

  const handleCopyNotes = () => {
    const notesToCopy = csvData
      .slice(0, -1)
      .map((row) => notes[Object.values(row)[0]] || "N/A")
      .join("\n");

    navigator.clipboard
      .writeText(notesToCopy)
      .then(() => alert("Notes copiées dans le presse-papiers"))
      .catch((err) => alert("Erreur lors de la copie des notes: " + err));
  };

  const handleExportEvaluation = () => {
    let exportContent = "Élève;Question;Note\n";

    studentNames.forEach((student) => {
      questions.forEach((question) => {
        const note = responses[student]?.[question] || "N/A";
        exportContent += `${student};${question};${note}\n`;
      });
    });

    setExportData(exportContent);
    alert("Données prêtes à être copiées.");
  };

  return (
    <div className="container">
      <div className="import-button">
        <h2>Importer l'évaluation</h2>
        <div className="import-container">
          <input type="file" accept=".csv" onChange={handleImportEval} />
        </div>
        <h2>Collez vos données CSV</h2>
        <textarea
          rows="10"
          cols="30"
          placeholder="Collez les données CSV ici"
          onChange={handleCsvInput}
        />
      </div>

      <div className="table-section">
        <div className="evaluation-container">
          <h3>Liste des élèves</h3>
          <select onChange={handleStudentChange} value={selectedStudent}>
            <option value="">Sélectionnez un élève</option>
            {studentNames
              .filter((name) => !responses[name])
              .map((name, index) => (
                <option key={index} value={name}>
                  {name}
                </option>
              ))}
          </select>

          {selectedStudent && (
            <div>
              <h3>Évaluation pour {selectedStudent}</h3>
              <table border="1">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>0</th>
                    <th>1</th>
                    <th>2</th>
                    <th>3</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question, index) => (
                    <tr key={index}>
                      <td
                        onMouseEnter={(e) => {
                          const desc = descriptors[question]
                            ? `0pt: ${descriptors[question][0]}\n1pt: ${descriptors[question][1]}\n2pt: ${descriptors[question][2]}\n3pt: ${descriptors[question][3]}`
                            : "";
                          setTooltipContent(desc);
                          setTooltipVisible(true);
                          setActiveQuestion(question);

                          const rect = e.target.getBoundingClientRect();
                          setTooltipPosition({
                            top: rect.bottom + window.scrollY + 5,
                            left: rect.left + window.scrollX,
                          });
                        }}
                        onMouseLeave={() => {
                          setTooltipVisible(false);
                          setActiveQuestion(null);
                        }}
                      >
                        {question}
                      </td>
                      {[0, 1, 2, 3].map((value) => (
                        <td key={value}>
                          <input
                            className="checkbox"
                            type="checkbox"
                            checked={
                              responses[selectedStudent]?.[question] === value
                            }
                            onChange={() =>
                              handleCheckboxChange(question, value)
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="table-container">
          <h3>Tableau des notes</h3>
          <button onClick={handleCopyNotes}>Copier notes</button>
          <button onClick={handleExportEvaluation}>Exporter évaluation</button>
          <table border="1">
            <thead>
              <tr>
                <th>Élève</th>
                <th>Note /20</th>
              </tr>
            </thead>
            <tbody>
              {csvData.slice(0, -1).map((row, rowIndex) => {
                const studentName = Object.values(row)[0];
                const note = notes[studentName];
                const absentMark =
                  studentNames.includes(studentName) &&
                  responses[studentName]?.absent
                    ? "X"
                    : "";

                return (
                  <tr key={rowIndex}>
                    <td>{studentName}</td>
                    <td>{absentMark || note || "N/A"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {exportData && (
            <div>
              <h3>Données à exporter</h3>
              <textarea
                rows="10"
                cols="50"
                value={exportData}
                readOnly
                onClick={() =>
                  navigator.clipboard
                    .writeText(exportData)
                    .then(() => alert("Données copiées dans le presse-papiers"))
                }
              />
            </div>
          )}
        </div>
      </div>

      {tooltipVisible && activeQuestion && (
        <div
          className="tooltip"
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        >
          {tooltipContent.split("\n").map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
