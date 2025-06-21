//Firebase Imports from global window object
const {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection
} = window.firebaseTools;


//firestore set up
const db = window.firebaseDB;
const subjectsCollection = collection(db, "subjects");


//state variables 
let subjects = [];
let hasVoted = localStorage.getItem("hasVoted") === "true";


//Fetch subjects from Firestore & render them
async function fetchSubjects() {
//   console.log("Fetching subjects from Firestore..."); //testing don't remove.


  const querySnapshot = await getDocs(subjectsCollection);
  subjects = [];
  querySnapshot.forEach((docSnap) => {
    subjects.push({
      name: docSnap.id,
      votes: docSnap.data().votes || 0
    });
  });

  renderTable(subjects);
}

// Cast a vote to Firestore
async function castVote(subjectName) {
    // console.log("Vote button clicked for:", subjectName); // Testing only, don't remove.
  if (hasVoted) return;

  const subjectDoc = doc(db, "subjects", subjectName);
  const snap = await getDoc(subjectDoc);
  const currentVotes = snap.exists() ? snap.data().votes : 0;

  await updateDoc(subjectDoc, {
    votes: currentVotes + 1
  });

  //// Record the vote in local storage to prevent duplicates
  localStorage.setItem("hasVoted", "true");
  hasVoted = true;

  fetchSubjects(); // Re-fetch and update table
}

//Render all subject rows in the table
function renderTable(subjects) {
  console.log("Subjects being rendered:", subjects);

  const tbody = document.getElementById("subjects-table-body");
  tbody.innerHTML = "";

  const totalVotes = subjects.reduce((sum, s) => sum + s.votes, 0);

  const rankedSubjects = subjects
    .map((s) => ({
      ...s,
      percentage: totalVotes === 0 ? 0 : Math.round((s.votes / totalVotes) * 100)
    }))
    .sort((a, b) => b.votes - a.votes);

  rankedSubjects.forEach((subject, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${subject.name}</td>
      <td><button class="vote" ${hasVoted ? "disabled" : ""} onclick="castVote('${subject.name}')">Vote</button></td>
      <td>
        <div class="bar">
          <div class="bar-fill" style="width: 0%;">${subject.percentage}%</div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);

    const barFill = tr.querySelector(".bar-fill");
    setTimeout(() => {
      barFill.style.width = `${subject.percentage}%`;
    }, 100);
  });
//Update leaderboard (top 3 subjects only)
  updateLeaderboard(rankedSubjects);
}

function updateLeaderboard(sorted) {
  const total = sorted.reduce((sum, s) => sum + s.votes, 0);
  const topThree = sorted.filter((s) => s.votes > 0).slice(0, 3);

  const [first, second, third] = [topThree[0], topThree[1], topThree[2]];

  document.getElementById("first-subject").textContent = first ? first.name : "-";
  document.getElementById("first-votes").textContent = first ? `${Math.round((first.votes / total) * 100)}% votes` : "";

  document.getElementById("second-subject").textContent = second ? second.name : "-";
  document.getElementById("second-votes").textContent = second ? `${Math.round((second.votes / total) * 100)}% votes` : "";

  document.getElementById("third-subject").textContent = third ? third.name : "-";
  document.getElementById("third-votes").textContent = third ? `${Math.round((third.votes / total) * 100)}% votes` : "";
}

//On page load, fetch & display subjects
document.addEventListener("DOMContentLoaded", fetchSubjects);
// Make castVote globally available so inline onclick can access it

window.castVote = castVote;
//testing purposes only
 
window.resetVotes = () => {
  localStorage.removeItem("hasVoted");
  alert("Voting reset! Refresh to try again.");
};

// copy link home page 
function copyLink() {
  const currentURL = window.location.href;
  navigator.clipboard.writeText(currentURL).then(() => {
    alert("🔗 Link copied to clipboard! Share it with your friends!");
  }).catch((err) => {
    alert("Failed to copy the link. Please try manually.");
    console.error("Copy error:", err);
  });
}
