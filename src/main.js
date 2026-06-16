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

    jobs: {
        data: [],
        currentView: 'table',
        searchQuery: '',
        filterStatus: 'all',
        editingId: null,
        tempNotes: [],
        charts: { pie: null, bar: null },

        loadJobs() {
            const saved = localStorage.getItem('aigraft_jobs');
            if (saved) {
                this.data = JSON.parse(saved);
                // Backward compatibility: Convert string notes to array format
                this.data.forEach(j => {
                    if (typeof j.notes === 'string') {
                        j.notes = j.notes.trim() ? [{ text: j.notes, date: j.updatedAt || new Date().toISOString() }] : [];
                    }
                    if (!j.priority) j.priority = 'medium';
                });
            }
        },

        saveJob() {
            const company = document.getElementById('job-company').value.trim();
            const role = document.getElementById('job-role').value.trim();
            const date = document.getElementById('job-date').value;
            const status = document.getElementById('job-status').value;
            const resumeId = document.getElementById('job-resume').value;
            const link = document.getElementById('job-link').value.trim();
            
            // New fields
            const priority = document.getElementById('job-priority').value;
            const interviewDate = document.getElementById('job-interview-date').value;
            const salary = document.getElementById('job-salary').value.trim();
            const source = document.getElementById('job-source').value;
            const contactName = document.getElementById('job-contact-name').value.trim();
            const contactEmail = document.getElementById('job-contact-email').value.trim();
            const followupDate = document.getElementById('job-followup-date').value;

            if (!company || !role) {
                alert('🚨 Please enter both Company Name and Job Role.');
                return;
            }

            // Check if there is a pending note that hasn't been added yet
            const pendingNote = document.getElementById('new-job-note').value.trim();
            if (pendingNote) {
                this.tempNotes.push({ text: pendingNote, date: new Date().toISOString() });
                document.getElementById('new-job-note').value = '';
            }

            const jobEntry = {
                id: this.editingId || Date.now().toString(),
                company,
                role,
                date: date || new Date().toISOString().split('T')[0],
                status,
                resumeId,
                link,
                priority,
                interviewDate: status === 'interview' ? interviewDate : '',
                salary,
                source,
                contactName,
                contactEmail,
                followupDate,
                notes: this.tempNotes,
                updatedAt: new Date().toISOString()
            };

            if (this.editingId) {
                const idx = this.data.findIndex(j => j.id === this.editingId);
                if (idx > -1) this.data[idx] = jobEntry;
                this.editingId = null;
                alert('Job updated successfully!');
            } else {
                this.data.unshift(jobEntry);
                alert('New job added to tracker! 🚀');
            }

            localStorage.setItem('aigraft_jobs', JSON.stringify(this.data));
            this.closeModal();
            this.render();
        },

        deleteJob(id) {
            if (confirm('Are you sure you want to delete this job application?')) {
                this.data = this.data.filter(j => j.id !== id);
                localStorage.setItem('aigraft_jobs', JSON.stringify(this.data));
                this.render();
            }
        },

        editJob(id) {
            const job = this.data.find(j => j.id === id);
            if (!job) return;
            
            this.editingId = id;
            document.getElementById('job-modal-title').textContent = 'Edit Job Application';
            document.getElementById('job-company').value = job.company;
            document.getElementById('job-role').value = job.role;
            document.getElementById('job-date').value = job.date;
            document.getElementById('job-status').value = job.status;
            document.getElementById('job-link').value = job.link || '';
            
            // New fields
            document.getElementById('job-priority').value = job.priority || 'medium';
            document.getElementById('job-interview-date').value = job.interviewDate || '';
            document.getElementById('job-salary').value = job.salary || '';
            document.getElementById('job-source').value = job.source || '';
            document.getElementById('job-contact-name').value = job.contactName || '';
            document.getElementById('job-contact-email').value = job.contactEmail || '';
            document.getElementById('job-followup-date').value = job.followupDate || '';
            
            this.tempNotes = [...(job.notes || [])];
            this.renderTimeline();
            
            this.populateResumeDropdown(job.resumeId);
            this.toggleInterviewDate();
            
            document.getElementById('job-modal').classList.remove('hidden');
        },

        openModal() {
            this.editingId = null;
            document.getElementById('job-modal-title').textContent = 'Add Job Application';
            document.getElementById('job-company').value = '';
            document.getElementById('job-role').value = '';
            document.getElementById('job-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('job-status').value = 'pending';
            document.getElementById('job-link').value = '';
            
            // New fields reset
            document.getElementById('job-priority').value = 'medium';
            document.getElementById('job-interview-date').value = '';
            document.getElementById('job-salary').value = '';
            document.getElementById('job-source').value = '';
            document.getElementById('job-contact-name').value = '';
            document.getElementById('job-contact-email').value = '';
            document.getElementById('job-followup-date').value = '';
            document.getElementById('new-job-note').value = '';
            
            this.tempNotes = [];
            this.renderTimeline();
            
            this.populateResumeDropdown();
            this.toggleInterviewDate();
            
            document.getElementById('job-modal').classList.remove('hidden');
        },

        closeModal() {
            document.getElementById('job-modal').classList.add('hidden');
        },

        toggleInterviewDate() {
            const status = document.getElementById('job-status').value;
            const group = document.getElementById('interview-date-group');
            if (status === 'interview') {
                group.classList.remove('hidden');
            } else {
                group.classList.add('hidden');
            }
        },

        addNoteUI(e) {
            if(e) e.preventDefault();
            const input = document.getElementById('new-job-note');
            const text = input.value.trim();
            if (!text) return;
            
            this.tempNotes.push({ text, date: new Date().toISOString() });
            input.value = '';
            this.renderTimeline();
        },

        renderTimeline() {
            const container = document.getElementById('job-notes-timeline');
            if (!this.tempNotes || this.tempNotes.length === 0) {
                container.innerHTML = '<div style="color:#888; font-size:0.9rem; text-align:center;">No notes added yet.</div>';
                return;
            }
            
            container.innerHTML = this.tempNotes.map(n => {
                const dateObj = new Date(n.date);
                const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                return `
                    <div class="timeline-entry">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <div class="timeline-date">${dateStr}</div>
                            <div class="timeline-text">${n.text}</div>
                        </div>
                    </div>
                `;
            }).join('');
            container.scrollTop = container.scrollHeight;
        },

        populateResumeDropdown(selectedId = '') {
            const select = document.getElementById('job-resume');
            select.innerHTML = '<option value="">-- Select a Resume --</option>' + 
                app.resumes.map(r => `<option value="${r.id}" ${r.id === selectedId ? 'selected' : ''}>${r.fullname} - ${r.jobtitle} (${r.template})</option>`).join('');
        },

        showJobTracker() {
            document.querySelectorAll('section, header').forEach(s => s.classList.add('hidden'));
            document.getElementById('job-tracker-section').classList.remove('hidden');
            this.render();
        },

        switchView(view) {
            this.currentView = view;
            document.getElementById('btn-view-table').classList.toggle('active', view === 'table');
            document.getElementById('btn-view-kanban').classList.toggle('active', view === 'kanban');
            
            document.getElementById('job-table-view').classList.toggle('hidden', view !== 'table');
            document.getElementById('job-kanban-view').classList.toggle('hidden', view !== 'kanban');
        },

        onSearch(val) {
            this.searchQuery = val.toLowerCase();
            this.render();
        },

        onFilter(val) {
            this.filterStatus = val;
            this.render();
        },

        onQuickStatusChange(id, newStatus) {
            const job = this.data.find(j => j.id === id);
            if(job) {
                job.status = newStatus;
                job.updatedAt = new Date().toISOString();
                localStorage.setItem('aigraft_jobs', JSON.stringify(this.data));
                this.render();
            }
        },

        exportCSV() {
            if(this.data.length === 0) {
                alert("No jobs to export.");
                return;
            }
            const headers = ['Company', 'Role', 'Date Applied', 'Status', 'Priority', 'Source', 'Salary', 'Resume Used'];
            const rows = this.data.map(j => {
                const resumeName = this.getResumeName(j.resumeId).replace(/,/g, '');
                return [
                    `"${j.company || ''}"`,
                    `"${j.role || ''}"`,
                    `"${j.date || ''}"`,
                    `"${j.status || ''}"`,
                    `"${j.priority || ''}"`,
                    `"${j.source || ''}"`,
                    `"${j.salary || ''}"`,
                    `"${resumeName}"`
                ].join(',');
            });
            const csvContent = headers.join(',') + '\n' + rows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `job_applications_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        getFilteredJobs() {
            return this.data.filter(j => {
                const matchesSearch = !this.searchQuery || 
                    j.company.toLowerCase().includes(this.searchQuery) ||
                    j.role.toLowerCase().includes(this.searchQuery);
                const matchesFilter = this.filterStatus === 'all' || j.status === this.filterStatus;
                return matchesSearch && matchesFilter;
            });
        },

        updateStats() {
            document.getElementById('stat-total').textContent = this.data.length;
            document.getElementById('stat-interviews').textContent = this.data.filter(j => j.status === 'interview').length;
            document.getElementById('stat-offers').textContent = this.data.filter(j => j.status === 'offer').length;
            document.getElementById('stat-rejected').textContent = this.data.filter(j => j.status === 'rejected').length;
        },

        getPriorityBadge(priority) {
            const map = {
                'high': '<span class="priority-badge prio-high">🔴 High</span>',
                'medium': '<span class="priority-badge prio-medium">🟡 Med</span>',
                'low': '<span class="priority-badge prio-low">🟢 Low</span>'
            };
            return map[priority] || map['medium'];
        },
        
        getResumeName(id) {
            if(!id) return '-';
            const r = app.resumes.find(res => res.id === id);
            return r ? `${r.fullname} (${r.template})` : 'Deleted Resume';
        },

        renderCharts() {
            const analyticsSection = document.getElementById('job-analytics-section');
            if (this.data.length === 0) {
                analyticsSection.classList.add('hidden');
                return;
            }
            analyticsSection.classList.remove('hidden');

            if (this.charts.pie) this.charts.pie.destroy();
            if (this.charts.bar) this.charts.bar.destroy();

            // Status Breakdown Pie Chart
            const statusCounts = { pending: 0, interview: 0, offer: 0, rejected: 0 };
            this.data.forEach(j => { if(statusCounts[j.status] !== undefined) statusCounts[j.status]++; });

            const ctxPie = document.getElementById('job-pie-chart').getContext('2d');
            this.charts.pie = new Chart(ctxPie, {
                type: 'doughnut',
                data: {
                    labels: ['Pending', 'Interview', 'Offer', 'Rejected'],
                    datasets: [{
                        data: [statusCounts.pending, statusCounts.interview, statusCounts.offer, statusCounts.rejected],
                        backgroundColor: ['#fde047', '#3b82f6', '#10b981', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: { plugins: { legend: { labels: { color: '#fff' } } } }
            });

            // Applications per month Bar Chart
            const monthCounts = {};
            this.data.forEach(j => {
                const d = new Date(j.date);
                if (!isNaN(d)) {
                    const month = d.toLocaleString('default', { month: 'short', year: 'numeric' });
                    monthCounts[month] = (monthCounts[month] || 0) + 1;
                }
            });
            const months = Object.keys(monthCounts).sort((a,b) => new Date(a) - new Date(b));
            const dataCounts = months.map(m => monthCounts[m]);

            const ctxBar = document.getElementById('job-bar-chart').getContext('2d');
            this.charts.bar = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: months.length ? months : ['No Data'],
                    datasets: [{
                        label: 'Applications',
                        data: dataCounts.length ? dataCounts : [0],
                        backgroundColor: '#4f46e5',
                        borderRadius: 4
                    }]
                },
                options: {
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { ticks: { color: '#aaa', stepSize: 1 }, grid: { color: '#333' } },
                        x: { ticks: { color: '#aaa' }, grid: { display: false } }
                    }
                }
            });
        },

        render() {
            this.updateStats();
            
            const filtered = this.getFilteredJobs();
            const emptyState = document.getElementById('job-empty-state');
            
            if (this.data.length === 0) {
                emptyState.classList.remove('hidden');
                document.getElementById('job-table-view').classList.add('hidden');
                document.getElementById('job-kanban-view').classList.add('hidden');
                document.getElementById('job-analytics-section').classList.add('hidden');
                document.getElementById('job-followup-banner').classList.add('hidden');
                return;
            } else {
                emptyState.classList.add('hidden');
                this.switchView(this.currentView);
            }

            // Follow-up Logic
            let followups = 0;
            const todayStr = new Date().toISOString().split('T')[0];
            
            // Render Table
            const tbody = document.getElementById('job-table-body');
            tbody.innerHTML = filtered.map(j => {
                let isOverdue = false;
                if(j.status === 'pending' && j.followupDate && j.followupDate <= todayStr) {
                    followups++;
                    isOverdue = true;
                }
                
                return `
                <tr>
                    <td style="font-weight:bold">
                        ${isOverdue ? '<span title="Follow-up Overdue!" style="margin-right:5px;">🔔</span>' : ''}
                        ${j.company}
                    </td>
                    <td>
                        ${this.getPriorityBadge(j.priority)}<br>
                        <span style="font-size:0.9rem;">${j.role}</span>
                    </td>
                    <td>${j.date}</td>
                    <td>
                        <select class="quick-status-select" onchange="app.jobs.onQuickStatusChange('${j.id}', this.value)" style="color: ${j.status==='pending'?'#fde047': j.status==='interview'?'#3b82f6': j.status==='offer'?'#10b981':'#ef4444'}">
                            <option value="pending" ${j.status==='pending'?'selected':''}>🟡 Pending</option>
                            <option value="interview" ${j.status==='interview'?'selected':''}>🔵 Interview</option>
                            <option value="offer" ${j.status==='offer'?'selected':''}>🟢 Offer</option>
                            <option value="rejected" ${j.status==='rejected'?'selected':''}>🔴 Rejected</option>
                        </select>
                    </td>
                    <td><span style="font-size:0.85rem; color:#aaa;">${this.getResumeName(j.resumeId)}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-small" onclick="app.jobs.editJob('${j.id}')">Edit</button>
                        <button class="btn btn-ghost btn-small" style="color:var(--red)" onclick="app.jobs.deleteJob('${j.id}')">Delete</button>
                    </td>
                </tr>
            `}).join('') || '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No jobs match your search/filter.</td></tr>';

            // Update Followup Banner
            const banner = document.getElementById('job-followup-banner');
            if (followups > 0) {
                document.getElementById('followup-count').textContent = followups;
                banner.classList.remove('hidden');
            } else {
                banner.classList.add('hidden');
            }

            // Render Kanban
            const columnsData = { pending: [], interview: [], offer: [], rejected: [] };
            filtered.forEach(j => {
                if(columnsData[j.status]) columnsData[j.status].push(j);
            });
            
            // Priority ordering: high > medium > low
            const pOrder = { high: 3, medium: 2, low: 1 };

            ['pending', 'interview', 'offer', 'rejected'].forEach(status => {
                const el = document.querySelector(`#kb-${status} .kb-cards`);
                if(el) {
                    columnsData[status].sort((a,b) => (pOrder[b.priority||'medium'] - pOrder[a.priority||'medium']));
                    
                    el.innerHTML = columnsData[status].map(j => {
                        let isOverdue = (j.status === 'pending' && j.followupDate && j.followupDate <= todayStr);
                        return `
                            <div class="kb-card glass-card">
                                <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                                    ${this.getPriorityBadge(j.priority)}
                                    ${isOverdue ? '<span title="Follow-up Overdue!">🔔</span>' : ''}
                                </div>
                                <div class="kb-card-title">${j.role}</div>
                                <div class="kb-card-company">${j.company}</div>
                                <div class="kb-card-date">📅 ${j.date}</div>
                                <div class="kb-card-actions">
                                    <button class="btn btn-secondary btn-small" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;" onclick="app.jobs.editJob('${j.id}')">Edit</button>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            });

            // Make sure charts render, but ensure Chart.js is loaded first
            if (window.Chart) {
                this.renderCharts();
            } else {
                setTimeout(() => { if(window.Chart) this.renderCharts(); }, 500);
            }
        }
    },

    // Initialization
    init() {
        this.setupEventListeners();
        this.auth.checkSession();
        this.loadResumes(); 
        this.jobs.loadJobs();
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

    showFeature(id) {
        const data = {
            ai: {
                title: "AI Polishing Engine",
                icon: "🤖",
                desc: "Our neural network analyzes your resume against 50,000+ job descriptions to provide pixel-perfect copy.",
                highlights: [
                    "Context-aware action verb suggestions",
                    "ATS keyword density optimization",
                    "Professional tone normalization",
                    "Grammar & impact scoring"
                ]
            },
            templates: {
                title: "Designer Templates",
                icon: "🎨",
                desc: "Every template is battle-tested against major ATS systems like Workday, Greenhouse, and Lever.",
                highlights: [
                    "Multi-column & single-column options",
                    "High-contrast print modes",
                    "Dynamic theme branding",
                    "Zero-config layout management"
                ]
            },
            portfolios: {
                title: "Interactive Web Portfolios",
                icon: "🌐",
                desc: "Turn your PDF into a live web experience that recruiters can interact with in real-time.",
                highlights: [
                    "Custom shareable links",
                    "Mobile-optimized views",
                    "Project display carousel",
                    "Dark/Light mode persistence"
                ]
            },
            insights: {
                title: "Strategic AI Insights",
                icon: "📊",
                desc: "Get an edge with real-time feedback on your professional narrative.",
                highlights: [
                    "Real-time recruiter-view simulation",
                    "Industry-specific skill gap analysis",
                    "Impact metric suggestions",
                    "Confidence score tracker"
                ]
            },
            dashboard: {
                title: "Central Command Center",
                icon: "🔒",
                desc: "One place for all your career documents, synchronized across all your devices.",
                highlights: [
                    "End-to-end data encryption",
                    "Auto-sync to cloud storage",
                    "Version history snapshotting",
                    "Bulk export capabilities"
                ]
            },
            backend: {
                title: "Enterprise Architecture",
                icon: "⚙️",
                desc: "Powered by a high-performance backend infrastructure designed for speed and reliability.",
                highlights: [
                    "High-concurrency processing",
                    "Global edge distribution",
                    "Zero-trust security model",
                    "99.99% infrastructure uptime"
                ]
            },
            pdf: {
                title: "High-Fidelity PDF Engine",
                icon: "📄",
                desc: "Professional-grade PDF generation that looks perfect on every screen and printer.",
                highlights: [
                    "Custom margin & font controls",
                    "CMYK color support for printing",
                    "Embedded metadata for SEO",
                    "Vector-perfect text rendering"
                ]
            }
        };

        const f = data[id];
        if (!f) return;

        const container = document.getElementById('detail-content');
        const overlay = document.getElementById('feature-detail-overlay');
        const featuresSection = document.getElementById('features');

        container.innerHTML = `
            <div class="f-detail-header">
                <div class="f-detail-icon">${f.icon}</div>
                <h1>${f.title}</h1>
            </div>
            <p class="f-detail-desc">${f.desc}</p>
            <div class="f-detail-grid">
                ${f.highlights.map(h => `<div class="f-h-item"><span>✓</span> ${h}</div>`).join('')}
            </div>
        `;

        featuresSection.classList.add('hidden');
        overlay.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    hideFeatureDetail() {
        document.getElementById('feature-detail-overlay').classList.add('hidden');
        document.getElementById('features').classList.remove('hidden');
        document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
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
