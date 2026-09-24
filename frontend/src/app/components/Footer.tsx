export default function Footer() {
	return (
		<footer className="border-t border-gray-200 bg-white">
			<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-gray-600 sm:flex-row lg:px-8">
				<p>© {new Date().getFullYear()} Tournament Tracker. All rights reserved.</p>
				<nav aria-label="Footer navigation" className="flex gap-6">
					<a href="#" className="transition-colors hover:text-gray-900">
						Privacy
					</a>
					<a href="#" className="transition-colors hover:text-gray-900">
						Terms
					</a>
					<a href="#" className="transition-colors hover:text-gray-900">
						Contact
					</a>
				</nav>
			</div>
		</footer>
	);
}
