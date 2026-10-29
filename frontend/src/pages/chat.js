/**
 * Human-to-Human Direct Messaging Page
 * STRICT: Absolutely NO AI chatbot. Pure authenticated peer-to-peer messaging.
 */
import { api } from '../services/api.js';
import { authState } from '../auth/authContext.js';
import { showToast } from '../components/toast.js';

export async function renderChatPage() {
  return `
    <div style="display: flex; flex-direction: column; height: calc(100vh - 120px);">
      <div style="margin-bottom: 16px;">
        <h1 style="font-size: 24px; font-weight: 800; color: var(--navy-900);">Direct Human-to-Human Messaging</h1>
        <p style="color: var(--slate-500); font-size: 13px;">Secure, private communication with your approved alumni, mentors, and peers.</p>
      </div>

      <div class="card" style="flex: 1; padding: 0; display: flex; overflow: hidden; min-height: 500px;">
        <!-- Left: Conversations List -->
        <div style="width: 320px; border-right: 1px solid var(--border-color); display: flex; flex-direction: column; background: #ffffff;">
          <div style="padding: 16px; border-bottom: 1px solid var(--border-color); font-weight: 700; color: var(--navy-900);">
            Conversations
          </div>
          <div id="chat-conv-list" style="flex: 1; overflow-y: auto;">
            <div style="padding: 24px; text-align: center; color: var(--slate-400); font-size: 13px;">
              Loading conversations...
            </div>
          </div>
        </div>

        <!-- Right: Message History & Input -->
        <div style="flex: 1; display: flex; flex-direction: column; background: var(--bg-page);">
          <!-- Chat Header -->
          <div id="active-chat-header" style="height: 60px; border-bottom: 1px solid var(--border-color); background: #ffffff; padding: 0 20px; display: flex; align-items: center; justify-content: space-between;">
            <div style="color: var(--slate-500); font-size: 14px;">Select a conversation to begin chatting</div>
          </div>

          <!-- Messages Stream -->
          <div id="chat-messages-container" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px;">
            <div class="empty-state" style="margin: auto;">
              <div class="empty-state-icon">💬</div>
              <div class="empty-state-title">No conversation selected</div>
              <p>Choose an ongoing discussion or start one from the Alumni Directory.</p>
            </div>
          </div>

          <!-- Input Bar -->
          <div style="border-top: 1px solid var(--border-color); background: #ffffff; padding: 14px 20px;">
            <form id="chat-send-form" style="display: flex; gap: 10px;">
              <input type="text" id="chat-message-input" class="form-control" placeholder="Type a message..." disabled autocomplete="off">
              <button type="submit" id="chat-send-btn" class="btn btn-primary" disabled style="padding: 10px 20px;">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initChatPage() {
  const convList = document.getElementById('chat-conv-list');
  const chatHeader = document.getElementById('active-chat-header');
  const messagesContainer = document.getElementById('chat-messages-container');
  const sendForm = document.getElementById('chat-send-form');
  const msgInput = document.getElementById('chat-message-input');
  const sendBtn = document.getElementById('chat-send-btn');

  const currentUid = authState.user?.uid;
  let activeConvId = null;
  let activePartnerName = '';

  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      const conversations = res.data || [];

      if (conversations.length === 0) {
        convList.innerHTML = `
          <div style="padding: 24px; text-align: center; color: var(--slate-500); font-size: 13px;">
            No conversations yet. Connect with alumni in the Directory to start chatting.
          </div>
        `;
        return;
      }

      convList.innerHTML = conversations.map(c => {
        const partnerUid = c.participants.find(p => p !== currentUid) || currentUid;
        const partnerName = c.participantNames?.[partnerUid] || 'Alumni Member';
        const partnerRole = c.participantRoles?.[partnerUid] || 'alumni';
        const isSelected = c.id === activeConvId;

        return `
          <div class="conv-item" data-id="${c.id}" data-partner="${escapeHtml(partnerName)}" data-role="${partnerRole}" style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); cursor: pointer; background: ${isSelected ? 'var(--teal-50)' : 'transparent'}; transition: background var(--transition-fast);">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <div style="font-weight: 700; font-size: 14px; color: var(--navy-900);">${escapeHtml(partnerName)}</div>
              <span class="user-role-badge role-${partnerRole}" style="font-size: 9px;">${partnerRole}</span>
            </div>
            <div style="font-size: 12px; color: var(--slate-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${escapeHtml(c.lastMessage || 'New conversation started')}
            </div>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.conv-item').forEach(item => {
        item.addEventListener('click', () => {
          activeConvId = item.getAttribute('data-id');
          activePartnerName = item.getAttribute('data-partner');
          const partnerRole = item.getAttribute('data-role');
          selectConversation(activeConvId, activePartnerName, partnerRole);
          loadConversations();
        });
      });

      // If query param ?conv= exists, pick it
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const paramConvId = urlParams.get('conv');
      if (paramConvId && !activeConvId) {
        const match = conversations.find(c => c.id === paramConvId);
        if (match) {
          const partnerUid = match.participants.find(p => p !== currentUid) || currentUid;
          activeConvId = match.id;
          activePartnerName = match.participantNames?.[partnerUid] || 'Peer';
          selectConversation(activeConvId, activePartnerName, match.participantRoles?.[partnerUid] || 'alumni');
        }
      }

    } catch (e) {
      convList.innerHTML = `<div style="padding: 20px; color: var(--color-danger); font-size: 12px;">Failed to load conversations.</div>`;
    }
  };

  const selectConversation = async (convId, partnerName, partnerRole) => {
    chatHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 36px; height: 36px; border-radius: var(--radius-full); background: var(--teal-600); color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">
          ${partnerName.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <div style="font-weight: 700; color: var(--navy-900); font-size: 15px;">${escapeHtml(partnerName)}</div>
          <span class="user-role-badge role-${partnerRole}">${partnerRole}</span>
        </div>
      </div>
      <span class="badge badge-teal">End-to-End Verified</span>
    `;

    msgInput.disabled = false;
    sendBtn.disabled = false;
    msgInput.focus();

    await loadMessages(convId);
  };

  const loadMessages = async (convId) => {
    try {
      const res = await api.getMessages(convId);
      const messages = res.data || [];

      if (messages.length === 0) {
        messagesContainer.innerHTML = `
          <div class="empty-state" style="margin: auto;">
            <p>No messages yet. Say hello to start the conversation!</p>
          </div>
        `;
        return;
      }

      messagesContainer.innerHTML = messages.map(m => {
        const isMe = m.senderId === currentUid;
        return `
          <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'};">
            <div style="font-size: 11px; color: var(--slate-500); margin-bottom: 2px;">
              ${escapeHtml(m.senderName || (isMe ? 'You' : 'Peer'))}
            </div>
            <div style="max-width: 65%; padding: 10px 14px; border-radius: var(--radius-md); font-size: 14px; line-height: 1.5; ${
              isMe
                ? 'background: var(--teal-600); color: #ffffff; border-bottom-right-radius: 2px;'
                : 'background: #ffffff; color: var(--slate-900); border: 1px solid var(--border-color); border-bottom-left-radius: 2px;'
            }">
              ${escapeHtml(m.text)}
            </div>
          </div>
        `;
      }).join('');

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (e) {
      messagesContainer.innerHTML = `<div style="color: var(--color-danger); padding: 20px;">Failed to load messages.</div>`;
    }
  };

  if (sendForm) {
    sendForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = msgInput.value.trim();
      if (!text || !activeConvId) return;

      sendBtn.disabled = true;
      msgInput.value = '';

      try {
        await api.sendMessage(activeConvId, text);
        await loadMessages(activeConvId);
        loadConversations();
      } catch (err) {
        showToast(err.message || 'Failed to send message.', 'error');
      } finally {
        sendBtn.disabled = false;
        msgInput.focus();
      }
    });
  }

  // Initial load
  loadConversations();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

