var game = {
	
	model: {
		rows: 0,
		cols: 0,
		gridCount: 0,
		numbers : [],
		distribution : [],
		revealedKeys: [],
	},

	controller: {
		gridCountTemp: 0,
		revealedTemp: false,
		revealedKeyTemp: null,

		//validates user input
		validateDimensions: function(){
			var inp1 = document.getElementsByClassName('grid-size')[0].value;
			var inp2 = document.getElementsByClassName('grid-size')[1].value;

			if(inp1 && inp2 && inp1 > 0 && inp2 > 0){
				document.getElementsByClassName('start-game')[0].removeAttribute('disabled');
			}
			else{
				document.getElementsByClassName('start-game')[0].setAttribute('disabled', true);	
			}
		},
		//returns total number of tiles
		getGridCount: function(){
			return game.model.gridCount;
		},

		//returns shuffled array from model
		getDistributionArray: function(){
			return game.model.distribution;
		},
		
		//generates a random integer between 0 and limit-1
		generateRandomNumber: function(limit){
			return Math.floor(Math.random()*(limit));
		},

		//returns number of columns specified by user
		getColumns: function(){
			return game.model.cols;
		},

		//Generate an array of length equal to gridCount with randomly distributed elements 1 to gridCount/2, repeated exactly twice
		assignRandomKeys: function(){
				game.model.numbers.length = 0;
				game.model.revealedKeys.length = 0;
				game.model.distribution.length = 0;
			for(var i=1; i <= game.model.gridCount/2; i++){
				game.model.numbers.push(i);
				game.model.numbers.push(i);
			}

			this.gridCountTemp = game.model.gridCount;
			for(var i=0; i < game.model.gridCount; i++){
				var randIndex = this.generateRandomNumber(this.gridCountTemp);
				if(game.model.numbers[randIndex] === undefined){
					game.model.distribution.push(-1);
				}else{
					game.model.distribution.push(game.model.numbers[randIndex]);	
				}
				game.model.numbers.splice(randIndex,1);
				--this.gridCountTemp;
			}
		},
		
		//Initializes the whole setup
		startGame: function(isResumed){

			if(!isResumed){
				//clear local storage and table
				if(typeof(Storage) !== 'undefined') {
					localStorage.clear();
					document.getElementById('game-board').innerHTML = '';
					game.view.rowTemp = 0;
					game.view.colTemp = 0;
					game.view.tileTable = '';
				}

				//animations
				setTimeout(function(){
					document.getElementById('user-input-wrapper').classList.add('user-input-animate');
					//document.getElementById('user-input-wrapper').style.marginTop = '50px';	
				}, 200);
				setTimeout(function(){
					document.getElementsByClassName('tile-table')[0].classList.remove('hidden');	
				}, 800);

			}

			game.model.rows = Number(document.getElementsByClassName('grid-size')[0].value);
			game.model.cols = Number(document.getElementsByClassName('grid-size')[1].value);
			game.model.gridCount = game.model.rows * game.model.cols;

			//TO-DO: handle empty NaN inputs, 1x1, 2x2 cases

			game.view.createGameTable();
			if(!isResumed){
				this.assignRandomKeys();
			}
			game.view.fillTiles();

			//reveal tiles based on localstorage
			if(isResumed && game.model.revealedKeys && game.model.revealedKeys.length){
				for(i=0; i < game.model.revealedKeys.length; i++){	
					for(var j=0; j < game.model.gridCount; j++){
						var thisTile = document.getElementsByClassName('tile')[j];
						if(thisTile.getAttribute('data-key') == game.model.revealedKeys[i]){
							thisTile.classList.add('revealed-tile');
						} 
					}
				}
			}
			if(game.model.distribution.length){
				setTimeout(function(){
					document.getElementsByClassName('tile-table')[0].classList.remove('hidden');	
				}, 700);
			}

			//update local storage
			if(typeof(Storage) !== 'undefined') {
				localStorage.setItem('rows', game.model.rows);
				localStorage.setItem('cols', game.model.cols);
				localStorage.setItem('gridCount', game.model.gridCount);
				localStorage.setItem('distribution', game.model.distribution);
			}

			//firefox table overflow issue
			if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && game.model.cols >=10){
			    document.getElementsByClassName('tile-table')[0].classList.add('firefox-overflow');
			}
		},

		shouldRevealOrNot: function(thisObj){

			var gridCount = game.controller.getGridCount();

			if(!thisObj.classList.contains('revealed-tile')){

				//when 1st out of the 2 is selected
				if(!this.revealedTemp){
					this.revealedTemp = true;
					this.revealedKeyTemp = Number(thisObj.getAttribute('data-key'));
					thisObj.classList.add('revealed-tile-temp');

					//incase number of grids are odd and the odd one out comes up
					if(thisObj.getAttribute('data-key') == -1){
						thisObj.classList.add('revealed-tile');
						game.model.revealedKeys.push(-1); //-1 is used to represent this unique value
						if(typeof(Storage) !== 'undefined') {
							localStorage.setItem('revealedKeys', game.model.revealedKeys); 
						}
						this.revealedTemp = false;
						this.revealedKeyTemp = null;
						if(game.model.revealedKeys.length >= gridCount/2){
							game.view.victory();	
						}
					}
				}

				//when 2nd out of the 2 is selected
				else{
					//incase of match
					if(thisObj.getAttribute('data-key') == this.revealedKeyTemp){
						thisObj.classList.add('revealed-tile');
						document.getElementsByClassName('revealed-tile-temp')[0].classList.add('revealed-tile');
						game.model.revealedKeys.push(this.revealedKeyTemp);

						//update local storage
						if(typeof(Storage) !== 'undefined') {
							localStorage.setItem('revealedKeys', game.model.revealedKeys); 
						}

						//TO-DO: notify user incase of victory and clear localstorage
						if(game.model.revealedKeys.length >= gridCount/2){
							game.view.victory();	
						}
					}
					else{
						thisObj.classList.add('revealed-tile-temp');
					}

					this.revealedTemp = false;
					this.revealedKeyTemp = null;
					setTimeout(function(){
						for(var i = 0; i < gridCount; i++){
							document.getElementsByClassName('tile')[i].classList.remove('revealed-tile-temp');
						}
					}, 200);	
				}
			}
		},

		resume: function(){
			if(typeof(Storage) !== 'undefined' && localStorage.length) {
				/**/
				document.getElementById('user-input-wrapper').style.top = '50px';
				game.model.gridCount = Number(localStorage.gridCount);
				game.model.cols = Number(localStorage.cols);
				game.model.rows = Number(localStorage.rows);
				game.model.distribution = localStorage.distribution.split(',');
				for(var i=0; i<game.model.gridCount; i++){
					game.model.distribution[i] = Number(game.model.distribution[i]);
				}
				if(localStorage.revealedKeys){
					game.model.revealedKeys = localStorage.revealedKeys.split(',');	
					for(var i=0; i<game.model.revealedKeys.length; i++){
						game.model.revealedKeys[i] = Number(game.model.revealedKeys[i]);
					}
				}
				document.getElementsByClassName('grid-size')[0].value = game.model.rows;
				document.getElementsByClassName('grid-size')[1].value = game.model.cols;
				this.startGame('isResumed');
			}
		}
	},

	view: {
		rowTemp: 0,
		colTemp: 0,
		tileTable: '',

		//Create an empty table of specified dimensions
		createGameTable: function(){
			this.tileTable = document.createElement('table');
			this.tileTable.className = 'tile-table hidden';
			document.getElementById('game-board').appendChild(this.tileTable);
		},

		//Fill table cells with tiles and random keys (1 to gridSize/2)
		fillTiles: function(){
			var gridCount = game.controller.getGridCount();
			var distributionArray = game.controller.getDistributionArray();
			var columns = game.controller.getColumns();

			for(var i=0; i < gridCount; i++){
				var tileWrapper = document.createElement('section');
				tileWrapper.className = 'tile-wrapper';
				var tile = document.createElement('img');
				tile.className = 'tile';
				tile.setAttribute('data-key', distributionArray[i]);
				var tileKey = document.createElement('span');
				tileKey.classList.add('tile-key');
				tileKey.innerHTML = distributionArray[i];


				if(this.colTemp == 0){
					var row = this.tileTable.insertRow(this.rowTemp);
				}
				else if(this.colTemp >= columns){
					this.colTemp = 0;
					++this.rowTemp;
					var row = this.tileTable.insertRow(this.rowTemp);
				}
				var cell = row.insertCell(this.colTemp);
				++this.colTemp;

				tileWrapper.appendChild(tileKey);
				tileWrapper.appendChild(tile);
				tile.setAttribute('src', 'img/tile.png');
				tile.setAttribute('onclick', 'game.controller.shouldRevealOrNot(this)');
				cell.appendChild(tileWrapper);
			}
		},

		//Notify user on victory and clear localstorage
		victory: function(){
			localStorage.clear();
			document.getElementsByClassName('tile-table')[0].classList.add('tile-victory');
		}
	}
};