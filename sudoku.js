const mainElement = document.querySelector( 'body main' );
const statusElement = document.createElement( 'div' );
mainElement.appendChild( statusElement );
const logElement = document.createElement( 'div' );
mainElement.appendChild( logElement );

let puzzles = [
	puzzleFromString('080790000690000800005008090500006080000400300000070002050000010001300700800020004'), // Weekly unsolvable (4-Aug-2018)
	puzzleFromString('000700000690000800005008090500006080000400300100070002050000010001300700008020004'), // Weekly unsolvable (11-Aug-2018)

	puzzleFromString('050000080800296000600805003190000000024000360000000015400309001000651004010000070'),

	[// Quest
		6, 0, 0, 0, 5, 0, 4, 0, 0,
		0, 0, 0, 0, 0, 7, 0, 2, 6,
		3, 0, 0, 0, 0, 0, 0, 9, 8,
		0, 0, 4, 2, 0, 5, 3, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 8, 4, 0, 3, 7, 0, 0,
		2, 6, 0, 0, 0, 0, 0, 0, 4,
		4, 9, 0, 8, 0, 0, 0, 0, 0,
		0, 0, 1, 0, 9, 0, 0, 0, 3
	],
	[// expert 2?
		9, 4, 0, 0, 0, 0, 2, 0, 8,
		8, 0, 0, 6, 4, 2, 9, 1, 7,
		7, 1, 0, 9, 0, 3, 0, 5, 0,
		6, 0, 0, 0, 0, 0, 4, 0, 0,
		0, 8, 0, 7, 9, 0, 0, 0, 2,
		0, 0, 0, 0, 0, 0, 7, 0, 0,
		1, 2, 0, 4, 0, 6, 8, 7, 9,
		0, 0, 0, 0, 0, 0, 0, 4, 0,
		0, 0, 8, 0, 7, 0, 1, 2, 0
	], [// expert 1
		0, 0, 0, 7, 0, 0, 0, 0, 1,
		0, 0, 5, 4, 0, 0, 7, 9, 0,
		0, 1, 0, 0, 5, 2, 6, 0, 0,
		5, 0, 0, 0, 0, 0, 2, 3, 0,
		1, 0, 0, 0, 0, 9, 4, 5, 0,
		0, 0, 4, 0, 0, 7, 0, 0, 0,
		6, 9, 0, 0, 2, 5, 0, 0, 0,
		4, 0, 0, 6, 9, 0, 0, 7, 0,
		0, 5, 0, 0, 0, 0, 0, 0, 2
	], [// ervaren 2 multiple solutions
		5, 7, 9, 1, 2, 0, 0, 0, 0,
		0, 0, 0, 0, 5, 0, 0, 8, 9,
		0, 6, 8, 3, 7, 9, 0, 2, 5,
		9, 0, 0, 0, 1, 2, 0, 0, 0,
		8, 0, 5, 6, 4, 7, 0, 0, 2,
		7, 0, 0, 0, 0, 5, 0, 0, 0,
		0, 9, 7, 0, 0, 3, 4, 5, 0,
		0, 0, 4, 5, 0, 1, 2, 9, 7,
		2, 0, 0, 0, 9, 0, 0, 0, 0
	], [// ervaren 1 multiple solutions
		5, 0, 0, 3, 6, 0, 1, 0, 4,
		0, 6, 0, 0, 0, 9, 0, 0, 0,
		0, 0, 0, 0, 5, 7, 8, 0, 6,
		9, 4, 0, 0, 0, 0, 0, 0, 0,
		0, 3, 0, 6, 1, 0, 0, 0, 9,
		7, 0, 2, 9, 0, 0, 5, 6, 0,
		0, 0, 0, 2, 8, 0, 0, 1, 5,
		0, 0, 0, 0, 9, 0, 0, 7, 0,
		2, 5, 1, 7, 0, 0, 0, 8, 3
	]
];

let puzzle = puzzles[0];

main( puzzle );

function createState( puzzle )
{
	return puzzle.map( n => n ? [n] : all() );
}

function main( puzzle )
{
	let state = createState( puzzle );

	let oldRemaining = puzzle.length;
	let remaining;
	for ( let i = 0; i < 20; i++ )
	{
		remaining = state.length - countSolved( state );

		logGrid( state, puzzle );
		log( remaining + ' remaining' );

		if ( remaining === 0 )
		{
			break;
		}

		if ( remaining === oldRemaining )
		{
			break;
		}

		oldRemaining = remaining;

		try
		{
			state = step( state );
		}
		catch ( e )
		{
			log( e.stack );
		}
	}

	let solutions;
	if ( remaining )
	{
		{
			log( 'Using A*...' );
			solutions = solveAStar( state, remaining, 100 );
		}
	}
	else
	{
		solutions = [state];
	}


	const start = performance.now();

	function printNext( first )
	{
		const next = solutions.next();
		let nextState = null;

		if ( next.value )
		{
			if ( typeof next.value === 'object' )
			{
				nextState = next.value;

				const end = performance.now();

				const grid = createGrid( {state: next.value, puzzle: puzzle, diffWith: first} );

				const tinyGridLabel = document.createElement( 'label' );
				tinyGridLabel.appendChild( document.createTextNode( (Math.round( end - start ) / 1000) + ' seconds' ) );

				const tinyGridWrapper = document.createElement( 'div' );
				tinyGridWrapper.className = 'tiny';
				tinyGridWrapper.appendChild( grid );
				tinyGridWrapper.appendChild( tinyGridLabel );
				logElement.appendChild( tinyGridWrapper );

				logPuzzleString( stateToString( next.value ) );
			}
			else
			{
				status( String( next.value ) );
			}
		}

		if ( next.done )
		{
			log( 'Done' );
		}
		else
		{
			setTimeout( () => printNext( first || nextState ), 10 );
		}
	}

	printNext();
}

function* solveAStar( start )
{
	start.string = stateToString( start );
	start.remaining = start.length - countSolved( start );

	const openSet = new Set();
	const closedSet = new Set();

	const openQueue = [ start ];
	openSet.add( start.string );

	let solutionCount = 0;
	let iterationCount = 0;

	while ( openQueue.length )
	{
		const current = openQueue[ 0 ];
		openQueue.splice( 0, 1 );
		openSet.delete( current.string );

		closedSet.add( current.string );

		for ( let i = 0; i < current.length; i++ )
		{
			if ( current[i].length > 1 )
			{
				for ( let j = 0; j < current[i].length; j++ )
				{
					let neighbour = current.slice();
					neighbour[i] = [neighbour[i][j]];
					checkCell( neighbour, i % 9, ( i - i % 9 ) / 9 );
					if ( !neighbour[ i ].length )
					{
						// console.info( 'from current ', current );
						// console.info( "state was invalid, producing neighbour ", neighbour, " by setting ", current[i][j], " at ", i );
						throw new Error();
					}
					// console.info( 'neighbour = ', neighbour );
					neighbour.string = stateToString( neighbour );

					if ( !closedSet.has( neighbour.string ) )
					{
						let before = current.remaining - 1;
						let after = before;
						do
						{
							before = after;
							neighbour = step( neighbour );
							neighbour.string = stateToString( neighbour );

							if ( closedSet.has( neighbour.string ) )
							{
								neighbour = null;
								break;
							}

							let invalid = isInvalid( neighbour );
							if ( invalid )
							{
								closedSet.add( neighbour.string );
								neighbour = null;
								break;
							}
							else
							{
								after = neighbour.length - countSolved( neighbour );
							}
						}
						while ( after && after < before );

						if ( neighbour )
						{
							neighbour.remaining = after;
							if ( !after )
							{
								closedSet.add( neighbour.string );
								solutionCount++;
								yield neighbour;
							}
							else if ( !openSet.has( neighbour.string ) )
							{
								openSet.add( neighbour.string );
								openQueue.push( neighbour );
							}
						}
					}
				}
			}
		}

		openQueue.sort( ( a, b ) => a.remaining < b.remaining ? -1 : a.remaining > b.remaining ? 1 : 0 );

		iterationCount++;
		if ( iterationCount % 10 === 0 )
		{
			yield iterationCount + ': ' + solutionCount + ' solutions, ' + openQueue.length + (openQueue.length ? ' in queue with distance \u2265 ' + openQueue[0].remaining : '');
		}
		else
		{
			yield;
		}
	}
}

function step( input )
{
	let state = input.slice();

	for ( let i = 0; i < 9; i++ )
	{
		let a = i - i % 3;
		for ( let j = 0; j < 9; j++ )
		{
			if ( state[i + 9 * j].length > 1 )
			{
				let b = j - j % 3;
				let s = state[i + 9 * j].slice();
				let row = s.slice();
				let col = s.slice();
				let cell = s.slice();
				for ( let k = 0; k < 9; k++ )
				{
					let x = a + k % 3;
					let y = b + (k - k % 3) / 3;

					// basic rules
					remove( s, only( state[k + 9 * j] ) );
					remove( s, only( state[i + 9 * k] ) );
					remove( s, only( state[x + 9 * y] ) );

					// column/row based on block
					state[x + 9 * y].forEach( e => {
						(x !== i) && (remove( col, e )); // pointing pair(s)/triple(s) (column)
						(y !== j) && (remove( row, e )); // pointing pair(s)/triple(s) (row)
						((x !== i) || (y !== j)) && (remove( cell, e )); // last cell in block
					} );
				}

				//log(i+','+j+':row ',row)
				if ( row.length )
				{
					for ( let x = 0; x < 9; x++ )
					{
						if ( ( state[x + 9 * j].length > 1 ) && ( x < a || x >= a + 3 ) )
						{
							//log(' - ', state[x+9*j])
							state[x + 9 * j] = state[x + 9 * j].filter( e => row.indexOf( e ) === -1 );
							// checkCell( state, x, j );
						}
					}
				}

				//log(i+','+j+':col ',col)
				if ( col.length )
				{
					for ( let y = 0; y < 9; y++ )
					{
						if ( ( state[i + 9 * y].length > 1 ) && ( y < b || y >= b + 3 ) )
						{
							state[i + 9 * y] = state[i + 9 * y].filter( e => col.indexOf( e ) === -1 );
							// checkCell( state, i, y );
						}
					}
				}

				//log(i+','+j+':cell ',cell)
				if ( cell.length === 1 )
				{
					s = cell;
					// checkCell( state, i, j );
				}

				state[i + 9 * j] = s;
				// checkCell( state, i, j );
			}
		}
	}

	checkState( state );
	return state;
}

function checkCell( state, i, j )
{
	let a = i - i % 3;
	let b = j - j % 3;

	let s = state[(i + 9 * j)].slice();

	for ( let k = 0; k < 9; k++ )
	{
		let x = a + k % 3;
		let y = b + (k - k % 3) / 3;

		// basic rules
		(k !== i) && remove( s, only( state[k + 9 * j] ) );
		(k !== j) && remove( s, only( state[i + 9 * k] ) );
		((x !== i) || (y !== j)) && remove( s, only( state[x + 9 * y] ) );
	}

	state[(i + 9 * j)] = s;
}

function checkState( state )
{
	state.forEach( ( e, i ) => checkCell( state, i % 9, ( i - i % 9 ) / 9 ) );
}

function all()
{
	return [1, 2, 3, 4, 5, 6, 7, 8, 9];
}

function removeCopy( s, n )
{
	return n ? s.filter( e => e !== n ) : s;
}

function remove( s, n )
{
	if ( n )
	{
		let index = s.indexOf( n );
		if ( index !== -1 )
		{
			s.splice( index, 1 );
		}
	}
}

function only( s )
{
	return s.length === 1 ? s[0] : 0;
}

function countSolved( state )
{
	return state.filter( e => e.length === 1 ).length;
}

function countInvalid( state )
{
	return state.filter( e => e.length === 0 ).length;
}

function isInvalid( state )
{
	return state.some( e => e.length === 0 );
}

function toHtml( s )
{
	return '<ul><li>' + s.map( e => Array.isArray( e ) ? toHtml( e ) : e ).join( ',' ) + '</li></ul>';
}

function stateToString( state )
{
	return puzzleToString( state.map( e => e.length === 1 ? e[0] : 0 ) );
}

function puzzleToString( puzzle )
{
	return puzzle.join( '' );
}

function stateFromString( s )
{
	return puzzleFromString( s ).map( e => e ? [ e ] : all() );
}

function puzzleFromString( s )
{
	return s.split( '' ).map( e => Number.parseInt( e ) || 0 );
}

function status( text )
{
	statusElement.innerText = text;
}

function log()
{
	[...arguments].forEach( e => {
		logElement.appendChild( document.createTextNode( Array.isArray( e ) ? e.join( ',' ) : String( e ) ) );
	} );
	logElement.appendChild( document.createElement( 'br' ) );
}

function logPuzzleString( s )
{
	const div = document.createElement('div');
	div.className = 'puzzle-string';
	div.appendChild( document.createTextNode( s ) );
	logElement.appendChild( div );
}

function logGrid( state, puzzle )
{
	logElement.appendChild( createGrid( { state: state, puzzle: puzzle } ) );
}

function createGrid( params )
{
	let { state, puzzle, diffWith, listener } = params;

	let table = document.createElement( 'table' );
	table.className = 'sudoku';
	let tbody = document.createElement( 'tbody' );
	for ( let i = 0; i < 9; i++ )
	{
		let tr = document.createElement( 'tr' );
		for ( let j = 0; j < 9; j++ )
		{
			let td = document.createElement( 'td' );
			let index = 9 * i + j;
			let e = only( state[index] );
			let n = state[index].length;
			if ( n === 1 )
			{
				if ( puzzle && (puzzle[index] === e) ) td.classList.add( 'given' );
				if ( !e ) td.classList.add( 'error' );
				if ( diffWith && ( only( diffWith[ index ] ) !== e ) )
				{
					td.classList.add( 'diff' );
				}
				td.appendChild( document.createTextNode( String( state[index][0] ) ) );
			}
			else
			{
				if ( e || !n ) td.classList.add( 'error' );
				if ( n < 9 )
				{
					td.appendChild( createNotes( state[index] ) );
				}
			}
			tr.appendChild( td );

			if ( listener )
			{
				td.addEventListener( 'click', event => listener( index, event ) );
			}
		}
		tbody.appendChild( tr );
	}
	table.appendChild( tbody );
	return table;
}

function createNotes( s )
{
	let table = document.createElement( 'table' );
	table.className = 'notes';
	let tbody = document.createElement( 'tbody' );
	for ( let i = 0; i < 3; i++ )
	{
		let tr = document.createElement( 'tr' );
		for ( let j = 0; j < 3; j++ )
		{
			let td = document.createElement( 'td' );
			let n = j + 3 * i + 1;
			if ( s.indexOf( n ) !== -1 )
			{
				td.appendChild( document.createTextNode( String( n ) ) );
			}
			tr.appendChild( td );
		}
		tbody.appendChild( tr );
	}
	table.appendChild( tbody );
	return table;
}
