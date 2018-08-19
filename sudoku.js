const mainElement = document.querySelector( 'body main' );
const statusElement = document.createElement( 'div' );
mainElement.appendChild( statusElement );
const logElement = document.createElement( 'div' );
mainElement.appendChild( logElement );

let puzzles = [
	puzzleFromString( '080790000690000800005008090500006080000400300000070002050000010001300700800020004' ), // Weekly unsolvable (4-Aug-2018)
	puzzleFromString( '000700000690000800005008090500006080000400300100070002050000010001300700008020004' ), // Weekly unsolvable (11-Aug-2018)
	puzzleFromString( '050000080800296000600805003190000000024000360000000015400309001000651004010000070' ),
	puzzleFromString( '600050400000007026300000098004205300000000000008403700260000004490800000001090003' ), // Quest
	puzzleFromString( '940000208800642917710903050600000400080790002000000700120406879000000040008070120' ), // expert 2?
	puzzleFromString( '000700001005400790010052600500000230100009450004007000690025000400690070050000002' ), // expert 1
	puzzleFromString( '579120000000050089068379025900012000805647002700005000097003450004501297200090000' ), // ervaren 2 multiple solutions
	puzzleFromString( '500360104060009000000057806940000000030610009702900560000280015000090070251700083' ) // ervaren 1 multiple solutions
];

let puzzle = puzzles[ 0 ];

main( puzzle );

function main( puzzle )
{
	let state = puzzleToState( puzzle );

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
		solutions = [ state ];
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

				const grid = createGrid( { state: nextState, puzzle: puzzle, diffWith: first } );

				const tinyGridLabel = document.createElement( 'label' );
				tinyGridLabel.appendChild( document.createTextNode( ( Math.round( end - start ) / 1000 ) + ' seconds' ) );

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
				break;
			}
		}

		openQueue.sort( ( a, b ) => a.remaining < b.remaining ? -1 : a.remaining > b.remaining ? 1 : 0 );

		iterationCount++;
		if ( iterationCount % 10 === 0 )
		{
			yield iterationCount + ': ' + solutionCount + ' solutions, ' + openQueue.length + ( openQueue.length ? ' in queue with distance \u2265 ' + openQueue[ 0 ].remaining : '' );
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
							// checkCell( state, x, j );
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
							// checkCell( state, i, y );
						}
					}
				}

				//log(i+','+j+':cell ',cell)
				if ( single( cell ) )
				{
					s = cell;
					// checkCell( state, i, j );
				}

				state[ i + 9 * j ] = s;
				// checkCell( state, i, j );
			}
		}
	}

	checkState( state );
	return state;
}

function checkCell( state, i, j )
{
	const a = i - i % 3;
	const b = j - j % 3;

	let s = copyCell( state[ i + 9 * j ] );

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

	state[ i + 9 * j ] = s;
}

function checkState( state )
{
	state.forEach( ( e, i ) => checkCell( state, i % 9, ( i - i % 9 ) / 9 ) );
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
			let e = only( state[ index ] );
			const values = cellValues( state[ index ] );
			let n = values.length;
			if ( n === 1 )
			{
				if ( puzzle && ( puzzle[ index ] === e ) ) td.classList.add( 'given' );
				if ( !e ) td.classList.add( 'error' );
				if ( diffWith && ( only( diffWith[ index ] ) !== e ) )
				{
					td.classList.add( 'diff' );
				}
				td.appendChild( document.createTextNode( String( values[ 0 ] ) ) );
			}
			else
			{
				if ( e || !n ) td.classList.add( 'error' );
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
	return [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
}

function copyCell( cell )
{
	return cell.slice();
}

function cellValues( cell )
{
	return cell;
}

function createSingle( value )
{
	return [ value ];
}

function invalidCell( cell )
{
	return cell.length === 0;
}

function single( cell )
{
	return cell.length === 1;
}

function nonEmpty( cell )
{
	return cell.length >= 1;
}

function unsolved( cell )
{
	return cell.length > 1;
}

function remove( cell, n )
{
	if ( n )
	{
		let index = cell.indexOf( n );
		if ( index !== -1 )
		{
			cell.splice( index, 1 );
		}
	}
	return cell;
}

// Removes all values in (pseudo)cell b from cell a.
function removeAll( a, b )
{
	b.forEach( e => remove( a, e ) );
	return a;
}

function only( cell )
{
	return cell.length === 1 ? cell[ 0 ] : 0;
}
