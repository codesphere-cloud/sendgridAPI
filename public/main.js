

document.getElementById("emailForm").addEventListener("submit", function (event) {
    event.preventDefault();
    console.log("submit logged");

    // const listId = document.getElementById('list-id').value
    const templateId = document.getElementById('template-id').value

    const formData = {
        // listId: listId,
        templateId: templateId
    }

    document.getElementById('spinner').style.display = 'block';

    fetch('/contacts', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
        .then(response => {
            document.getElementById('spinner').style.display = 'none';

            if (response.ok) {
                window.location.href = "/success.html";
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const errorMessageElement = document.getElementById('error-message');
            errorMessageElement.innerText = 'Sending failed: ' + error.message;
            errorMessageElement.style.display = 'block';

            document.getElementById('spinner').style.display = 'none';
        });
})
