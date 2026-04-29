// Test Page Logic
// filepath: js/test.js

let currentUser = null;
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    // Verify student role
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'student') {
      await auth.signOut();
      window.location.href = 'index.html';
      return;
    }

    currentUser = { uid: user.uid, ...userDoc.data() };
    await loadQuestions();
  });

  async function loadQuestions() {
    try {
      const snapshot = await db.collection('questions').get();
      questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (questions.length === 0) {
        alert('No questions available. Please contact your teacher.');
        window.location.href = 'student.html';
        return;
      }

      // Shuffle questions (optional - remove if you want fixed order)
      shuffleArray(questions);

      // Initialize test
      initializeTest();
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Error loading questions. Please try again.');
    }
  }

  function initializeTest() {
    // Update total questions
    document.getElementById('totalQuestionsNum').textContent = questions.length;
    document.getElementById('totalCount').textContent = questions.length;

    // Generate question dots
    generateQuestionDots();

    // Load first question
    loadQuestion(0);

    // Setup navigation buttons
    setupNavigation();
  }

  // Generate Question Dots
  function generateQuestionDots() {
    const dotsContainer = document.getElementById('questionDots');
    dotsContainer.innerHTML = questions.map((_, index) => `
      <div class="question-dot" data-index="${index}" onclick="goToQuestion(${index})">
        ${index + 1}
      </div>
    `).join('');
  }

  // Load Question
  function loadQuestion(index) {
    if (index < 0 || index >= questions.length) return;

    currentQuestionIndex = index;
    const question = questions[index];

    // Update question number
    document.getElementById('currentQuestionNum').textContent = index + 1;
    document.getElementById('qNum').textContent = index + 1;

    // Update category
    document.getElementById('qCategory').textContent = question.category;

    // Update question text
    document.getElementById('questionText').textContent = question.questionText;

    // Generate options
    const optionsContainer = document.getElementById('optionsContainer');
    const options = [
      { key: 'A', text: question.optionA },
      { key: 'B', text: question.optionB },
      { key: 'C', text: question.optionC },
      { key: 'D', text: question.optionD }
    ];

    optionsContainer.innerHTML = options.map(opt => `
      <label class="option-label ${userAnswers[question.id] === opt.key ? 'selected' : ''}">
        <input type="radio" name="answer" value="${opt.key}" ${userAnswers[question.id] === opt.key ? 'checked' : ''}>
        <span class="option-key">${opt.key}</span>
        <span class="option-text">${opt.text}</span>
      </label>
    `).join('');

    // Add event listeners to options
    document.querySelectorAll('.option-label').forEach(label => {
      label.addEventListener('click', () => {
        const questionId = questions[currentQuestionIndex].id;
        const selectedOption = label.querySelector('input[type="radio"]').value;
        userAnswers[questionId] = selectedOption;
        
        // Update visual selection
        document.querySelectorAll('.option-label').forEach(l => l.classList.remove('selected'));
        label.classList.add('selected');
        
        // Update dot
        updateDot(index);
      });
    });

    // Update navigation buttons
    updateNavigationButtons();

    // Update current dot
    updateCurrentDot();
  }

  // Update Dot
  function updateDot(index) {
    const dot = document.querySelector(`.question-dot[data-index="${index}"]`);
    if (dot) {
      dot.classList.add('answered');
    }
  }

  // Update Current Dot
  function updateCurrentDot() {
    document.querySelectorAll('.question-dot').forEach(dot => {
      dot.classList.remove('current');
    });
    const currentDot = document.querySelector(`.question-dot[data-index="${currentQuestionIndex}"]`);
    if (currentDot) {
      currentDot.classList.add('current');
    }
  }

  // Update Navigation Buttons
  function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Previous button
    prevBtn.disabled = currentQuestionIndex === 0;

    // Next and Submit buttons
    if (currentQuestionIndex === questions.length - 1) {
      nextBtn.classList.add('hidden');
      submitBtn.classList.remove('hidden');
    } else {
      nextBtn.classList.remove('hidden');
      submitBtn.classList.add('hidden');
    }
  }

  // Setup Navigation
  function setupNavigation() {
    // Previous button
    document.getElementById('prevBtn').addEventListener('click', () => {
      if (currentQuestionIndex > 0) {
        loadQuestion(currentQuestionIndex - 1);
      }
    });

    // Next button
    document.getElementById('nextBtn').addEventListener('click', () => {
      if (currentQuestionIndex < questions.length - 1) {
        loadQuestion(currentQuestionIndex + 1);
      }
    });

    // Submit button
    document.getElementById('submitBtn').addEventListener('click', () => {
      document.getElementById('answeredCount').textContent = Object.keys(userAnswers).length;
      document.getElementById('submitModal').classList.remove('hidden');
    });

    // Submit Modal
    document.getElementById('closeSubmitModal').addEventListener('click', () => {
      document.getElementById('submitModal').classList.add('hidden');
    });

    document.getElementById('submitModal').querySelector('.modal-overlay').addEventListener('click', () => {
      document.getElementById('submitModal').classList.add('hidden');
    });

    document.getElementById('cancelSubmit').addEventListener('click', () => {
      document.getElementById('submitModal').classList.add('hidden');
    });

    document.getElementById('confirmSubmit').addEventListener('click', submitTest);

    // Back to Dashboard
    document.getElementById('backToDashboard').addEventListener('click', () => {
      window.location.href = 'student.html';
    });
  }

  // Go to Question
  window.goToQuestion = function(index) {
    loadQuestion(index);
  };

  // Submit Test
  async function submitTest() {
    const confirmBtn = document.getElementById('confirmSubmit');
    setButtonLoading(confirmBtn, true);

    try {
      // Create result document
      // await db.collection('results').add({
      //   studentId: currentUser.uid,
      //   studentName: currentUser.name,
      //   studentEmail: currentUser.email,
      //   answers: userAnswers,
      //   score: null, // Will be set by teacher
      //   totalQuestions: questions.length,
      //   submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      // });
      // 🔥 Calculate score
let score = 0;

questions.forEach(q => {
  if (userAnswers[q.id] === q.correctAnswer) {
    score++;
  }
});

// 🔥 Save result with score
await db.collection('results').add({
  studentId: currentUser.uid,
  studentName: currentUser.name,
  studentEmail: currentUser.email,
  answers: userAnswers,
  score: score, // ✅ FIXED
  totalQuestions: questions.length,
  submittedAt: firebase.firestore.FieldValue.serverTimestamp()
});

      // Hide submit modal
      document.getElementById('submitModal').classList.add('hidden');

      // Show success modal
      document.getElementById('successModal').classList.remove('hidden');

    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Error submitting test. Please try again.');
    } finally {
      setButtonLoading(confirmBtn, false);
    }
  }

  // Utility Functions
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  }
});