// Authentication Logic
// filepath: js/auth.js

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const showSignup = document.getElementById('showSignup');
  const showLogin = document.getElementById('showLogin');
  const authMessage = document.getElementById('authMessage');

  // Check if user is already logged in
  auth.onAuthStateChanged((user) => {
    if (user) {
      checkUserRoleAndRedirect(user);
    }
  });

  // Toggle between Login and Signup forms
  showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    authMessage.classList.add('hidden');
  });

  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authMessage.classList.add('hidden');
  });

  // Login Form Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      // Sign in with email and password
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Check if user data exists in Firestore
      await checkUserRoleAndRedirect(user);

    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = getAuthErrorMessage(error.code);
      showAuthMessage(errorMessage, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // Signup Form Submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const role = document.getElementById('signupRole').value;

    // Validation
    if (password !== confirmPassword) {
      showAuthMessage('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showAuthMessage('Password must be at least 6 characters', 'error');
      return;
    }

    if (!role) {
      showAuthMessage('Please select a role', 'error');
      return;
    }

    const submitBtn = signupForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      // Create user with email and password
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Save additional user data to Firestore
      await db.collection('users').doc(user.uid).set({
        name: name,
        email: email,
        role: role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Redirect based on role
      if (role === 'teacher') {
        window.location.href = 'teacher.html';
      } else {
        window.location.href = 'student.html';
      }

    } catch (error) {
      console.error('Signup error:', error);
      let errorMessage = getAuthErrorMessage(error.code);
      showAuthMessage(errorMessage, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // Function to check user role and redirect
  async function checkUserRoleAndRedirect(user) {
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Redirect based on role
        if (userData.role === 'teacher') {
          window.location.href = 'teacher.html';
        } else if (userData.role === 'student') {
          window.location.href = 'student.html';
        }
      } else {
        // User document doesn't exist, sign out
        await auth.signOut();
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  }

  // Function to show auth message
  function showAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
    authMessage.classList.remove('hidden');
  }

  // Function to set button loading state
  function setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  }

  // Function to get user-friendly error messages
  function getAuthErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/weak-password': 'Password is too weak',
      'auth/user-disabled': 'This account has been disabled',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection'
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again';
  }
});