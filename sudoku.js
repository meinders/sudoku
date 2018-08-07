const mainElement = document.querySelector( "body main" );
const logElement = mainElement;

let puzzles = [
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
// mainElement.appendChild( createGrid( createState( puzzle ), puzzle, index => {
//
// }) );

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
			let start = performance.now();
			solutions = solveAStar( state, remaining, 100 );
			state = solutions[0];
			let end = performance.now();
			log( Math.round( end - start ) / 1000 + ' seconds' );
		}
	}
	else
	{
		solutions = [state];
	}

	if ( solutions.length > 1 )
	{
		log( 'Showing the first of at least ' + solutions.length + ' distinct solutions' );
		logGrid( state, puzzle );
		log( 'Other solutions are' );
		for ( let i = 1; i < solutions.length; i++ )
		{
			log( solutions[ i ] );
		}
	}
	else if ( solutions.length )
	{
		log( 'Found exactly 1 solution' );
		logGrid( state, puzzle );
	}
	else
	{
		log( 'Found no solution' );
	}
}

function solveDepthFirst( state, remaining, depth = 0, result = [] )
{
	result.nonUniqueCount = result.nonUniqueCount || 0;
	for ( let i = 0; i < state.length; i++ )
	{
		if ( state[i].length > 1 )
		{
			//log('state ', i, ' = ',state [i])
			for ( let j = 0; j < state[i].length; j++ )
			{
				let next = state.slice();
				let n = next[i][j];
				//log('try ', n);
				next[i] = [n];

				let before = remaining - 1;
				let after = before;
				do
				{
					before = after;
					next = step( next );
					let invalid = isInvalid( next );
					if ( invalid )
					{
						//log('invalid ', invalid)
						//logGrid(next)
						//state[i] = removeCopy(state[i], n)
						//j--
						next = null;
						break;
					}
					else
					{
						after = next.length - countSolved( next );
						//log('next = ', next)
						//log('remaining before ', before)
						//log('remaining after ', after)
					}
				}
				while ( after && after < before );

				//log ('@', depth, ':', after?next?"I'm stuck again":"it's a dead end":"solved it")

				if ( !after )
				{
					const s = stateToString( next );
					if ( result.indexOf( s ) === -1 )
					{
						result.push( s );
					}
					result.nonUniqueCount++;
				}
				else if ( next && depth < 10 && result.nonUniqueCount < 100 )
				{
					solveDepthFirst( next, after, depth + 1, result );
				}
			}
		}
	}
	return result;
}

function solveAStar( start )
{
	start.string = stateToString( start );
	start.remaining = start.length - countSolved( start );

	const open = new Set();
	open.add( start.string );

	const closed = new Set();
	const candidates = [ start ];
	const result = [];

	let i = 0;
	while ( candidates.length && ( i++ < 10000 ) )
	{
		const current = candidates[ 0 ];
		open.delete( current.string );
		closed.add( current.string );

		for ( let i = 0; i < current.length; i++ )
		{
			if ( current[i].length > 1 )
			{
				for ( let j = 0; j < current[i].length; j++ )
				{
					let next = current.slice();
					next[i] = [next[i][j]];
					next.string = stateToString( next );

					if ( !closed.has( next.string ) )
					{
						let before = current.remaining - 1;
						let after = before;
						do
						{
							before = after;
							next = step( next );
							let invalid = isInvalid( next );
							if ( invalid )
							{
								closed.add( stateToString( next ) );
								next = null;
								break;
							}
							else
							{
								after = next.length - countSolved( next );
							}
						}
						while ( after && after < before );

						if ( next )
						{
							next.string = stateToString( next );
							next.remaining = after;
							if ( !after )
							{
								if ( result.indexOf( next.string ) === -1 )
								{
									result.push( next.string );
								}
							}
							else if ( !open.has( next.string ) )
							{
								open.add( next.string );
								candidates.push( next );
							}
						}
					}
				}
			}
		}

		candidates.sort( ( a, b ) => a.remaining < b.remaining ? -1 : a.remaining > b.remaining ? 1 : 0 );
	}

	return result;
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
						(x !== i) && (remove( col, e ));
						(y !== j) && (remove( row, e ));
						((x !== i) || (y !== j)) && (remove( cell, e ));
					} );
				}

				//log(i+','+j+':row ',row)
				if ( row.length )
				{
					for ( let x = 0; x < 9; x++ )
					{
						if ( x < a || x >= a + 3 )
						{
							//log(' - ', state[x+9*j])
							state[x + 9 * j] = state[x + 9 * j].filter( e => row.indexOf( e ) === -1 );
						}
					}
				}

				//log(i+','+j+':col ',col)
				if ( col.length )
				{
					for ( let y = 0; y < 9; y++ )
					{
						if ( y < b || y >= b + 3 )
						{
							state[i + 9 * y] = state[i + 9 * y].filter( e => col.indexOf( e ) === -1 );
						}
					}
				}

				//log(i+','+j+':cell ',cell)
				if ( cell.length === 1 )
				{
					s = cell;
				}

				state[i + 9 * j] = s;
			}
		}
	}

	return state;
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

function log()
{
	[...arguments].forEach( e => {
		logElement.appendChild( document.createTextNode( Array.isArray( e ) ? e.join( ',' ) : String( e ) ) );
	} );
	logElement.appendChild( document.createElement( 'br' ) );
}

function logGrid( state, puzzle )
{
	logElement.appendChild( createGrid( state, puzzle ) );
}

function createGrid( state, puzzle, listener )
{
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
