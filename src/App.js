import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import "./styles.css"; // Assurez-vous que ce fichier existe et contient vos styles

function App() {
  // États pour stocker les différentes données de l'application
  const [csvData, setCsvData] = useState([]);
  const [studentNames, setStudentNames] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [responses, setResponses] = useState({});
  const [questions, setQuestions] = useState([]);
  const [coefData, setCoefData] = useState({});
  const [notes, setNotes] = useState({});
  const [competences, setCompetences] = useState({}); // Nouvel état pour les compétences
  const [exportData, setExportData] = useState("");
  const [descriptors, setDescriptors] = useState({});
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [showTutorial, setShowTutorial] = useState(false);
  const [showTutorialTwo, setShowTutorialTwo] = useState(false);

  // Fonction pour convertir une note en compétence
  const noteToCompetence = (note) => {
    if (note >= 16) return 4;
    if (note >= 12) return 3;
    if (note >= 9) return 2;
    return 1;
  };

  // Gère l'importation des données CSV des élèves
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

  // Gère l'importation du fichier d'évaluation
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

  // Gère le changement d'élève sélectionné
  const handleStudentChange = (event) => {
    setSelectedStudent(event.target.value);
  };

  // Gère le changement de réponse pour une question
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
    const noteFormatted = noteFinale.toFixed(2).replace(".", ",");

    setNotes((prevNotes) => ({
      ...prevNotes,
      [selectedStudent]: noteFormatted,
    }));

    // Calculer et mettre à jour la compétence
    const competence = noteToCompetence(noteFinale);
    setCompetences((prevCompetences) => ({
      ...prevCompetences,
      [selectedStudent]: competence,
    }));
  };

  // Gère la copie des notes dans le presse-papiers
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

  // Gère la copie des compétences dans le presse-papiers
  const handleCopyCompetences = () => {
    const competencesToCopy = csvData
      .slice(0, -1)
      .map((row) => {
        const studentName = Object.values(row)[0];
        return competences[studentName] || "N/A";
      })
      .join("\n");

    navigator.clipboard
      .writeText(competencesToCopy)
      .then(() => alert("Compétences copiées dans le presse-papiers"))
      .catch((err) => alert("Erreur lors de la copie des compétences: " + err));
  };

  // Gère le showTutorial
  const toggleTutorial = () => {
    setShowTutorial(!showTutorial);
  };
  const toggleTutorialTwo = () => {
    setShowTutorialTwo(!showTutorialTwo);
  };

  // Gère l'exportation des évaluations
  const handleExportEvaluation = () => {
    let exportContent = "Élève;Question;Note;Compétence\n";

    studentNames.forEach((student) => {
      questions.forEach((question) => {
        const note = responses[student]?.[question] || "N/A";
        const competence = competences[student] || "N/A";
        exportContent += `${student};${question};${note};${competence}\n`;
      });
    });
    //Telechargement du Fichier CSV
    const blob = new Blob([exportContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "evaluation.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportData(exportContent);
    alert(
      "Les données vont être téléchargées. Si cela ne fonctionne pas, elles sont mises à disposition dans une zone de texte en dessous du tableau de notes."
    );

    // Scroller vers le bas de la page après l'exportation
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  // Fonction pour réinitialiser l'évaluation d'un élève
  const handleResetStudent = () => {
    if (selectedStudent) {
      if (
        window.confirm(
          `Êtes-vous sûr de vouloir réinitialiser l'évaluation de ${selectedStudent}?`
        )
      ) {
        setResponses((prevResponses) => {
          const newResponses = { ...prevResponses };
          delete newResponses[selectedStudent];
          return newResponses;
        });
        setNotes((prevNotes) => {
          const newNotes = { ...prevNotes };
          delete newNotes[selectedStudent];
          return newNotes;
        });
        setCompetences((prevCompetences) => {
          const newCompetences = { ...prevCompetences };
          delete newCompetences[selectedStudent];
          return newCompetences;
        });
        alert(`L'évaluation de ${selectedStudent} a été réinitialisée.`);
      }
    }
  };

  // Fonction pour sauvegarder le travail actuel
  const handleSaveProgress = () => {
    const saveData = {
      studentNames,
      responses,
      notes,
      competences,
    };

    const file = new Blob([JSON.stringify(saveData, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "sauvegarde.json";
    link.click();
  };

  // Fonction pour charger une sauvegarde
  const handleLoadProgress = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const saveData = JSON.parse(e.target.result);
      setStudentNames(saveData.studentNames);
      setResponses(saveData.responses);
      setNotes(saveData.notes);
      setCompetences(saveData.competences);

      // Si la zone de texte de la liste des élèves est vide, on la remplit avec la liste chargée
      if (
        studentListRef.current &&
        studentListRef.current.value.trim() === ""
      ) {
        // On crée une copie de la liste d'élèves
        let studentList = saveData.studentNames.slice();

        // Insérer "NOM" sur la première ligne et un saut de ligne
        studentList.unshift("NOM"); // On ajoute "NOM" au début de la liste

        // Ajouter les élèves après "NOM" et un retour à la ligne à la fin
        let textToInsert = studentList.join("\n") + "\n"; // Ajouter un retour à la ligne après le dernier élève

        // Remplir la zone de texte avec le texte formaté
        studentListRef.current.value = textToInsert;

        // Placer le curseur à la fin de la zone de texte
        studentListRef.current.selectionStart =
          studentListRef.current.selectionEnd = textToInsert.length;

        // Simuler la pression de la touche "Entrée" (Retour à la ligne)
        const event = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
        });

        // Déclencher l'événement sur la zone de texte
        studentListRef.current.dispatchEvent(event);
      }
    };

    if (file) {
      reader.readAsText(file);
    }
  };
  // Crée un ref pour accéder à la zone de texte
  const studentListRef = useRef(null);

  // États pour gérer l'affichage de chaque section

  // Fonctions pour afficher/masquer les sections

  return (
    <div className="container">
      <h1 className="main-title">SOPHIE</h1>
      <h2 className="sub-title">
        Système Optimisé Pour Harmoniser les Interactions Éducatives
      </h2>

      {/* Flèche pour afficher/masquer le tutoriel */}
      <div
        onClick={toggleTutorial}
        style={{ cursor: "pointer", marginTop: "20px", fontSize: "1" }}
      >
        {showTutorial
          ? "▼ Masquer le tutoriel"
          : "▶ Voir le tutoriel de fonctionnement"}
      </div>

      {/* Nouveau bouton Tutoriel 2 */}
      <div
        onClick={toggleTutorialTwo}
        style={{
          cursor: "pointer",
          marginTop: "20px",
          fontSize: "1",
          display: "inline-block",
        }}
      >
        {showTutorialTwo
          ? "▼ Masquer le tutoriel"
          : "▶ Voir le tutoriel pour Sauvegarde/Importer"}
      </div>

      {/* Contenu du Tutoriel 2 qui s'affiche/masque selon l'état */}
      {showTutorialTwo && (
        <div style={{ marginTop: "20px" }}>
          <h2>Sauvegarde / Importer</h2>

          <section>
            <h3>Bouton Sauvegarde</h3>
            <p>
              Le bouton <strong>Sauvegarde</strong> vous permet de sauvegarder
              votre travail. Cette action télécharge un document{" "}
              <code>.json</code> contenant toutes les informations que vous avez
              saisies dans <strong>SOPHIE</strong>. Ce fichier pourra être
              utilisé ultérieurement pour restaurer vos données.
            </p>
          </section>

          <section>
            <h3>Bouton Importer Sauvegarde</h3>
            <p>
              Le bouton <strong>Importer Sauvegarde</strong> vous permet de
              récupérer les données sauvegardées précédemment. Voici la
              procédure à suivre :
            </p>
            <ol>
              <li>
                Importez d'abord votre évaluation via le champ{" "}
                <strong>Importer évaluation</strong>.
              </li>
              <li>
                Ensuite, cliquez sur <strong>Importer Sauvegarde</strong>.
              </li>
              <li>
                Sélectionnez le fichier de sauvegarde{" "}
                <code>suavegarde.json</code>.
              </li>
              <li>La liste des élèves sera importée.</li>
              <li>
                Cliquez sur la dernière ligne de la zone de texte et appuyez sur{" "}
                <strong>Entrée</strong>. Cela affichera le tableau avec les
                notes et les compétences.
              </li>
            </ol>
            <p>
              Pour mieux comprendre ce processus, voici un lien vers un{" "}
              <a
                href="https://youtu.be/UGvQhq05JMA"
                target="_blank"
                rel="noopener noreferrer"
              >
                Vidéo explicatif
              </a>{" "}
              illustrant les étapes.
            </p>
          </section>
        </div>
      )}

      {/* Contenu du tutoriel qui s'affiche/masque selon l'état */}
      {showTutorial && (
        <div style={{ marginTop: "20px" }}>
          <h2>Fonctionnement</h2>
          <h3>Étape 1 : Préparer un fichier .csv</h3>
          <p>
            Pour utiliser SOPHIE, il vous faut un fichier .csv d'un format
            spécifique. Vous pouvez télécharger un modèle ici qui est un exemple
            d'evaluation pour le HTML:{" "}
            <a
              href="https://drive.google.com/uc?export=download&id=1AoN9RwMBNFN9eSRQ_706gI02NWvkfNfR"
              target="_blank"
              rel="noopener noreferrer"
            >
              Télécharger le modèle de fichier .csv
            </a>
            .
            <br />
            Ouvrez le fichier avec Excel ou Google Sheets pour le personnaliser.
          </p>
          <h3>Étape 2 : Créer vos descripteurs</h3>
          <p>
            Utilisez vos descripteurs en les complétents dans le fichier .csv
            [format:Question;Coefficient;0;1;2;3.], ou utilisez ChatGPT pour
            créer les descripteurs. Voici un prompt à utiliser :
            <br />
            <em>
              "Voici mon évaluation, écris-moi les descripteurs par question de
              0 à 3. Attention, je souhaite que tu me l'écrives en .csv de ce
              type : Question;Coefficient;0pt;1pt;2pt;3pt."
            </em>
            <br />
            N'ouvliez pas de joindre votre évaluation en .pdf à ChatGPT.
            <br /> Accédez à ChatGPT ici :{" "}
            <a
              href="https://chat.openai.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              ChatGPT
            </a>
            .
          </p>
          <h3>Étape 3 : Modifier votre fichier .csv</h3>
          <p>
            Vous pouvez ajuster les coefficients des questions en modifiant la
            deuxième colonne du fichier .csv généré.
          </p>
          <h3>Étape 4 : Importer le fichier dans SOPHIE</h3>
          <p>
            Une fois votre fichier prêt, importez-le via le bouton{" "}
            <strong>"Choisir un fichier"</strong> dans SOPHIE.
          </p>
          <h3>Étape 5 : Copier les listes d’élèves via Pronote</h3>
          <p>
            Si vous utilisez Pronote Client (non WEB), suivez ces étapes :
            <ol>
              <li>Créez une nouvelle évaluation (Note ou Compétence).</li>
              <li>Cliquez sur "Liste" en haut du tableau d'évaluation.</li>
              <li>
                Sélectionnez l'icône "copier" pour copier les informations dans
                votre presse-papiers.
              </li>
            </ol>
            Vous pouvez aussi suivre cette{" "}
            <a
              href="https://drive.google.com/file/d/1NEUxE8jxJmAhFqdrUPIpvbCIZ_O2UNkj/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
            >
              démonstration visuelle sous forme de GIF
            </a>
            .
          </p>
          <h3>Étape 6 : Coller les listes dans SOPHIE</h3>
          <p>Collez vos listes dans la zone de texte prévue à cet effet.</p>
          <h3>Étape 7 : Évaluation des élèves</h3>
          <p>
            <ol>
              <li>
                Utilisez le menu déroulant pour choisir l’élève à évaluer.
              </li>
              <li>
                Un tableau apparaîtra avec les questions. Survolez la question
                avec la souris pour voir les descripteurs.
              </li>
            </ol>
          </p>
          <h3>Étape 8 : Exporter les résultats</h3>
          <p>
            Une fois l’évaluation terminée, vous pouvez copier les notes dans
            Pronote (Notes uniquement) ou exporter les résultats. Les
            informations seront copiées au format suivant :{" "}
            <strong>Élève;Question;Score;Compétence</strong>.
          </p>
          <p>
            Si vous avez des questions ou des retours, n'hésitez pas à me
            contacter à :{" "}
            <a href="mailto:te-dunne.thomas@ac-poitiers.fr">
              te-dunne.thomas@ac-poitiers.fr
            </a>
            .
          </p>
        </div>
      )}

      <div className="container">
        <div className="import-button">
          <h2>Importer l'évaluation</h2>
          <div className="import-container">
            <input type="file" accept=".csv" onChange={handleImportEval} />
          </div>
          <h2>Collez la liste des élèves via Pronote</h2>
          <button onClick={() => document.getElementById("load-file").click()}>
            Importer Sauvegarde
          </button>
          <textarea
            ref={studentListRef}
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
              {studentNames.map((name, index) => (
                <option key={index} value={name}>
                  {name}
                  {responses[name] ? " (Évalué)" : ""}
                </option>
              ))}
            </select>
            {selectedStudent && (
              <button className="reset-button" onClick={handleResetStudent}>
                Réinitialiser l'évaluation
              </button>
            )}
            <button onClick={handleSaveProgress}>Sauvegarder </button>

            <input
              type="file"
              id="load-file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleLoadProgress}
            />
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
            <h3>Tableau des notes et compétences</h3>
            <button onClick={handleCopyNotes}>Copier notes</button>
            <button onClick={handleCopyCompetences}>Copier Compétences</button>
            <button onClick={handleExportEvaluation}>
              Exporter évaluation
            </button>

            <table border="1">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Note /20</th>
                  <th>Compétence</th>
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, -1).map((row, rowIndex) => {
                  const studentName = Object.values(row)[0];
                  const note = notes[studentName];
                  const competence = competences[studentName];
                  const absentMark =
                    studentNames.includes(studentName) &&
                    responses[studentName]?.absent
                      ? "X"
                      : "";

                  return (
                    <tr key={rowIndex}>
                      <td>{studentName}</td>
                      <td>{absentMark || note || "N/A"}</td>
                      <td>{absentMark || competence || "N/A"}</td>
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
                      .then(() =>
                        alert("Données copiées dans le presse-papiers")
                      )
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
    </div>
  );
}

export default App;
