document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Function to make all input fields focusable
    // function makeInputsFocusable() {
    //     const inputs = document.querySelectorAll('input');
    //     inputs.forEach(input => {
    //         input.addEventListener('click', function(e) {
    //             this.blur();
    //             setTimeout(() => this.focus(), 0);
    //         });
    //     });
    // }

    // // Call this function when the page loads
    // makeInputsFocusable();

    // Function to reset focus and make inputs focusable again
    // function resetFocusAndInputs() {
    //     if (document.activeElement instanceof HTMLInputElement) {
    //         document.activeElement.blur();
    //     }
    //     makeInputsFocusable();
    // }

    // Add this event listener to handle focus issues
    // window.addEventListener('focus', resetFocusAndInputs);

    function displayCautionMessage(message, isVisible) {
        const cautionMessage = document.getElementById('cautionMessage');
        if (isVisible) {
            cautionMessage.innerText = message;
            cautionMessage.style.display = 'block'; // Show the message
        } else {
            cautionMessage.style.display = 'none'; // Hide the message
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    window.location.href = '/';  // Redirect to main page on successful login
                    displayCautionMessage('', false);
                } else {
                    const data = await response.json();
                    displayCautionMessage(data.error || 'Login failed', true);
                }
            } catch (error) {
                console.error('Login error:', error);
                displayCautionMessage('An error occurred during login', true);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            if (password !== confirmPassword) {
                displayCautionMessaget("Passwords don't match", true);
                return;
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    displayCautionMessage('Registration successful. Please log in.', true);
                    window.location.href = '/login';  // Redirect to login page
                } else {
                    const data = await response.json();
                    displayCautionMessage(data.error || 'Registration failed', true);
                }
            } catch (error) {
                console.error('Registration error:', error);
                displayCautionMessage('An error occurred during registration', true);
            }
        });
    }
});