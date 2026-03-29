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

    // Initialization
    init() {
        this.setupEventListeners();
        console.log('✨ AIGraft initialized');
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

    startFlow() {
        const hero = document.getElementById('landing-hero');
        const form = document.getElementById('form-container');
        
        hero.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            hero.classList.add('hidden');
            form.classList.remove('hidden');
            form.scrollIntoView({ behavior: 'smooth' });
        }, 600);
    },

    nextStep() {
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
            newItem.innerHTML = `<textarea placeholder="${placeholder}"></textarea>`;
        }
        
        listContainer.appendChild(newItem);
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
