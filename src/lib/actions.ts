// src/lib/actions.ts

export function scrollText(node: HTMLElement) {
	let ro: ResizeObserver;
	let mo: MutationObserver;

	function check() {
		// Clean up existing clones before measuring
		const clones = node.querySelectorAll('.marquee-clone');
		clones.forEach(c => c.remove());

		const child = node.firstElementChild as HTMLElement;
		if (!child) return;

		const overflow = child.scrollWidth - node.clientWidth;
		if (overflow > 2) {
			node.classList.add('is-overflowing');
			
			const clone = child.cloneNode(true) as HTMLElement;
			clone.classList.add('marquee-clone');
			clone.setAttribute('aria-hidden', 'true');
			node.appendChild(clone);

			// Linear speed relative to child width
			const dur = child.scrollWidth / 30;
			node.style.setProperty('--scroll-duration', `${Math.max(3, dur).toFixed(1)}s`);
		} else {
			node.classList.remove('is-overflowing');
			node.style.removeProperty('--scroll-duration');
		}
	}

	ro = new ResizeObserver(check);
	ro.observe(node);

	// Also observe text content changes to the child element
	mo = new MutationObserver(check);
	const child = node.firstElementChild as HTMLElement;
	if (child) {
		mo.observe(child, { childList: true, subtree: true, characterData: true });
	}

	check();

	return { 
		destroy() { 
			ro.disconnect(); 
			mo.disconnect();
		} 
	};
}

export function portal(node: HTMLElement, target: HTMLElement | string = 'body') {
	let targetNode: HTMLElement | null;
	
	function updateTarget(newTarget: HTMLElement | string) {
		if (typeof newTarget === 'string') {
			targetNode = document.querySelector(newTarget);
		} else {
			targetNode = newTarget;
		}

		if (targetNode) {
			targetNode.appendChild(node);
		}
	}

	updateTarget(target);

	return {
		update(newTarget: HTMLElement | string) {
			updateTarget(newTarget);
		},
		destroy() {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
		}
	};
}