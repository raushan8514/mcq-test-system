// Student Dashboard Logic
// filepath: js/student.js

let currentUser = null;
let questions = [];
let userSubmissions = [];

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
    initializeDashboard();
  });

  function initializeDashboard() {
    // Set user info
    document.getElementById('studentName').textContent = currentUser.name;
    document.getElementById('studentEmail').textContent = currentUser.email;
    document.getElementById('studentAvatar').textContent = currentUser.name.charAt(0).toUpperCase();

    // Setup navigation
    setupNavigation();

    // Load data
    loadQuestions();
    loadHistory();
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

    // Start Test button
    document.getElementById('startTestBtn').addEventListener('click', () => {
      if (questions.length === 0) {
        alert('No questions available yet. Please check back later.');
        return;
      }
      window.location.href = 'test.html';
    });
  }

  // Load Questions
  async function loadQuestions() {
    try {
      const snapshot = await db.collection('questions').get();
      questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Update UI
      document.getElementById('questionCount').textContent = `${questions.length} Questions Available`;
      document.getElementById('totalQuestions').textContent = questions.length;

    } catch (error) {
      console.error('Error loading questions:', error);
    }
  }

  // Load History
  async function loadHistory() {
    try {
      const snapshot = await db.collection('results')
        .where('studentId', '==', currentUser.uid)
        .orderBy('submittedAt', 'desc')
        .get();

      userSubmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderHistory();
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }

  // Render History
  function renderHistory() {
    const tbody = document.getElementById('historyTableBody');
    const noHistory = document.getElementById('noHistory');

    if (userSubmissions.length === 0) {
      tbody.innerHTML = '';
      noHistory.classList.remove('hidden');
      return;
    }

    noHistory.classList.add('hidden');
    tbody.innerHTML = userSubmissions.map((sub, index) => {
      const date = sub.submittedAt ? new Date(sub.submittedAt.seconds * 1000).toLocaleDateString() : 'N/A';
      const status = sub.score !== null ? 'Graded' : 'Pending';
      
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${date}</td>
          <td>${sub.totalQuestions}</td>
          <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
        </tr>
      `;
    }).join('');
  }
});