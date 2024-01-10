function validateForm() {
    // Get form elements
    var firstName = document.getElementById('first-name').value;
    var lastName = document.getElementById('last-name').value;
    var email = document.getElementById('email').value;
    var issueDescription = document.getElementById('issue-description').value;

    // Check if all fields are filled
    if (firstName && lastName && email && issueDescription) {
        // Display a simple alert notifying the user
        alert('Form submitted successfully!');
        // You can also submit the form to the server if needed
        // document.getElementById('contactForm').submit();
    } else {
        alert('Please fill in all the fields.');
    }
}
