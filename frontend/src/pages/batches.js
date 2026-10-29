/**
 * Batch Corner & Cohort Communities Page
 */
import { api } from '../services/api.js';
import { authState } from '../auth/authContext.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';

export async function renderBatchesPage() {
  return `
    <div>
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 800; color: var(--navy-900);">Batch Corner & Cohort Communities</h1>
        <p style="color: var(--slate-500); font-size: 14px;">Connect with your graduation cohort, plan reunions, and share stories.</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px;">
        <!-- Left: Batches List -->
        <div>
          <div class="card" style="padding: 16px;">
            <h3 class="card-title" style="margin-bottom: 14px; font-size: 16px;">Available Batches</h3>
            <div id="batch-list-container" style="display: flex; flex-direction: column; gap: 8px;">
              <div style="color: var(--slate-400); font-size: 13px;">Loading batches...</div>
            </div>
          </div>
        </div>

        <!-- Right: Active Batch Community Feed & Members -->
        <div>
          <div id="batch-community-view" class="card" style="min-height: 400px;">
            <div class="empty-state">
              <div class="empty-state-icon">🎓</div>
              <div class="empty-state-title">Select a Batch Community</div>
              <p>Choose your graduation cohort from the left panel to join discussions and see member rosters.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initBatchesPage() {
  const batchList = document.getElementById('batch-list-container');
  const communityView = document.getElementById('batch-community-view');
  let activeBatchId = null;

  const loadBatches = async () => {
    try {
      const res = await api.getBatches();
      const batches = res.data || [];

      if (batches.length === 0) {
        batchList.innerHTML = `<p style="font-size: 13px; color: var(--slate-500);">No batches registered.</p>`;
        return;
      }

      batchList.innerHTML = batches.map(b => `
        <div class="batch-item card" data-id="${b.id}" data-name="${escapeHtml(b.name)}" style="padding: 12px; cursor: pointer; border-color: ${b.id === activeBatchId ? 'var(--teal-600)' : 'var(--border-color)'};">
          <div style="font-weight: 700; font-size: 14px; color: var(--navy-900);">${escapeHtml(b.name)}</div>
          <div style="font-size: 12px; color: var(--slate-500);">${escapeHtml(b.courseName || 'Engineering')} • ${b.graduationYear || ''}</div>
        </div>
      `).join('');

      document.querySelectorAll('.batch-item').forEach(item => {
        item.addEventListener('click', () => {
          activeBatchId = item.getAttribute('data-id');
          const batchName = item.getAttribute('data-name');
          selectBatch(activeBatchId, batchName);
          loadBatches();
        });
      });

      // Default select first batch
      if (!activeBatchId && batches.length > 0) {
        activeBatchId = batches[0].id;
        selectBatch(batches[0].id, batches[0].name);
      }
    } catch (e) {
      batchList.innerHTML = `<p style="color: var(--color-danger); font-size: 12px;">Failed to load batches.</p>`;
    }
  };

  const selectBatch = async (batchId, batchName) => {
    communityView.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--slate-400);">Loading batch community...</div>`;
    try {
      const [membersRes, postsRes] = await Promise.all([
        api.getBatchMembers(batchId).catch(() => ({ data: [] })),
        api.getBatchPosts(batchId).catch(() => ({ data: [] }))
      ]);

      const members = membersRes.data || [];
      const posts = postsRes.data || [];

      communityView.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800; color: var(--navy-900);">${escapeHtml(batchName)}</h2>
            <div style="font-size: 13px; color: var(--slate-500);">${members.length} Verified Cohort Members</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" id="join-batch-btn" class="btn btn-outline btn-sm">Join Batch</button>
            <button type="button" id="new-batch-post-btn" class="btn btn-primary btn-sm">+ New Post</button>
          </div>
        </div>

        <!-- Posts Stream -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${posts.length === 0 ? `
            <div class="empty-state">
              <p>No community posts in this batch yet. Be the first to start a conversation!</p>
            </div>
          ` : posts.map(p => `
            <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; background: #ffffff;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <div style="font-weight: 700; color: var(--navy-900); font-size: 15px;">${escapeHtml(p.title)}</div>
                <span class="user-role-badge role-${p.authorRole || 'alumni'}">${p.authorRole || 'member'}</span>
              </div>
              <div style="font-size: 12px; color: var(--slate-400); margin-bottom: 10px;">
                Posted by <strong>${escapeHtml(p.authorName || 'Alumnus')}</strong>
              </div>
              <p style="font-size: 14px; color: var(--slate-700); line-height: 1.6; margin-bottom: 14px;">
                ${escapeHtml(p.content)}
              </p>
              <div style="border-top: 1px solid var(--border-color); padding-top: 10px; display: flex; align-items: center; gap: 14px;">
                <span style="font-size: 13px; color: var(--slate-500);">❤️ ${p.likesCount || 0} Likes</span>
                <button type="button" class="btn btn-outline btn-sm view-comments-btn" data-id="${p.id}" data-title="${escapeHtml(p.title)}">
                  Comments
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Wire join batch
      document.getElementById('join-batch-btn').addEventListener('click', async () => {
        try {
          await api.joinBatch(batchId);
          showToast('Joined batch community!', 'success');
          selectBatch(batchId, batchName);
        } catch (e) {
          showToast(e.message || 'Error joining batch', 'error');
        }
      });

      // Wire new post
      document.getElementById('new-batch-post-btn').addEventListener('click', () => {
        openNewPostModal(batchId, batchName);
      });

      // Wire comments
      document.querySelectorAll('.view-comments-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const postId = btn.getAttribute('data-id');
          const title = btn.getAttribute('data-title');
          openCommentsModal(postId, title);
        });
      });

    } catch (e) {
      communityView.innerHTML = `<div style="color: var(--color-danger); padding: 20px;">Failed to load batch content.</div>`;
    }
  };

  const openNewPostModal = (batchId, batchName) => {
    const content = `
      <div class="form-group">
        <label class="form-label" for="post-title">Post Title</label>
        <input type="text" id="post-title" class="form-control" placeholder="e.g. Planning our 5-Year Reunion Dinner" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="post-content">Message Content</label>
        <textarea id="post-content" class="form-control" placeholder="Share your update, reunion question, or memory..." required></textarea>
      </div>
    `;

    const footer = `
      <button type="button" class="btn btn-outline" id="cancel-post-btn">Cancel</button>
      <button type="button" class="btn btn-primary" id="submit-post-btn">Publish to Batch</button>
    `;

    const { close } = openModal({ title: `New Post in ${batchName}`, contentHtml: content, footerHtml: footer });

    document.getElementById('cancel-post-btn').addEventListener('click', close);
    document.getElementById('submit-post-btn').addEventListener('click', async () => {
      const title = document.getElementById('post-title').value.trim();
      const contentText = document.getElementById('post-content').value.trim();

      if (!title || !contentText) {
        showToast('Please enter both title and content.', 'error');
        return;
      }

      try {
        await api.createBatchPost(batchId, title, contentText);
        showToast('Post published to cohort!', 'success');
        close();
        selectBatch(batchId, batchName);
      } catch (e) {
        showToast(e.message || 'Failed to publish post.', 'error');
      }
    });
  };

  const openCommentsModal = async (postId, postTitle) => {
    let comments = [];
    try {
      const res = await api.getPostComments(postId);
      comments = res.data || [];
    } catch (e) {}

    const content = `
      <p style="font-size: 13px; color: var(--slate-600); margin-bottom: 14px;">Discussion on <strong>${escapeHtml(postTitle)}</strong>:</p>
      <div id="comments-stream" style="display: flex; flex-direction: column; gap: 10px; max-height: 250px; overflow-y: auto; margin-bottom: 16px;">
        ${comments.length === 0 ? `<p style="font-size: 12px; color: var(--slate-400);">No comments yet.</p>` : comments.map(c => `
          <div style="background: var(--slate-50); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <div style="font-weight: 700; font-size: 12px; color: var(--navy-900);">${escapeHtml(c.authorName || 'Peer')}</div>
            <div style="font-size: 13px; color: var(--slate-700);">${escapeHtml(c.content)}</div>
          </div>
        `).join('')}
      </div>
      <div class="form-group">
        <input type="text" id="new-comment-input" class="form-control" placeholder="Write a comment..." autocomplete="off">
      </div>
    `;

    const footer = `
      <button type="button" class="btn btn-outline" id="close-comment-modal-btn">Close</button>
      <button type="button" class="btn btn-primary" id="submit-comment-btn">Comment</button>
    `;

    const { close } = openModal({ title: 'Discussion Comments', contentHtml: content, footerHtml: footer });

    document.getElementById('close-comment-modal-btn').addEventListener('click', close);
    document.getElementById('submit-comment-btn').addEventListener('click', async () => {
      const input = document.getElementById('new-comment-input');
      const val = input.value.trim();
      if (!val) return;

      try {
        await api.addComment(postId, val);
        showToast('Comment added!', 'success');
        close();
      } catch (e) {
        showToast(e.message || 'Failed to add comment.', 'error');
      }
    });
  };

  // Initial load
  loadBatches();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

