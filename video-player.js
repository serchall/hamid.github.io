// Video Player JavaScript
class VideoPlayer {
    constructor() {
        this.videos = [];
        this.currentPage = 1;
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.isLoading = false;
        this.hasMore = true;
        this.currentVideo = null;
        this.likedVideos = JSON.parse(localStorage.getItem('liked_videos') || '[]');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthentication();
        this.loadVideos();
        this.loadSampleVideos(); // Load sample videos for demo
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.debounce(() => this.searchVideos(), 500);
            });
        }

        // Category tabs
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setActiveCategory(e.target.dataset.category);
            });
        });

        // Upload button
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                this.showUploadModal();
            });
        }

        // Upload form
        const submitUpload = document.getElementById('submitUpload');
        if (submitUpload) {
            submitUpload.addEventListener('click', () => {
                this.handleUpload();
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreVideos();
            });
        }

        // Like button
        const likeVideoBtn = document.getElementById('likeVideoBtn');
        if (likeVideoBtn) {
            likeVideoBtn.addEventListener('click', () => {
                this.toggleLike();
            });
        }

        // Video player modal events
        const videoPlayerModal = document.getElementById('videoPlayerModal');
        if (videoPlayerModal) {
            videoPlayerModal.addEventListener('hidden.bs.modal', () => {
                this.stopVideo();
            });
        }
    }

    checkAuthentication() {
        const token = localStorage.getItem('authToken');
        const authBtn = document.getElementById('authBtn');
        
        if (token && authBtn) {
            authBtn.innerHTML = '<i class="fas fa-user me-1"></i>پروفایل';
            authBtn.href = '/profile.html';
        }
    }

    async loadVideos() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch(`/api/videos?page=${this.currentPage}&limit=12`);
            const data = await response.json();
            
            if (data.success) {
                this.videos = data.videos;
                this.hasMore = this.currentPage < data.pagination.pages;
                this.renderVideos();
                this.showLoadMoreButton();
            } else {
                this.showError('خطا در بارگذاری ویدئوها');
            }
        } catch (error) {
            console.error('Error loading videos:', error);
            this.showError('خطا در اتصال به سرور');
        } finally {
            this.isLoading = false;
        }
    }

    loadSampleVideos() {
        // Sample videos for demo
        const sampleVideos = [
            {
                id: 1,
                title: 'ویدئوی نمونه اول',
                description: 'این یک ویدئوی نمونه برای نمایش قابلیت‌های پخش‌کننده است.',
                filename: 'sample1.mp4',
                thumbnail: 'https://via.placeholder.com/300x200/ff6b6b/ffffff?text=ویدئو+1',
                views: 1250,
                likes: 89,
                user_name: 'کاربر نمونه',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                title: 'ویدئوی آموزشی',
                description: 'آموزش کامل استفاده از پلتفرم ویدئو',
                filename: 'sample2.mp4',
                thumbnail: 'https://via.placeholder.com/300x200/4ecdc4/ffffff?text=آموزش',
                views: 890,
                likes: 45,
                user_name: 'مدرس',
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 3,
                title: 'ویدئوی موسیقی',
                description: 'اجرای زنده موسیقی سنتی',
                filename: 'sample3.mp4',
                thumbnail: 'https://via.placeholder.com/300x200/45b7d1/ffffff?text=موسیقی',
                views: 2100,
                likes: 156,
                user_name: 'هنرمند',
                createdAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
                id: 4,
                title: 'ویدئوی طنز',
                description: 'کلیپ طنز و سرگرم‌کننده',
                filename: 'sample4.mp4',
                thumbnail: 'https://via.placeholder.com/300x200/96ceb4/ffffff?text=طنز',
                views: 3400,
                likes: 234,
                user_name: 'کمدین',
                createdAt: new Date(Date.now() - 259200000).toISOString()
            }
        ];

        this.videos = sampleVideos;
        this.renderVideos();
    }

    renderVideos() {
        const videoGrid = document.getElementById('videoGrid');
        if (!videoGrid) return;

        if (this.videos.length === 0) {
            videoGrid.innerHTML = `
                <div class="no-videos">
                    <i class="fas fa-video"></i>
                    <h4>ویدئویی یافت نشد</h4>
                    <p>هنوز هیچ ویدئویی آپلود نشده است.</p>
                </div>
            `;
            return;
        }

        const filteredVideos = this.filterVideos();
        
        videoGrid.innerHTML = filteredVideos.map(video => this.createVideoCard(video)).join('');
        
        // Add click events to video cards
        const videoCards = videoGrid.querySelectorAll('.video-card');
        videoCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                this.playVideo(filteredVideos[index]);
            });
        });
    }

    createVideoCard(video) {
        const isLiked = this.likedVideos.includes(video.id);
        const timeAgo = this.getTimeAgo(video.createdAt);
        
        return `
            <div class="video-card" data-video-id="${video.id}">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail || 'https://via.placeholder.com/300x200/333/ffffff?text=ویدئو'}" 
                         alt="${video.title}" 
                         onerror="this.src='https://via.placeholder.com/300x200/333/ffffff?text=ویدئو'">
                    <div class="play-button">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="video-info">
                    <div class="video-title">${this.highlightSearch(video.title)}</div>
                    <div class="video-meta">
                        <span>${video.user_name || 'کاربر ناشناس'}</span>
                        <div class="video-stats">
                            <span>
                                <i class="fas fa-eye"></i>
                                ${this.formatNumber(video.views)}
                            </span>
                            <span>
                                <i class="fas fa-heart ${isLiked ? 'text-danger' : ''}"></i>
                                ${this.formatNumber(video.likes)}
                            </span>
                            <span>${timeAgo}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    playVideo(video) {
        this.currentVideo = video;
        
        // Update modal content
        document.getElementById('videoPlayerTitleText').textContent = video.title;
        document.getElementById('videoPlayerDescription').textContent = video.description;
        document.getElementById('videoPlayerViews').innerHTML = `<i class="fas fa-eye"></i>${this.formatNumber(video.views)} بازدید`;
        document.getElementById('videoPlayerLikes').innerHTML = `<i class="fas fa-heart"></i>${this.formatNumber(video.likes)} لایک`;
        
        // Set video source
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.src = `/videos/${video.filename}`;
        
        // Update like button
        const likeBtn = document.getElementById('likeVideoBtn');
        const isLiked = this.likedVideos.includes(video.id);
        likeBtn.classList.toggle('liked', isLiked);
        likeBtn.innerHTML = `<i class="fas fa-heart"></i>${isLiked ? 'لایک شده' : 'لایک'}`;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('videoPlayerModal'));
        modal.show();
        
        // Increment views
        this.incrementViews(video.id);

        // نمایش کامنت‌ها
        this.loadComments(video.id);
        // دکمه اشتراک‌گذاری
        document.getElementById('videoPlayerDescription').insertAdjacentHTML('afterend', `
            <div class="d-flex align-items-center mt-3">
                <button class="btn btn-outline-secondary me-2" id="shareVideoBtn">
                    <i class="fas fa-share"></i> اشتراک‌گذاری
                </button>
                <input type="text" class="form-control bg-dark text-light border-secondary" id="shareLink" value="${window.location.origin}/videos.html?v=${video.id}" readonly style="max-width:300px;">
            </div>
            <div class="mt-3" id="commentsSection"></div>
        `);
        document.getElementById('shareVideoBtn').onclick = () => {
            const link = document.getElementById('shareLink');
            link.select();
            document.execCommand('copy');
            alert('لینک ویدئو کپی شد!');
        };
        // فرم ثبت کامنت
        this.renderCommentForm(video.id);
    }

    stopVideo() {
        const videoPlayer = document.getElementById('videoPlayer');
        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.currentTime = 0;
        }
    }

    toggleLike() {
        if (!this.currentVideo) return;
        
        const videoId = this.currentVideo.id;
        const likeBtn = document.getElementById('likeVideoBtn');
        const isLiked = this.likedVideos.includes(videoId);
        
        if (isLiked) {
            this.likedVideos = this.likedVideos.filter(id => id !== videoId);
            likeBtn.classList.remove('liked');
            likeBtn.innerHTML = '<i class="fas fa-heart"></i>لایک';
        } else {
            this.likedVideos.push(videoId);
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = '<i class="fas fa-heart"></i>لایک شده';
        }
        
        localStorage.setItem('liked_videos', JSON.stringify(this.likedVideos));
        
        // Update like count
        if (isLiked) {
            this.currentVideo.likes--;
        } else {
            this.currentVideo.likes++;
        }
        
        document.getElementById('videoPlayerLikes').innerHTML = `<i class="fas fa-heart"></i>${this.formatNumber(this.currentVideo.likes)} لایک`;
        
        // Send like to server
        this.sendLikeToServer(videoId, !isLiked);
    }

    async sendLikeToServer(videoId, isLike) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            await fetch(`/api/videos/${videoId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error sending like:', error);
        }
    }

    async incrementViews(videoId) {
        try {
            await fetch(`/api/videos/${videoId}`, {
                method: 'GET'
            });
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
    }

    async loadComments(videoId) {
        const res = await fetch(`/api/videos/${videoId}/comments`);
        const data = await res.json();
        if (data.success) {
            this.renderComments(data.comments);
        }
    }

    renderComments(comments) {
        const section = document.getElementById('commentsSection');
        if (!section) return;
        section.innerHTML = `<h5 class='mb-3'><i class='fas fa-comments me-2'></i>نظرات</h5>` +
            (comments.length === 0 ? '<div class="text-muted">نظری ثبت نشده است.</div>' :
            '<ul class="list-group mb-3">' +
            comments.map(c => `<li class="list-group-item bg-dark text-light border-secondary"><b>${c.user_name || 'کاربر'}</b>: ${c.text}</li>`).join('') +
            '</ul>');
    }

    renderCommentForm(videoId) {
        const section = document.getElementById('commentsSection');
        if (!section) return;
        section.insertAdjacentHTML('beforeend', `
            <form id="commentForm" class="d-flex gap-2">
                <input type="text" class="form-control bg-dark text-light border-secondary" id="commentInput" placeholder="نظر خود را بنویسید...">
                <button class="btn btn-success" type="submit"><i class="fas fa-paper-plane"></i> ارسال</button>
            </form>
        `);
        document.getElementById('commentForm').onsubmit = async (e) => {
            e.preventDefault();
            const input = document.getElementById('commentInput');
            const text = input.value.trim();
            if (!text) return;
            const token = localStorage.getItem('authToken');
            if (!token) return alert('برای ثبت نظر وارد شوید');
            const res = await fetch(`/api/videos/${videoId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text })
            });
            const data = await res.json();
            if (data.success) {
                input.value = '';
                this.loadComments(videoId);
            } else {
                alert(data.message || 'خطا در ثبت نظر');
            }
        };
    }

    setActiveCategory(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        
        // Update active tab
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
        
        this.loadVideos();
    }

    searchVideos() {
        this.currentPage = 1;
        this.renderVideos();
    }

    filterVideos() {
        let filtered = this.videos;
        if (this.currentCategory === 'shorts') {
            filtered = filtered.filter(v => v.type === 'short');
        } else if (this.currentCategory !== 'all') {
            filtered = filtered.filter(v => v.category === this.currentCategory);
        }
        if (this.searchQuery) {
            filtered = filtered.filter(v => v.title && v.title.includes(this.searchQuery));
        }
        return filtered;
    }

    highlightSearch(text) {
        if (!this.searchQuery) return text;
        
        const regex = new RegExp(`(${this.searchQuery})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    showUploadModal() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('برای آپلود ویدئو ابتدا وارد شوید');
            window.location.href = '/auth.html';
            return;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('uploadModal'));
        modal.show();
    }

    async handleUpload() {
        const form = document.getElementById('uploadForm');
        const formData = new FormData();
        
        const title = document.getElementById('videoTitle').value;
        const description = document.getElementById('videoDescription').value;
        const videoFile = document.getElementById('videoFile').files[0];
        const thumbnailFile = document.getElementById('thumbnailFile').files[0];
        const type = document.getElementById('videoType')?.value || 'normal';
        
        if (!title || !videoFile) {
            alert('لطفاً عنوان و فایل ویدئو را وارد کنید');
            return;
        }
        
        formData.append('title', title);
        formData.append('description', description);
        formData.append('video', videoFile);
        if (thumbnailFile) {
            formData.append('thumbnail', thumbnailFile);
        }
        formData.append('type', type);
        
        const token = localStorage.getItem('authToken');
        const progressBar = document.getElementById('uploadProgress');
        const progressFill = progressBar.querySelector('.progress-bar');
        
        progressBar.style.display = 'block';
        progressFill.style.width = '0%';
        
        try {
            const response = await fetch('/api/videos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('ویدئو با موفقیت آپلود شد');
                bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
                form.reset();
                this.loadVideos();
            } else {
                alert(data.message || 'خطا در آپلود ویدئو');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('خطا در آپلود ویدئو');
        } finally {
            progressBar.style.display = 'none';
        }
    }

    loadMoreVideos() {
        if (this.hasMore && !this.isLoading) {
            this.currentPage++;
            this.loadVideos();
        }
    }

    showLoading() {
        const videoGrid = document.getElementById('videoGrid');
        if (videoGrid) {
            videoGrid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span class="ms-2">در حال بارگذاری...</span>
                </div>
            `;
        }
    }

    showError(message) {
        const videoGrid = document.getElementById('videoGrid');
        if (videoGrid) {
            videoGrid.innerHTML = `
                <div class="no-videos">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>خطا</h4>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    showLoadMoreButton() {
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        if (loadMoreContainer) {
            loadMoreContainer.style.display = this.hasMore ? 'block' : 'none';
        }
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'همین الان';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} دقیقه پیش`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ساعت پیش`;
        } else if (diffInSeconds < 2592000) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} روز پیش`;
        } else {
            const months = Math.floor(diffInSeconds / 2592000);
            return `${months} ماه پیش`;
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    debounce(func, wait) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(func, wait);
    }
}

// Initialize video player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.videoPlayer = new VideoPlayer();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoPlayer;
} 