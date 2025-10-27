// OTP Management
let generatedOTP = null;
let otpTimestamp = null;
let otpExpiryMinutes = 5;
let isEmailVerified = false;
let countdownInterval = null;

// Sanitize filename to remove spaces and special characters
function sanitizeFileName(filename) {
    // Get file extension
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
    const extension = lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';

    // Sanitize the name: remove/replace special characters and spaces
    const sanitizedName = name
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/[^\w\-]/g, '')        // Remove all non-alphanumeric characters except hyphens
        .replace(/\-+/g, '-')           // Replace multiple hyphens with single hyphen
        .replace(/^\-+|\-+$/g, '');     // Remove leading/trailing hyphens

    return sanitizedName + extension.toLowerCase();
}

// Check if email already exists in Firestore
async function checkEmailExists(email) {
    try {
        const querySnapshot = await db.collection('users')
            .where('email', '==', email.toLowerCase().trim())
            .get();

        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking email existence:', error);
        throw error;
    }
}

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via Email
async function sendOTP() {
    const emailInput = document.getElementById('email');
    const emailValue = emailInput.value.trim();
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const otpGroup = document.getElementById('otpGroup');

    // Validate email
    if (!emailValue || !emailInput.validity.valid) {
        showErrorMessage('Please enter a valid email address');
        return;
    }

    // Disable button and show loading
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Checking...';

    try {
        // Check if email already exists in database
        const emailExists = await checkEmailExists(emailValue);
        
        if (emailExists) {
            showErrorMessage('This email is already registered. Please use a different email address.');
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = 'Send OTP';
            return;
        }

        // Continue with OTP sending
        sendOtpBtn.textContent = 'Sending...';
    } catch (error) {
        console.error('Error checking email:', error);
        showErrorMessage('Unable to verify email. Please try again.');
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';
        return;
    }

    try {
        // Generate new OTP
        generatedOTP = generateOTP();
        otpTimestamp = Date.now();
        isEmailVerified = false;

        const userName = document.getElementById('name').value || 'User';

        // Create email HTML template
        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #c51f84 0%, #e73b9f 100%); padding: 30px; text-align: center; color: white; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .content { padding: 40px 30px; }
                    .otp-box { background: #f8f9fa; border: 2px dashed #c51f84; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
                    .otp-code { font-size: 36px; font-weight: bold; color: #c51f84; letter-spacing: 8px; font-family: 'Courier New', monospace; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Email Verification</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">UEF Trade Summit 2025</p>
                    </div>
                    <div class="content">
                        <p>Hello <strong>${userName}</strong>,</p>
                        <p>Thank you for registering for the UEF Trade Summit 2025! Please use the following One-Time Password (OTP) to verify your email address:</p>

                        <div class="otp-box">
                            <div style="font-size: 14px; color: #6c757d; margin-bottom: 10px;">Your OTP Code</div>
                            <div class="otp-code">${generatedOTP}</div>
                        </div>

                        <div class="warning">
                            ⏰ <strong>Important:</strong> This OTP will expire in 5 minutes. Do not share this code with anyone.
                        </div>

                        <p>If you didn't request this OTP, please ignore this email.</p>

                        <p style="margin-top: 30px;">
                            Best regards,<br>
                            <strong>United Economic Forum Team</strong>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 United Economic Forum. All rights reserved.</p>
                        <p>Buhari Building, Ground Floor #4, Moores Road, Chennai - 600 006</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send email using Firebase Trigger Email Extension
        await db.collection('mail').add({
            to: emailValue,
            from: 'UEF Trade Summit <edgeup.1014@gmail.com>',
            message: {
                subject: 'UEF Trade Summit 2025 - Email Verification OTP',
                text: `Hello ${userName},\n\nYour OTP code is: ${generatedOTP}\n\nThis code will expire in 5 minutes.\n\nBest regards,\nUEF Trade Summit Team`,
                html: emailHTML
            }
        });

        console.log('OTP email sent successfully via Firebase');

        // Show OTP input field
        otpGroup.style.display = 'block';

        // Start countdown timer
        startOTPTimer();

        // Show success message
        showSuccessMessage('OTP sent to your email!');

        // Clear any previous verification status
        document.getElementById('verificationStatus').innerHTML = '';
        document.getElementById('otpInput').value = '';

    } catch (error) {
        console.error('Error sending OTP:', error);
        showErrorMessage('Failed to send OTP. Please try again.');
        generatedOTP = null;
        otpTimestamp = null;
    } finally {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Resend OTP';
    }
}

// Start OTP countdown timer
function startOTPTimer() {
    const timerElement = document.getElementById('otpTimer');
    const resendBtn = document.getElementById('resendOtpBtn');
    const sendOtpBtn = document.getElementById('sendOtpBtn');

    // Clear any existing interval
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    let timeLeft = 60; // 60 seconds countdown

    // Hide resend button, show timer
    resendBtn.style.display = 'none';
    timerElement.style.display = 'block';
    sendOtpBtn.disabled = true;

    countdownInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Resend OTP in ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            timerElement.style.display = 'none';
            resendBtn.style.display = 'block';
            sendOtpBtn.disabled = false;
        }
    }, 1000);
}

// Success message function (Global)
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert-message success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-family: 'Poppins', sans-serif;
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 4000);
}

// Error message function (Global)
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert-message error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-family: 'Poppins', sans-serif;
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 4000);
}

// Verify OTP
function verifyOTP() {
    const otpInput = document.getElementById('otpInput').value.trim();
    const verificationStatus = document.getElementById('verificationStatus');
    const verifyBtn = document.getElementById('verifyOtpBtn');

    // Validate OTP input BEFORE disabling button
    if (!otpInput || otpInput.length !== 6) {
        showErrorMessage('Please enter a 6-digit OTP');
        verificationStatus.innerHTML = '✗';
        verificationStatus.style.color = '#f44336';
        return;
    }

    // Check if OTP exists
    if (!generatedOTP || !otpTimestamp) {
        showErrorMessage('Please request an OTP first');
        verificationStatus.innerHTML = '✗';
        verificationStatus.style.color = '#f44336';
        return;
    }

    // Check if OTP has expired (5 minutes)
    const currentTime = Date.now();
    const timeElapsed = (currentTime - otpTimestamp) / 1000 / 60; // in minutes

    if (timeElapsed > otpExpiryMinutes) {
        showErrorMessage('OTP has expired. Please request a new one.');
        generatedOTP = null;
        otpTimestamp = null;
        verificationStatus.innerHTML = '✗';
        verificationStatus.style.color = '#f44336';
        return;
    }

    // All validation passed - NOW disable button
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

    setTimeout(() => {
        if (otpInput === generatedOTP) {
            // OTP is correct
            isEmailVerified = true;
            verificationStatus.innerHTML = '✓';
            verificationStatus.style.color = '#4caf50';
            showSuccessMessage('Email verified successfully!');

            // Disable OTP input and verify button
            document.getElementById('otpInput').disabled = true;
            verifyBtn.disabled = true;
            verifyBtn.textContent = 'Verified';
            verifyBtn.style.background = '#4caf50';

            // Disable email input and send OTP button
            document.getElementById('email').disabled = true;
            document.getElementById('sendOtpBtn').disabled = true;

            // Clear timer
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
            document.getElementById('otpTimer').style.display = 'none';
            document.getElementById('resendOtpBtn').style.display = 'none';

        } else {
            // OTP is incorrect - ALWAYS reset button state
            isEmailVerified = false;
            verificationStatus.innerHTML = '✗';
            verificationStatus.style.color = '#f44336';
            showErrorMessage('Invalid OTP. Please try again.');

            // Reset button to allow retry
            verifyBtn.disabled = false;
            verifyBtn.textContent = 'Verify';
        }
    }, 500); // Small delay for better UX
}

// Scroll Animation Setup
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.05  // Reduced from 0.15 to trigger earlier
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.add('scroll-section');
        observer.observe(section);
    });

    // Observe cards and items - no delay, all appear at once
    const cards = document.querySelectorAll('.objective-card, .gallery-item, .contact-item, .about-content, .board-member, .sponsor-card');
    cards.forEach((card) => {
        card.classList.add('scroll-item');
        observer.observe(card);
    });
}

// Parallax Effect for Backgrounds
function initParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        parallaxElements.forEach(el => {
            const speed = el.dataset.parallax || 0.5;
            el.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize scroll animations
    initScrollAnimations();
    initParallax();

    // Get the register button
    const registerBtn = document.getElementById('registerBtn');

    // Add click event listener
    registerBtn.addEventListener('click', function() {
        openRegistrationModal();
    });

    // Handle occupation select change for "Other" option
    const occupationSelect = document.getElementById('occupation');
    const customOccupationGroup = document.getElementById('customOccupationGroup');
    const customOccupationInput = document.getElementById('customOccupation');

    occupationSelect.addEventListener('change', function() {
        if (this.value === 'other') {
            customOccupationGroup.style.display = 'block';
            customOccupationInput.required = true;
        } else {
            customOccupationGroup.style.display = 'none';
            customOccupationInput.required = false;
            customOccupationInput.value = ''; // Clear the field when hidden
        }
    });

    // Handle nationality select change for State field (India only)
    const nationalitySelect = document.getElementById('nationality');
    const stateGroup = document.getElementById('stateGroup');
    const stateSelect = document.getElementById('state');

    nationalitySelect.addEventListener('change', function() {
        if (this.value === 'India') {
            stateGroup.style.display = 'block';
            // Add smooth transition class
            setTimeout(() => {
                stateGroup.classList.add('show');
            }, 10);
            stateSelect.required = true;
        } else {
            stateGroup.classList.remove('show');
            // Wait for transition to complete before hiding
            setTimeout(() => {
                if (!stateGroup.classList.contains('show')) {
                    stateGroup.style.display = 'none';
                }
            }, 400);
            stateSelect.required = false;
            stateSelect.value = ''; // Clear the field when hidden
        }
    });
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const headerOffset = 80; // Height of fixed header
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add scroll effect to header
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
        }
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    
    mobileMenuToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        mobileNav.classList.toggle('active');
    });
    
    // Add skill on Enter key press
    document.getElementById('skillInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    });
    
    // File input handling
    document.getElementById('profilePic').addEventListener('change', function(e) {
        const fileName = e.target.files[0]?.name || 'No file chosen';
        const fileNameElement = document.querySelector('.file-name');
        fileNameElement.textContent = fileName;
    });

    // Payment screenshot file input handling
    document.getElementById('paymentScreenshot').addEventListener('change', function(e) {
        const fileName = e.target.files[0]?.name || 'No file chosen';
        const fileNameElement = document.querySelector('.payment-file-name');
        fileNameElement.textContent = fileName;
    });
    
    // Form submission handling
    document.getElementById('registrationForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        // Show loading state
        const submitBtn = document.querySelector('.submit-btn');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        try {
            // Check if email is verified
            if (!isEmailVerified) {
                showErrorMessage('Please verify your email address before submitting');
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            // Double-check email doesn't exist (safety check)
            const emailValue = document.getElementById('email').value.trim().toLowerCase();
            const emailExists = await checkEmailExists(emailValue);

            if (emailExists) {
                showErrorMessage('This email is already registered. Registration cannot be completed.');
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
                return;
            }

            // Generate a secure random password for the user
            const generateSecurePassword = () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                let password = '';
                for (let i = 0; i < 16; i++) {
                    password += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return password;
            };

            const userPassword = generateSecurePassword();
            const userEmail = document.getElementById('email').value.trim().toLowerCase(); // Convert to lowercase for consistency

            // Create user in Firebase Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(userEmail, userPassword);
            const userId = userCredential.user.uid;

            console.log('User created in Firebase Auth with UID:', userId);

            // Generate epoch-based document ID
            const epochDocId = `user_${Date.now()}`;
            console.log('Generated document ID:', epochDocId);

            // Collect form data
            const occupationSelect = document.getElementById('occupation');
            const occupationValue = occupationSelect.value === 'other'
                ? document.getElementById('customOccupation').value.trim()
                : occupationSelect.value;

            const formData = {
                uid: epochDocId, // Use the epoch-based document ID instead of Firebase Auth UID
                authUid: userId, // Optional: Keep Firebase Auth UID for reference
                name: document.getElementById('name').value,
                email: userEmail, // userEmail is already lowercase from line 494
                emailVerified: isEmailVerified,
                dob: document.getElementById('dob').value,
                age: parseInt(document.getElementById('age').value),
                gender: document.getElementById('gender').value,
                nationality: document.getElementById('nationality').value,
                state: document.getElementById('nationality').value === 'India' 
                    ? document.getElementById('state').value 
                    : null,
                occupation: occupationValue,
                skills: skills,
                success: document.getElementById('success').value,
                meetPeople: document.getElementById('meetPeople').value,
                strengths: document.getElementById('strengths').value,
                weaknesses: document.getElementById('weaknesses').value,
                hobby: document.getElementById('hobby').value,
                registrationDate: firebase.firestore.FieldValue.serverTimestamp(),
                approvalStatus: 'pending',
            };

            // Handle profile picture upload
            const profilePicFile = document.getElementById('profilePic').files[0];
            if (profilePicFile) {
                // Create a unique filename with sanitization
                const sanitizedName = sanitizeFileName(profilePicFile.name);
                const filename = `profile-pictures/${Date.now()}_${sanitizedName}`;

                // Upload to Firebase Storage
                const storageRef = storage.ref(filename);
                const uploadTask = await storageRef.put(profilePicFile);

                // Get download URL
                const downloadURL = await uploadTask.ref.getDownloadURL();
                formData.profilePicUrl = downloadURL;
            } else {
                formData.profilePicUrl = null;
            }

            // Handle payment screenshot upload
            const paymentScreenshotFile = document.getElementById('paymentScreenshot').files[0];
            if (paymentScreenshotFile) {
                // Create a unique filename with sanitization
                const sanitizedName = sanitizeFileName(paymentScreenshotFile.name);
                const filename = `payment-screenshots/${Date.now()}_${sanitizedName}`;

                // Upload to Firebase Storage
                const storageRef = storage.ref(filename);
                const uploadTask = await storageRef.put(paymentScreenshotFile);

                // Get download URL
                const downloadURL = await uploadTask.ref.getDownloadURL();
                formData.paymentScreenshotUrl = downloadURL;
            } else {
                formData.paymentScreenshotUrl = null;
            }

            // Save to users collection with epoch-based document ID
            await db.collection('users').doc(epochDocId).set(formData);

            console.log('Registration saved with ID:', epochDocId);

            // Show success message
            showSuccessMessage('Registration submitted successfully!');

            // Reset form and close modal
            this.reset();
            skills = [];
            renderSkills();
            document.querySelector('.file-name').textContent = 'No file chosen';
            document.querySelector('.payment-file-name').textContent = 'No file chosen';

            // Reset custom occupation field
            document.getElementById('customOccupationGroup').style.display = 'none';
            document.getElementById('customOccupation').required = false;
            document.getElementById('customOccupation').value = '';

            // Reset state field
            document.getElementById('stateGroup').classList.remove('show');
            document.getElementById('stateGroup').style.display = 'none';
            document.getElementById('state').required = false;
            document.getElementById('state').value = '';

            // Reset email verification state
            isEmailVerified = false;
            generatedOTP = null;
            otpTimestamp = null;
            document.getElementById('email').disabled = false;
            document.getElementById('sendOtpBtn').disabled = false;
            document.getElementById('sendOtpBtn').textContent = 'Send OTP';
            document.getElementById('otpGroup').style.display = 'none';
            document.getElementById('otpInput').disabled = false;
            document.getElementById('otpInput').value = '';
            document.getElementById('verifyOtpBtn').disabled = false;
            document.getElementById('verifyOtpBtn').textContent = 'Verify';
            document.getElementById('verifyOtpBtn').style.background = '#4caf50';
            document.getElementById('verificationStatus').innerHTML = '';
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }

            // Close modal after 2 seconds
            setTimeout(() => {
                closeRegistrationModal();
            }, 2000);

        } catch (error) {
            console.error('Error submitting registration:', error);
            showErrorMessage('Error submitting registration. Please try again.');
        } finally {
            // Reset button state
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});

// Modal functionality
function openModal(imageSrc, caption) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    modal.style.display = 'block';
    modalImg.src = imageSrc;
    modalCaption.textContent = caption;
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    
    // Restore body scroll
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside the image
window.addEventListener('click', function(event) {
    const modal = document.getElementById('imageModal');
    if (event.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
        closeRegistrationModal();
    }
});

// Registration Modal Functions
function openRegistrationModal() {
    const modal = document.getElementById('registrationModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeRegistrationModal() {
    const modal = document.getElementById('registrationModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';

    // Reset email verification state when modal is closed
    isEmailVerified = false;
    generatedOTP = null;
    otpTimestamp = null;
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    // Reset custom occupation field
    const customOccupationGroup = document.getElementById('customOccupationGroup');
    const customOccupationInput = document.getElementById('customOccupation');
    if (customOccupationGroup) {
        customOccupationGroup.style.display = 'none';
        customOccupationInput.required = false;
        customOccupationInput.value = '';
    }

    // Reset state field
    const stateGroup = document.getElementById('stateGroup');
    const stateSelect = document.getElementById('state');
    if (stateGroup) {
        stateGroup.classList.remove('show');
        stateGroup.style.display = 'none';
        stateSelect.required = false;
        stateSelect.value = '';
    }

    // Reset email verification UI
    const emailInput = document.getElementById('email');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const otpGroup = document.getElementById('otpGroup');
    const otpInput = document.getElementById('otpInput');
    const verifyBtn = document.getElementById('verifyOtpBtn');

    if (emailInput) emailInput.disabled = false;
    if (sendOtpBtn) {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';
    }
    if (otpGroup) otpGroup.style.display = 'none';
    if (otpInput) {
        otpInput.disabled = false;
        otpInput.value = '';
    }
    if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify';
        verifyBtn.style.background = '#4caf50';
    }

    const verificationStatus = document.getElementById('verificationStatus');
    if (verificationStatus) verificationStatus.innerHTML = '';

    const otpTimer = document.getElementById('otpTimer');
    if (otpTimer) otpTimer.style.display = 'none';

    const resendBtn = document.getElementById('resendOtpBtn');
    if (resendBtn) resendBtn.style.display = 'none';
}

// Skills functionality
let skills = [];

function addSkill() {
    const skillInput = document.getElementById('skillInput');
    const skillValue = skillInput.value.trim();
    
    if (skillValue && !skills.includes(skillValue)) {
        skills.push(skillValue);
        renderSkills();
        skillInput.value = '';
    }
}

function removeSkill(skill) {
    skills = skills.filter(s => s !== skill);
    renderSkills();
}

function renderSkills() {
    const skillsList = document.getElementById('skillsList');
    skillsList.innerHTML = skills.map(skill =>
        `<div class="skill-tag">
            <span>${skill}</span>
            <button type="button" onclick="removeSkill('${skill}')">&times;</button>
        </div>`
    ).join('');
}

// Close registration modal when clicking outside
window.addEventListener('click', function(event) {
    const registrationModal = document.getElementById('registrationModal');
    if (event.target === registrationModal) {
        closeRegistrationModal();
    }
});

// Close mobile menu function
function closeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');
    mobileMenuToggle.classList.remove('active');
    mobileNav.classList.remove('active');
}