import { Link } from 'react-router-dom';

const navigation = [
	{ label: 'HOME', href: '/' },
	{ label: 'MATCHES', href: '/' },
	{ label: 'TOURNAMENTS', href: '/tournaments' },
	{ label: 'TEAMS', href: '/teams' },
	{ label: 'PLAYERS', href: '/players' },
];

export default function Header() {
	return (
		<header className="w-full border-b border-[#30343b] bg-[#17191e] text-white shadow-lg">
			<div className="mx-auto flex max-w-7xl items-center gap-8 px-5">
				<Link to="/" className="flex shrink-0 items-center gap-2 py-4" aria-label="Tournament Tracker home">
					<span className="grid h-8 w-8 place-items-center rounded bg-[#f04b3a] text-sm font-black italic">T</span>
					<span className="text-lg font-extrabold tracking-tight">TOURNAMENT<span className="text-[#f04b3a]">TRACKER</span></span>
				</Link>

				<nav aria-label="Main navigation" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
					{navigation.map((item, index) => (
						<Link
							key={item.label}
							to={item.href}
							className={`whitespace-nowrap border-b-2 px-4 py-5 text-xs font-bold tracking-wide transition-colors hover:text-white ${
								index === 0
									? 'border-[#f04b3a] text-white'
									: 'border-transparent text-[#a7aab0] hover:border-[#f04b3a]'
							}`}
						>
							{item.label}
						</Link>
					))}
				</nav>

				<Link
					to="/search"
					className="hidden shrink-0 items-center gap-2 rounded bg-[#24272e] px-3 py-2 text-sm text-[#a7aab0] transition hover:bg-[#30343b] hover:text-white sm:flex"
					aria-label="Search"
				>
					<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
						<circle cx="11" cy="11" r="7" />
						<path d="m16 16 4 4" />
					</svg>
					<span>Search</span>
				</Link>
			</div>
		</header>
	);
}
