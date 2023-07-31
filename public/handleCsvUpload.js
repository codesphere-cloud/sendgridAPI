// Get the necessary elements
const dragDropArea = document.getElementById('drag-drop-area');
const selectedFile = document.getElementById('selected-file');
const fileInput = document.getElementById('contacts-upload');

// Handle drag and drop events
dragDropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  dragDropArea.classList.add('border-blue-500');
});

dragDropArea.addEventListener('dragleave', () => {
  dragDropArea.classList.remove('border-blue-500');
});

dragDropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDropArea.classList.remove('border-blue-500');
  const file = e.dataTransfer.files[0];
  displaySelectedFile(file);
});

// Handle file input change event
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  displaySelectedFile(file);
});

// Display the selected file name
function displaySelectedFile(file) {
  if (file) {
    selectedFile.innerText = file.name;
  } else {
    selectedFile.innerText = 'Upload a file';
  }
}

// Handle form submit event
const form = document.getElementById('dbForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (file) {
    uploadFile(file);
  } else {
    alert('Please select a file.');
  }
});

// Upload the file
function uploadFile(file) {
  // Check if the file is a CSV
  if (file.type !== 'text/csv') {
    alert('Please select a CSV file.');
    return;
  }

  const formData = new FormData();
  formData.append('contacts-upload', file);

  // Make a POST request to the server/upload endpoint
  fetch('/upload', {
    method: 'POST',
    body: formData
  })
    .then(response => {
      if (response.ok) {
        // File uploaded successfully
        // Perform any additional actions if needed
        console.log('File uploaded successfully.');
      } else {
        // Error uploading file
        console.log("formData",formData);
        console.error('Failed to upload file.');
      }
    })
    .catch(error => {
      console.error('An error occurred while uploading the file:', error);
    });
}


// Debugging logs
console.log('JavaScript file loaded successfully.');
console.log('dragDropArea:', dragDropArea);
console.log('selectedFile:', selectedFile);
console.log('fileInput:', fileInput);
console.log('form:', form);
