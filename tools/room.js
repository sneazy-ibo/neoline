class RoomManager {
  constructor() {
    this.serverIcon = document.getElementById('server-icon');
    this.serverDropdown = document.getElementById('server-dropdown');
    this.roomList = document.getElementById('room-list');
    this.tabs = document.querySelectorAll('.tab');
    this.currentRoomId = document.getElementById('current-room-id');
    
    this.activeHostPrefix = 'all';
    this.isOpen = false;
    
    this.initEventListeners();
  }
  
  initEventListeners() {
    this.serverIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });
    
    document.addEventListener('click', (e) => {
      if (!this.serverDropdown.contains(e.target) && e.target !== this.serverIcon) {
        this.closeDropdown();
      }
    });
    
    window.addEventListener('roomsloaded', () => {
      this.updateCurrentRoomDisplay();
      this.updateTabCounts();
    });
    
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.setActiveTab(tab);
        this.updateRoomList();
      });
    });
  }
  
  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.serverDropdown.classList.toggle('open', this.isOpen);
    
    if (this.isOpen) {
      this.updateRoomList();
    }
  }
  
  closeDropdown() {
    this.isOpen = false;
    this.serverDropdown.classList.remove('open');
  }
  
  setActiveTab(activeTab) {
    this.activeHostPrefix = activeTab.dataset.host;
    this.tabs.forEach(tab => tab.classList.remove('active'));
    activeTab.classList.add('active');
  }
  
  getFilteredRooms() {
    if (!window.rooms?.length) return [];
    
    if (this.activeHostPrefix === 'all') return window.rooms;
    
    return window.rooms.filter(room => {
      const hostPrefix = this.getRoomId(room).split('-')[0];
      return hostPrefix.startsWith(this.activeHostPrefix);
    });
  }
  
  createServerUrl(room) {
    const isSSL = window.location.protocol === 'https:';
    const protocol = isSSL ? 'wss://' : 'ws://';
    const port = isSSL ? (9080 + parseInt(room.roomNumber)) : (8080 + parseInt(room.roomNumber));
    const rawHost = room.host.split(':')[0];
    
    return {
      url: `${protocol}${rawHost}:${port}/`,
      rawHost,
      port
    };
  }
  
  getRoomId(room) {
    const rawHost = room.host.split(':')[0];
    const subdomain = rawHost.split('.')[0].replace('powerline-', '');
    return `${subdomain}-${room.roomID}`;
  }
  
  findCurrentRoom() {
    if (!window.ws || !window.rooms?.length) return null;
    
    return window.rooms.find(room => {
      const { rawHost, port } = this.createServerUrl(room);
      return window.ws.includes(rawHost) && window.ws.includes(`:${port}`);
    });
  }
  
  updateCurrentRoomDisplay() {
    const currentRoom = this.findCurrentRoom();
    if (currentRoom) {
      const roomId = this.getRoomId(currentRoom);
      this.currentRoomId.textContent = `#${roomId}`;
    }
  }
  
  updateTabCounts() {
    if (!window.rooms?.length) {
      this.tabs.forEach(tab => this.setTabCount(tab, 0));
      return;
    }
    
    const counts = { all: window.rooms.length, us: 0, uk: 0, aus: 0 };
    
    window.rooms.forEach(room => {
      const hostPrefix = this.getRoomId(room).split('-')[0];
      if (hostPrefix.startsWith('us')) counts.us++;
      else if (hostPrefix.startsWith('uk')) counts.uk++;
      else if (hostPrefix.startsWith('aus')) counts.aus++;
    });
    
    this.tabs.forEach(tab => {
      const count = counts[tab.dataset.host] || 0;
      this.setTabCount(tab, count);
    });
  }
  
  setTabCount(tab, count) {
    let countSpan = tab.querySelector('.tab-count');
    if (!countSpan) {
      countSpan = document.createElement('span');
      countSpan.className = 'tab-count';
      tab.appendChild(countSpan);
    }
    countSpan.textContent = ` (${count})`;
  }
  
  updateRoomList() {
    const filteredRooms = this.getFilteredRooms();
    
    if (filteredRooms.length === 0) {
      this.showNoRoomsMessage();
      return;
    }
    
    this.roomList.innerHTML = '';
    filteredRooms.forEach(room => this.addRoomToList(room));
  }
  
  showNoRoomsMessage() {
    const messages = {
      all: 'No servers available',
      us: 'No US servers available', 
      uk: 'No UK servers available',
      aus: 'No AUS servers available'
    };
    
    const message = messages[this.activeHostPrefix] || 'No servers available';
    this.roomList.innerHTML = `<div class="no-rooms">${message}</div>`;
  }
  
  addRoomToList(room) {
    const { url } = this.createServerUrl(room);
    const roomId = this.getRoomId(room);
    const isCurrentServer = window.ws?.includes(url.split('://')[1].split('/')[0]);
    
    const roomItem = document.createElement('div');
    roomItem.className = `room-item${isCurrentServer ? ' current-server' : ''}`;
    roomItem.innerHTML = `
      <div class="room-info">
        <span><span class="room-cc">${room.cc.toUpperCase()}</span> <span class="room-id">#${roomId}</span></span>
        <span>Room: ${room.roomNumber}</span>
      </div>
    `;
    
    roomItem.addEventListener('click', () => this.switchServer(url, roomId));
    this.roomList.appendChild(roomItem);
  }
  
  switchServer(serverUrl, roomId) {
    window.ws = serverUrl;
    console.log('Switching to server:', serverUrl);
    
    if (window.isInGame) {
      window.network.leave();
    }
    if (window.network?.disconnect) {
      window.network.disconnect();
    }
    
    this.currentRoomId.textContent = `#${roomId}`;
    this.closeDropdown();
  }
}

new RoomManager();