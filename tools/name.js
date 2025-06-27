class NicknameDropdown {
	constructor() {
		this.nickInputContainer = document.getElementById('nickInput');
		this.nickBookSvg = document.getElementById('nicknameBook');
		this.refreshSvg = document.getElementById('refreshSvg');
		this.nickInput = document.getElementById('nick');
		this.nameDropdown = document.getElementById('name-dropdown');
		this.firstNameList = document.getElementById('first-name-list');
		this.lastNameList = document.getElementById('last-name-list');
		
		this.nicks = window.localStorage.nickIndexes?.split(',').map(Number) || [0, 0];
		this.rotationAngle = 0;
		this.scrambleIterations = 12;
		this.lastUpdateType = 'both';
		window.nicks = this.nicks;
		
		this.init();
	}
	
	init() {
		this.nickInputContainer.style.position = 'relative';
		this.nickInput.style.cursor = 'pointer';
		this.bindEvents();
		if (window.first && window.second) this.updateNickname();
	}
	
	bindEvents() {
		[this.nickBookSvg, this.nickInput].forEach(el => el?.addEventListener('click', e => {
			e.preventDefault();
			this.toggleDropdown();
		}));
		
		this.refreshSvg?.addEventListener('click', e => {
			e.preventDefault();
			this.randomizeNicks();
		});
		
		this.nickInput.addEventListener('keydown', e => {
			if (e.key === 'Enter') {
				this.closeDropdown();
				clickPlay(this.nickInput.value);
				return false;
			}
		});
		
		this.nickInput.addEventListener('selectstart', e => e.preventDefault());
		
		document.addEventListener('click', e => {
			if (![this.nickInput, this.nameDropdown, this.nickBookSvg].some(el => el?.contains(e.target))) {
				this.closeDropdown();
			}
		});
		
		document.querySelectorAll('.name-tab').forEach(tab => {
			tab.addEventListener('click', () => {
				document.querySelectorAll('.name-tab, .name-list').forEach(el => el.classList.remove('active'));
				tab.classList.add('active');
				document.getElementById(`${tab.dataset.tab}-name-list`).classList.add('active');
			});
		});
	}
	
	toggleDropdown() {
		const isVisible = this.nameDropdown.classList.contains('show');
		this.animateNicknameBook(!isVisible);
		isVisible ? this.closeDropdown() : this.openDropdown();
	}
	
	openDropdown() {
		this.nameDropdown.style.display = 'block';
		this.nameDropdown.offsetHeight;
		this.nameDropdown.classList.add('show');
		if (!this.firstNameList.innerHTML) this.populateNameLists();
	}
	
	closeDropdown() {
		this.nameDropdown.classList.remove('show');
		setTimeout(() => {
			if (!this.nameDropdown.classList.contains('show')) this.nameDropdown.style.display = 'none';
		}, 300);
	}
	
	updateNickname() {
		if (!window.first?.length || !window.second?.length) return;
		
		this.nicks = this.nicks.map((nick, i) => Math.max(0, Math.min(nick, [window.first, window.second][i].length - 1)));
		const newNickname = `${window.first[this.nicks[0]]} ${window.second[this.nicks[1]]}`;
		
		if (this.nickInput.value !== newNickname) {
			this.animateTextScramble(newNickname, this.lastUpdateType);
		} else {
			this.nickInput.value = newNickname;
		}
		
		window.localStorage.nickIndexes = this.nicks.join(',');
		window.nicks = this.nicks;
		this.highlightSelectedNames();
		this.lastUpdateType = 'both';
	}
	
	highlightSelectedNames() {
		document.querySelectorAll('.name-item').forEach(item => item.classList.remove('selected'));
		[this.firstNameList, this.lastNameList].forEach((list, i) => {
			list.querySelectorAll('.name-item').forEach(item => {
				if (parseInt(item.dataset.index) === this.nicks[i]) item.classList.add('selected');
			});
		});
	}
	
	populateNameLists() {
		this.populateNameList(window.first, this.firstNameList, 0);
		this.populateNameList(window.second, this.lastNameList, 1);
		this.highlightSelectedNames();
	}
	
	populateNameList(names, container, nicksIndex) {
		if (!names?.length) return;
		
		container.innerHTML = '';
		const sortedNames = names.map((name, index) => ({ name, originalIndex: index }))
			.sort((a, b) => a.name.localeCompare(b.name));
		
		const columns = [[], [], []];
		sortedNames.forEach((nameObj, i) => columns[i % 3].push(nameObj));
		
		columns.forEach(columnNames => {
			const column = document.createElement('div');
			column.className = 'name-column';
			
			columnNames.forEach(nameObj => {
				const nameItem = document.createElement('div');
				nameItem.className = 'name-item';
				nameItem.textContent = nameObj.name;
				nameItem.dataset.index = nameObj.originalIndex;
				
				nameItem.addEventListener('click', () => {
					const oldIndex = this.nicks[nicksIndex];
					this.nicks[nicksIndex] = parseInt(nameItem.dataset.index);
					if (oldIndex !== this.nicks[nicksIndex]) {
						this.lastUpdateType = nicksIndex === 0 ? 'first' : 'last';
						this.updateNickname();
					}
				});
				
				column.appendChild(nameItem);
			});
			
			container.appendChild(column);
		});
	}

	randomizeNicks() {
		if (!window.first?.length || !window.second?.length) return;
		
		this.nicks = [Math.floor(Math.random() * window.first.length), Math.floor(Math.random() * window.second.length)];
		this.lastUpdateType = 'both';
		this.updateNickname();
		this.animateRefreshButton();
	}

	animateRefreshButton() {
		if (!this.refreshSvg) return;
		this.rotationAngle += 360;
		this.refreshSvg.style.transform = `rotate(${this.rotationAngle}deg)`;
	}

	animateNicknameBook(isOpening) {
		if (!this.nickBookSvg) return;
		const rotation = isOpening ? 'rotateY(360deg)' : 'rotateY(180deg)';
		this.nickBookSvg.style.transform = `scale(0.95) ${rotation}`;
		setTimeout(() => this.nickBookSvg.style.transform = '', 300);
	}

	animateTextScramble(targetText, updateType = 'both') {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
		const originalText = this.nickInput.value;
		let iterations = 0;
		
		const scrambleText = (text, iterations) => 
			text.split('').map((char, i) => 
				iterations >= i * 2 ? char : chars[Math.floor(Math.random() * chars.length)]
			).join('');
		
		const parseNames = (text) => {
			const spaceIndex = text.indexOf(' ');
			return spaceIndex === -1 
				? [text, ''] 
				: [text.substring(0, spaceIndex), text.substring(spaceIndex + 1)];
		};
		
		const getAnimatedText = (iterations) => {
			if (updateType === 'both') {
				return scrambleText(targetText, iterations);
			}
			
			const [originalFirst, originalLast] = parseNames(originalText);
			const [targetFirst, targetLast] = parseNames(targetText);
			
			const animatedFirst = updateType === 'first' ? scrambleText(targetFirst, iterations) : originalFirst;
			const animatedLast = updateType === 'last' ? scrambleText(targetLast, iterations) : originalLast;
			
			return animatedLast ? `${animatedFirst} ${animatedLast}` : animatedFirst;
		};
		
		const interval = setInterval(() => {
			this.nickInput.value = getAnimatedText(iterations);
			
			if (++iterations >= this.scrambleIterations) {
				clearInterval(interval);
				this.nickInput.value = targetText;
			}
		}, 50);
	}
}

new NicknameDropdown();