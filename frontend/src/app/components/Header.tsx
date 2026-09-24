import { Link } from "react-router-dom";

export default function Header() {
	return (
		<header className="border-b bg-white">
			<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
				<Link to="/" className="text-xl font-bold tracking-tight text-gray-900">
					Tournament Tracker
				</Link>

				<nav aria-label="Main navigation" className="flex items-center gap-6 text-sm">
					<Link to="/tournaments" className="text-gray-600 transition hover:text-gray-900">
						Tournaments
					</Link>
					<Link to="/about" className="text-gray-600 transition hover:text-gray-900">
						About
					</Link>
					<Link
						 to="/login"
						className="rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
					>
						Sign in
					</Link>
				</nav>
			</div>
		</header>
	);
}
