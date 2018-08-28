const mainElement = document.querySelector( 'body main' );
const statusElement = document.createElement( 'div' );
statusElement.className = 'status';
mainElement.appendChild( statusElement );
const logElement = document.createElement( 'div' );
logElement.className = 'log';
// mainElement.appendChild( logElement );

const cellValuesLookup = [];
for ( let i = 0; i < 512; i++ )
{
	const entry = [];
	( ( i & 1 ) !== 0 ) && entry.push( 1 );
	( ( i & 2 ) !== 0 ) && entry.push( 2 );
	( ( i & 4 ) !== 0 ) && entry.push( 3 );
	( ( i & 8 ) !== 0 ) && entry.push( 4 );
	( ( i & 16 ) !== 0 ) && entry.push( 5 );
	( ( i & 32 ) !== 0 ) && entry.push( 6 );
	( ( i & 64 ) !== 0 ) && entry.push( 7 );
	( ( i & 128 ) !== 0 ) && entry.push( 8 );
	( ( i & 256 ) !== 0 ) && entry.push( 9 );
	cellValuesLookup.push( entry );
}

let selectedNumber = 1;

for ( let i = 0; i <= 9; i++ )
{
	const numberButton = document.createElement( 'button' );
	numberButton.innerText = i ? String( i ) : 'Erase';
	numberButton.addEventListener( 'click', () => {
		mainElement.querySelector( '.selected' ).className = '';
		numberButton.className = 'selected';
		selectedNumber = i;
	} );
	if ( i === selectedNumber )
	{
		numberButton.className = 'selected';
	}
	mainElement.appendChild( numberButton );
}

class SudokuGrid
{
	constructor()
	{
		const cells = [];

		const table = document.createElement( 'table' );
		table.className = 'sudoku';
		const tbody = document.createElement( 'tbody' );
		for ( let i = 0; i < 9; i++ )
		{
			const tr = document.createElement( 'tr' );
			for ( let j = 0; j < 9; j++ )
			{
				const td = document.createElement( 'td' );
				const index = 9 * i + j;
				cells[ index ] = td;
				td.addEventListener( 'click', event => this.handleCellClicked( index, event ) );

				tr.appendChild( td );
			}
			tbody.appendChild( tr );
		}
		table.appendChild( tbody );
		this.element = table;

		this.cells = cells;
		this.listener = null;
		this.diffWith = null;
	}

	get puzzle()
	{
		return this._puzzle;
	}

	set puzzle( puzzle )
	{
		this._puzzle = puzzle;
		this.state = puzzleToState( puzzle );
		this.update();
	}

	handleCellClicked( index, event )
	{
		if ( this.listener )
		{
			this.listener( index, event );
		}
	}

	update()
	{
		let { state, puzzle, diffWith } = this;

		const checked = state.slice();
		checkState( checked );

		for ( let index = 0; index < 81; index++ )
		{
			let td = this.cells[ index ];
			td.className = '';
			td.innerText = '';

			let cell = only( state[ index ] );
			let values = cellValues( state[ index ] );
			let n = values.length;

			if ( n === 1 )
			{
				if ( puzzle && ( puzzle[ index ] === cell ) )
				{
					td.classList.add( 'given' );
				}

				if ( !cell || ( checked[ index ] !== state[ index ] ) )
				{
					td.classList.add( 'error' );
				}

				if ( diffWith && ( only( diffWith[ index ] ) !== cell ) )
				{
					td.classList.add( 'diff' );
				}

				td.appendChild( document.createTextNode( String( values[ 0 ] ) ) );
			}
			else
			{
				if ( cell || !n )
				{
					td.classList.add( 'error' );
				}

				if ( n < 9 )
				{
					td.appendChild( createNotes( values ) );
				}
			}
		}
	}
}

const mainGrid = new SudokuGrid();
mainGrid.listener = function( index )
{
	if ( this.puzzle[ index ] === 0 )
	{
		this.state[ index ] = only( this.state[ index ] ) === selectedNumber ? all() : createSingle( selectedNumber );
		this.update();
	}
};

mainElement.appendChild( mainGrid.element );

const solveElement = document.createElement( 'button' );
solveElement.innerText = 'Solve';
solveElement.onclick = () => solve( mainGrid );
mainElement.appendChild( solveElement );

let puzzles = [
	{ name: 'Weekly unsolvable (25-Aug-2018)', puzzle: '001020030000400002200007800150060000090000060006300005010200000005010090000008701' },
	{ name: 'Weekly unsolvable (4-Aug-2018)', puzzle: '080790000690000800005008090500006080000400300000070002050000010001300700800020004' },
	{ name: 'Weekly unsolvable (11-Aug-2018)', puzzle: '000700000690000800005008090500006080000400300100070002050000010001300700008020004' },
	{ name: 'Weekly unsolvable, I think', puzzle: '050000080800296000600805003190000000024000360000000015400309001000651004010000070' },
	{ name: 'Quest', puzzle: '600050400000007026300000098004205300000000000008403700260000004490800000001090003' },
	{ name: 'expert 2?', puzzle: '940000208800642917710903050600000400080790002000000700120406879000000040008070120' },
	{ name: 'expert 1', puzzle: '000700001005400790010052600500000230100009450004007000690025000400690070050000002' },
	{ name: 'ervaren 2 multiple solutions', puzzle: '579120000000050089068379025900012000805647002700005000097003450004501297200090000' },
	{ name: 'ervaren 1 multiple solutions', puzzle: '500360104060009000000057806940000000030610009702900560000280015000090070251700083' }
];

mainGrid.puzzle = puzzleFromString( puzzles[ 4 ].puzzle );

function devUI()
{
	const puzzlesElement = document.createElement( 'ul' );
	puzzlesElement.className = 'puzzles';
	mainElement.appendChild( puzzlesElement );
	const actionsElement = document.createElement( 'ul' );
	actionsElement.className = 'actions';
	mainElement.appendChild( actionsElement );

	puzzles.forEach( puzzle => {
		const puzzleElement = document.createElement( 'li' );
		puzzleElement.onclick = () => mainGrid.puzzle = puzzleFromString( puzzle.puzzle );
		puzzleElement.innerText = puzzle.name;
		puzzlesElement.appendChild( puzzleElement );
	} );
}

function solve( sudokuGrid )
{
	const generator = solveImpl( sudokuGrid );

	function nextStep()
	{
		const before = sudokuGrid.state.slice();
		const next = generator.next();
		sudokuGrid.diffWith = before;
		sudokuGrid.update();

		if ( !next.done )
		{
			setTimeout( nextStep, 1000 );
		}
	}

	nextStep();
}

function* solveImpl( sudokuGrid, slowly = true )
{
	logClear();

	let oldRemaining = sudokuGrid.puzzle.length;
	let remaining;

	for ( let i = 0; i < slowly ? 200 : 20; i++ )
	{
		const state = sudokuGrid.state;
		remaining = state.length - countSolved( state );

		logClear();
		log( remaining + ' remaining' );

		if ( remaining === 0 )
		{
			break;
		}

		if ( !slowly && ( remaining === oldRemaining ) )
		{
			break;
		}

		oldRemaining = remaining;

		sudokuGrid.state = solveLogicStep( state, true );
		yield;
	}

	let solutions;
	if ( remaining )
	{
		log( 'Using A*...' );
		const start = performance.now();

		solutions = solveAStar( sudokuGrid.state, remaining, 100 );

		for ( let next = solutions.next(); !next.done; next = solutions.next() )
		{
			if ( next.value )
			{
				if ( typeof next.value === 'object' )
				{
					const end = performance.now();

					sudokuGrid.state = next.value;
					// TODO: sudokuGrid.diffWith = first;
					yield;

					/*
					const tinyGridLabel = document.createElement( 'label' );
					tinyGridLabel.appendChild( document.createTextNode( ( Math.round( end - start ) / 1000 ) + ' seconds' ) );

					const tinyGridWrapper = document.createElement( 'div' );
					tinyGridWrapper.className = 'tiny';
					tinyGridWrapper.appendChild( grid );
					tinyGridWrapper.appendChild( tinyGridLabel );
					logElement.appendChild( tinyGridWrapper );

					logPuzzleString( stateToString( next.value ) );
					*/
				}
				else
				{
					status( String( next.value ) );
				}
			}
		}
		log( 'Done' );
	}
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
			if ( unsolved( current[ i ] ) )
			{
				const candidates = cellValues( current[ i ] );
				for ( let j = 0; j < candidates.length; j++ )
				{
					let neighbour = current.slice();
					neighbour[ i ] = createSingle( candidates[ j ] );
					neighbour.string = stateToString( neighbour );

					if ( !closedSet.has( neighbour.string ) )
					{
						let before = current.remaining - 1;
						let after = before;
						do
						{
							before = after;
							neighbour = solveLogicStep( neighbour );
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
				break;
			}
		}

		openQueue.sort( ( a, b ) => a.remaining < b.remaining ? -1 : a.remaining > b.remaining ? 1 : 0 );

		iterationCount++;
		if ( iterationCount % 10 === 0 )
		{
			yield iterationCount + ': ' + solutionCount + ' solutions, ' + openQueue.length + ( openQueue.length ? ' in queue with distance \u2265 ' + openQueue[ 0 ].remaining : '' );
		}
	}
}

function solveLogicStep( input, slowly = false )
{
	let state = input.slice();

	for ( let i = 0; i < 9; i++ )
	{
		let a = i - i % 3;
		for ( let j = 0; j < 9; j++ )
		{
			if ( unsolved( state[ i + 9 * j ] ) )
			{
				let b = j - j % 3;
				let s = copyCell( state[ i + 9 * j ] );
				let row = copyCell( s );
				let col = copyCell( s );
				let cell = copyCell( s );
				for ( let k = 0; k < 9; k++ )
				{
					let x = a + k % 3;
					let y = b + ( k - k % 3 ) / 3;

					// basic rules
					s = remove( s, only( state[ k + 9 * j ] ) );
					s = remove( s, only( state[ i + 9 * k ] ) );
					s = remove( s, only( state[ x + 9 * y ] ) );

					// column/row based on block
					if ( x !== i )
					{
						col = removeAll( col, state[ x + 9 * y ] ); // pointing pair(s)/triple(s) (column)
					}
					if ( y !== j )
					{
						row = removeAll( row, state[ x + 9 * y ] ); // pointing pair(s)/triple(s) (row)
					}
					if ( ( x !== i ) || ( y !== j ) )
					{
						cell = removeAll( cell, state[ x + 9 * y ] ); // last cell in block
					}
				}

				//log(i+','+j+':row ',row)
				if ( nonEmpty( row ) )
				{
					for ( let x = 0; x < 9; x++ )
					{
						if ( unsolved( state[ x + 9 * j ] ) && ( x < a || x >= a + 3 ) )
						{
							//log(' - ', state[x+9*j])
							state[ x + 9 * j ] = removeAll( copyCell( state[ x + 9 * j ] ), row );
						}
					}
				}

				//log(i+','+j+':col ',col)
				if ( nonEmpty( col ) )
				{
					for ( let y = 0; y < 9; y++ )
					{
						if ( unsolved( state[ i + 9 * y ] ) && ( y < b || y >= b + 3 ) )
						{
							state[ i + 9 * y ] = removeAll( copyCell( state[ i + 9 * y ] ), col );
						}
					}
				}

				//log(i+','+j+':cell ',cell)
				if ( single( cell ) )
				{
					s = cell;
				}

				state[ i + 9 * j ] = s;

				if ( slowly && single( s ) )
				{
					console.info( 'solve', i, j );
					return state;
				}
			}
		}
	}

	// checkState( state );
	return state;
}

function checkCell( state, index )
{
	const i = index % 9;
	const j = ( index - i ) / 9;

	const a = i - i % 3;
	const b = j - j % 3;

	let s = copyCell( state[ index ] );

	for ( let k = 0; k < 9; k++ )
	{
		const x = a + k % 3;
		const y = b + ( k - k % 3 ) / 3;

		// basic rules
		if ( k !== i )
		{
			s = remove( s, only( state[ k + 9 * j ] ) );
		}
		if ( k !== j )
		{
			s = remove( s, only( state[ i + 9 * k ] ) );
		}
		if ( ( x !== i ) || ( y !== j ) )
		{
			s = remove( s, only( state[ x + 9 * y ] ) );
		}
	}

	return s;
}

function checkState( state )
{
	const result = state.slice();
	state.forEach( ( e, i ) => result[ i ] = checkCell( state, i ) );
	state.forEach( ( e, i ) => state[ i ] = result[ i ] );
}

function countSolved( state )
{
	return state.filter( single ).length;
}

function isInvalid( state )
{
	return state.some( invalidCell );
}

function stateToString( state )
{
	return puzzleToString( state.map( only ) );
}

function puzzleToString( puzzle )
{
	return puzzle.join( '' );
}

function puzzleFromString( s )
{
	return s.split( '' ).map( e => Number.parseInt( e ) || 0 );
}

function puzzleToState( puzzle )
{
	return puzzle.map( n => n ? createSingle( n ) : all() );
}

function status( text )
{
	statusElement.innerText = text;
}

function logClear()
{
	logElement.innerHTML = '';
}

function log()
{
	[ ...arguments ].forEach( e => {
		logElement.appendChild( document.createTextNode( Array.isArray( e ) ? e.join( ',' ) : String( e ) ) );
	} );
	logElement.appendChild( document.createElement( 'br' ) );
}

function logPuzzleString( s )
{
	const div = document.createElement( 'div' );
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

	const checked = state.slice();
	checkState( checked );

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
			let cell = only( state[ index ] );
			let values = cellValues( state[ index ] );
			let n = values.length;
			if ( n === 1 )
			{
				if ( puzzle && ( puzzle[ index ] === cell ) )
				{
					td.classList.add( 'given' );
				}
				if ( !cell || ( checked[ index ] !== state[ index ] ) )
				{
					td.classList.add( 'error' );
				}
				if ( diffWith && ( only( diffWith[ index ] ) !== cell ) )
				{
					td.classList.add( 'diff' );
				}
				td.appendChild( document.createTextNode( String( values[ 0 ] ) ) );
			}
			else
			{
				if ( cell || !n ) td.classList.add( 'error' );
				if ( n < 9 )
				{
					td.appendChild( createNotes( values ) );
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

function all()
{
	return 511; // ( 1 << 9 ) - 1
}

function copyCell( cell )
{
	return cell;
}

function cellValues( cell )
{
	return cellValuesLookup[ cell ];
}

function createSingle( value )
{
	return 1 << ( value - 1 );
}

function invalidCell( cell )
{
	return cell === 0;
}

function single( cell )
{
	return ( ( cell !== 0 ) && ( ( cell & ( ~cell + 1 ) ) === cell ) );
}

function nonEmpty( cell )
{
	return cell !== 0;
}

function unsolved( cell )
{
	return ( ( cell !== 0 ) && ( ( cell & ( ~cell + 1 ) ) !== cell ) );
}

function remove( cell, n )
{
	return cell & ~createSingle( n );
}

// Removes all values in (pseudo)cell b from cell a.
function removeAll( a, b )
{
	return a & ~b;
}

function only( cell )
{
	return single( cell ) ? log2( cell ) + 1 : 0;
}

function log2( x )
{
	return 31 - clz3( x );
}

// https://en.wikipedia.org/wiki/Find_first_set#CLZ
function clz3( x )
{
	if ( x === 0 )
	{
		return 32;
	}
	let n = 0;
	if ( ( x & 0xffff0000 ) === 0 )
	{
		n = n + 16;
		x = x << 16;
	}
	if ( ( x & 0xff000000 ) === 0 )
	{
		n = n + 8;
		x = x << 8;
	}
	if ( ( x & 0xf0000000 ) === 0 )
	{
		n = n + 4;
		x = x << 4;
	}
	if ( ( x & 0xc0000000 ) === 0 )
	{
		n = n + 2;
		x = x << 2;
	}
	if ( ( x & 0x80000000 ) === 0 )
	{
		n = n + 1;
	}
	return n;
}
