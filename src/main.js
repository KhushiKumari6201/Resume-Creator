// Main Application Logic for AI Resume & Portfolio Builder

const app = {
    currentStep: 1,
    totalSteps: 4,
    userData: {
        fullname: '',
        jobtitle: '',
        about: '',
        email: '',
        phone: '',
        education: [],
        skills: [],
        experience: [],
        projects: [],
        template: 'modern'
    },
    resumes: [], // Caching: all saved resumes
    currentPage: 1,
    itemsPerPage: 3, 
    searchTerm: '',
    filterTemplate: 'all',

    auth: {
        isLoggedIn: false,
        currentUser: null,

        login() {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            
            if (!this.validateEmail(email)) {
                alert('🚨 Invalid Email: Please include "@" and a domain.');
                return;
            }

            if (pass.length < 6) {
                alert('🚨 Security Error: Password must be at least 6 characters.');
                return;
            }

            if (email && pass) {
                this.isLoggedIn = true;
                const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
                this.currentUser = { email, name: email.split('@')[0], role };
                localStorage.setItem('aigraft_session', JSON.stringify(this.currentUser));
                app.onAuthSuccess();
            }
        },

        signup() {
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const pass = document.getElementById('signup-password').value;

            if (!name) {
                alert('🚨 Name Required: Tell us who you are!');
                return;
            }

            if (!this.validateEmail(email)) {
                alert('🚨 Invalid Email format.');
                return;
            }

            if (pass.length < 6) {
                alert('🚨 Security Error: Password must be 6+ characters.');
                return;
            }

            if (name && email && pass) {
                alert('Account created successfully! Welcome to AIGraft.');
                this.login();
            }
        },

        resetPassword() {
            const email = document.getElementById('forgot-email').value;
            if (!this.validateEmail(email)) {
                alert('🚨 Please enter a valid email to receive the reset link.');
                return;
            }
            alert(`A password reset link has been sent to ${email}.`);
            this.toggleForm('login');
        },

        validateEmail(email) {
            return String(email)
                .toLowerCase()
                .match(
                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                );
        },

        toggleForm(id) {
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById(`${id}-form`).classList.add('active');
        },

        checkSession() {
            const session = localStorage.getItem('aigraft_session');
            if (session) {
                this.currentUser = JSON.parse(session);
                this.isLoggedIn = true;
                app.onAuthSuccess();
            }
        },

        logout() {
            localStorage.removeItem('aigraft_session');
            window.location.reload();
        }
    },

    admin: {
        openDashboard() {
            alert("Admin Management Dashboard initialized. All user data is secured.");
            document.getElementById('admin-stats').scrollIntoView({ behavior: 'smooth' });
        },
        clearAllData() {
            if (confirm("🚨 DANGER: This will factory reset the application for all users! Are you sure?")) {
                localStorage.clear();
                alert("Data purged. Reloading app...");
                window.location.reload();
            }
        }
    },

    // Initialization
    init() {
        this.setupEventListeners();
        this.auth.checkSession();
        this.loadResumes(); 
        this.checkTheme();
        this.setupScrollAnimations();
        console.log('✨ AIGraft initialized');
    },

    loadResumes() {
        const saved = localStorage.getItem('aigraft_resumes');
        if (saved) {
            this.resumes = JSON.parse(saved);
        }
    },

    saveResume() {
        const id = this.userData.id || Date.now().toString();
        const existingIdx = this.resumes.findIndex(r => r.id === id);
        
        const resumeData = { ...this.userData, id, updatedAt: new Date().toISOString() };
        
        if (existingIdx > -1) {
            this.resumes[existingIdx] = resumeData;
            alert('Resume updated successfully!');
        } else {
            this.resumes.unshift(resumeData);
            alert('New resume created and saved!');
        }
        
        localStorage.setItem('aigraft_resumes', JSON.stringify(this.resumes));
        this.showDashboard();
    },

    deleteResume(id) {
        if (confirm('Are you sure you want to delete this resume?')) {
            this.resumes = this.resumes.filter(r => r.id !== id);
            localStorage.setItem('aigraft_resumes', JSON.stringify(this.resumes));
            this.renderResumes();
        }
    },

    editResume(id) {
        const r = this.resumes.find(r => r.id === id);
        if (r) {
            this.userData = { ...r };
            // Update UI fields
            const fields = ['fullname', 'jobtitle', 'about', 'email', 'phone'];
            fields.forEach(f => {
                const el = document.getElementById(f);
                if (el) el.value = r[f];
            });
            document.getElementById('skills').value = r.skills.join(', ');
            
            // Map dynamic lists... (for simplicity, only first items in basic demo)
            this.currentStep = 1;
            this.updateStepUI();
            this.startFlow();
        }
    },

    showDashboard() {
        // Hide all major sections
        document.querySelectorAll('section, header').forEach(s => s.classList.add('hidden'));
        document.getElementById('dashboard-section').classList.remove('hidden');
        this.renderResumes();
    },

    renderResumes() {
        const list = document.getElementById('resume-list');
        const controls = document.getElementById('pagination-controls');
        if (!list) return;

        // Filtering Logic (Search + Filter)
        const filteredResumes = this.resumes.filter(r => {
            const matchesSearch = !this.searchTerm || 
                r.fullname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                r.skills.some(s => s.toLowerCase().includes(this.searchTerm.toLowerCase()));
            
            const matchesTemplate = this.filterTemplate === 'all' || r.template === this.filterTemplate;

            return matchesSearch && matchesTemplate;
        });

        // Pagination Logic on filtered list
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const pagedItems = filteredResumes.slice(start, start + this.itemsPerPage);

        list.innerHTML = pagedItems.map(r => `
            <div class="resume-card glass-card">
                <div class="r-thumb ${r.template}-thumb"></div>
                <div class="r-content">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start">
                        <h3>${r.fullname || 'Untitled'}</h3>
                        <span class="badge ${r.template}">${r.template}</span>
                    </div>
                    <p>${r.jobtitle || 'No Title'}</p>
                    <div class="r-skills-preview">
                        ${r.skills.slice(0, 3).map(s => `<span>#${s}</span>`).join(' ')}
                    </div>
                    <div class="r-meta">Updated: ${new Date(r.updatedAt).toLocaleDateString()}</div>
                </div>
                <div class="r-actions">
                    <button class="btn btn-secondary btn-small" onclick="app.editResume('${r.id}')">Edit</button>
                    <button class="btn btn-ghost btn-small" style="color:var(--red)" onclick="app.deleteResume('${r.id}')">Delete</button>
                </div>
            </div>
        `).join('') || `<div class="empty-state">No matching resumes found for "${this.searchTerm}".</div>`;

        // Render controls
        const totalPages = Math.ceil(filteredResumes.length / this.itemsPerPage);
        controls.innerHTML = totalPages > 1 ? `
            <button class="btn btn-ghost" ${this.currentPage === 1 ? 'disabled' : ''} onclick="app.prevPage()">Previous</button>
            <span>Page ${this.currentPage} of ${totalPages}</span>
            <button class="btn btn-ghost" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="app.nextPage()">Next</button>
        ` : '';
    },

    onSearchUpdate(val) {
        this.searchTerm = val;
        this.currentPage = 1;
        this.renderResumes();
    },

    onFilterUpdate(val) {
        this.filterTemplate = val;
        this.currentPage = 1;
        this.renderResumes();
    },

    toggleTheme() {
        const isLight = document.body.classList.toggle('light-mode');
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('aigraft_theme', isLight ? 'light' : 'dark');
    },

    checkTheme() {
        const saved = localStorage.getItem('aigraft_theme');
        if (saved === 'light') {
            document.body.classList.add('light-mode');
            const btn = document.getElementById('theme-toggle');
            if (btn) btn.textContent = '☀️';
        }
    },

    nextPage() { this.currentPage++; this.renderResumes(); },
    prevPage() { if (this.currentPage > 1) { this.currentPage--; this.renderResumes(); } },

    onAuthSuccess() {
        document.body.classList.remove('auth-locked');
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');

        // Check for Admin credentials
        if (this.auth.currentUser && this.auth.currentUser.role === 'admin') {
            document.getElementById('admin-btn')?.classList.remove('hidden');
            document.getElementById('admin-stats')?.classList.remove('hidden');
            console.log("🛡️ Admin access granted");
        }
    },

    setupEventListeners() {
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');

        nextBtn?.addEventListener('click', () => this.nextStep());
        prevBtn?.addEventListener('click', () => this.prevStep());

        // Template selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const template = e.currentTarget.getAttribute('data-template');
                this.userData.template = template;
                
                // Toggle active class
                document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Sync inputs
        const inputs = ['fullname', 'jobtitle', 'about', 'email', 'phone', 'skills'];
        inputs.forEach(id => {
            document.getElementById(id)?.addEventListener('input', (e) => {
                this.userData[id] = e.target.value;
                if (id === 'skills') {
                    this.userData.skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                }
            });
        });
    },

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.feature-card, .section-title, .section-badge').forEach(el => {
            el.classList.add('reveal-on-scroll');
            observer.observe(el);
        });
    },

    startFlow() {
        const hero = document.getElementById('landing-hero');
        const features = document.getElementById('features');
        const form = document.getElementById('form-container');
        
        hero.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(-20px)';

        if (features) {
            features.style.transition = 'opacity 0.6s ease';
            features.style.opacity = '0';
        }
        
        setTimeout(() => {
            hero.classList.add('hidden');
            if (features) features.classList.add('hidden');
            form.classList.remove('hidden');
            form.scrollIntoView({ behavior: 'smooth' });
        }, 600);
    },

    nextStep() {
        if (this.currentStep === 1) {
            if (!this.userData.fullname || !this.userData.email) {
                alert('🚨 Personal Details Missing: We need your name and email to proceed.');
                return;
            }
            if (!this.auth.validateEmail(this.userData.email)) {
                alert('🚨 Invalid Email in form.');
                return;
            }
        }

        if (this.currentStep < this.totalSteps) {
            this.captureDynamicLists();
            this.currentStep++;
            this.updateStepUI();
        } else {
            // Last step: Generate Resume
            this.captureDynamicLists();
            this.generateResume();
            this.showPreview();
        }
    },

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepUI();
        }
    },

    updateStepUI() {
        // Update steps visiblity
        document.querySelectorAll('.form-step').forEach((el, idx) => {
            el.classList.toggle('active', idx + 1 === this.currentStep);
        });

        // Update progress icons
        document.querySelectorAll('.step').forEach((el, idx) => {
            el.classList.toggle('active', idx + 1 === this.currentStep);
            el.classList.toggle('completed', idx + 1 < this.currentStep);
        });

        // Update Buttons
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        if (prevBtn) prevBtn.disabled = this.currentStep === 1;
        if (nextBtn) nextBtn.textContent = this.currentStep === this.totalSteps ? 'Generate Resume' : 'Next Step';
    },

    addItem(listId) {
        const listContainer = document.getElementById(listId);
        const placeholder = listId === 'education-list' ? 'Degree / University (e.g. BS in Design, MIT 2020)' : 'Details...';
        const newItem = document.createElement('div');
        newItem.className = 'list-item';
        
        if (listId === 'education-list') {
            newItem.innerHTML = `<input type="text" placeholder="${placeholder}">`;
        } else {
            newItem.innerHTML = `
                <div class="item-actions">
                    <button class="btn-ai-mini" onclick="app.polishItem(this)">✨ AI Polish</button>
                </div>
                <textarea placeholder="${placeholder}"></textarea>
            `;
        }
        
        listContainer.appendChild(newItem);
    },

    polishText(id) {
        const el = document.getElementById(id);
        if (!el || !el.value) return;
        
        const original = el.value;
        const polished = this.applyProfessionalStructure(original, 'profile');
        
        this.animateTextReplacement(el, polished);
    },

    polishItem(btn) {
        const textarea = btn.closest('.list-item').querySelector('textarea');
        if (!textarea || !textarea.value) return;
        
        const type = textarea.placeholder.includes('Project') ? 'project' : 'experience';
        const polished = this.applyProfessionalStructure(textarea.value, type);
        
        this.animateTextReplacement(textarea, polished);
    },

    applyProfessionalStructure(text, type) {
        // AI detection of role/tech keywords
        const isBackend = /\b(node|express|api|mongodb|sql|backend|server|java|python|aws)\b/i.test(text);
        const isFrontend = /\b(react|vue|ui|ux|frontend|canvas|animation|css)\b/i.test(text);

        if (type === 'project') {
            const parts = text.split('-').map(p => p.trim());
            const projectName = parts[0] || 'Strategic Initiative';
            const functionality = parts[1] || 'achieve mission-critical goals';
            
            if (isBackend) {
                return `Architected and deployed ${projectName}, a high-performance backend solution. Designed a scalable infrastructure from scratch, focusing on efficient data handling and secure API integrations. By leveraging robust database management and low-latency logic, I ensured the system could handle high-traffic scenarios while maintaining 99.9% uptime. The backend serves as the core engine, processing complex requests and ensuring seamless data flow across the entire platform.`;
            }

            return `My project solves the challenge of complex manual workflows. To address this, I developed ${projectName}, which allows users to ${functionality}. The user interface is clean, responsive, and easy to use, ensuring a smooth experience. On the backend, I implemented core functionalities like authentication, database management, and CRUD operations to handle data efficiently. Additionally, the project is designed for real-world scenarios with robust error handling and scalability.`;
        }

        // Generic Polished phrases
        let base = text.replace(/\b(I|i)\b/g, 'Strategically').replace(/was/g, 'served as');
        if (isBackend) base += " Specialized in backend optimization and scalable architecture.";
        return base + " Driven by a focus on impact and technical excellence.";
    },

    animateTextReplacement(el, newText) {
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0.3';
        setTimeout(() => {
            el.value = newText;
            el.style.opacity = '1';
            // Sync data
            if (el.id) this.userData[el.id] = newText;
        }, 300);
    },

    captureDynamicLists() {
        // Capture Education
        const eduInputs = document.querySelectorAll('#education-list input');
        this.userData.education = Array.from(eduInputs).map(i => i.value).filter(v => v);

        // Capture Experience
        const expTextareas = document.querySelectorAll('#experience-list textarea');
        this.userData.experience = Array.from(expTextareas).map(t => t.value).filter(v => v);

        // Capture Projects
        const projTextareas = document.querySelectorAll('#projects-list textarea');
        this.userData.projects = Array.from(projTextareas).map(t => t.value).filter(v => v);
    },

    generateResume() {
        const previewEl = document.getElementById('resume-preview');
        const data = this.userData;

        let content = `
            <div class="res-header">
                <div class="res-name">${data.fullname || 'Your Name'}</div>
                <div class="res-title">${data.jobtitle || 'Professional Title'}</div>
                <div class="res-contact">
                    <span>📧 ${data.email || 'email@example.com'}</span>
                    <span>📱 ${data.phone || '+0 000 000 0000'}</span>
                </div>
            </div>

            <div class="res-section">
                <h3 class="res-section-title">Summary</h3>
                <p class="res-item-desc">${data.about || 'Versatile professional with over X years of experience...'}</p>
            </div>

            <div class="res-section">
                <h3 class="res-section-title">Experience</h3>
                ${data.experience.map(exp => `
                    <div class="res-item">
                        <div class="res-item-desc">${exp}</div>
                    </div>
                `).join('') || '<p>Detailed company roles and achievements...</p>'}
            </div>

            <div class="res-section">
                <h3 class="res-section-title">Key Projects</h3>
                ${data.projects.map(p => `
                    <div class="res-item">
                        <div class="res-item-desc">${p}</div>
                    </div>
                `).join('') || '<p>Highlighting impact and technologies...</p>'}
            </div>

            <div class="res-section">
                <h3 class="res-section-title">Education</h3>
                ${data.education.map(edu => `
                    <div class="res-item">
                        <div class="res-item-desc">${edu}</div>
                    </div>
                `).join('') || '<p>University, Degree, Graduation Date...</p>'}
            </div>

            <div class="res-section">
                <h3 class="res-section-title">Skills</h3>
                <div class="res-skills">
                    ${data.skills.map(s => `<span class="res-skill-tag">${s}</span>`).join('') || '<span>Logic, Creativity, Leadership...</span>'}
                </div>
            </div>
        `;

        previewEl.innerHTML = content;
        
        // Apply template style classes (CSS handles styling based on structure)
        previewEl.className = `resume-container ${data.template}-theme`;
    },

    showPreview() {
        document.getElementById('form-container').classList.add('hidden');
        document.getElementById('preview-section').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    backToForm() {
        document.getElementById('preview-section').classList.add('hidden');
        document.getElementById('form-container').classList.remove('hidden');
        this.currentStep = this.totalSteps;
        this.updateStepUI();
    },

    printResume() {
        const element = document.getElementById('resume-preview');
        const opt = {
            margin:       0.5,
            filename:     `${this.userData.fullname.replace(' ', '_')}_Resume.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Old browsers might need the direct cdn call if library not in local node_modules
        if (typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(element).save();
        } else {
            console.error('html2pdf library not loaded');
            alert('PDF generation library is still loading. Please try again in a few seconds.');
        }
    },

    viewPortfolio() {
        const section = document.getElementById('portfolio-section');
        const container = document.getElementById('portfolio-container');
        const d = this.userData;

        document.getElementById('preview-section').classList.add('hidden');
        section.classList.remove('hidden');

        let html = `
            <header class="port-hero">
                <div>
                    <h1 class="glow-text" style="font-size: 5rem">${d.fullname}</h1>
                    <p class="hero-subtitle">${d.jobtitle}</p>
                </div>
            </header>

            <section class="port-section">
                <h2 class="gradient-text">About Me</h2>
                <p style="font-size: 1.2rem; max-width: 800px; margin-top: 1rem; color: #ccc">${d.about}</p>
            </section>

            <section class="port-section" style="background: #050505">
                <h2 class="gradient-text">Featured Projects</h2>
                <div class="port-grid">
                    ${d.projects.map((p, i) => `
                        <div class="port-card">
                            <span style="font-size: 0.8rem; color: var(--primary)">Project 0${i+1}</span>
                            <p style="margin-top: 1rem">${p}</p>
                        </div>
                    `).join('')}
                </div>
            </section>

            <section class="port-section">
                <h2 class="gradient-text">Skills & Mastery</h2>
                <div class="res-skills" style="margin-top: 2rem">
                    ${d.skills.map(s => `<span class="res-skill-tag" style="background:#111; border: 1px solid #333; color: white; padding: 0.5rem 1.5rem; font-size: 1rem">${s}</span>`).join('')}
                </div>
            </section>

            <section class="port-section" style="text-align: center">
                <h2 class="gradient-text">Let's Connect</h2>
                <p style="margin: 2rem 0; font-size: 1.5rem">${d.email}</p>
                <div style="display: flex; justify-content: center; gap: 2rem">
                    <button class="btn btn-secondary">${d.phone}</button>
                    <button class="btn btn-primary" onclick="window.print()">Print Resume</button>
                </div>
            </section>
        `;

        container.innerHTML = html;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    backToPreview() {
        document.getElementById('portfolio-section').classList.add('hidden');
        document.getElementById('preview-section').classList.remove('hidden');
    },

    regenerateSuggestions() {
        const suggestions = [
            "Your profile looks strong! Add specific metrics to your projects for 40% more visibility.",
            "Consider adding 'Problem Solving' and 'Team Leadership' to your skills for this role.",
            "AI Tip: Use active verbs like 'Spearheaded' and 'Architected' in your experience items.",
            "Matching your background with current trends... Try highlighting your AI tool proficiency.",
            "Education section is robust. Linking your portfolio to your LinkedIn can double inquiries."
        ];
        const random = suggestions[Math.floor(Math.random() * suggestions.length)];
        const el = document.getElementById('ai-suggestion');
        if (el) {
            el.style.opacity = '0';
            setTimeout(() => {
                el.textContent = random;
                el.style.opacity = '1';
            }, 300);
        }
    }
};

// Global Exposure
window.app = app;

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
