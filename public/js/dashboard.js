// 控制台页面 JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const sessionId = localStorage.getItem('sessionId');
  
  // 检查登录状态
  if (!sessionId) {
    window.location.href = '/login';
    return;
  }

  // API 请求封装
  async function apiRequest(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${sessionId}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, { ...options, ...defaultOptions });
      const result = await response.json();
      
      if (response.status === 401) {
        localStorage.removeItem('sessionId');
        window.location.href = '/login';
        return null;
      }
      
      return result;
    } catch (error) {
      console.error('API 请求错误:', error);
      showMessage('网络错误，请重试', 'error');
      return null;
    }
  }

  // 显示消息
  function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
  }

  // 显示详细错误消息（支持多行和建议）
  function showDetailedMessage(title, details, type = 'info') {
    const messageDiv = document.getElementById('message');
    
    let content = `<strong>${title}</strong>`;
    if (details && Array.isArray(details) && details.length > 0) {
      content += '<br><br>详细信息：';
      details.forEach(detail => {
        content += `<br>• ${detail}`;
      });
    } else if (details) {
      content += `<br><br>${details}`;
    }
    
    messageDiv.innerHTML = content;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // 10秒后自动隐藏（详细消息需要更长时间阅读）
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 10000);
  }

  // 标签页切换
  function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // 更新按钮状态
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // 更新内容显示
        tabContents.forEach(content => {
          content.classList.remove('active');
          content.style.display = 'none';
        });
        
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
          targetContent.classList.add('active');
          targetContent.style.display = 'block';
        }
        
        // 加载对应标签页的数据
        loadTabData(targetTab);
      });
    });
  }

  // 加载标签页数据
  async function loadTabData(tab) {
    switch (tab) {
      case 'config':
        await loadConfig();
        break;
      case 'subscriptions':
        await loadSubscriptions();
        break;
      case 'posts':
        await loadPosts();
        break;
      case 'stats':
        await loadStats();
        break;
    }
  }

  // 加载配置
  async function loadConfig() {
    const result = await apiRequest('/api/config');
    if (result && result.success) {
      const config = result.data;
      
      // 更新 Bot Token 状态
      const botTokenStatus = document.getElementById('botTokenStatus');
      const botToken = document.getElementById('botToken');
      if (config.bot_token) {
        botToken.value = config.bot_token;
        botTokenStatus.textContent = '已配置';
        botTokenStatus.style.background = '#4caf50';
        botTokenStatus.textContent = '已配置';
        botTokenStatus.style.background = '#4caf50';
        
        // 显示 Bot 信息并获取详细状态
        await loadTelegramStatus();
      } else {
        botTokenStatus.textContent = '未配置';
        botTokenStatus.style.background = '#dc3545';
        
        // 隐藏 Bot 信息和绑定信息
        const botInfoDisplay = document.getElementById('botInfoDisplay');
        const bindingInfo = document.getElementById('bindingInfo');
        if (botInfoDisplay) botInfoDisplay.style.display = 'none';
        if (bindingInfo) bindingInfo.style.display = 'none';
      }
      
      // 更新推送设置
      const stopPushCheckbox = document.getElementById('stopPush');
      const onlyTitleCheckbox = document.getElementById('onlyTitle');
      if (stopPushCheckbox) stopPushCheckbox.checked = config.stop_push === 1;
      if (onlyTitleCheckbox) onlyTitleCheckbox.checked = config.only_title === 1;
    }
  }

  // 加载 Telegram 状态
  async function loadTelegramStatus() {
    const result = await apiRequest('/api/telegram/status');
    if (result && result.success) {
      const status = result.data;
      
      // 更新 Bot 状态显示
      const botStatus = document.getElementById('botStatus');
      if (status.connected) {
        botStatus.textContent = '正常运行';
        botStatus.style.color = '#4caf50';
      } else {
        botStatus.textContent = 'Token无效';
        botStatus.style.color = '#f44336';
      }
      
      // 显示/隐藏 Bot 信息
      const botInfoDisplay = document.getElementById('botInfoDisplay');
      if (status.configured && status.connected && status.bot_info) {
        botInfoDisplay.style.display = 'block';
        
        // 更新 Bot 信息
        document.getElementById('botId').textContent = status.bot_info.id;
        document.getElementById('botUsername').textContent = '@' + status.bot_info.username;
        document.getElementById('botName').textContent = status.bot_info.first_name;
        
        // 重新绑定按钮事件（因为按钮现在可见了）
        await setupTelegramButtons();
      } else {
        botInfoDisplay.style.display = 'none';
      }
      
      // 更新用户绑定状态
      const bindingStatus = document.getElementById('bindingStatus');
      const bindingInfo = document.getElementById('bindingInfo');
      const bindingInstructions = document.getElementById('bindingInstructions');
      
      if (status.bound && status.config.has_chat_id) {
        bindingStatus.textContent = '已绑定';
        bindingStatus.style.background = '#4caf50';
        
        // 显示绑定信息
        bindingInfo.style.display = 'block';
        bindingInstructions.style.display = 'none';
        
        // 更新绑定信息
        document.getElementById('boundUserName').textContent = status.config.bound_user_name || '未知';
        document.getElementById('boundUsername').textContent = status.config.bound_user_username ? '@' + status.config.bound_user_username : '无';
        document.getElementById('boundChatId').textContent = status.config.has_chat_id ? '已设置' : '未设置';
        document.getElementById('bindingTime').textContent = status.config.last_check_time ? new Date(status.config.last_check_time).toLocaleString() : '未知';
        
        // 重新绑定按钮事件（因为按钮现在可见了）
        await setupTelegramButtons();
      } else {
        bindingStatus.textContent = '未绑定';
        bindingStatus.style.background = '#dc3545';
        
        // 隐藏绑定信息，显示说明
        bindingInfo.style.display = 'none';
        bindingInstructions.style.display = 'block';
      }
    }
  }

  // 加载订阅列表
  async function loadSubscriptions() {
    const result = await apiRequest('/api/subscriptions');
    if (result && result.success) {
      const subscriptions = result.data;
      const subscriptionsList = document.getElementById('subscriptionsList');
      
      if (subscriptions.length === 0) {
        subscriptionsList.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; color: #999;">
            📝 暂无订阅记录<br>
            <small>使用上方表单添加新的关键词订阅</small>
          </div>
        `;
      } else {
        subscriptionsList.innerHTML = subscriptions.map(sub => `
          <div class="subscription-item">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <h4 style="margin: 0; flex: 1; color: #333; font-size: 15px;">
                订阅 #${sub.id}
              </h4>
              <button onclick="deleteSubscription(${sub.id})" style="padding: 4px 8px; font-size: 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                删除
              </button>
            </div>
            ${sub.keyword1 || sub.keyword2 || sub.keyword3 ? `
              <div style="background: #e3f2fd; padding: 4px 8px; border-radius: 3px; font-size: 12px; color: #1976d2; margin-bottom: 6px;">
                🔍 ${[sub.keyword1, sub.keyword2, sub.keyword3].filter(k => k).join(' + ')}
              </div>
            ` : ''}
            ${sub.creator ? `<div style="font-size: 11px; color: #666;">👤 创建者: ${sub.creator}</div>` : ''}
            ${sub.category ? `<div style="font-size: 11px; color: #666;">📂 分类: ${sub.category}</div>` : ''}
          </div>
        `).join('');
      }
    }
  }

  // 加载文章列表（支持分页和搜索）
  let currentPage = 1;
  let currentFilters = {};
  
  async function loadPosts(page = 1, filters = {}) {
    currentPage = page;
    currentFilters = filters;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== undefined))
    });
    
    const result = await apiRequest(`/api/posts?${params}`);
    if (result && result.success) {
      const { posts, total, page: currentPageNum, totalPages } = result.data;
      const postsList = document.getElementById('postsList');
      
      // 更新统计信息
      const postsStats = document.getElementById('postsStats');
      const postsStatsText = document.getElementById('postsStatsText');
      postsStatsText.textContent = `找到 ${total} 条记录，当前显示第 ${currentPageNum} 页，共 ${totalPages} 页`;
      postsStats.style.display = 'block';
      
      if (posts.length === 0) {
        postsList.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; color: #999;">
            📰 ${Object.keys(filters).length > 0 ? '没有找到符合条件的文章' : '暂无文章数据'}<br>
            <small>${Object.keys(filters).length > 0 ? '试试调整搜索条件' : '点击"更新RSS"按钮获取最新文章'}</small>
          </div>
        `;
        document.getElementById('pagination').style.display = 'none';
      } else {
        postsList.innerHTML = posts.map(post => {
          const statusText = post.push_status === 0 ? '未推送' : post.push_status === 1 ? '已推送' : '无需推送';
          const statusColor = post.push_status === 0 ? '#ff9800' : post.push_status === 1 ? '#4caf50' : '#999';
          
          return `
            <div class="post-item">
              <h4 style="margin-bottom: 8px; color: #333; font-size: 15px;">
                <a href="https://www.nodeseek.com/post-${post.post_id}-1" target="_blank" style="color: #1976d2; text-decoration: none;">
                  ${post.title}
                </a>
              </h4>
              <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                👤 ${post.creator} | 📂 ${post.category} | 📅 ${new Date(post.pub_date).toLocaleString()}
              </div>
              <div style="font-size: 12px; color: ${statusColor}; font-weight: 500;">
                状态: ${statusText}
              </div>
            </div>
          `;
        }).join('');
        
        // 更新分页控件
        updatePagination(currentPageNum, totalPages, total);
      }
    }
  }

  // 更新分页控件
  function updatePagination(currentPageNum, totalPages, total) {
    const pagination = document.getElementById('pagination');
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageNumbers = document.getElementById('pageNumbers');
    
    // 更新信息文本
    paginationInfo.textContent = `第 ${currentPageNum} 页，共 ${total} 条记录`;
    
    // 更新按钮状态
    prevBtn.disabled = currentPageNum <= 1;
    nextBtn.disabled = currentPageNum >= totalPages;
    
    // 生成页码按钮
    pageNumbers.innerHTML = '';
    if (totalPages <= 7) {
      // 总页数少，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.appendChild(createPageButton(i, i === currentPageNum));
      }
    } else {
      // 总页数多，显示省略号逻辑
      pageNumbers.appendChild(createPageButton(1, currentPageNum === 1));
      
      if (currentPageNum > 3) {
        pageNumbers.appendChild(createEllipsis());
      }
      
      const start = Math.max(2, currentPageNum - 1);
      const end = Math.min(totalPages - 1, currentPageNum + 1);
      
      for (let i = start; i <= end; i++) {
        pageNumbers.appendChild(createPageButton(i, i === currentPageNum));
      }
      
      if (currentPageNum < totalPages - 2) {
        pageNumbers.appendChild(createEllipsis());
      }
      
      if (totalPages > 1) {
        pageNumbers.appendChild(createPageButton(totalPages, currentPageNum === totalPages));
      }
    }
    
    pagination.style.display = 'flex';
  }
  
  // 创建页码按钮
  function createPageButton(pageNum, isActive) {
    const button = document.createElement('button');
    button.textContent = pageNum;
    button.style.cssText = `
      padding: 8px 12px; 
      border: 1px solid #ddd; 
      border-radius: 4px; 
      cursor: pointer; 
      font-size: 14px;
      background: ${isActive ? '#2196f3' : '#f5f5f5'};
      color: ${isActive ? 'white' : '#333'};
    `;
    if (!isActive) {
      button.addEventListener('click', () => loadPosts(pageNum, currentFilters));
    }
    return button;
  }
  
  // 创建省略号
  function createEllipsis() {
    const span = document.createElement('span');
    span.textContent = '...';
    span.style.cssText = 'padding: 8px 4px; color: #999; font-size: 14px;';
    return span;
  }

  // 防抖函数
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 加载统计信息
  async function loadStats() {
    const result = await apiRequest('/api/stats');
    if (result && result.success) {
      const stats = result.data;
      
      // 更新统计数字
      document.getElementById('statTotalPosts').textContent = stats.total_posts;
      document.getElementById('statPushedPosts').textContent = stats.pushed_posts;
      document.getElementById('statUnpushedPosts').textContent = stats.unpushed_posts;
      document.getElementById('statSubscriptions').textContent = stats.total_subscriptions;
    }
  }

  // 更新状态卡片
  async function updateStatusCards() {
    const result = await apiRequest('/api/stats');
    if (result && result.success) {
      const stats = result.data;
      
      document.getElementById('activeSubscriptions').textContent = stats.total_subscriptions;
      document.getElementById('todayMessages').textContent = stats.today_messages;
      document.getElementById('totalPosts').textContent = stats.total_posts;
    }
  }

  // Bot Token 表单提交
  const botTokenForm = document.getElementById('botTokenForm');
  if (botTokenForm) {
    botTokenForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(botTokenForm);
      const botToken = formData.get('botToken');
      const webhookUrl = formData.get('webhookUrl');
      
      if (!botToken) {
        showMessage('请输入 Bot Token', 'error');
        return;
      }
      
      const requestData = { bot_token: botToken };
      if (webhookUrl && webhookUrl.trim()) {
        requestData.webhook_url = webhookUrl.trim();
      }
      
      showMessage('正在设置 Bot Token...', 'info');
      
      const result = await apiRequest('/api/bot-token', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      if (result && result.success) {
        // 检查 webhook 设置状态
        if (result.data.webhook_set) {
          showMessage('Bot Token 和 Webhook 设置成功', 'success');
        } else if (result.data.webhook_error && result.data.webhook_suggestions) {
          // 显示详细的 webhook 错误信息
          showDetailedMessage(
            'Bot Token 设置成功，但 Webhook 设置失败',
            result.data.webhook_suggestions,
            'warning'
          );
        } else {
          showMessage('Bot Token 设置成功，但 Webhook 设置失败', 'warning');
        }
        
        await loadConfig();
        // Bot 信息显示更新后，更新按钮绑定
        await setupTelegramButtons();
      } else {
        showMessage(result?.message || 'Bot Token 设置失败', 'error');
      }
    });
  }

  // 设置 Telegram 相关按钮事件
  async function setupTelegramButtons() {
    // 测试连接按钮
    const testBotBtn = document.getElementById('testBotBtn');
    if (testBotBtn) {
      testBotBtn.onclick = async function() {
        showMessage('正在测试连接...', 'info');
        
        const result = await apiRequest('/api/telegram/test', {
          method: 'POST'
        });
        
        if (result && result.success) {
          showMessage(result.message || 'Bot 连接测试成功', 'success');
        } else {
          showMessage(result?.message || 'Bot 连接测试失败', 'error');
        }
      };
    }

    // 刷新状态按钮
    const refreshBotStatusBtn = document.getElementById('refreshBotStatusBtn');
    if (refreshBotStatusBtn) {
      refreshBotStatusBtn.onclick = async function() {
        showMessage('正在刷新状态...', 'info');
        await loadTelegramStatus();
        showMessage('状态已刷新', 'success');
      };
    }

    // 发送测试消息按钮
    const sendTestMsgBtn = document.getElementById('sendTestMsgBtn');
    if (sendTestMsgBtn) {
      sendTestMsgBtn.onclick = async function() {
        const message = prompt('请输入测试消息内容（可选）：');
        
        const result = await apiRequest('/api/telegram/send-test', {
          method: 'POST',
          body: JSON.stringify({ message: message || undefined })
        });
        
        if (result && result.success) {
          showMessage('测试消息发送成功', 'success');
        } else {
          showMessage(result?.message || '测试消息发送失败', 'error');
        }
      };
    }

    // 解除绑定按钮
    const unbindUserBtn = document.getElementById('unbindUserBtn');
    if (unbindUserBtn) {
      unbindUserBtn.onclick = async function() {
        if (!confirm('确定要解除用户绑定吗？解除后将无法接收推送消息。')) {
          return;
        }
        
        const result = await apiRequest('/api/telegram/unbind', {
          method: 'POST'
        });
        
        if (result && result.success) {
          showMessage('用户绑定已解除', 'success');
          await loadTelegramStatus();
        } else {
          showMessage(result?.message || '解除绑定失败', 'error');
        }
      };
    }
  }

  // 推送设置表单提交
  const pushSettingsForm = document.getElementById('pushSettingsForm');
  if (pushSettingsForm) {
    pushSettingsForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(pushSettingsForm);
      const data = {
        stop_push: formData.get('stopPush') === 'on' ? 1 : 0,
        only_title: formData.get('onlyTitle') === 'on' ? 1 : 0
      };
      
      const result = await apiRequest('/api/config', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      if (result && result.success) {
        showMessage('推送设置保存成功', 'success');
      } else {
        showMessage(result?.message || '推送设置保存失败', 'error');
      }
    });
  }

  // 添加订阅表单提交
  const addSubForm = document.getElementById('addSubForm');
  if (addSubForm) {
    addSubForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(addSubForm);
      const data = {
        keyword1: formData.get('keyword1') || undefined,
        keyword2: formData.get('keyword2') || undefined,
        keyword3: formData.get('keyword3') || undefined,
        creator: formData.get('creator') || undefined,
        category: formData.get('category') || undefined
      };
      
      // 检查是否至少有一个条件
      if (!data.keyword1 && !data.keyword2 && !data.keyword3 && !data.creator && !data.category) {
        showMessage('请至少填写一个关键词或选择创建者/分类', 'error');
        return;
      }
      
      const result = await apiRequest('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (result && result.success) {
        showMessage('订阅添加成功', 'success');
        addSubForm.reset();
        await loadSubscriptions();
        await updateStatusCards();
      } else {
        showMessage(result?.message || '订阅添加失败', 'error');
      }
    });
  }

  // 删除订阅
  window.deleteSubscription = async function(id) {
    if (!confirm('确定要删除这个订阅吗？')) {
      return;
    }
    
    const result = await apiRequest(`/api/subscriptions/${id}`, {
      method: 'DELETE'
    });
    
    if (result && result.success) {
      showMessage('订阅删除成功', 'success');
      await loadSubscriptions();
      await updateStatusCards();
    } else {
      showMessage(result?.message || '订阅删除失败', 'error');
    }
  };

  // 刷新文章按钮
  const refreshPostsBtn = document.getElementById('refreshPostsBtn');
  if (refreshPostsBtn) {
    refreshPostsBtn.addEventListener('click', async function() {
      await loadPosts();
      showMessage('文章列表已刷新', 'success');
    });
  }

  // 更新RSS按钮
  const updateRssBtn = document.getElementById('updateRssBtn');
  if (updateRssBtn) {
    updateRssBtn.addEventListener('click', async function() {
      showMessage('正在更新RSS...', 'info');
      
      const result = await apiRequest('/api/rss/fetch', {
        method: 'POST'
      });
      
      if (result && result.success) {
        showMessage(`RSS更新成功，新增 ${result.data.new} 篇文章`, 'success');
        await loadPosts();
        await updateStatusCards();
      } else {
        showMessage(result?.message || 'RSS更新失败', 'error');
      }
    });
  }

  // 退出登录按钮
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
      if (confirm('确定要退出登录吗？')) {
        try {
          // 先调用服务器端注销API
          const result = await apiRequest('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ sessionId: sessionId })
          });
          
          if (result && result.success) {
            console.log('服务器端session已清理');
          } else {
            console.warn('服务器端session清理失败:', result?.message);
          }
        } catch (error) {
          console.error('注销API调用失败:', error);
        } finally {
          // 无论服务器端清理是否成功，都清除本地存储并跳转
          localStorage.removeItem('sessionId');
          window.location.href = '/login';
        }
      }
    });
  }

  // 搜索表单事件处理
  const postsFilterForm = document.getElementById('postsFilterForm');
  if (postsFilterForm) {
    // 防抖搜索
    const debouncedSearch = debounce(performSearch, 500);
    
    postsFilterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      performSearch();
    });
    
    // 实时搜索（输入时触发）
    const searchInputs = postsFilterForm.querySelectorAll('input, select');
    searchInputs.forEach(input => {
      input.addEventListener('input', debouncedSearch);
    });
    
    function performSearch() {
      const formData = new FormData(postsFilterForm);
      const filters = {
        search: formData.get('searchTitle')?.trim() || '',
        pushStatus: formData.get('filterStatus') || '',
        creator: formData.get('filterCreator')?.trim() || '',
        category: formData.get('filterCategory')?.trim() || ''
      };
      
      // 过滤空值
      Object.keys(filters).forEach(key => {
        if (filters[key] === '') {
          delete filters[key];
        }
      });
      
      loadPosts(1, filters);
    }
  }
  
  // 清空筛选按钮
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', function() {
      document.getElementById('searchTitle').value = '';
      document.getElementById('filterStatus').value = '';
      document.getElementById('filterCreator').value = '';
      document.getElementById('filterCategory').value = '';
      loadPosts(1, {});
    });
  }
  
  // 分页按钮事件
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', function() {
      if (currentPage > 1) {
        loadPosts(currentPage - 1, currentFilters);
      }
    });
  }
  
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', function() {
      loadPosts(currentPage + 1, currentFilters);
    });
  }

  // 刷新文章列表按钮
  const refreshPostsBtn = document.getElementById('refreshPostsBtn');
  if (refreshPostsBtn) {
    refreshPostsBtn.addEventListener('click', async function() {
      await loadPosts(currentPage, currentFilters);
      showMessage('文章列表已刷新', 'success');
    });
  }

  // 初始化
  initTabs();
  updateStatusCards();
  loadConfig();
  
  // 自动填充 webhook URL
  const webhookUrlInput = document.getElementById('webhookUrl');
  if (webhookUrlInput && !webhookUrlInput.value) {
    const currentUrl = new URL(window.location.href);
    const webhookUrl = `${currentUrl.protocol}//${currentUrl.host}/telegram/webhook`;
    webhookUrlInput.value = webhookUrl;
  }
  
  // 延迟设置 Telegram 按钮，等待 DOM 更新
  setTimeout(setupTelegramButtons, 500);
});