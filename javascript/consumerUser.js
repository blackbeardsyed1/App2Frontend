console.log("consumer.js loaded");
const consumerBackend = "https://scalablesoftwarephotoapp-cbcmh4hcemhsg2bh.francecentral-01.azurewebsites.net";
let selectedPhoto = null;
let currentRating = 0;

document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
const username = getUsernameFromToken(token);
document.getElementById('user').textContent = `📸 Welcome, ${username}`;

  
  setupStarRating();
  loadPhotos();
  
  // Setup search functionality
  document.getElementById('searchBtn')?.addEventListener('click', searchPhotos);
  document.getElementById('submitCommentBtn')?.addEventListener('click', submitComment);
  document.getElementById('submitRatingBtn')?.addEventListener('click', submitRating);

});



function getUsernameFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username || "Consumer";
  } catch (e) {
    console.error("Failed to decode token", e);
    return "Consumer";
  }
}


function setupStarRating() {
  const stars = document.querySelectorAll('.star-rating .star');
  stars.forEach(star => {
    star.addEventListener('click', function() {
      const value = parseInt(this.getAttribute('data-value'));
      currentRating = value;
      
      stars.forEach((s, index) => {
        if (index < value) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });
  });
}

async function loadPhotos() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${consumerBackend}/media-items`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch photos');
    }

    const data = await response.json();
    displayPhotos(data);
  } catch (err) {
    console.error("Error loading photos:", err);
    alert("Failed to load photos. Please try again.");
  }
}

function displayPhotos(photos) {
  const container = document.getElementById("photos");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (!photos || photos.length === 0) {
    container.innerHTML = "<p>No photos found. Check back later!</p>";
    return;
  }
  
  photos.forEach(photo => {
    const card = document.createElement("div");
    card.className = "photo-card";
    card.innerHTML = `
      <img src="${photo.blob_url}" alt="${photo.title}" loading="lazy"/>
      <div class="photo-info">
        <h3>${photo.title}</h3>
        <p class="photo-meta">${photo.caption || ''}</p>
        <p class="photo-meta"><small>${photo.location || 'Location not specified'}</small></p>
        <div class="photo-actions">
          <button class="btn view-details-btn">View Details</button>
        </div>
      </div>
    `;
    container.appendChild(card);
    
    // Add event listener to the button we just created
    card.querySelector('.view-details-btn').addEventListener('click', () => {
      viewPhotoDetails(photo.title, photo.blob_url, photo.caption, photo.location);
    });
  });
}

function viewPhotoDetails(title, imageUrl, caption, location) {
  selectedPhoto = title;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalImage').src = imageUrl;
  document.getElementById('modalCaption').textContent = caption || '';
  document.getElementById('modalLocation').textContent = location ? `Location: ${location}` : '';
  
  // Load comments for this photo
  loadComments(title);
  
  // Show modal
  document.getElementById('photoModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('photoModal').style.display = 'none';
  currentRating = 0;
  // Reset stars
  document.querySelectorAll('.star-rating .star').forEach(star => {
    star.classList.remove('active');
  });
}

async function loadComments(photoTitle) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${consumerBackend}/media-items/${encodeURIComponent(photoTitle)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to load comments');
      }
  
      const data = await response.json();
      displayComments(data.comments);
      
      // OPTIONAL: if you want to handle ratings as well
      document.getElementById('photoAverageRating').innerText = `Average Rating: ${data.average_rating ? data.average_rating.toFixed(1) : "No ratings yet"}`;
    } catch (err) {
      console.error("Error loading comments:", err);
      document.getElementById('commentsList').innerHTML = "<p>Error loading comments</p>";
    }
  }

function displayComments(comments) {
  const container = document.getElementById('commentsList');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!comments || comments.length === 0) {
    container.innerHTML = "<p>No comments yet. Be the first to comment!</p>";
    return;
  }
  
  comments.forEach(comment => {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.innerHTML = `
      <div class="comment-user">${comment.username || 'Anonymous'}</div>
      <div class="comment-text">${comment.text}</div>
      <small>${new Date(comment.timestamp).toLocaleString()}</small>
    `;
    container.appendChild(commentDiv);
  });
}

async function submitComment() {
  const commentText = document.getElementById('commentText').value;
  const token = localStorage.getItem('token');
  
  if (!commentText) {
    alert("Please enter a comment");
    return;
  }
  
  try {
    const response = await fetch(`${consumerBackend}/media-items/${encodeURIComponent(selectedPhoto)}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text: commentText })
    });

    if (!response.ok) {
      throw new Error('Failed to post comment');
    }

    document.getElementById('commentText').value = '';
    loadComments(selectedPhoto);
    alert("Comment posted successfully");
  } catch (err) {
    console.error("Error posting comment:", err);
    alert("Error posting comment: " + err.message);
  }
}

async function submitRating() {
  const token = localStorage.getItem('token');
  
  if (currentRating === 0) {
    alert("Please select a rating");
    return;
  }
  
  try {
    const response = await fetch(`${consumerBackend}/media-items/${encodeURIComponent(selectedPhoto)}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rating: currentRating })
    });

    if (!response.ok) {
      throw new Error('Failed to submit rating');
    }

    alert("Rating submitted successfully");
  } catch (err) {
    console.error("Error submitting rating:", err);
    alert("Error submitting rating: " + err.message);
  }
}

async function searchPhotos() {
  const query = document.getElementById('searchInput').value;
  const token = localStorage.getItem('token');
  
  if (!query) {
    loadPhotos();
    return;
  }
  
  try {
    const response = await fetch(`${consumerBackend}/media-items/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to search photos');
    }

    const results = await response.json();
    displayPhotos(results);
  } catch (err) {
    console.error("Error searching photos:", err);
    alert("Error searching photos");
  }
}

// Make these functions available globally
window.viewPhotoDetails = viewPhotoDetails;
window.closeModal = closeModal;
window.submitComment = submitComment;
window.submitRating = submitRating;
window.searchPhotos = searchPhotos;