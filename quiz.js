// Each question stores its type, prompt, and correct answer in one place.
const questions = [
	{
		type: "blank",
		prompt: "Which HTTP method is commonly used to retrieve data from a server?",
		answers: ["get"],
		answerText: "GET"
	},
	{
		type: "blank",
		prompt: "How many digits are in an HTTP status code?",
		answers: ["three", "3"],
		answerText: "Three digits"
	},
	{
		type: "choice",
		prompt: "In the HTTP client-server model, what does the client send to the server?",
		options: ["A request", "A status code", "A response body"],
		answers: ["A request"],
		answerText: "A request"
	},
	{
		type: "choice",
		prompt: "What does an HTTP status code in the 4xx range indicate?",
		options: ["A client error", "A successful request", "A server error"],
		answers: ["A client error"],
		answerText: "A client error"
	},
	{
		type: "choice",
		prompt: "In which year was HTTP/1.1 released, according to the History page?",
		options: ["1991", "1999", "2015"],
		answers: ["1999"],
		answerText: "1999"
	},
	{
		type: "choice",
		prompt: "Which transport protocol does HTTP/3 use?",
		options: ["QUIC", "TCP only", "MIME"],
		answers: ["QUIC"],
		answerText: "QUIC"
	},
	{
		type: "multiple",
		prompt: "Which features were introduced with HTTP/1.0, according to the History page? Select all that apply.",
		options: ["Headers", "Status codes", "MIME types", "Multiplexing"],
		answers: ["Headers", "Status codes", "MIME types"],
		answerText: "Headers, status codes, and MIME types"
	},
	{
		type: "multiple",
		prompt: "Which are common HTTP methods listed on the Concepts page? Select all that apply.",
		options: ["GET", "POST", "PUT", "DELETE", "FETCH"],
		answers: ["GET", "POST", "PUT", "DELETE"],
		answerText: "GET, POST, PUT, and DELETE"
	},
	{
		type: "multiple",
		prompt: "Which HTTP/2 features are listed on the History page? Select all that apply.",
		options: ["Binary format", "Multiplexing", "Header compression", "Server push", "MIME types"],
		answers: ["Binary format", "Multiplexing", "Header compression", "Server push"],
		answerText: "Binary format, multiplexing, header compression, and server push"
	},
	{
		type: "blank",
		prompt: "What is the name of the HTTP/3 transport protocol that uses UDP?",
		answers: ["quic"],
		answerText: "QUIC"
	}
];

const timeLimitSeconds = 10 * 60;
const form = document.querySelector("#quiz-form");
const questionsContainer = document.querySelector("#quiz-questions");
const timerDisplay = document.querySelector("#quiz-timer");
const resultsSection = document.querySelector("#quiz-results");
const summary = document.querySelector("#quiz-summary");
const questionResults = document.querySelector("#question-results");

let startedAt = Date.now();
let timerId;
let submitted = false;

// Renders the questions and their inputs based on the question type.
function renderQuestions() {
	questionsContainer.innerHTML = questions.map((q, i) => {
        let inputsHTML = "";
        if (q.type === "blank") {
            inputsHTML = `
                <label for="question-${i}">Your answer</label>
                <input type="text" name="question-${i}" id="question-${i}" autocomplete="off" class="quiz-text-input">
            `;
        }
        else{
            const inputType = q.type === "multiple" ? "checkbox" : "radio";
            inputsHTML = q.options.map((option, j) => `
                <label class="quiz-option">
                    <input type="${inputType}" name="question-${i}" value="${option}" id="question-${i}-option-${j}">
                    <span>${option}</span>
                </label>
            `).join("");
        }
        return `<fieldset class="quiz-question"><legend>Question ${i + 1}</legend><p>${q.prompt}</p>${inputsHTML}</fieldset>`;
    }).join("");
}

// Formats a number of seconds into MM:SS format.
function formatTime(totalSeconds) {
	const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
	const seconds = (totalSeconds % 60).toString().padStart(2, "0");
	return `${minutes}:${seconds}`;
}

// Updates the timer display and checks if time has run out.
function updateTimer() {
	const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
	const remainingSeconds = Math.max(0, timeLimitSeconds - elapsedSeconds);
	timerDisplay.textContent = `Time remaining: ${formatTime(remainingSeconds)}`;

	if (remainingSeconds === 0) {
		finishQuiz();
	}
}

// Retrieves the selected answers for a given question index.
function getSelectedAnswers(questionIndex) {
	const selected = form.querySelectorAll(`input[name="question-${questionIndex}"]:checked`);
	return Array.from(selected, (input) => input.value);
}

// Checks if the chosen answers for a question are correct.
function isCorrect(question, chosenAnswers) {
	if (question.type === "blank") {
		const answer = (chosenAnswers[0] || "").trim().toLowerCase();
		return question.answers.some((correctAnswer) => answer === correctAnswer.toLowerCase());
	}

	const chosen = [...chosenAnswers].sort();
	const correct = [...question.answers].sort();
	return chosen.length === correct.length && chosen.every((answer, index) => answer === correct[index]);
}

// Finalizes the quiz, calculates the score, and displays the results.
function finishQuiz() {
	if (submitted) return;
	submitted = true;
	clearInterval(timerId);

	const elapsedSeconds = Math.min(timeLimitSeconds, Math.floor((Date.now() - startedAt) / 1000));
    const score = questions.reduce((total, question, index) => total + (isCorrect(question, getSelectedAnswers(index)) ? 1 : 0), 0);
    const passed = score >= 6;
    const percentage = Math.round((score / questions.length) * 100);

    const timeLabel = (elapsedSeconds === timeLimitSeconds && score < questions.length)
        ? `${formatTime(elapsedSeconds)} (time limit reached)`
        : formatTime(elapsedSeconds);

    summary.innerHTML = `
        <p class="quiz-overall ${passed ? "quiz-pass" : "quiz-fail"}">
            ${passed ? "Pass" : "Fail"} — ${score} / ${questions.length} (${percentage}%)
        </p>
        <p>Time spent: ${timeLabel}</p>
    `;

    questionResults.innerHTML = questions.map((question, index) => {
        const correct = isCorrect(question, getSelectedAnswers(index));
        return `
            <li class="${correct ? "quiz-correct" : "quiz-incorrect"}">
                Question ${index + 1}: ${correct ? "Correct (+1 point)" : "Incorrect (+0 points)"}. Correct answer: ${question.answerText}.
            </li>
        `;
    }).join("");
    
	form.querySelectorAll('input, button[type="submit"]').forEach((el) => el.disabled = true);
    
    // Use classList instead of hidden attribute to reliably show results
    resultsSection.classList.add("show");
    resultsSection.focus();
}

// Event listeners for form submission and reset.
form.addEventListener("submit", (event) => {
	event.preventDefault();
	finishQuiz();
});

// Event listener for form reset (Retake quiz).
form.addEventListener("reset", (event) => {
	event.preventDefault(); // Added back to prevent default page reload behavior
	form.reset();
	form.querySelectorAll("input").forEach((input) => {
		input.disabled = false;
	});
	form.querySelector('[type="submit"]').disabled = false;
	
	// Hide results section using classList
	resultsSection.classList.remove("show");
    summary.innerHTML = "";
    questionResults.innerHTML = "";
	
	submitted = false;
	startedAt = Date.now();
	timerDisplay.textContent = "Time remaining: 10:00";
	clearInterval(timerId);
	timerId = setInterval(updateTimer, 250);
});

// Initialize the quiz by rendering questions and starting the timer.
renderQuestions();
updateTimer();
timerId = setInterval(updateTimer, 250);
