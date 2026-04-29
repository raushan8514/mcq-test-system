// Teacher Dashboard Logic
// filepath: js/teacher.js

let currentUser = null;
let questions = [];
let submissions = [];
let editingQuestionId = null;
let deletingQuestionId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    // Verify teacher role
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'teacher') {
      await auth.signOut();
      window.location.href = 'index.html';
      return;
    }

    currentUser = { uid: user.uid, ...userDoc.data() };
    initializeDashboard();
  });

  function initializeDashboard() {
    // Set user info
    document.getElementById('teacherName').textContent = currentUser.name;
    document.getElementById('teacherEmail').textContent = currentUser.email;
    document.getElementById('teacherAvatar').textContent = currentUser.name.charAt(0).toUpperCase();

    // Setup navigation
    setupNavigation();

    // Setup modals
    setupModals();

    // Setup form
    setupQuestionForm();

    // Load data
    loadQuestions();
    loadSubmissions();
    loadStatistics();
  }

  // Navigation
  function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.dataset.section;
        
        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Show corresponding section
        document.querySelectorAll('.content-section').forEach(sec => {
          sec.classList.remove('active');
        });
        document.getElementById(`${section}Section`).classList.add('active');
      });
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await auth.signOut();
      window.location.href = 'index.html';
    });
  }

  // Modals
  function setupModals() {
    // Question Modal
    const questionModal = document.getElementById('questionModal');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const closeQuestionModal = document.getElementById('closeQuestionModal');
    const cancelQuestion = document.getElementById('cancelQuestion');

    addQuestionBtn.addEventListener('click', () => {
      editingQuestionId = null;
      document.getElementById('questionModalTitle').textContent = 'Add New Question';
      document.getElementById('questionForm').reset();
      questionModal.classList.remove('hidden');
    });

    closeQuestionModal.addEventListener('click', () => {
      questionModal.classList.add('hidden');
    });

    cancelQuestion.addEventListener('click', () => {
      questionModal.classList.add('hidden');
    });

    questionModal.querySelector('.modal-overlay').addEventListener('click', () => {
      questionModal.classList.add('hidden');
    });

    // Delete Modal
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const confirmDelete = document.getElementById('confirmDelete');

    closeDeleteModal.addEventListener('click', () => {
      deleteModal.classList.add('hidden');
    });

    cancelDelete.addEventListener('click', () => {
      deleteModal.classList.add('hidden');
    });

    deleteModal.querySelector('.modal-overlay').addEventListener('click', () => {
      deleteModal.classList.add('hidden');
    });

    confirmDelete.addEventListener('click', async () => {
      if (deletingQuestionId) {
        await deleteQuestion(deletingQuestionId);
        deleteModal.classList.add('hidden');
      }
    });

    // Result Modal
    const resultModal = document.getElementById('resultModal');
    const closeResultModal = document.getElementById('closeResultModal');

    closeResultModal.addEventListener('click', () => {
      resultModal.classList.add('hidden');
    });

    resultModal.querySelector('.modal-overlay').addEventListener('click', () => {
      resultModal.classList.add('hidden');
    });
  }

  // Question Form
  function setupQuestionForm() {
    const questionForm = document.getElementById('questionForm');
    
    questionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const questionData = {
        questionText: document.getElementById('questionText').value,
        optionA: document.getElementById('optionA').value,
        optionB: document.getElementById('optionB').value,
        optionC: document.getElementById('optionC').value,
        optionD: document.getElementById('optionD').value,
        correctAnswer: document.getElementById('correctAnswer').value,
        category: document.getElementById('questionCategory').value || 'General',
        createdBy: currentUser.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const saveBtn = document.getElementById('saveQuestion');
      setButtonLoading(saveBtn, true);

      try {
        if (editingQuestionId) {
          // Update existing question
          await db.collection('questions').doc(editingQuestionId).update(questionData);
        } else {
          // Add new question
          questionData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await db.collection('questions').add(questionData);
        }

        document.getElementById('questionModal').classList.add('hidden');
        questionForm.reset();
        loadQuestions();
        loadStatistics();
      } catch (error) {
        console.error('Error saving question:', error);
        alert('Error saving question. Please try again.');
      } finally {
        setButtonLoading(saveBtn, false);
      }
    });
  }

  // Load Questions
  async function loadQuestions() {
    try {
      const snapshot = await db.collection('questions')
        .orderBy('createdAt', 'desc')
        .get();

      questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderQuestions();
      updateCategoryFilter();
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  }

  // Render Questions
  function renderQuestions() {
    const tbody = document.getElementById('questionsTableBody');
    const noQuestions = document.getElementById('noQuestions');
    const searchTerm = document.getElementById('questionSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;

    // Filter questions
    let filteredQuestions = questions.filter(q => {
      const matchesSearch = q.questionText.toLowerCase().includes(searchTerm) ||
        q.category.toLowerCase().includes(searchTerm);
      const matchesCategory = !categoryFilter || q.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    if (filteredQuestions.length === 0) {
      tbody.innerHTML = '';
      noQuestions.classList.remove('hidden');
      return;
    }

    noQuestions.classList.add('hidden');
    tbody.innerHTML = filteredQuestions.map((q, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${truncateText(q.questionText, 50)}</td>
        <td>${q.category}</td>
        <td><span class="answer-badge">${q.correctAnswer}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-icon edit" onclick="editQuestion('${q.id}')" title="Edit">✏️</button>
            <button class="btn btn-icon delete" onclick="confirmDeleteQuestion('${q.id}')" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Update Category Filter
  function updateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = [...new Set(questions.map(q => q.category))];
    
    categoryFilter.innerHTML = '<option value="">All Categories</option>' +
      categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  }

  // Search and Filter
  document.getElementById('questionSearch').addEventListener('input', renderQuestions);
  document.getElementById('categoryFilter').addEventListener('change', renderQuestions);

  // Edit Question
  window.editQuestion = function(questionId) {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    editingQuestionId = questionId;
    document.getElementById('questionModalTitle').textContent = 'Edit Question';
    
    document.getElementById('questionText').value = question.questionText;
    document.getElementById('optionA').value = question.optionA;
    document.getElementById('optionB').value = question.optionB;
    document.getElementById('optionC').value = question.optionC;
    document.getElementById('optionD').value = question.optionD;
    document.getElementById('correctAnswer').value = question.correctAnswer;
    document.getElementById('questionCategory').value = question.category;

    document.getElementById('questionModal').classList.remove('hidden');
  };

  // Confirm Delete Question
  window.confirmDeleteQuestion = function(questionId) {
    deletingQuestionId = questionId;
    document.getElementById('deleteModal').classList.remove('hidden');
  };

  // Delete Question
  async function deleteQuestion(questionId) {
    try {
      await db.collection('questions').doc(questionId).delete();
      loadQuestions();
      loadStatistics();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Error deleting question. Please try again.');
    }
  }

  // Load Submissions
  async function loadSubmissions() {
    try {
      const snapshot = await db.collection('results')
        .orderBy('submittedAt', 'desc')
        .get();

      submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderSubmissions();
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  }

  // Render Submissions
  function renderSubmissions() {
    const tbody = document.getElementById('submissionsTableBody');
    const noSubmissions = document.getElementById('noSubmissions');

    if (submissions.length === 0) {
      tbody.innerHTML = '';
      noSubmissions.classList.remove('hidden');
      return;
    }

    noSubmissions.classList.add('hidden');
    tbody.innerHTML = submissions.map((sub, index) => {
      const score = sub.score !== null ? `${sub.score}/${sub.totalQuestions}` : 'Pending';
      const date = sub.submittedAt ? new Date(sub.submittedAt.seconds * 1000).toLocaleDateString() : 'N/A';
      
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${sub.studentName}</td>
          <td>${sub.studentEmail}</td>
          <td>${sub.totalQuestions}</td>
          <td><span class="score-badge ${sub.score !== null ? 'graded' : 'pending'}">${score}</span></td>
          <td>${date}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-icon view" onclick="viewResult('${sub.id}')" title="View Details">👁️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // View Result Details
  window.viewResult = async function(resultId) {
    const result = submissions.find(s => s.id === resultId);
    if (!result) return;

    const resultDetails = document.getElementById('resultDetails');
    const score = result.score !== null ? result.score : 'Not graded yet';
    const percentage = result.score !== null ? Math.round((result.score / result.totalQuestions) * 100) : 0;

    // Load questions for comparison
    const questionsSnapshot = await db.collection('questions').get();
    const allQuestions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let answersHtml = '';
    for (const [questionId, answer] of Object.entries(result.answers || {})) {
      const question = allQuestions.find(q => q.id === questionId);
      if (question) {
        const isCorrect = answer === question.correctAnswer;
        answersHtml += `
          <div class="result-answer ${isCorrect ? 'correct' : 'incorrect'}">
            <p class="result-question-text">${question.questionText}</p>
            <div class="result-options">
              <span class="your-answer">Your answer: <strong>${answer}</strong></span>
              ${!isCorrect ? `<span class="correct-answer">Correct: <strong>${question.correctAnswer}</strong></span>` : ''}
            </div>
          </div>
        `;
      }
    }

    resultDetails.innerHTML = `
      <div class="result-header-info">
        <p><strong>Student:</strong> ${result.studentName}</p>
        <p><strong>Email:</strong> ${result.studentEmail}</p>
        <p><strong>Date:</strong> ${result.submittedAt ? new Date(result.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
      </div>
      <div class="result-score">
        <div class="score-circle">
          <span class="score-value">${score}</span>
          <span class="score-label">${percentage}%</span>
        </div>
      </div>
      <div class="result-answers">
        <h3>Answer Details</h3>
        ${answersHtml || '<p>No answers recorded.</p>'}
      </div>
    `;

    document.getElementById('resultModal').classList.remove('hidden');
  };

  // Load Statistics
  async function loadStatistics() {
    try {
      // Total Questions
      const questionsSnapshot = await db.collection('questions').get();
      const totalQuestions = questionsSnapshot.docs.length;

      // Total Students
      const studentsSnapshot = await db.collection('users')
        .where('role', '==', 'student')
        .get();
      const totalStudents = studentsSnapshot.docs.length;

      // Total Submissions
      const submissionsSnapshot = await db.collection('results').get();
      const totalSubmissions = submissionsSnapshot.docs.length;

      // Average Score (only from graded submissions)
      const gradedSubmissions = submissionsSnapshot.docs
        .map(doc => doc.data())
        .filter(sub => sub.score !== null);
      
      let avgScore = 0;
      if (gradedSubmissions.length > 0) {
        const totalScore = gradedSubmissions.reduce((sum, sub) => sum + sub.score, 0);
        const totalPossible = gradedSubmissions.reduce((sum, sub) => sum + sub.totalQuestions, 0);
        avgScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      }

      // Update UI
      document.getElementById('totalQuestions').textContent = totalQuestions;
      document.getElementById('totalStudents').textContent = totalStudents;
      document.getElementById('totalSubmissions').textContent = totalSubmissions;
      document.getElementById('avgScore').textContent = `${avgScore}%`;

    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  // Utility Functions
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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