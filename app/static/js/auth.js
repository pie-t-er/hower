const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

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
                    credentials: 'include', // Include this to send and receive cookies
                    body: JSON.stringify({ username, password }),
                });
    
                if (response.ok) {
                    // Notify the main process that login was successful
                    ipcRenderer.send('login-success');
    
                    // Redirect to main page on successful login
                    window.location.href = '/';  
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
                displayCautionMessage("Passwords don't match", true);
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