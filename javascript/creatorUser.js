console.log("creator.js loaded");
const creatorBackend = "https://scalablesoftwarephotoapp-cbcmh4hcemhsg2bh.francecentral-01.azurewebsites.net";

document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
const username = getUsernameFromToken(token);
document.getElementById('user').textContent = `Instagram - ${username}`;
  loadUploadedPhotos();
  document.getElementById("uploadBtn").addEventListener("click", uploadPhoto);

});


function getUsernameFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username || "Creator";
  } catch (e) {
    console.error("Failed to decode token", e);
    return "Consumer";
  }
}
function uploadPhoto() {
  const file = document.getElementById("photoFile").files[0];
  const title = document.getElementById("photoTitle").value;
  const caption = document.getElementById("photoCaption").value;
  const location = document.getElementById("photoLocation").value;
  const token = localStorage.getItem('token');

  if (!file || !title) {
    alert("Please select a file and provide a title");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("caption", caption);
  formData.append("location", location);

  fetch(`${creatorBackend}/add-media`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => { throw err; });
    }
    return res.json();
  })
  .then(data => {
    alert("Photo uploaded successfully!");
    // Clear form and refresh
    document.getElementById("photoFile").value = "";
    document.getElementById("photoTitle").value = "";
    document.getElementById("photoCaption").value = "";
    document.getElementById("photoLocation").value = "";
    loadUploadedPhotos();
  })
  .catch(err => {
    alert(err.error || "Error uploading photo");
  });
}

function loadUploadedPhotos() {
  const token = localStorage.getItem('token');
  
  fetch(`${creatorBackend}/media-items`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("uploadedPhotos");
    container.innerHTML = "";
    
    if (data.length === 0) {
      container.innerHTML = "<p>You haven't uploaded any photos yet.</p>";
      return;
    }
    
    data.forEach(photo => {
      const card = document.createElement("div");
      card.className = "photo-card";
      card.innerHTML = `
        <img src="${photo.blob_url}" alt="${photo.title}"/>
        <div class="photo-info">
          <h3>${photo.title}</h3>
          <p class="photo-meta">${photo.caption}</p>
          <p class="photo-meta"><small>${photo.location || 'Location not specified'}</small></p>
        </div>
      `;
      container.appendChild(card);
    });
  })
  .catch(err => {
    console.error("Error loading uploaded photos:", err);
  });
}