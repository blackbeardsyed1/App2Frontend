console.log("auth js loaded");
const backend = "https://scalablesoftwarephotoapp-cbcmh4hcemhsg2bh.francecentral-01.azurewebsites.net";

// Global functionss
window.showSignUp = function() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('signUpSection').style.display = 'flex';
};

window.showLogin = function() {
  document.getElementById('signUpSection').style.display = 'none';
  document.getElementById('loginSection').style.display = 'flex';
};

window.signUp = function() {
  const username = document.getElementById('signUpUsername').value;
  const password = document.getElementById('signUpPassword').value;

  if (!username || !password) {
    alert("Please fill in all fields");
    return;
  }

  fetch(`${backend}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(handleResponse)
  .then(data => {
    if (data.token) {
      alert("Signup successful! You can now log in.");
      // Clear sign-up fields
      document.getElementById('signUpUsername').value = '';
      document.getElementById('signUpPassword').value = '';
      // Switch to login section
      showLogin();
    }
  })
  .catch(err => {
    alert(err.error || "Signup failed. Please try again.");
  });
};

window.login = function() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  fetch(`${backend}/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(handleResponse)
  .then(data => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      // Don't redirect here - let the token check handle it
      window.location.reload();
    }
  })
  .catch(err => {
    alert(err.error || "Login failed. Please try again.");
  });
};

window.logout = function() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
};

// Helper function to handle fetch responses
function handleResponse(res) {
  if (!res.ok) {
    return res.json().then(err => { throw err; });
  }
  return res.json();
}

// Token validation and redirection
function checkAuthState() {
  const token = localStorage.getItem('token');
  const currentPage = window.location.pathname.split('/').pop();
  
  if (!token) {
    if (currentPage !== 'index.html') {
      window.location.href = 'index.html';
    }
    return;
  }


  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000; // Convert to seconds
    
    // Check token expiration
    if (payload.exp < now) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }

    // Prevent redirection loops
    if (payload.role === 'consumer' && currentPage !== 'consumerUser.html') {
      window.location.href = 'consumerUser.html';
    } else if (payload.role === 'creator' && currentPage !== 'creatorUser.html') {
      window.location.href = 'creatorUser.html';
    } else if (!['consumerUser.html', 'creatorUser.html'].includes(currentPage)) {
      // Default redirect for authenticated users
      window.location.href = payload.role === 'consumer' ? 'consumerUser.html' : 'creatorUser.html';
    }
  } catch (e) {
    localStorage.removeItem('token');
    if (currentPage !== 'index.html') {
      window.location.href = 'index.html';
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Set up event listeners
  if (document.getElementById('signUpBtn')) {
    document.getElementById('signUpBtn').addEventListener('click', signUp);
  }
  if (document.getElementById('loginBtn')) {
    document.getElementById('loginBtn').addEventListener('click', login);
  }
  if (document.getElementById('showLoginBtn')) {
    document.getElementById('showLoginBtn').addEventListener('click', showLogin);
  }
  if (document.getElementById('showSignUpBtn')) {
    document.getElementById('showSignUpBtn').addEventListener('click', showSignUp);
  }

  // Check auth state
  checkAuthState();
});